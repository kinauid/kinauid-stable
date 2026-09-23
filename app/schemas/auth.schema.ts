import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  rememberMe: z.boolean().optional().default(false),
});

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'Token Google tidak valid'),
  email: z.string().email('Format email tidak valid'),
  name: z.string().min(1, 'Nama wajib diisi'),
  avatar: z.string().optional(),
});

export const CompleteProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().min(9, 'Nomor WhatsApp minimal 9 digit'),
  address: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;

export interface AuthState {
  mode: 'customer' | 'admin' | 'complete-profile';
  email: string;
  error?: string;
  redirectTo?: string;
}

export const AUTH_ROLES = ['admin', 'staff', 'customer'] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export const ROLE_LABELS: Record<AuthRole, string> = {
  admin: 'Administrator',
  staff: 'Production Staff',
  customer: 'Customer & Member',
};

export const ROLE_BADGES: Record<AuthRole, { label: string; variant: 'primary' | 'warning' | 'info' | 'success' }> = {
  admin: { label: 'Admin', variant: 'primary' },
  staff: { label: 'Staff', variant: 'warning' },
  customer: { label: 'Customer', variant: 'info' },
};
