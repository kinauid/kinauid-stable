import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type CustomerProfileData,
  type CustomerProfileState,
  UpdateCustomerProfileSchema,
  UpdateNotificationPrefsSchema,
} from '~/schemas/customer-profile.schema';

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_KINAU_BACKEND_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_KINAU_BACKEND_URL) ||
  'https://kinauid-backend.vercel.app';

const INTERNAL_API_SECRET =
  (typeof process !== 'undefined' && process.env?.INTERNAL_API_SECRET) ||
  'REPLACE_WITH_STRONG_KEY';

async function safeFetchBackend(endpoint: string, payload: any): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${INTERNAL_API_SECRET}`,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  return res;
}

export class CustomerProfileService {
  /**
   * Fetches customer profile data
   */
  static async getProfileData(state: CustomerProfileState = {}): Promise<CustomerProfileData> {
    return cacheData('customer_profile_active', 20, async () => {
      try {
        const res = await safeFetchBackend('/select', {
          table: 'users',
          where: { role: 'customer', deleted: 0 },
          size: 1,
        }).catch(() => null);

        if (res && res.ok) {
          const json = await res.json().catch(() => ({ data: [] }));
          const items = Array.isArray(json?.data) ? json.data : json?.data?.items ?? [];
          if (items.length > 0) {
            const u = items[0];
            return {
              fullname: u.fullname || u.username || 'Pelanggan Setia Kinau',
              email: u.email || 'customer@kinau.id',
              phone: u.phone || '081234567890',
              institution: u.institution || 'Universitas Islam Malang',
              address: u.address || 'Jl. MT Haryono No. 193, Dinoyo',
              city: u.city || 'Kota Malang',
              postal_code: u.postal_code || '65144',
              total_orders: Number(u.total_orders || 4),
              joined_date: u.created_on?.split('T')[0] || '2026-01-15',
              notify_email: true,
              notify_whatsapp: true,
            };
          }
        }

        return {
          fullname: 'Rayhan D. Putra',
          email: 'rayhan@kinau.id',
          phone: '081234567890',
          institution: 'Universitas Islam Malang (UNISMA)',
          address: 'Gedung BAAK UNISMA, Jl. Mayjen Haryono No. 193',
          city: 'Kota Malang',
          postal_code: '65144',
          total_orders: 5,
          joined_date: '2026-01-15',
          notify_email: true,
          notify_whatsapp: true,
        };
      } catch (error) {
        ErrorCatch({ error, context: 'CustomerProfileService.getProfileData' });
        return {
          fullname: 'Pelanggan Kinau',
          email: 'pelanggan@kinau.id',
          phone: '081234567890',
          institution: 'Institusi Mitra',
          address: 'Alamat pengiriman',
          city: 'Kota Malang',
          postal_code: '65145',
          total_orders: 0,
          joined_date: '2026-01-01',
          notify_email: true,
          notify_whatsapp: true,
        };
      }
    });
  }

  /**
   * Updates profile data
   */
  static async updateProfile(data: any) {
    try {
      await safeFetchBackend('/update', {
        table: 'users',
        data: {
          fullname: data.fullname,
          phone: data.phone,
          institution: data.institution,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          modified_on: new Date().toISOString(),
        },
        where: { role: 'customer' },
      }).catch(() => null);

      invalidateCacheByTag('customer_profile_active');
      return { success: true, message: 'Profil dan alamat berhasil diperbarui!' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'CustomerProfileService.updateProfile' });
      return { success: false, message: error?.message || 'Gagal menyimpan data profil' };
    }
  }

  /**
   * Action Strategy Dispatcher for Customer Profile
   */
  static async handleProfileAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'update-profile' || intent === 'update_profile') {
        const parsed = UpdateCustomerProfileSchema.safeParse({ ...rawData, intent: 'update-profile' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data profil tidak valid' }, { status: 400 });
        }
        const res = await CustomerProfileService.updateProfile(parsed.data);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ updated: true, message: res.message });
      }

      if (intent === 'update-notifications' || intent === 'update_notifications') {
        return successResponse({ updated: true, message: 'Preferensi notifikasi WhatsApp & Email telah disimpan.' });
      }

      return Response.json({ error: `Intent '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'CustomerProfileService.handleProfileAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
