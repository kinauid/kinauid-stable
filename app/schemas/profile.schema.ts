import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().or(z.number()),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().optional().default(''),
  role: z.string().default('admin'),
  avatar: z.string().optional().default(''),
  institution_name: z.string().optional().default(''),
  bio: z.string().optional().default(''),
  language: z.enum(['id', 'en']).default('id'),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  notifications_enabled: z.boolean().default(true),
  created_at: z.string().optional().default(''),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().min(8, 'Nomor telepon minimal 8 digit').optional().or(z.literal('')),
  institution_name: z.string().optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
  newPassword: z.string().min(6, 'Kata sandi baru minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi kata sandi minimal 6 karakter'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Konfirmasi kata sandi tidak cocok',
  path: ['confirmPassword'],
});

export const PreferenceSchema = z.object({
  language: z.enum(['id', 'en']),
  theme: z.enum(['light', 'dark', 'system']),
  notifications_enabled: z.boolean(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type PreferenceInput = z.infer<typeof PreferenceSchema>;

export interface ProfileState {
  tab?: 'overview' | 'security' | 'preferences';
  edit?: boolean;
}
