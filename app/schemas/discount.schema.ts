import { z } from 'zod';

export type DiscountType = 'percent' | 'fixed';

export interface DiscountCodeItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  valid_from?: string;
  valid_until?: string;
  user_limit?: number;
  used_count?: number;
  active: number;
  created_on: string;
}

export interface DiscountState {
  search?: string;
  type?: string;
  status?: string;
}

export interface DiscountData {
  items: DiscountCodeItem[];
  totalActive: number;
  totalCodes: number;
}

export const CreateDiscountSchema = z.object({
  intent: z.literal('create-discount').or(z.literal('create_discount')),
  code: z.string().min(3, 'Kode promo minimal 3 karakter').toUpperCase(),
  name: z.string().min(1, 'Nama promo wajib diisi'),
  description: z.string().optional().default(''),
  discount_type: z.enum(['percent', 'fixed']).default('percent'),
  discount_value: z.coerce.number().min(1, 'Nilai diskon minimal 1'),
  max_discount_amount: z.coerce.number().default(0),
  min_order_amount: z.coerce.number().default(0),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  user_limit: z.coerce.number().default(100),
  active: z.coerce.number().default(1),
});

export const ToggleDiscountSchema = z.object({
  intent: z.literal('toggle-discount').or(z.literal('toggle_discount')),
  id: z.string().min(1, 'ID Kupon wajib diisi'),
  active: z.coerce.number(),
});

export const DeleteDiscountSchema = z.object({
  intent: z.literal('delete-discount').or(z.literal('delete_discount')),
  id: z.string().min(1, 'ID Kupon wajib diisi'),
});
