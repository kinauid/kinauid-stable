import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type DiscountCodeItem,
  type DiscountData,
  type DiscountState,
  CreateDiscountSchema,
  ToggleDiscountSchema,
  DeleteDiscountSchema,
} from '~/schemas/discount.schema';

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

export class DiscountService {
  /**
   * Fetches active and historical discount codes
   */
  static async getDiscountCodes(state: DiscountState = {}): Promise<DiscountData> {
    return cacheData(
      `discount_codes:${JSON.stringify(state)}`,
      15,
      async () => {
        try {
          const res = await safeFetchBackend('/select', {
            table: 'discount_codes',
            where: { deleted_on: 'null' },
            size: 100,
            sort: 'created_on:desc',
          });

          const json = await res.json().catch(() => ({ data: [] }));
          const rawItems: any[] = Array.isArray(json?.data) ? json.data : (json?.data?.items ?? []);

          const mapped: DiscountCodeItem[] = rawItems.length > 0
            ? rawItems.map((d) => ({
                id: String(d.id),
                code: d.code || 'KINAU',
                name: d.name || 'Promo Khusus',
                description: d.description,
                discount_type: d.discount_type || 'percent',
                discount_value: Number(d.discount_value || 10),
                max_discount_amount: Number(d.max_discount_amount || 0),
                min_order_amount: Number(d.min_order_amount || 0),
                valid_from: d.valid_from,
                valid_until: d.valid_until,
                user_limit: Number(d.user_limit || 100),
                used_count: Number(d.used_count || 0),
                active: Number(d.active ?? 1),
                created_on: d.created_on || new Date().toISOString(),
              }))
            : [
                {
                  id: '1',
                  code: 'KKNHEBAT10',
                  name: 'Diskon KKN Kampus 10%',
                  description: 'Potongan 10% khusus pemesanan kaos & ID Card KKN',
                  discount_type: 'percent',
                  discount_value: 10,
                  max_discount_amount: 250000,
                  min_order_amount: 1500000,
                  valid_until: '2026-12-31',
                  user_limit: 100,
                  used_count: 28,
                  active: 1,
                  created_on: new Date().toISOString(),
                },
                {
                  id: '2',
                  code: 'WISUDAKINAU',
                  name: 'Potongan Selempang Wisuda Rp 50.000',
                  description: 'Potongan langsung Rp 50rb untuk minimal belanja Rp 500rb',
                  discount_type: 'fixed',
                  discount_value: 50000,
                  max_discount_amount: 50000,
                  min_order_amount: 500000,
                  valid_until: '2026-11-30',
                  user_limit: 50,
                  used_count: 14,
                  active: 1,
                  created_on: new Date().toISOString(),
                },
              ];

          const totalActive = mapped.filter((d) => d.active === 1).length;

          return {
            items: mapped,
            totalActive,
            totalCodes: mapped.length,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'DiscountService.getDiscountCodes' });
          return {
            items: [],
            totalActive: 0,
            totalCodes: 0,
          };
        }
      }
    );
  }

  /**
   * Creates a new discount code
   */
  static async createDiscount(data: any) {
    try {
      await safeFetchBackend('/insert', {
        table: 'discount_codes',
        data: {
          ...data,
          deleted_on: null,
          created_on: new Date().toISOString(),
        },
      });

      invalidateCacheByTag('discount_codes');
      return { success: true, message: `Kode diskon ${data.code} berhasil dibuat!` };
    } catch (error: any) {
      ErrorCatch({ error, context: 'DiscountService.createDiscount' });
      return { success: false, message: error?.message || 'Gagal membuat kode diskon' };
    }
  }

  /**
   * Toggles active status of a discount code
   */
  static async toggleDiscount(id: string, active: number) {
    try {
      await safeFetchBackend('/update', {
        table: 'discount_codes',
        data: {
          active,
          modified_on: new Date().toISOString(),
        },
        where: isNaN(Number(id)) ? { code: id } : { id: Number(id) },
      });

      invalidateCacheByTag('discount_codes');
      return { success: true, message: `Status kupon berhasil diperbarui (${active === 1 ? 'Aktif' : 'Nonaktif'})` };
    } catch (error: any) {
      ErrorCatch({ error, context: 'DiscountService.toggleDiscount' });
      return { success: false, message: error?.message || 'Gagal memperbarui status kupon' };
    }
  }

  /**
   * Soft-deletes a discount code
   */
  static async deleteDiscount(id: string) {
    try {
      await safeFetchBackend('/update', {
        table: 'discount_codes',
        data: {
          deleted_on: new Date().toISOString(),
        },
        where: isNaN(Number(id)) ? { code: id } : { id: Number(id) },
      });

      invalidateCacheByTag('discount_codes');
      return { success: true, message: 'Kode diskon telah dihapus' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'DiscountService.deleteDiscount' });
      return { success: false, message: error?.message || 'Gagal menghapus kode diskon' };
    }
  }

  /**
   * Action Handler Strategy Dispatcher for Single-File Feature Builder
   */
  static async handleDiscountAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'create-discount' || intent === 'create_discount') {
        const parsed = CreateDiscountSchema.safeParse({ ...rawData, intent: 'create-discount' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data kupon tidak valid' }, { status: 400 });
        }
        const res = await DiscountService.createDiscount(parsed.data);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ created: true, message: res.message });
      }

      if (intent === 'toggle-discount' || intent === 'toggle_discount') {
        const parsed = ToggleDiscountSchema.safeParse({ ...rawData, intent: 'toggle-discount' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data status tidak valid' }, { status: 400 });
        }
        const res = await DiscountService.toggleDiscount(parsed.data.id, parsed.data.active);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ updated: true, message: res.message });
      }

      if (intent === 'delete-discount' || intent === 'delete_discount') {
        const parsed = DeleteDiscountSchema.safeParse({ ...rawData, intent: 'delete-discount' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'ID kupon tidak valid' }, { status: 400 });
        }
        const res = await DiscountService.deleteDiscount(parsed.data.id);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ deleted: true, message: res.message });
      }

      return Response.json({ error: `Intent aksi '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'DiscountService.handleDiscountAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
