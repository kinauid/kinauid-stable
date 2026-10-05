import { z } from 'zod';

export interface OrderItemSpec {
  id?: string;
  product_id: string | number;
  product_name: string;
  variant?: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export interface OrderDetailData {
  id: string | number;
  order_number: string;
  institution_id?: string | number;
  institution_name: string;
  institution_domain?: string;
  pic_name: string;
  pic_phone: string;
  deadline?: string;
  status: 'pending' | 'design_review' | 'production' | 'ready_to_ship' | 'delivered' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'dp' | 'paid';
  dp_amount: number;
  total_amount: number;
  discount_type?: string;
  discount_value?: number;
  is_kkn?: boolean;
  kkn_source?: string;
  kkn_type?: string;
  kkn_period?: number;
  kkn_year?: number;
  kkn_detail?: string;
  is_sponsor?: boolean;
  is_personal?: boolean;
  notes?: string;
  items: OrderItemSpec[];
  images: string[];
}

export interface OrderEditState {
  id?: string;
}

export const UpdateOrderDetailSchema = z.object({
  intent: z.literal('update-order').or(z.literal('update_order')),
  id: z.string().min(1, 'ID order wajib diisi'),
  order_number: z.string().min(1, 'Nomor order wajib diisi'),
  institution_name: z.string().min(1, 'Nama institusi/pelanggan wajib diisi'),
  pic_name: z.string().min(1, 'Nama PIC wajib diisi'),
  pic_phone: z.string().min(1, 'Nomor kontak PIC wajib diisi'),
  deadline: z.string().optional().default(''),
  status: z.enum(['pending', 'design_review', 'production', 'ready_to_ship', 'delivered', 'completed', 'cancelled']).default('pending'),
  payment_status: z.enum(['unpaid', 'dp', 'paid']).default('unpaid'),
  dp_amount: z.coerce.number().min(0).default(0),
  total_amount: z.coerce.number().min(0).default(0),
  discount_type: z.string().optional().nullable(),
  discount_value: z.coerce.number().min(0).default(0),
  is_kkn: z.coerce.boolean().default(false),
  kkn_type: z.string().optional().default('PPM'),
  kkn_period: z.coerce.number().default(1),
  kkn_year: z.coerce.number().default(2026),
  kkn_detail: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  items: z.string().optional().default('[]'),
  images: z.string().optional().default('[]'),
});
