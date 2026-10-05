import { z } from 'zod';

export type VendorCategory = 'selempang' | 'seragam' | 'bordir' | 'prod3';

export interface VendorSubkonOrder {
  id: string;
  order_number: string;
  institution_name: string;
  pic_name?: string;
  pic_phone?: string;
  category: VendorCategory;
  items_summary: string;
  total_qty: number;
  total_amount: number;
  status: string;
  created_on: string;
  vendor_name?: string;
  notes?: string;
}

export interface VendorState {
  category?: VendorCategory;
  search?: string;
}

export interface VendorData {
  orders: VendorSubkonOrder[];
  activeCount: number;
  doneCount: number;
  category: VendorCategory;
}

export const UpdateVendorStatusSchema = z.object({
  intent: z.literal('update-vendor-status').or(z.literal('update_status')),
  id: z.string().min(1, 'ID Order wajib diisi'),
  status: z.enum(['waiting', 'processing', 'done']).default('done'),
});
