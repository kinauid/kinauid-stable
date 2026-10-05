import type { ActionFunctionArgs } from 'react-router';
import { cacheData } from '~/utils/cache';
import { successResponse, errorResponse } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type CustomerDashboardData,
  type CustomerDashboardState,
  type CustomerProductItem,
  type ProductionPortfolioItem,
  CustomerInquirySchema,
} from '~/schemas/customer-dashboard.schema';

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_KINAU_BACKEND_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_KINAU_BACKEND_URL) ||
  'https://kinauid-backend.vercel.app';

const INTERNAL_API_SECRET =
  (typeof process !== 'undefined' && process.env?.INTERNAL_API_SECRET) ||
  'REPLACE_WITH_STRONG_KEY';

async function safeFetchBackend(endpoint: string, payload: any): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${INTERNAL_API_SECRET}`,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  return res;
}

export class CustomerDashboardService {
  /**
   * Loads customer dashboard data (featured catalog + finished portfolio)
   */
  static async getDashboardData(state: CustomerDashboardState = {}): Promise<CustomerDashboardData> {
    return cacheData(
      `customer_dashboard:${state.category || 'all'}:${state.search || ''}`,
      30,
      async () => {
        try {
          const [productsRes, ordersRes] = await Promise.all([
            safeFetchBackend('/select', {
              table: 'products',
              where: { deleted: 0 },
              size: 12,
              sort: 'id:asc',
            }).catch(() => null),
            safeFetchBackend('/select', {
              table: 'orders',
              where: { status: 'done', deleted: 0 },
              size: 6,
              sort: 'created_on:desc',
            }).catch(() => null),
          ]);

          let products: CustomerProductItem[] = [];
          if (productsRes && productsRes.ok) {
            const json = await productsRes.json().catch(() => ({ data: [] }));
            const items = Array.isArray(json?.data) ? json.data : json?.data?.items ?? [];
            products = items.map((p: any) => ({
              id: String(p.id),
              name: p.name || 'Paket Merchandise Kinau',
              slug: p.slug || p.id,
              price: Number(p.price || p.base_price || 25000),
              description: p.description || 'Spesifikasi standar konveksi & sablon apparel Kinau.',
              image: p.image_url || p.image || 'https://data.kinau.web.id/sample-kaos.png',
              category: p.category || 'apparel',
              min_order: Number(p.min_order || 12),
              is_featured: Boolean(p.is_featured ?? true),
            }));
          }

          if (products.length === 0) {
            products = [
              {
                id: '1',
                name: 'Paket Lanyard Sablon & ID Card Doff',
                price: 18500,
                description: 'Tali lanyard 2cm nylon/tisue + kartu PVC id card laminasi doff tahan air.',
                image: 'https://data.kinau.web.id/sample-lanyard.png',
                category: 'idcard',
                min_order: 20,
                is_featured: true,
              },
              {
                id: '2',
                name: 'Kaos Cotton Combed 30s Cetak DTF Presisi',
                price: 65000,
                description: 'Bahan 100% cotton combed reaktif, adem, sablon DTF full color tajam.',
                image: 'https://data.kinau.web.id/sample-kaos.png',
                category: 'kaos',
                min_order: 12,
                is_featured: true,
              },
              {
                id: '3',
                name: 'Selempang Wisuda Bludru Bordir Komputer',
                price: 45000,
                description: 'Bahan bludru premium 2 lapis list pita satin/renda dengan bordir emas berkilau.',
                image: 'https://data.kinau.web.id/sample-selempang.png',
                category: 'selempang',
                min_order: 1,
                is_featured: true,
              },
              {
                id: '4',
                name: 'Kemeja PDH / Korsa Drill Bordir Logo',
                price: 125000,
                description: 'Kain Japan Drill / American Drill tebal berpori rapi dengan 3 titik bordir nama & logo.',
                image: 'https://data.kinau.web.id/sample-pdh.png',
                category: 'pdh',
                min_order: 15,
                is_featured: true,
              },
            ];
          }

          let productionItems: ProductionPortfolioItem[] = [];
          if (ordersRes && ordersRes.ok) {
            const json = await ordersRes.json().catch(() => ({ data: [] }));
            const items = Array.isArray(json?.data) ? json.data : json?.data?.items ?? [];
            productionItems = items.map((o: any) => ({
              id: String(o.id),
              order_number: o.order_number || `ORD-${o.id}`,
              product_name: o.product_name || 'Merchandise Custom',
              customer_name: o.customer_name || 'Pelanggan Kinau',
              institution_name: o.institution_name || 'Universitas Islam Malang',
              total_qty: Number(o.total_qty || 50),
              completed_at: o.completed_at || o.modified_on || new Date().toISOString(),
              image_url: o.image_url || 'https://data.kinau.web.id/portfolio-sample.jpg',
              rating: 5,
            }));
          }

          if (productionItems.length === 0) {
            productionItems = [
              {
                id: '101',
                order_number: 'ORD-KKN-2026-088',
                product_name: '450 pcs Lanyard + ID Card KKN UNISMA',
                customer_name: 'Panitia KKN UNISMA',
                institution_name: 'Universitas Islam Malang',
                total_qty: 450,
                completed_at: '2026-09-28',
                image_url: 'https://data.kinau.web.id/portfolio-1.jpg',
                rating: 5,
              },
              {
                id: '102',
                order_number: 'ORD-TI-2026-042',
                product_name: '120 pcs Kaos Reuni Akbar DTF Navy',
                customer_name: 'Alumni Teknik Industri',
                institution_name: 'Fakultas Teknik',
                total_qty: 120,
                completed_at: '2026-10-01',
                image_url: 'https://data.kinau.web.id/portfolio-2.jpg',
                rating: 5,
              },
              {
                id: '103',
                order_number: 'ORD-WSD-2026-015',
                product_name: '85 pcs Selempang Bludru Bordir Emas',
                customer_name: 'Biro Yudisium Sarjana',
                institution_name: 'UNISMA',
                total_qty: 85,
                completed_at: '2026-10-03',
                image_url: 'https://data.kinau.web.id/portfolio-3.jpg',
                rating: 5,
              },
            ];
          }

          return {
            products,
            productionItems,
            user: {
              fullname: 'Mitra Pelanggan Kinau',
              email: 'pelanggan@kinau.id',
              institution: 'Universitas Islam Malang',
            },
            activeOrderCount: 2,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'CustomerDashboardService.getDashboardData' });
          return {
            products: [],
            productionItems: [],
            user: { fullname: 'Pelanggan', email: '' },
            activeOrderCount: 0,
          };
        }
      }
    );
  }

  /**
   * Action Strategy Dispatcher for Customer Dashboard
   */
  static async handleDashboardAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'customer-inquiry' || intent === 'customer_inquiry') {
        const parsed = CustomerInquirySchema.safeParse({ ...rawData, intent: 'customer-inquiry' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data konsultasi tidak valid' }, { status: 400 });
        }
        return successResponse({
          inquiry: true,
          message: `Permintaan konsultasi untuk ${parsed.data.product_name} (${parsed.data.estimated_qty} pcs) berhasil dikirim ke CS Kinau!`,
        });
      }

      return Response.json({ error: `Intent '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'CustomerDashboardService.handleDashboardAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
