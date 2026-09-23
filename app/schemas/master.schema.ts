import { z } from 'zod';

// ==========================================
// 1. Supplier Schema & Types
// ==========================================
export const SupplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nama supplier minimal 2 karakter'),
  contact_person: z.string().optional(),
  phone: z.string().min(8, 'Nomor telepon minimal 8 digit'),
  address: z.string().optional(),
  category: z.string().default('Kain & Material'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type SupplierItem = z.infer<typeof SupplierSchema>;

export interface SupplierManageState {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
}

export const SUPPLIER_STATUS_BADGES: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Aktif', variant: 'success' },
  inactive: { label: 'Non-Aktif', variant: 'danger' },
};

export const SUPPLIER_CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'Kain & Material', label: 'Kain & Material' },
  { value: 'Aksesoris & Resleting', label: 'Aksesoris & Resleting' },
  { value: 'Tinta & Percetakan', label: 'Tinta & Percetakan' },
  { value: 'Packaging & Label', label: 'Packaging & Label' },
];

// ==========================================
// 2. Institution Schema & Types
// ==========================================
export const InstitutionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nama institusi minimal 2 karakter'),
  type: z.enum(['Universitas', 'Sekolah', 'Korporat', 'Komunitas', 'Umum']).default('Universitas'),
  city: z.string().optional(),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  discount_rate: z.number().min(0).max(100).default(0),
});

export type InstitutionItem = z.infer<typeof InstitutionSchema>;

export interface InstitutionManageState {
  search?: string;
  type?: string;
  page?: number;
}

export const INSTITUTION_TYPE_BADGES: Record<string, { label: string; variant: 'primary' | 'info' | 'info' | 'outline' }> = {
  Universitas: { label: 'Kampus / PT', variant: 'primary' },
  Sekolah: { label: 'Sekolah', variant: 'info' },
  Korporat: { label: 'Korporat', variant: 'info' },
  Komunitas: { label: 'Komunitas', variant: 'outline' },
  Umum: { label: 'Umum', variant: 'outline' },
};

export const INSTITUTION_TYPE_OPTIONS = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'Universitas', label: 'Universitas' },
  { value: 'Sekolah', label: 'Sekolah' },
  { value: 'Korporat', label: 'Korporat' },
  { value: 'Komunitas', label: 'Komunitas' },
  { value: 'Umum', label: 'Umum' },
];
