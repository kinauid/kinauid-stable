import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type PrintOrder,
  type PrintCategory,
  type PrintAreaState,
  UpdatePrintStatusSchema,
  FetchFolderFilesSchema,
} from '~/schemas/print-area.schema';

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

export class PrintAreaService {
  /**
   * Fetches active orders for the print queue along with their upload folders and files
   */
  static async getPrintOrders(state: PrintAreaState = {}): Promise<{
    orders: PrintOrder[];
    category: PrintCategory;
  }> {
    const activeCategory = state.category || 'idcard';

    return cacheData(
      `print_orders:${activeCategory}:${state.search || ''}`,
      10,
      async () => {
        try {
          // Fetch orders that are not deleted and status is active (e.g. processing/waiting)
          const orderWhere: Record<string, any> = {
            deleted_on: 'null',
          };

          const res = await safeFetchBackend('/select', {
            table: 'orders',
            where: orderWhere,
            size: 100,
            sort: 'created_on:asc',
          });

          const json = await res.json().catch(() => ({ data: [] }));
          const rawOrders = Array.isArray(json?.data) ? json.data : (json?.data?.items ?? []);

          // Filter for waiting print status and not completely done if specified
          const filteredOrders = rawOrders.filter((o: any) => {
            const isPrintedDone = o.status_printed === 'done' || o.status_printed === 'printed';
            const isDone = o.status === 'done' || o.status === 'completed' || o.status === 'cancelled';
            return !isPrintedDone && !isDone;
          });

          // Fetch all active upload folders
          const foldersRes = await safeFetchBackend('/select', {
            table: 'order_upload_folders',
            where: { deleted: 0 },
            size: 500,
          }).catch(() => null);

          const foldersJson = foldersRes ? await foldersRes.json().catch(() => ({ data: [] })) : { data: [] };
          const allFolders = Array.isArray(foldersJson?.data) ? foldersJson.data : (foldersJson?.data?.items ?? []);

          // Fetch all upload files
          const filesRes = await safeFetchBackend('/select', {
            table: 'order_upload_files',
            where: { deleted: 0 },
            size: 1000,
          }).catch(() => null);

          const filesJson = filesRes ? await filesRes.json().catch(() => ({ data: [] })) : { data: [] };
          const allFiles = Array.isArray(filesJson?.data) ? filesJson.data : (filesJson?.data?.items ?? []);

          // Map files into folders and folders into orders
          const mappedOrders: PrintOrder[] = filteredOrders.map((o: any) => {
            const orderFolders = allFolders
              .filter((f: any) => f.order_number === o.order_number || String(f.order_id) === String(o.id))
              .map((f: any) => {
                const folderFiles = allFiles
                  .filter((fl: any) => String(fl.folder_id) === String(f.id))
                  .map((fl: any) => ({
                    id: String(fl.id),
                    name: fl.file_name || fl.name || 'File Tanpa Nama',
                    file_url: fl.file_url || fl.url || fl.preview_url || '',
                  }));

                return {
                  id: String(f.id),
                  folder_name: f.folder_name || 'Folder',
                  order_number: f.order_number || o.order_number,
                  files: folderFiles,
                };
              });

            // Filter folders relevant to active category
            const categoryFilteredFolders = orderFolders.filter((f: any) => {
              const nameLower = (f.folder_name || '').toLowerCase();
              if (activeCategory === 'idcard') {
                return nameLower.includes('id card') || nameLower.includes('idcard') || nameLower.includes('kartu') || nameLower.includes('depan') || nameLower.includes('belakang');
              }
              if (activeCategory === 'lanyard') {
                return nameLower.includes('lanyard') || nameLower.includes('tali');
              }
              return true;
            });

            return {
              id: String(o.id),
              order_number: o.order_number,
              institution_name: o.institution_name || 'Instansi Umum',
              pic_name: o.pic_name,
              pic_phone: o.pic_phone,
              status_printed: o.status_printed || 'waiting',
              status: o.status || 'processing',
              created_on: o.created_on || new Date().toISOString(),
              order_items: typeof o.order_items === 'string' ? JSON.parse(o.order_items || '[]') : o.order_items,
              order_upload_folders: categoryFilteredFolders.length > 0 ? categoryFilteredFolders : orderFolders,
            };
          });

          return {
            orders: mappedOrders,
            category: activeCategory,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'PrintAreaService.getPrintOrders' });
          return {
            orders: [],
            category: activeCategory,
          };
        }
      }
    );
  }

  /**
   * Updates status_printed of an order
   */
  static async updatePrintStatus(id: string, status: string = 'done') {
    try {
      const res = await safeFetchBackend('/update', {
        table: 'orders',
        data: {
          status_printed: status === 'done' ? 'done' : 'waiting',
          modified_on: new Date().toISOString(),
        },
        where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
      });

      invalidateCacheByTag('print_orders');
      invalidateCacheByTag('orders');
      return { success: true, message: `Status cetak berhasil diperbarui (${status})` };
    } catch (error: any) {
      ErrorCatch({ error, context: 'PrintAreaService.updatePrintStatus' });
      return { success: false, message: error?.message || 'Gagal memperbarui status cetak' };
    }
  }

  /**
   * Action Handler Strategy Dispatcher for Single-File Feature Builder
   */
  static async handlePrintAreaAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || rawData.action || '') as string;

      if (intent === 'update-status' || intent === 'update_status') {
        const parsed = UpdatePrintStatusSchema.safeParse({
          ...rawData,
          intent: 'update-status',
        });
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message || 'Data update status tidak valid' },
            { status: 400 }
          );
        }

        const res = await PrintAreaService.updatePrintStatus(parsed.data.id, parsed.data.status);
        if (!res.success) {
          return Response.json({ error: res.message }, { status: 400 });
        }
        return successResponse({ updated: true, message: res.message });
      }

      return Response.json({ error: `Intent aksi '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'PrintAreaService.handlePrintAreaAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
