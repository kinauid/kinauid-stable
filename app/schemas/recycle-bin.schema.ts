import { z } from 'zod';

export interface DeletedOrderItem {
  id: string;
  order_number: string;
  institution_name: string;
  pic_name?: string;
  pic_phone?: string;
  total_amount?: number;
  total_price?: number;
  status?: string;
  created_on: string;
  deleted_on: string;
  created_by?: string | { fullname?: string };
  is_sponsor?: number;
  is_archive?: number;
  notes?: string;
}

export interface RecycleBinState {
  search?: string;
  page?: number;
  size?: number;
  tab?: string;
}

export interface RecycleBinData {
  items: DeletedOrderItem[];
  total_items: number;
  page: number;
  size: number;
}

export const RestoreOrderSchema = z.object({
  intent: z.literal('restore').or(z.literal('restore-order')),
  id: z.string().min(1, 'ID Pesanan wajib diisi'),
});

export const PurgeOrderSchema = z.object({
  intent: z.literal('purge').or(z.literal('permanent-delete')),
  id: z.string().min(1, 'ID Pesanan wajib diisi'),
});
