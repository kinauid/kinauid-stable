import { z } from 'zod';
import type { TableTabItem } from '~/builder';

// ============================================================================
// 1. Interfaces & Types
// ============================================================================

export interface ProductPriceRule {
  id?: string | number;
  product_id?: string | number;
  min_qty: number;
  price: number;
}

export interface ProductVariant {
  id?: string | number;
  product_id?: string | number;
  variant_name: string;
  base_price: number;
  is_default: boolean | number;
}

export interface ProductDriveFolder {
  name: string;
  is_card_front: boolean;
  is_card_back: boolean;
  is_lanyard: boolean;
  is_sablon_depan: boolean;
  is_sablon_belakang: boolean;
}

export interface ProductCategoryItem {
  id: string | number;
  uid?: string;
  name: string;
  description?: string;
  default_drive_folders?: string | (string | ProductDriveFolder)[];
  product_count?: number;
  created_on?: string;
  modified_on?: string;
  deleted?: number;
}

export interface ProductItem {
  id: string | number;
  uid?: string;
  code?: string;
  name: string;
  image?: string;
  type?: 'single' | 'package' | 'material' | 'custom' | 'id_card' | 'lanyard';
  category_id?: string | number | null;
  category_name?: string;
  description?: string;
  price?: number;
  total_price?: number;
  show_in_dashboard?: boolean | number;
  product_price_rules?: ProductPriceRule[];
  product_variants?: ProductVariant[];
  created_on?: string;
  modified_on?: string;
  deleted?: number;
}

export interface ProductState {
  tab?: 'products' | 'categories';
  search?: string;
  category?: string;
  category_id?: string;
  show_in_dashboard?: string;
  page?: number;
  size?: number;
}

export interface ProductInitialData {
  products: ProductItem[];
  categories: ProductCategoryItem[];
  totalProducts: number;
  totalCategories: number;
  activeInDashboardCount: number;
  categoryOptions: { value: string | number; label: string; data?: ProductCategoryItem }[];
}

// ============================================================================
// 2. Zod Validation Schemas
// ============================================================================

export const ProductPriceRuleSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  product_id: z.union([z.string(), z.number()]).optional(),
  min_qty: z.coerce.number().min(0).default(1),
  price: z.coerce.number().min(0).default(0),
});

export const ProductVariantSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  product_id: z.union([z.string(), z.number()]).optional(),
  variant_name: z.string().min(1, 'Nama variasi wajib diisi'),
  base_price: z.coerce.number().min(0).default(0),
  is_default: z.union([z.boolean(), z.number()]).default(0),
});

export const CreateProductSchema = z.object({
  intent: z.enum(['create_product', 'update_product', 'duplicate_product']),
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, 'Nama produk wajib diisi'),
  category_id: z.union([z.string(), z.number()]).nullable().optional(),
  category_name: z.string().optional(),
  type: z.string().default('single'),
  description: z.string().optional().default(''),
  image: z.string().optional().default(''),
  show_in_dashboard: z.union([z.boolean(), z.number()]).default(1),
  product_price_rules: z.union([z.string(), z.array(z.any())]).optional(),
  product_variants: z.union([z.string(), z.array(z.any())]).optional(),
});

export const CreateProductCategorySchema = z.object({
  intent: z.enum(['create_category', 'update_category']),
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  description: z.string().optional().default(''),
  default_drive_folders: z.union([z.string(), z.array(z.any())]).optional(),
});

// ============================================================================
// 3. Navigation Tabs & Presets
// ============================================================================

export const PRODUCT_TABS: TableTabItem[] = [
  { key: 'products', label: 'Daftar Produk', icon: 'Tag' },
  { key: 'categories', label: 'Kategori Produk', icon: 'FolderCog' },
];

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'single', label: 'Single Item (Standar)' },
  { value: 'package', label: 'Paket Bundling' },
  { value: 'material', label: 'Bahan Baku' },
];

export const DRIVE_FOLDER_OPTIONS = [
  { key: 'is_card_front', label: 'ID Card Depan' },
  { key: 'is_card_back', label: 'ID Card Belakang' },
  { key: 'is_lanyard', label: 'Lanyard' },
  { key: 'is_sablon_depan', label: 'Sablon Depan' },
  { key: 'is_sablon_belakang', label: 'Sablon Belakang' },
] as const;
