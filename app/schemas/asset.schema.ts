import { z } from 'zod';

export const AssetSchema = z.object({
  id: z.string().optional(),
  asset_name: z.string().min(2, 'Nama aset wajib diisi'),
  category: z.enum(['Mesin Printing', 'Mesin Heat Press', 'Komputer & IT', 'Alat Jahit & Bordir', 'Peralatan Gudang']).default('Mesin Printing'),
  purchase_date: z.string().optional(),
  location: z.string().default('Workshop Utama'),
  status: z.enum(['operational', 'maintenance', 'idle', 'damaged']).default('operational'),
  total_value: z.number().default(0),
  total_unit: z.number().default(1),
});

export type AssetItem = z.infer<typeof AssetSchema>;

export interface AssetManageState {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
}

export const ASSET_STATUS_BADGES: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
  operational: { label: 'Beroperasi', variant: 'success' },
  maintenance: { label: 'Perawatan', variant: 'warning' },
  idle: { label: 'Siaga (Idle)', variant: 'info' },
  damaged: { label: 'Rusak', variant: 'danger' },
};

export const ASSET_CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'Mesin Printing', label: 'Mesin Printing' },
  { value: 'Mesin Heat Press', label: 'Mesin Heat Press' },
  { value: 'Komputer & IT', label: 'Komputer & IT' },
  { value: 'Alat Jahit & Bordir', label: 'Alat Jahit & Bordir' },
  { value: 'Peralatan Gudang', label: 'Peralatan Gudang' },
];
