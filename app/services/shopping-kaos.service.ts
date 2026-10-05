import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type ShoppingKaosOrder,
  type SupplierKaos,
  type ProcurementStockLog,
  type ShoppingKaosState,
  CreateProcurementSchema,
  UpdatePaymentProofSchema,
} from '~/schemas/shopping-kaos.schema';

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_KINAU_BACKEND_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_KINAU_BACKEND_URL) ||
  'https://kinauid-backend.vercel.app';

const INTERNAL_API_SECRET =
  (typeof process !== 'undefined' && process.env?.INTERNAL_API_SECRET) ||
  'REPLACE_WITH_STRONG_KEY';

async function safeFetchBackend(endpoint: string, payload: any, retries = 2): Promise<Response> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
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
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export class ShoppingKaosService {
  /**
   * Fetches data for the Shopping Kaos calculator and logs
   */
  static async getShoppingKaosData(state: ShoppingKaosState = {}): Promise<{
    orders: ShoppingKaosOrder[];
    suppliers: SupplierKaos[];
    sablonSuppliers: SupplierKaos[];
    stockLogs: ProcurementStockLog[];
  }> {
    return cacheData(
      `shopping_kaos:${JSON.stringify(state)}`,
      15,
      async () => {
        try {
          // 1. Fetch Orders with kaos / apparel items
          const ordersRes = await safeFetchBackend('/select', {
            table: 'orders',
            where: { deleted_on: 'null' },
            size: 100,
            sort: 'created_on:desc',
          });
          const ordersJson = await ordersRes.json().catch(() => ({ data: [] }));
          const rawOrders: any[] = Array.isArray(ordersJson?.data) ? ordersJson.data : (ordersJson?.data?.items ?? []);

          const mappedOrders: ShoppingKaosOrder[] = rawOrders
            .map((o) => {
              let items: any[] = [];
              try {
                items = typeof o.order_items === 'string' ? JSON.parse(o.order_items || '[]') : (o.order_items || []);
              } catch {
                items = [];
              }

              return {
                id: String(o.id),
                order_number: o.order_number || `ORD-${o.id}`,
                institution_name: o.institution_name || 'Instansi Umum',
                pic_name: o.pic_name,
                pic_phone: o.pic_phone,
                total_amount: Number(o.total_amount || o.total_price || 0),
                status: o.status || 'pending',
                created_on: o.created_on || new Date().toISOString(),
                order_items: items.map((it) => ({
                  id: String(it.id || ''),
                  product_name: it.product_name || it.name || 'Kaos Cotton Combed',
                  color: it.color || it.variant || 'Hitam',
                  size: it.size || 'L',
                  sleeve: it.sleeve || 'Pendek',
                  qty: Number(it.qty || it.quantity || 1),
                  unit_price: Number(it.unit_price || it.price || 0),
                  total_price: Number(it.total_price || (it.unit_price || 0) * (it.qty || 1)),
                })),
              };
            });

          // 2. Fetch Suppliers
          const suppliersRes = await safeFetchBackend('/select', {
            table: 'suppliers',
            where: { deleted: 0 },
            size: 50,
          }).catch(() => null);
          const suppliersJson = suppliersRes ? await suppliersRes.json().catch(() => ({ data: [] })) : { data: [] };
          const rawSuppliers: any[] = Array.isArray(suppliersJson?.data) ? suppliersJson.data : (suppliersJson?.data?.items ?? []);

          const mappedSuppliers: SupplierKaos[] = rawSuppliers.length > 0
            ? rawSuppliers.map((s) => ({
                id: s.id,
                name: s.name || s.supplier_name || 'Supplier Kaos',
                category: s.category || 'cotton_combed',
                phone: s.phone || s.pic_phone,
                price_s_xl: Number(s.price_s_xl || 35000),
                price_2xl: Number(s.price_2xl || 40000),
                price_3xl: Number(s.price_3xl || 45000),
                price_4xl: Number(s.price_4xl || 50000),
                price_5xl: Number(s.price_5xl || 55000),
                price_long_sleeve: Number(s.price_long_sleeve || 7000),
              }))
            : [
                {
                  id: 1,
                  name: 'Grosir Cotton Combed 30s Bandung',
                  category: 'cotton_combed_premium',
                  price_s_xl: 36000,
                  price_2xl: 41000,
                  price_3xl: 46000,
                  price_4xl: 52000,
                  price_5xl: 58000,
                  price_long_sleeve: 7500,
                },
                {
                  id: 2,
                  name: 'Vendor Kaos Polos Kinau Standard',
                  category: 'cotton_combed_standard',
                  price_s_xl: 32000,
                  price_2xl: 37000,
                  price_3xl: 42000,
                  price_4xl: 48000,
                  price_5xl: 54000,
                  price_long_sleeve: 6000,
                },
              ];

          const sablonSuppliers: SupplierKaos[] = [
            {
              id: 101,
              name: 'DTF Subkon Express Malang',
              category: 'sablon_dtf',
              price_s_xl: 45000, // per meter
              price_2xl: 45000,
              price_3xl: 45000,
              price_long_sleeve: 0,
            },
            {
              id: 102,
              name: 'Sablon Rubber Manual Pro',
              category: 'sablon_manual',
              price_s_xl: 30000,
              price_2xl: 30000,
              price_3xl: 30000,
              price_long_sleeve: 0,
            },
          ];

          // 3. Fetch Stock Logs
          const stockLogsRes = await safeFetchBackend('/select', {
            table: 'stock_logs',
            where: { deleted: 0 },
            size: 50,
            sort: 'created_on:desc',
          }).catch(() => null);
          const stockLogsJson = stockLogsRes ? await stockLogsRes.json().catch(() => ({ data: [] })) : { data: [] };
          const rawLogs: any[] = Array.isArray(stockLogsJson?.data) ? stockLogsJson.data : (stockLogsJson?.data?.items ?? []);

          const mappedStockLogs: ProcurementStockLog[] = rawLogs.map((l) => ({
            id: String(l.id),
            order_trx_code: l.order_trx_code || '-',
            supplier_id: l.supplier_id,
            supplier_name: l.supplier_name || 'Vendor Kaos',
            total_item_qty: Number(l.total_item_qty || 0),
            total_item_price: Number(l.total_item_price || 0),
            discount_value: Number(l.discount_value || 0),
            shipping_cost: Number(l.shipping_cost || 0),
            admin_cost: Number(l.admin_cost || 0),
            sablon_supplier_id: l.sablon_supplier_id,
            sablon_kebutuhan_per_meter: Number(l.sablon_kebutuhan_per_meter || 0),
            sablon_cost: Number(l.sablon_cost || 0),
            sablon_discount_value: Number(l.sablon_discount_value || 0),
            sablon_shipping_cost: Number(l.sablon_shipping_cost || 0),
            sablon_admin_cost: Number(l.sablon_admin_cost || 0),
            final_amount: Number(l.final_amount || 0),
            laba_bersih: Number(l.laba_bersih || 0),
            description: l.description,
            created_on: l.created_on || new Date().toISOString(),
            kaos_payment_proof_paid: l.kaos_payment_proof_paid,
            sablon_payment_proof_paid: l.sablon_payment_proof_paid,
          }));

          return {
            orders: mappedOrders,
            suppliers: mappedSuppliers,
            sablonSuppliers,
            stockLogs: mappedStockLogs,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'ShoppingKaosService.getShoppingKaosData' });
          return {
            orders: [],
            suppliers: [],
            sablonSuppliers: [],
            stockLogs: [],
          };
        }
      }
    );
  }

  /**
   * Records a procurement and calculated profit record
   */
  static async createProcurement(data: any) {
    try {
      await safeFetchBackend('/insert', {
        table: 'stock_logs',
        data: {
          ...data,
          created_on: new Date().toISOString(),
          deleted: 0,
        },
      });

      invalidateCacheByTag('shopping_kaos');
      return { success: true, message: 'Kalkulasi belanja bahan & estimasi laba berhasil dicatat' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'ShoppingKaosService.createProcurement' });
      return { success: false, message: error?.message || 'Gagal menyimpan kalkulasi pengadaan' };
    }
  }

  /**
   * Updates payment transfer proof URL
   */
  static async updatePaymentProof(id: string, field: string, fileUrl: string) {
    try {
      await safeFetchBackend('/update', {
        table: 'stock_logs',
        data: {
          [field]: fileUrl,
          modified_on: new Date().toISOString(),
        },
        where: isNaN(Number(id)) ? { order_trx_code: id } : { id: Number(id) },
      });

      invalidateCacheByTag('shopping_kaos');
      return { success: true, message: 'Bukti pembayaran berhasil disimpan' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'ShoppingKaosService.updatePaymentProof' });
      return { success: false, message: error?.message || 'Gagal menyimpan bukti pembayaran' };
    }
  }

  /**
   * Action Handler Strategy Dispatcher for Single-File Feature Builder
   */
  static async handleShoppingKaosAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'create-procurement' || intent === 'create_procurement') {
        const parsed = CreateProcurementSchema.safeParse({
          ...rawData,
          intent: 'create-procurement',
        });
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message || 'Data pengadaan tidak valid' },
            { status: 400 }
          );
        }

        const res = await ShoppingKaosService.createProcurement(parsed.data);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ created: true, message: res.message });
      }

      if (intent === 'update-payment-proof' || intent === 'update_payment_proof') {
        const parsed = UpdatePaymentProofSchema.safeParse({
          ...rawData,
          intent: 'update-payment-proof',
        });
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message || 'Data bukti transfer tidak valid' },
            { status: 400 }
          );
        }

        const res = await ShoppingKaosService.updatePaymentProof(parsed.data.id, parsed.data.target_field, parsed.data.file_url);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ updated: true, message: res.message });
      }

      return Response.json({ error: `Intent aksi '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'ShoppingKaosService.handleShoppingKaosAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
