import { z } from 'zod';

export interface CustomerProfileData {
  fullname: string;
  email: string;
  phone: string;
  institution: string;
  address: string;
  city: string;
  postal_code: string;
  total_orders: number;
  joined_date: string;
  notify_email: boolean;
  notify_whatsapp: boolean;
}

export interface CustomerProfileState {
  tab?: 'profile' | 'security' | 'address';
}

export const UpdateCustomerProfileSchema = z.object({
  intent: z.literal('update-profile').or(z.literal('update_profile')),
  fullname: z.string().min(2, 'Nama lengkap wajib diisi'),
  phone: z.string().min(8, 'Nomor WhatsApp / telepon wajib diisi'),
  institution: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postal_code: z.string().optional().default(''),
});

export const UpdateNotificationPrefsSchema = z.object({
  intent: z.literal('update-notifications').or(z.literal('update_notifications')),
  notify_email: z.coerce.boolean().default(true),
  notify_whatsapp: z.coerce.boolean().default(true),
});
