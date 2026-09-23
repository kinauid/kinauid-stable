import type { ActionFunctionArgs } from 'react-router';
import {
  AssetSchema,
  type AssetItem,
  type AssetManageState,
} from '~/schemas/asset.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';

let ASSETS_DB: AssetItem[] = [
  { id: 'ast-1', asset_name: 'Mesin Sublimasi EPSON SureColor F6330', category: 'Mesin Printing', location: 'Ruang Printing 1', status: 'operational', total_value: 125000000, total_unit: 2 },
  { id: 'ast-2', asset_name: 'Pneumatic Double Bed Heat Press 40x60', category: 'Mesin Heat Press', location: 'Ruang Pressing', status: 'operational', total_value: 45000000, total_unit: 3 },
  { id: 'ast-3', asset_name: 'Workstation PC Render (i7 / RTX 4070)', category: 'Komputer & IT', location: 'Studio Desain', status: 'operational', total_value: 32000000, total_unit: 4 },
  { id: 'ast-4', asset_name: 'Mesin Jahit Obras High Speed Typical', category: 'Alat Jahit & Bordir', location: 'Ruang Jahit', status: 'maintenance', total_value: 18000000, total_unit: 6 },
];

export class AssetService {
  static async getAssets(state: AssetManageState = {}) {
    return cacheData(`assets:${JSON.stringify(state)}`, 60, async () => {
      let items = [...ASSETS_DB];
      if (state.search) {
        const q = state.search.toLowerCase();
        items = items.filter(a => a.asset_name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
      }
      if (state.category && state.category !== 'all') {
        items = items.filter(a => a.category === state.category);
      }
      if (state.status && state.status !== 'all') {
        items = items.filter(a => a.status === state.status);
      }

      return {
        assets: items,
        totalValue: items.reduce((acc, a) => acc + (a.total_value * a.total_unit), 0),
        totalUnits: items.reduce((acc, a) => acc + a.total_unit, 0),
        totalCount: ASSETS_DB.length,
      };
    }, { tags: ['assets'] });
  }

  static async createAsset(data: AssetItem) {
    const parsed = AssetSchema.safeParse(data);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message || 'Input aset tidak valid', 400);

    const newAsset: AssetItem = { ...parsed.data, id: `ast-${Date.now()}` };
    ASSETS_DB.unshift(newAsset);
    invalidateCacheByTag('assets');
    return newAsset;
  }

  static async deleteAsset(id: string) {
    ASSETS_DB = ASSETS_DB.filter(a => a.id !== id);
    invalidateCacheByTag('assets');
    return { id, deleted: true };
  }
}

export async function handleAssetAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'create-asset');
    const id = String(formData.get('id') || '');

    const strategies: Record<string, () => Promise<any>> = {
      'create-asset': async () => {
        const asset_name = String(formData.get('asset_name') || '');
        const category = (formData.get('category') || 'Mesin Printing') as any;
        const location = String(formData.get('location') || 'Workshop Utama');
        const status = (formData.get('status') || 'operational') as any;
        const total_value = Number(formData.get('total_value') || 0);
        const total_unit = Number(formData.get('total_unit') || 1);
        return successResponse(await AssetService.createAsset({ asset_name, category, location, status, total_value, total_unit }));
      },
      'delete-asset': async () => {
        if (!id) throw new ApiError('ID aset wajib disertakan', 400);
        return successResponse(await AssetService.deleteAsset(id));
      },
    };

    const handler = strategies[intent];
    if (!handler) throw new ApiError(`Intent '${intent}' tidak didukung`, 400);
    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: 'action:asset' });
    return errorResponse(error);
  }
}
