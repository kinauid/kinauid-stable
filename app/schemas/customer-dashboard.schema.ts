import { z } from 'zod';

export interface CustomerProductItem {
  id: string | number;
  name: string;
  slug?: string;
  price?: number;
  description?: string;
  image?: string;
  category?: string;
  min_order?: number;
  is_featured?: boolean;
}

export interface ProductionPortfolioItem {
  id: string | number;
  order_number: string;
  product_name: string;
  customer_name?: string;
  institution_name?: string;
  total_qty?: number;
  completed_at?: string;
  image_url?: string;
  rating?: number;
}

export interface CustomerDashboardData {
  products: CustomerProductItem[];
  productionItems: ProductionPortfolioItem[];
  user: {
    fullname?: string;
    email?: string;
    institution?: string;
  };
  activeOrderCount: number;
}

export interface CustomerDashboardState {
  category?: string;
  search?: string;
}

export const CustomerInquirySchema = z.object({
  intent: z.literal('customer-inquiry').or(z.literal('customer_inquiry')),
  product_id: z.string().min(1),
  product_name: z.string().min(1),
  estimated_qty: z.coerce.number().min(1).default(50),
  notes: z.string().optional().default(''),
});
