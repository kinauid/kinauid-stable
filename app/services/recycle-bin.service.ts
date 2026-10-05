import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type DeletedOrderItem,
  type RecycleBinState,
  type RecycleBinData,
  RestoreOrderSchema,
  PurgeOrderSchema,
} from '~/schemas/recycle-bin.schema';

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

export class RecycleBinService {
  /**
   * Fetches deleted orders (soft-deleted with deleted_on != null)
   */
  static async getDeletedOrders(state: RecycleBinState = {}): Promise<RecycleBinData> {
    const page = Number(state.page) || 0;
    const size = Number(state.size) || 10;
    const search = (state.search || '').trim().toLowerCase();

    return cacheData(
      `recycle_bin_orders:${page}:${size}:${search}`,
      10,
      async () => {
        try {
          const res = await safeFetchBackend('/select', {
            table: 'orders',
            where: {
              deleted_on: 'is_not_null',
            },
            size: 200,
            sort: 'deleted_on:desc',
          });

          const json = await res.json().catch(() => ({ data: [] }));
          const rawOrders: any[] = Array.isArray(json?.data) ? json.data : (json?.data?.items ?? []);

          // Filter by search keyword
          let filtered = rawOrders;
          if (search) {
            filtered = rawOrders.filter((o) => {
              const num = (o.order_number || '').toLowerCase();
              const inst = (o.institution_name || '').toLowerCase();
              const pic = (o.pic_name || '').toLowerCase();
              return num.includes(search) || inst.includes(search) || pic.includes(search);
            });
          }

          const total_items = filtered.length;
          const startIndex = page * size;
          const pagedItems = filtered.slice(startIndex, startIndex + size);

          const mapped: DeletedOrderItem[] = pagedItems.map((o) => ({
            id: String(o.id),
            order_number: o.order_number || `ORD-${o.id}`,
            institution_name: o.institution_name || 'Instansi Tanpa Nama',
            pic_name: o.pic_name,
            pic_phone: o.pic_phone,
            total_amount: Number(o.total_amount || o.total_price || 0),
            total_price: Number(o.total_price || o.total_amount || 0),
            status: o.status || 'deleted',
            created_on: o.created_on || new Date().toISOString(),
            deleted_on: o.deleted_on || new Date().toISOString(),
            created_by: o.created_by,
            is_sponsor: Number(o.is_sponsor || 0),
            is_archive: Number(o.is_archive || 0),
            notes: o.notes,
          }));

          return {
            items: mapped,
            total_items,
            page,
            size,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'RecycleBinService.getDeletedOrders' });
          return {
            items: [],
            total_items: 0,
            page,
            size,
          };
        }
      }
    );
  }

  /**
   * Restores a deleted order back to active state
   */
  static async restoreOrder(id: string) {
    try {
      await safeFetchBackend('/update', {
        table: 'orders',
        data: {
          deleted_on: null,
          modified_on: new Date().toISOString(),
        },
        where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
      });

      invalidateCacheByTag('recycle_bin_orders');
      invalidateCacheByTag('orders');
      invalidateCacheByTag('orders_list');
      return { success: true, message: 'Pesanan berhasil dikembalikan ke daftar aktif' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'RecycleBinService.restoreOrder' });
      return { success: false, message: error?.message || 'Gagal mengembalikan pesanan' };
    }
  }

  /**
   * Permanently purges a deleted order
   */
  static async purgeOrder(id: string) {
    try {
      await safeFetchBackend('/delete', {
        table: 'orders',
        where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
      });

      invalidateCacheByTag('recycle_bin_orders');
      return { success: true, message: 'Pesanan telah dihapus permanen' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'RecycleBinService.purgeOrder' });
      return { success: false, message: error?.message || 'Gagal menghapus permanen pesanan' };
    }
  }

  /**
   * Action Handler Strategy Dispatcher for Single-File Feature Builder
   */
  static async handleRecycleBinAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'restore' || intent === 'restore-order') {
        const parsed = RestoreOrderSchema.safeParse({ ...rawData, intent: 'restore' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data restore tidak valid' }, { status: 400 });
        }
        const res = await RecycleBinService.restoreOrder(parsed.data.id);
        if (!res.success) {
          return Response.json({ error: res.message }, { status: 400 });
        }
        return successResponse({ restored: true, message: res.message });
      }

      if (intent === 'purge' || intent === 'permanent-delete') {
        const parsed = PurgeOrderSchema.safeParse({ ...rawData, intent: 'purge' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data purge tidak valid' }, { status: 400 });
        }
        const res = await RecycleBinService.purgeOrder(parsed.data.id);
        if (!res.success) {
          return Response.json({ error: res.message }, { status: 400 });
        }
        return successResponse({ purged: true, message: res.message });
      }

      return Response.json({ error: `Intent aksi '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'RecycleBinService.handleRecycleBinAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
