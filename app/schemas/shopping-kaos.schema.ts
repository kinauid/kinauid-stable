import { z } from 'zod';

export interface SupplierKaos {
  id: string | number;
  name: string;
  category?: string;
  phone?: string;
  price_s_xl: number;
  price_2xl: number;
  price_3xl: number;
  price_4xl?: number;
  price_5xl?: number;
  price_long_sleeve: number;
}

export interface KaosOrderItemDetail {
  id?: string;
  product_name?: string;
  color?: string;
  size?: string;
  sleeve?: string;
  qty: number;
  unit_price?: number;
  total_price?: number;
}

export interface ShoppingKaosOrder {
  id: string;
  order_number: string;
  institution_name: string;
  pic_name?: string;
  pic_phone?: string;
  total_amount: number;
  status: string;
  created_on: string;
  order_items: KaosOrderItemDetail[];
}

export interface ProcurementStockLog {
  id: string;
  order_trx_code: string;
  supplier_id?: number;
  supplier_name?: string;
  total_item_qty: number;
  total_item_price: number;
  discount_value: number;
  shipping_cost: number;
  admin_cost: number;
  sablon_supplier_id?: number;
  sablon_kebutuhan_per_meter?: number;
  sablon_cost?: number;
  sablon_discount_value?: number;
  sablon_shipping_cost?: number;
  sablon_admin_cost?: number;
  final_amount: number;
  laba_bersih: number;
  description?: string;
  created_on: string;
  kaos_payment_proof_paid?: string;
  sablon_payment_proof_paid?: string;
}

export interface ShoppingKaosState {
  order_id?: string;
  supplier_id?: string;
  search?: string;
}

export const CreateProcurementSchema = z.object({
  intent: z.literal('create-procurement').or(z.literal('create_procurement')),
  order_trx_code: z.string().min(1, 'Nomor order wajib diisi'),
  supplier_id: z.coerce.number().min(1, 'Supplier wajib dipilih'),
  total_item_qty: z.coerce.number().min(1, 'Jumlah item harus > 0'),
  total_item_price: z.coerce.number().min(0),
  discount_value: z.coerce.number().default(0),
  admin_cost: z.coerce.number().default(0),
  shipping_cost: z.coerce.number().default(0),
  sablon_supplier_id: z.coerce.number().optional().nullable(),
  sablon_kebutuhan_per_meter: z.coerce.number().default(0),
  sablon_cost: z.coerce.number().default(0),
  sablon_discount_value: z.coerce.number().default(0),
  sablon_admin_cost: z.coerce.number().default(0),
  sablon_shipping_cost: z.coerce.number().default(0),
  final_amount: z.coerce.number(),
  laba_bersih: z.coerce.number(),
  description: z.string().optional().default(''),
});

export const UpdatePaymentProofSchema = z.object({
  intent: z.literal('update-payment-proof').or(z.literal('update_payment_proof')),
  id: z.string().min(1, 'ID Stock Log wajib diisi'),
  target_field: z.enum(['kaos_payment_proof_paid', 'sablon_payment_proof_paid', 'kaos_payment_proof_dp', 'sablon_payment_proof_dp']),
  file_url: z.string().min(1, 'URL Bukti Transfer wajib diisi'),
});
