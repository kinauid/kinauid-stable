import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import type { PublicDriveData, DriveFolderItem, DriveFileItem } from '~/schemas/public-drive.schema';

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_KINAU_BACKEND_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_KINAU_BACKEND_URL) ||
  'https://kinauid-backend.vercel.app';

export class PublicDriveService {
  /**
   * Fetches public drive data for a specific order domain or order number.
   */
  static async getPublicDriveData(domain: string, folderId?: string | null): Promise<PublicDriveData> {
    if (!domain) {
      throw new ApiError('Domain / Nomor Pesanan tidak ditemukan', 404);
    }

    const cleanDomain = String(domain).trim();

    return cacheData(
      `public:drive:${cleanDomain}:${folderId || 'root'}`,
      15,
      async () => {
        try {
          // 1. Fetch Order Data
          const isOrderNumber = cleanDomain.startsWith('ORD-') || cleanDomain.includes('ORD');
          const orderRes = await fetch(`${BACKEND_URL}/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table: 'orders',
              where: isOrderNumber ? { order_number: cleanDomain } : { institution_domain: cleanDomain },
              size: 1,
            }),
          }).then((r) => r.json()).catch(() => ({ data: [] }));

          const orderList = Array.isArray(orderRes?.data)
            ? orderRes.data
            : (orderRes?.data?.items ?? orderRes?.items ?? []);
          const orderData = orderList[0] || null;

          if (!orderData) {
            return {
              domain: cleanDomain,
              orderData: null,
              current_folder: null,
              folders: [],
              files: [],
              breadcrumbs: [{ id: null, name: 'Root' }],
            };
          }

          // Parse order_items if it is a JSON string
          let parsedItems = orderData.order_items;
          if (typeof parsedItems === 'string') {
            try {
              parsedItems = JSON.parse(parsedItems);
            } catch {
              parsedItems = [];
            }
          }
          orderData.order_items = Array.isArray(parsedItems) ? parsedItems : [];

          const orderNum = orderData.order_number;

          // 2. Fetch all folders for this order to build tree & breadcrumbs
          const foldersRes = await fetch(`${BACKEND_URL}/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table: 'order_upload_folders',
              where: { order_number: orderNum, deleted: 0 },
              size: 100,
            }),
          }).then((r) => r.json()).catch(() => ({ data: [] }));

          let allFolders: DriveFolderItem[] = Array.isArray(foldersRes?.data)
            ? foldersRes.data
            : (foldersRes?.data?.items ?? foldersRes?.items ?? []);

          // Auto-seed default folders if new order has no folders yet
          if (allFolders.length === 0) {
            try {
              const defaultNames = ['01. Desain Mockup', '02. File Siap Cetak', '03. Lampiran & Dokumen'];
              for (const fname of defaultNames) {
                await fetch(`${BACKEND_URL}/insert`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    table: 'order_upload_folders',
                    data: {
                      order_number: orderNum,
                      folder_name: fname,
                      parent_id: null,
                      level: 1,
                      deleted: 0,
                    },
                  }),
                });
              }
              const reloaded = await fetch(`${BACKEND_URL}/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  table: 'order_upload_folders',
                  where: { order_number: orderNum, deleted: 0 },
                  size: 100,
                }),
              }).then((r) => r.json()).catch(() => ({ data: [] }));
              allFolders = Array.isArray(reloaded?.data) ? reloaded.data : (reloaded?.data?.items ?? []);
            } catch (e) {
              console.warn('[PublicDriveService] Auto-seed folders fallback:', e);
            }
          }

          // 3. Current folder & active view
          const currentFolder = folderId && folderId !== 'null' && folderId !== 'root'
            ? allFolders.find((f) => String(f.id) === String(folderId)) || null
            : null;

          // Folders directly inside current level, sorted
          const currentParentId = currentFolder ? currentFolder.id : null;
          const displayFolders = allFolders
            .filter((f) => {
              if (currentParentId === null) {
                return !f.parent_id || f.parent_id === 'null' || f.parent_id === null;
              }
              return String(f.parent_id) === String(currentParentId);
            })
            .sort((a, b) => (a.folder_name || '').localeCompare(b.folder_name || '', undefined, { numeric: true }));

          // 4. Fetch Files for current folder level
          const filesWhere: Record<string, any> = {
            order_number: orderNum,
            deleted: 0,
          };
          if (currentParentId) {
            filesWhere.folder_id = currentParentId;
          }

          const filesRes = await fetch(`${BACKEND_URL}/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table: 'order_upload_files',
              where: filesWhere,
              size: 100,
            }),
          }).then((r) => r.json()).catch(() => ({ data: [] }));

          const rawFiles = Array.isArray(filesRes?.data)
            ? filesRes.data
            : (filesRes?.data?.items ?? filesRes?.items ?? []);

          const displayFiles: DriveFileItem[] = rawFiles.map((f: any) => ({
            id: f.id,
            folder_id: f.folder_id,
            file_name: f.file_name || f.name || 'File Cetak',
            file_url: f.file_url || f.url || '',
            file_size: f.file_size || f.size || '',
            mime_type: f.mime_type || f.type || '',
            extension: f.extension || (f.file_name ? f.file_name.split('.').pop() : ''),
            created_on: f.created_on,
          }));

          // 5. Build Breadcrumb Trail
          const breadcrumbs: { id: string | number | null; name: string }[] = [
            { id: null, name: 'Root' },
          ];
          if (currentFolder) {
            let trace: DriveFolderItem | null = currentFolder;
            const chain: DriveFolderItem[] = [];
            while (trace) {
              chain.unshift(trace);
              trace = trace.parent_id
                ? allFolders.find((f) => String(f.id) === String(trace?.parent_id)) || null
                : null;
            }
            chain.forEach((c) => breadcrumbs.push({ id: c.id, name: c.folder_name }));
          }

          return {
            domain: cleanDomain,
            orderData,
            current_folder: currentFolder,
            folders: displayFolders,
            files: displayFiles,
            breadcrumbs,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'PublicDriveService:getPublicDriveData' });
          throw error;
        }
      },
      { tags: ['drive', `drive:${cleanDomain}`] }
    );
  }
}

