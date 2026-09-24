import { z } from 'zod';

export const SizeBreakdownSchema = z.object({
  S: z.number().default(0),
  M: z.number().default(0),
  L: z.number().default(0),
  XL: z.number().default(0),
  XXL: z.number().default(0),
  custom: z.number().default(0),
});

export const OrderItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  order_number: z.string(),
  customer_name: z.string().min(1, 'Nama pemesan wajib diisi').default('Pelanggan Kinau'),
  customer_phone: z.string().optional().default(''),
  pic_name: z.string().optional(),
  pic_phone: z.string().optional(),
  institution_name: z.string().optional(),
  is_kkn: z.union([z.boolean(), z.number()]).default(false),
  kkn_type: z.string().optional(),
  kkn_period: z.string().optional(),
  kkn_detail: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  kkn_year: z.union([z.string(), z.number()]).optional(),
  product_name: z.string().default('Pesanan Custom'),
  category: z.string().default('Jersey'),
  order_type: z.string().optional(),
  total_qty: z.number().default(1),
  unit_price: z.number().default(125000),
  subtotal: z.number().default(0),
  discount: z.number().default(0),
  grand_total: z.number().default(0),
  total_amount: z.number().optional(),
  paid_amount: z.number().optional(),
  dp_amount: z.number().optional(),
  status: z.string().default('pending'),
  status_printed: z.string().default('waiting'),
  payment_status: z.string().default('none'),
  payment_method: z.string().optional(),
  payment_proof: z.string().optional(),
  dp_payment_proof: z.string().optional(),
  payment_detail: z.any().optional(),
  dp_payment_detail: z.any().optional(),
  is_portfolio: z.union([z.boolean(), z.number()]).optional(),
  images: z.any().optional(),
  portfolio_images: z.array(z.string()).optional(),
  created_at: z.string().optional(),
  deadline_at: z.string().optional(),
  notes: z.string().optional(),
  order_items: z.array(z.any()).optional(),
  is_sponsor: z.union([z.boolean(), z.number()]).optional(),
  created_by: z.any().optional(),
  computed_items_subtotal: z.number().optional(),
}).passthrough();

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type SizeBreakdown = z.infer<typeof SizeBreakdownSchema>;

export interface OrderState {
  search?: string;
  tab?: 'reguler' | 'kkn' | 'portfolio' | 'all';
  year?: string;
  status?: string;
  category?: string;
  order_type?: string;
  payment_status?: string;
  status_printed?: string;
  kkn_institution?: string;
  portfolio_only?: boolean;
  sortBy?: string;
  page?: number;
}

export const BANK_ACCOUNTS_PRESET = [
  { id: 'bca', code: 'BCA', name: 'BCA Bisnis (Utama)', account_number: '123-456-7890', account_holder: 'PT Kinau Apparel Nusantara' },
  { id: 'mandiri', code: 'MANDIRI', name: 'Mandiri Operasional', account_number: '987-654-3210', account_holder: 'Kinau Apparel' },
  { id: 'bri', code: 'BRI', name: 'BRI Kas Produksi', account_number: '554-123-999', account_holder: 'Kinau ID' },
  { id: 'bni', code: 'BNI', name: 'BNI Giro', account_number: '012-345-6789', account_holder: 'PT Kinau Apparel' },
  { id: 'cash', code: 'CASH', name: 'Kas Tunai Workshop (Direct Cash)', account_number: 'DIRECT-CASH', account_holder: 'Kasir Kinau' },
];

export const ORDER_STATUS_BADGES: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'outline' }> = {
  ordered: { label: 'Pesanan Masuk', variant: 'outline' },
  pending: { label: 'Pending', variant: 'outline' },
  in_design: { label: 'Penyusunan Desain', variant: 'info' },
  confirmed: { label: 'Diproses', variant: 'info' },
  in_production: { label: 'Proses Produksi', variant: 'primary' },
  ready_to_ship: { label: 'Siap Dikirim', variant: 'warning' },
  completed: { label: 'Selesai & Diterima', variant: 'success' },
  done: { label: 'Selesai', variant: 'success' },
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
};

export const PRINT_STATUS_BADGES: Record<string, { label: string; variant: 'success' | 'outline' }> = {
  unprinted: { label: 'Belum Dicetak', variant: 'outline' },
  waiting: { label: 'Antrean Cetak', variant: 'outline' },
  printed: { label: 'Tercetak', variant: 'success' },
  done: { label: 'Tercetak', variant: 'success' },
};

export const PAYMENT_STATUS_BADGES: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  none: { label: 'Belum Bayar', variant: 'danger' },
  unpaid: { label: 'Belum Bayar', variant: 'danger' },
  down_payment: { label: 'DP Terbayar', variant: 'warning' },
  partial_dp: { label: 'DP Terbayar', variant: 'warning' },
  paid: { label: 'Lunas', variant: 'success' },
  refunded: { label: 'Dikembalikan', variant: 'danger' },
};

export const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status Pengerjaan' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Diproses' },
  { value: 'in_design', label: 'Penyusunan Desain' },
  { value: 'in_production', label: 'Proses Produksi' },
  { value: 'ready_to_ship', label: 'Siap Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status Bayar' },
  { value: 'unpaid', label: 'Belum Bayar (Unpaid)' },
  { value: 'partial_dp', label: 'DP Terbayar (Down Payment)' },
  { value: 'paid', label: 'Lunas (Paid in Full)' },
];

export const PRODUCT_CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'Jersey', label: 'Jersey Sublimasi' },
  { value: 'ID Card & Lanyard', label: 'ID Card & Lanyard' },
  { value: 'Kaos Polos', label: 'Kaos Polos / Sablon' },
  { value: 'Polo Shirt', label: 'Polo Shirt Bordir' },
  { value: 'Jaket / Hoodie', label: 'Jaket & Hoodie' },
  { value: 'Merchandise', label: 'Merchandise & Selempang' },
];

export const JerseyConfigSchema = z.object({
  template_id: z.string().default('tmpl-cyber-neon'),
  fabric: z.enum(['Dryfit Milano', 'Dryfit Benzema', 'Dryfit Nike', 'Polyester Premium']).default('Dryfit Milano'),
  collar_type: z.enum(['V-Neck', 'O-Neck', 'Polo Kerah', 'Kerah Shanghai']).default('V-Neck'),
  sleeve_type: z.enum(['Pendek', 'Panjang']).default('Pendek'),
  primary_color: z.string().default('#0a192f'),
  secondary_color: z.string().default('#0097b2'),
  accent_color: z.string().default('#f59e0b'),
  nameset_enabled: z.boolean().default(true),
  notes: z.string().optional(),
});

export type JerseyConfig = z.infer<typeof JerseyConfigSchema>;
