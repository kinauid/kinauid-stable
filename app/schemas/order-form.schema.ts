import { z } from 'zod';

export interface ProductPriceRule {
  id: number | string;
  product_id?: number | string;
  min_qty: number;
  price: number;
}

export interface ProductVariant {
  id: number | string;
  product_id?: number | string;
  variant_name: string;
  base_price: number;
  is_default?: boolean | number;
}

export interface CatalogProduct {
  id: string;
  code?: string;
  name: string;
  image?: string;
  type?: string;
  category_id?: number | string;
  category_name?: string;
  total_price?: number;
  price?: number;
  product_variants?: ProductVariant[];
  product_price_rules?: ProductPriceRule[];
}

export interface InstitutionOption {
  id: string | number;
  name: string;
  abbr?: string;
  city?: string;
  type?: string;
}

export interface OrderFormItem {
  productId: string;
  productName?: string;
  variant_id?: number | string | null;
  variant_name?: string | null;
  variant_price?: number;
  quantity: number | string;
  price_rule_id?: number | string | null;
  price_rule_min_qty?: number | null;
  price_rule_value?: number;
  variant_final_price?: number;
  product_variants?: ProductVariant[];
  product_price_rules?: ProductPriceRule[];
}

export interface KknDetails {
  periode: string | number;
  tahun: string | number;
  tipe: 'PPM' | 'Tematik';
  nilai: string;
  jumlahKelompok?: number;
}

export interface OrderFormData {
  instansiMode: 'new' | 'existing' | 'perorangan';
  instansi_id?: string | number | null;
  instansi: string;
  pemesanName: string;
  pemesanPhone: string;
  isKKN: boolean;
  kknDetails?: KknDetails;
  items: OrderFormItem[];
  isSponsor: boolean;
  discount?: {
    type: 'nominal' | 'percent';
    value: number;
  };
  deadline: string;
  statusPembayaran: 'Tidak Ada' | 'DP' | 'Lunas';
  dpAmount?: number;
  accessCode: string;
  domain: string;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  createdAt?: string;
  portfolioImages?: string[];
  is_portfolio?: boolean;
}

export interface OrderFormInitialData {
  products: CatalogProduct[];
  institutions: InstitutionOption[];
  accessCode?: string;
  kknPeriod?: { period: string; year: string; label: string };
}

export function generateAccessCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getKKNPeriod(): { period: string; year: string; label: string } {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  if (month >= 1 && month <= 7) {
    return { period: '2', year: String(year), label: `KKN ITERA ${year} - PERIODE 2` };
  } else {
    const targetYear = month >= 8 ? year + 1 : year;
    return { period: '1', year: String(targetYear), label: `KKN ITERA ${targetYear} - PERIODE 1` };
  }
}

export interface OrderFormState {
  mode?: 'reguler' | 'kkn';
}

export const OrderFormItemSchema = z.object({
  productId: z.union([z.string(), z.number()]).transform(String),
  productName: z.string().optional(),
  variant_id: z.union([z.string(), z.number()]).nullable().optional(),
  variant_name: z.string().nullable().optional(),
  variant_price: z.number().optional().default(0),
  quantity: z.union([z.number(), z.string()]).transform((val) => Number(val) || 1),
  price_rule_id: z.union([z.string(), z.number()]).nullable().optional(),
  price_rule_min_qty: z.number().nullable().optional(),
  price_rule_value: z.number().optional().default(0),
  variant_final_price: z.number().optional().default(0),
});

export const CreateOrderFormSchema = z.object({
  instansiMode: z.enum(['new', 'existing', 'perorangan']).default('new'),
  instansi_id: z.union([z.string(), z.number()]).nullable().optional(),
  instansi: z.string().optional().default(''),
  pemesanName: z.string().min(1, 'Nama pemesan wajib diisi'),
  pemesanPhone: z.string().min(1, 'No. WhatsApp wajib diisi'),
  isKKN: z.boolean().default(false),
  kknDetails: z
    .object({
      periode: z.union([z.string(), z.number()]),
      tahun: z.union([z.string(), z.number()]),
      tipe: z.enum(['PPM', 'Tematik']),
      nilai: z.string(),
      jumlahKelompok: z.number().optional(),
    })
    .optional(),
  items: z.array(OrderFormItemSchema).min(1, 'Pilih minimal satu produk'),
  isSponsor: z.boolean().default(false),
  discount: z
    .object({
      type: z.enum(['nominal', 'percent']),
      value: z.number().min(0),
    })
    .optional(),
  deadline: z.string().optional().default(''),
  statusPembayaran: z.enum(['Tidak Ada', 'DP', 'Lunas']).default('Tidak Ada'),
  dpAmount: z.number().min(0).optional().default(0),
  accessCode: z.string().default(''),
  domain: z.string().optional(),
  totalAmount: z.number().min(0),
  portfolioImages: z.array(z.string()).optional().default([]),
  is_portfolio: z.boolean().optional().default(false),
});

export const INSTANSI_MODE_OPTIONS = [
  { val: 'new', label: 'Instansi Baru' },
  { val: 'existing', label: 'Pilih Instansi' },
  { val: 'perorangan', label: 'Perorangan' },
] as const;

export const KKN_TYPE_OPTIONS = [
  { val: 'PPM', label: 'PPM (Reguler)' },
  { val: 'Tematik', label: 'Tematik (Desa)' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { val: 'Tidak Ada', label: 'Tidak Ada (Belum Bayar)' },
  { val: 'DP', label: 'DP (Uang Muka)' },
  { val: 'Lunas', label: 'Lunas' },
] as const;

export const DISCOUNT_TYPE_OPTIONS = [
  { value: 'nominal', label: 'Nominal (Rp)' },
  { value: 'percent', label: 'Persen (%)' },
] as const;