/**
 * Strategy Action Dispatcher for Public Drive mutations
 */
export async function handlePublicDriveAction({ request, params }: ActionFunctionArgs) {
  const domain = params?.domain || '';
  try {
    const formData = await request.formData();
    const intent = String(formData.get('intent') || '');
    const id = String(formData.get('id') || '');

    const strategies: Record<string, () => Promise<Response>> = {
      create_folder: async () => {
        const folder_name = String(formData.get('folder_name') || '').trim();
        const parent_id = formData.get('parent_id') ? String(formData.get('parent_id')) : null;
        const order_number = String(formData.get('order_number') || domain);

        if (!folder_name) {
          return Response.json({ error: 'Nama folder wajib diisi' }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}/insert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'order_upload_folders',
            data: {
              order_number,
              folder_name,
              parent_id: parent_id || null,
              level: 1,
              deleted: 0,
            },
          }),
        });

        invalidateCacheByTag('drive');
        if (!res.ok) return Response.json({ error: 'Gagal membuat folder' }, { status: 400 });
        return Response.json({ success: true, message: 'Folder berhasil dibuat' });
      },

      rename_folder: async () => {
        const folder_name = String(formData.get('folder_name') || '').trim();
        if (!id || !folder_name) {
          return Response.json({ error: 'ID dan nama folder wajib diisi' }, { status: 400 });
        }
        await fetch(`${BACKEND_URL}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'order_upload_folders',
            data: { folder_name, modified_on: new Date().toISOString() },
            where: { id },
          }),
        });
        invalidateCacheByTag('drive');
        return Response.json({ success: true, message: 'Nama folder berhasil diubah' });
      },

      create_file: async () => {
        const file_name = String(formData.get('file_name') || '').trim();
        const file_url = String(formData.get('file_url') || '').trim();
        const folder_id = formData.get('folder_id') ? String(formData.get('folder_id')) : null;
        const order_number = String(formData.get('order_number') || domain);
        const file_size = String(formData.get('file_size') || '');

        if (!file_name || !file_url) {
          return Response.json({ error: 'Nama dan URL file wajib diisi' }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}/insert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'order_upload_files',
            data: {
              order_number,
              folder_id: folder_id || null,
              file_name,
              file_url,
              file_size,
              deleted: 0,
            },
          }),
        });

        invalidateCacheByTag('drive');
        if (!res.ok) return Response.json({ error: 'Gagal menambahkan file' }, { status: 400 });
        return Response.json({ success: true, message: 'File berhasil diunggah' });
      },

      delete_folder: async () => {
        if (!id) return Response.json({ error: 'ID folder wajib disertakan' }, { status: 400 });
        await fetch(`${BACKEND_URL}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'order_upload_folders',
            data: { deleted: 1, deleted_on: new Date().toISOString() },
            where: { id },
          }),
        });
        invalidateCacheByTag('drive');
        return Response.json({ success: true, message: 'Folder berhasil dihapus' });
      },

      delete_file: async () => {
        if (!id) return Response.json({ error: 'ID file wajib disertakan' }, { status: 400 });
        await fetch(`${BACKEND_URL}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'order_upload_files',
            data: { deleted: 1, deleted_on: new Date().toISOString() },
            where: { id },
          }),
        });
        invalidateCacheByTag('drive');
        return Response.json({ success: true, message: 'File berhasil dihapus' });
      },

      update_review: async () => {
        const rating = Number(formData.get('rating') || 5);
        const review = String(formData.get('review') || '');
        await fetch(`${BACKEND_URL}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'orders',
            data: { rating, review, modified_on: new Date().toISOString() },
            where: { order_number: domain },
          }),
        });
        invalidateCacheByTag('drive');
        return Response.json({ success: true, message: 'Ulasan Anda berhasil dikirim' });
      },

      update_payment_proof: async () => {
        const proof = String(formData.get('proof') || '');
        if (!proof) return Response.json({ error: 'Bukti pembayaran wajib disertakan' }, { status: 400 });
        await fetch(`${BACKEND_URL}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'orders',
            data: { payment_proof: proof, payment_status: 'paid', modified_on: new Date().toISOString() },
            where: { order_number: domain },
          }),
        });
        invalidateCacheByTag('drive');
        return Response.json({ success: true, message: 'Bukti pembayaran berhasil diunggah' });
      },
    };

    const handler = strategies[intent];
    if (!handler) {
      return Response.json({ error: `Intent '${intent}' tidak dikenal` }, { status: 400 });
    }

    return await handler();
  } catch (error: any) {
    if (error instanceof Response) throw error;
    const message = error?.message || 'Terjadi kesalahan sistem';
    return Response.json({ error: message }, { status: 400 });
  }
}

