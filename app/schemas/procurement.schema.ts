import { z } from 'zod';

export const ProcurementComponentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nama komponen wajib diisi'),
  category: z.string().default('Jersey'),
  stock: z.number().default(0),
  unit: z.string().default('pcs'),
  min_stock: z.number().default(10),
  price: z.number().default(0),
});

export type ProcurementComponentItem = z.infer<typeof ProcurementComponentSchema>;

export const CatalogColorSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Kode warna wajib diisi'),
  name: z.string().min(2, 'Nama warna wajib diisi'),
  hex: z.string().default('#000000'),
  pantone: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type CatalogColorItem = z.infer<typeof CatalogColorSchema>;

export const ShoppingItemSchema = z.object({
  id: z.string().optional(),
  item_name: z.string().min(2, 'Nama barang wajib diisi'),
  supplier_name: z.string().optional(),
  quantity: z.number().min(1),
  unit: z.string().default('roll'),
  estimated_cost: z.number().default(0),
  status: z.enum(['pending', 'ordered', 'received']).default('pending'),
});

export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

export interface ProcurementState {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
}

export const SHOPPING_STATUS_BADGES: Record<string, { label: string; variant: 'warning' | 'info' | 'success' }> = {
  pending: { label: 'Menunggu Beli', variant: 'warning' },
  ordered: { label: 'Dipesan', variant: 'info' },
  received: { label: 'Diterima', variant: 'success' },
};
