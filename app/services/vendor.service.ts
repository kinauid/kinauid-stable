import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type VendorCategory,
  type VendorSubkonOrder,
  type VendorData,
  type VendorState,
  UpdateVendorStatusSchema,
} from '~/schemas/vendor.schema';

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

export class VendorService {
  /**
   * Fetches subkon / vendor orders filtered by category
   */
  static async getVendorOrders(state: VendorState = {}): Promise<VendorData> {
    const activeCategory = state.category || 'selempang';

    return cacheData(
      `vendor_orders:${activeCategory}:${state.search || ''}`,
      10,
      async () => {
        try {
          const res = await safeFetchBackend('/select', {
            table: 'orders',
            where: { deleted_on: 'null' },
            size: 150,
            sort: 'created_on:desc',
          });

          const json = await res.json().catch(() => ({ data: [] }));
          const rawOrders: any[] = Array.isArray(json?.data) ? json.data : (json?.data?.items ?? []);

          // Filter by keyword relevance
          const filtered = rawOrders.filter((o) => {
            const inst = (o.institution_name || '').toLowerCase();
            let items: any[] = [];
            try {
              items = typeof o.order_items === 'string' ? JSON.parse(o.order_items || '[]') : (o.order_items || []);
            } catch {
              items = [];
            }

            const itemText = items.map((it) => `${it.product_name || it.name || ''} ${it.color || ''}`).join(' ').toLowerCase();

            if (activeCategory === 'selempang') {
              return inst.includes('selempang') || inst.includes('selendang') || itemText.includes('selempang') || itemText.includes('selendang') || itemText.includes('bordir');
            }
            if (activeCategory === 'seragam') {
              return inst.includes('seragam') || inst.includes('kemeja') || inst.includes('pdh') || itemText.includes('seragam') || itemText.includes('kemeja') || itemText.includes('pdh') || itemText.includes('jaket');
            }
            if (activeCategory === 'bordir') {
              return inst.includes('bordir') || itemText.includes('bordir') || itemText.includes('emblem') || itemText.includes('badge');
            }
            return true;
          });

          const mapped: VendorSubkonOrder[] = filtered.map((o) => {
            let items: any[] = [];
            try {
              items = typeof o.order_items === 'string' ? JSON.parse(o.order_items || '[]') : (o.order_items || []);
            } catch {
              items = [];
            }

            const itemsSummary = items.map((it) => `${it.product_name || it.name || 'Produk'} (${it.qty || 1} pcs)`).join(', ') || 'Custom Subkon Item';
            const totalQty = items.reduce((acc, it) => acc + Number(it.qty || 1), 0) || 1;

            return {
              id: String(o.id),
              order_number: o.order_number || `ORD-${o.id}`,
              institution_name: o.institution_name || 'Instansi Umum',
              pic_name: o.pic_name,
              pic_phone: o.pic_phone,
              category: activeCategory,
              items_summary: itemsSummary,
              total_qty: totalQty,
              total_amount: Number(o.total_amount || o.total_price || 0),
              status: o.status || 'processing',
              created_on: o.created_on || new Date().toISOString(),
              vendor_name: 'Mitra Bordir & Jahit Kinau',
              notes: o.notes,
            };
          });

          const activeCount = mapped.filter((o) => o.status !== 'done' && o.status !== 'completed').length;
          const doneCount = mapped.filter((o) => o.status === 'done' || o.status === 'completed').length;

          return {
            orders: mapped,
            activeCount,
            doneCount,
            category: activeCategory,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'VendorService.getVendorOrders' });
          return {
            orders: [],
            activeCount: 0,
            doneCount: 0,
            category: activeCategory,
          };
        }
      }
    );
  }

  /**
   * Updates vendor / subkon milestone status
   */
  static async updateVendorStatus(id: string, status: string = 'done') {
    try {
      await safeFetchBackend('/update', {
        table: 'orders',
        data: {
          status: status === 'done' ? 'done' : 'processing',
          modified_on: new Date().toISOString(),
        },
        where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
      });

      invalidateCacheByTag('vendor_orders');
      invalidateCacheByTag('orders');
      return { success: true, message: `Status vendor berhasil diperbarui (${status})` };
    } catch (error: any) {
      ErrorCatch({ error, context: 'VendorService.updateVendorStatus' });
      return { success: false, message: error?.message || 'Gagal memperbarui status vendor' };
    }
  }

  /**
   * Action Handler Strategy Dispatcher for Single-File Feature Builder
   */
  static async handleVendorAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || rawData.action || '') as string;

      if (intent === 'update-vendor-status' || intent === 'update_status') {
        const parsed = UpdateVendorStatusSchema.safeParse({
          ...rawData,
          intent: 'update-vendor-status',
        });
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message || 'Data update status vendor tidak valid' },
            { status: 400 }
          );
        }

        const res = await VendorService.updateVendorStatus(parsed.data.id, parsed.data.status);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ updated: true, message: res.message });
      }

      return Response.json({ error: `Intent aksi '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'VendorService.handleVendorAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
