import type { ActionFunctionArgs } from 'react-router';
import { type DriveItem, type DriveState } from '~/schemas/drive.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';

let DRIVE_DB: DriveItem[] = [
  { id: 'fld-1', name: 'Desain Jersey Futsal 2026', type: 'folder', parent_id: null, updated_at: '2026-09-18', owner: 'Design Team' },
  { id: 'fld-2', name: 'Mockup & Template Kaos', type: 'folder', parent_id: null, updated_at: '2026-09-15', owner: 'Creative Hub' },
  { id: 'fld-3', name: 'Arsip Bukti Bayar & Invoice', type: 'folder', parent_id: null, updated_at: '2026-09-10', owner: 'Finance' },
  { id: 'fil-1', name: 'Jersey_UI_Esports_Final.ai', type: 'design', size: '24.5 MB', parent_id: 'fld-1', updated_at: '2026-09-19', extension: 'ai', owner: 'Ahmad Designer' },
  { id: 'fil-2', name: 'Pattern_Sublimasi_Flames.pdf', type: 'document', size: '12.8 MB', parent_id: 'fld-1', updated_at: '2026-09-19', extension: 'pdf', owner: 'Ahmad Designer' },
  { id: 'fil-3', name: 'Mockup_Depan_Belakang.png', type: 'image', size: '4.2 MB', parent_id: 'fld-2', updated_at: '2026-09-16', extension: 'png', owner: 'Creative Hub' },
];

export class DriveService {
  static async getItems(state: DriveState = {}) {
    return cacheData(`drive:${JSON.stringify(state)}`, 60, async () => {
      const parentId = state.folderId && state.folderId !== 'root' ? state.folderId : null;
      let items = DRIVE_DB.filter(d => d.parent_id === parentId);

      if (state.search) {
        const q = state.search.toLowerCase();
        items = DRIVE_DB.filter(d => d.name.toLowerCase().includes(q));
      }

      const currentFolder = parentId ? DRIVE_DB.find(d => d.id === parentId) : null;

      return {
        items,
        currentFolder,
        folderCount: items.filter(i => i.type === 'folder').length,
        fileCount: items.filter(i => i.type !== 'folder').length,
        totalCount: items.length,
      };
    }, { tags: ['drive'] });
  }

  static async createFolder(name: string, parentId?: string | null) {
    if (!name.trim()) throw new ApiError('Nama folder wajib diisi', 400);
    const newFolder: DriveItem = {
      id: `fld-${Date.now()}`,
      name: name.trim(),
      type: 'folder',
      parent_id: parentId || null,
      updated_at: new Date().toISOString().split('T')[0],
      owner: 'Internal Kinau',
    };
    DRIVE_DB.unshift(newFolder);
    invalidateCacheByTag('drive');
    return newFolder;
  }

  static async deleteItem(id: string) {
    DRIVE_DB = DRIVE_DB.filter(d => d.id !== id && d.parent_id !== id);
    invalidateCacheByTag('drive');
    return { id, deleted: true };
  }
}

export async function handleDriveAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'create-folder');
    const id = String(formData.get('id') || '');

    const strategies: Record<string, () => Promise<any>> = {
      'create-folder': async () => {
        const name = String(formData.get('name') || '');
        const parent_id = formData.get('parent_id') ? String(formData.get('parent_id')) : null;
        return successResponse(await DriveService.createFolder(name, parent_id));
      },
      'delete-item': async () => {
        if (!id) throw new ApiError('ID item drive wajib disertakan', 400);
        return successResponse(await DriveService.deleteItem(id));
      },
    };

    const handler = strategies[intent];
    if (!handler) throw new ApiError(`Intent '${intent}' tidak didukung`, 400);
    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: 'action:drive' });
    return errorResponse(error);
  }
}
