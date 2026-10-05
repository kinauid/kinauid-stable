import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import {
  UserProfileSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  PreferenceSchema,
  type UserProfile,
} from '~/schemas/profile.schema';
import { getSessionData, requireAuth } from '~/lib/session.server';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import { invalidateCacheByTag } from '~/utils/cache';

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_KINAU_BACKEND_URL) ||
  'https://kinauid-backend.vercel.app';

const INTERNAL_API_SECRET =
  (typeof process !== 'undefined' && process.env?.INTERNAL_API_SECRET) ||
  'REPLACE_WITH_STRONG_KEY';

export class ProfileService {
  /**
   * Get active user profile from session and backend
   */
  static async getProfile(request: Request): Promise<{ profile: UserProfile }> {
    const session = await getSessionData(request);
    const defaultProfile: UserProfile = {
      id: session?.user_id || '1',
      name: session?.user_name || 'Admin Kinau',
      email: session?.user_email || 'admin@kinau.id',
      phone: '+62 852-1933-7474',
      role: session?.user_role || 'admin',
      avatar: '/icon/kinau-logo-icon.png',
      institution_name: 'PT Kinau Digital Kreatif',
      bio: 'Operasional Sistem & Percetakan Digital Kinau ID.',
      language: 'id',
      theme: 'light',
      notifications_enabled: true,
      created_at: '2026-01-01',
    };

    if (!session?.user_id) {
      return { profile: defaultProfile };
    }

    try {
      const response = await fetch(`${BACKEND_URL}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'users',
          where: { id: session.user_id },
          size: 1,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const raw = json?.data?.[0] || json?.data?.items?.[0];
        if (raw) {
          return {
            profile: {
              ...defaultProfile,
              id: String(raw.id || defaultProfile.id),
              name: raw.name || raw.user_name || defaultProfile.name,
              email: raw.email || defaultProfile.email,
              phone: raw.phone || defaultProfile.phone,
              role: raw.role || defaultProfile.role,
              avatar: raw.avatar || defaultProfile.avatar,
              institution_name: raw.institution_name || defaultProfile.institution_name,
              bio: raw.bio || defaultProfile.bio,
            },
          };
        }
      }
    } catch (err) {
      ErrorCatch({ error: err, context: 'ProfileService:getProfile' });
    }

    return { profile: defaultProfile };
  }

  /**
   * Update Profile Details
   */
  static async updateProfile(userId: string | number, data: any) {
    const parsed = UpdateProfileSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Data profil tidak valid', 400);
    }

    try {
      await fetch(`${BACKEND_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'users',
          data: {
            id: userId,
            ...parsed.data,
            modified_on: new Date().toISOString(),
          },
        }),
      });
      invalidateCacheByTag('user_profile');
    } catch (err) {
      ErrorCatch({ error: err, context: 'ProfileService:updateProfile' });
    }

    return parsed.data;
  }

  /**
   * Change Password
   */
  static async changePassword(userId: string | number, data: any) {
    const parsed = ChangePasswordSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Data kata sandi tidak valid', 400);
    }

    try {
      await fetch(`${BACKEND_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'users',
          data: {
            id: userId,
            password: parsed.data.newPassword,
            modified_on: new Date().toISOString(),
          },
        }),
      });
    } catch (err) {
      ErrorCatch({ error: err, context: 'ProfileService:changePassword' });
    }

    return { success: true };
  }

  /**
   * Update App Preferences
   */
  static async updatePreferences(data: any) {
    const parsed = PreferenceSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError('Format preferensi tidak valid', 400);
    }
    return parsed.data;
  }
}

/**
 * Profile Action Strategy Dispatcher
 */
export async function handleProfileAction({ request }: ActionFunctionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  const strategies: Record<string, () => Promise<any>> = {
    'update-profile': async () => {
      const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        institution_name: formData.get('institution_name'),
        bio: formData.get('bio'),
      };
      const updated = await ProfileService.updateProfile(session.user_id, data);
      return successResponse(updated, { meta: { message: 'Profil berhasil diperbarui' } });
    },

    'change-password': async () => {
      const data = {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword'),
      };
      await ProfileService.changePassword(session.user_id, data);
      return successResponse(null, { meta: { message: 'Kata sandi berhasil diubah' } });
    },

    'update-preferences': async () => {
      const data = {
        language: formData.get('language') || 'id',
        theme: formData.get('theme') || 'light',
        notifications_enabled: formData.get('notifications_enabled') === 'true',
      };
      const prefs = await ProfileService.updatePreferences(data);
      return successResponse(prefs, { meta: { message: 'Preferensi aplikasi berhasil disimpan' } });
    },

    logout: async () => {
      throw redirect('/_auth/logout');
    },
  };

  const handler = strategies[intent];
  if (!handler) {
    return errorResponse(`Intent tidak dikenali: ${intent}`, 400);
  }

  try {
    return await handler();
  } catch (error) {
    if (error instanceof Response) throw error;
    if (error instanceof ApiError) return errorResponse(error.message, error.status);
    ErrorCatch({ error, context: `ProfileService:action:${intent}` });
    return errorResponse('Gagal memproses permintaan profil', 500);
  }
}
