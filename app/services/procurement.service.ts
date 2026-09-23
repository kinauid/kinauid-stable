import type { ActionFunctionArgs } from 'react-router';
import {
  ProcurementComponentSchema,
  CatalogColorSchema,
  ShoppingItemSchema,
  type ProcurementComponentItem,
  type CatalogColorItem,
  type ShoppingItem,
  type ProcurementState,
} from '~/schemas/procurement.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';

let COMPONENTS_DB: ProcurementComponentItem[] = [
  { id: 'cmp-1', name: 'Kain Dryfit Benzema', category: 'Jersey', stock: 45, unit: 'roll', min_stock: 10, price: 950000 },
  { id: 'cmp-2', name: 'Kain Milano Premium', category: 'Jersey', stock: 28, unit: 'roll', min_stock: 8, price: 1100000 },
  { id: 'cmp-3', name: 'Kerah Rib Elastis Hitam', category: 'Aksesoris', stock: 350, unit: 'pcs', min_stock: 50, price: 12000 },
  { id: 'cmp-4', name: 'Resleting YKK 15cm', category: 'Aksesoris', stock: 500, unit: 'pcs', min_stock: 100, price: 4500 },
];

let COLORS_DB: CatalogColorItem[] = [
  { id: 'clr-1', code: 'NVY-01', name: 'Navy Blue Deep', hex: '#0a192f', pantone: '19-4024 TCX', is_active: true },
  { id: 'clr-2', code: 'RED-02', name: 'Crimson Red Flame', hex: '#dc2626', pantone: '18-1662 TCX', is_active: true },
  { id: 'clr-3', code: 'CYN-03', name: 'Kinau Teal Cyan', hex: '#30b29e', pantone: '16-5127 TCX', is_active: true },
  { id: 'clr-4', code: 'GLD-04', name: 'Metallic Gold Accent', hex: '#d97706', pantone: '16-0836 TCX', is_active: true },
];

let SHOPPING_DB: ShoppingItem[] = [
  { id: 'shp-1', item_name: 'Kain Dryfit Benzema (Roll)', supplier_name: 'PT Surya Texindo', quantity: 10, unit: 'roll', estimated_cost: 9500000, status: 'pending' },
  { id: 'shp-2', item_name: 'Tinta Sublimasi Cyan 1L', supplier_name: 'SubliColor Ink', quantity: 4, unit: 'botol', estimated_cost: 1600000, status: 'ordered' },
  { id: 'shp-3', item_name: 'Polyflex PU Korea Putih', supplier_name: 'CV Indo Zipper', quantity: 2, unit: 'roll', estimated_cost: 2400000, status: 'received' },
];

export class ProcurementService {
  static async getComponents(state: ProcurementState = {}) {
    return cacheData(`procurement_components:${JSON.stringify(state)}`, 60, async () => {
      let items = [...COMPONENTS_DB];
      if (state.search) {
        const q = state.search.toLowerCase();
        items = items.filter(c => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
      }
      return {
        components: items,
        totalCount: COMPONENTS_DB.length,
        filteredCount: items.length,
      };
    }, { tags: ['procurement'] });
  }

  static async getCatalogColors(state: ProcurementState = {}) {
    return cacheData(`procurement_colors:${JSON.stringify(state)}`, 60, async () => {
      let items = [...COLORS_DB];
      if (state.search) {
        const q = state.search.toLowerCase();
        items = items.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
      }
      return {
        colors: items,
        totalCount: COLORS_DB.length,
      };
    }, { tags: ['procurement'] });
  }

  static async getShoppingList(state: ProcurementState = {}) {
    return cacheData(`procurement_shopping:${JSON.stringify(state)}`, 60, async () => {
      let items = [...SHOPPING_DB];
      if (state.search) {
        const q = state.search.toLowerCase();
        items = items.filter(s => s.item_name.toLowerCase().includes(q));
      }
      if (state.status && state.status !== 'all') {
        items = items.filter(s => s.status === state.status);
      }
      return {
        items,
        totalCost: items.reduce((acc, s) => acc + s.estimated_cost, 0),
        totalCount: SHOPPING_DB.length,
      };
    }, { tags: ['procurement'] });
  }

  static async createShoppingItem(data: ShoppingItem) {
    const newItem: ShoppingItem = { ...data, id: `shp-${Date.now()}` };
    SHOPPING_DB.unshift(newItem);
    invalidateCacheByTag('procurement');
    return newItem;
  }

  static async updateShoppingStatus(id: string, status: 'pending' | 'ordered' | 'received') {
    const item = SHOPPING_DB.find(s => s.id === id);
    if (item) item.status = status;
    invalidateCacheByTag('procurement');
    return item;
  }
}

export async function handleProcurementAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'create-shopping');
    const id = String(formData.get('id') || '');

    const strategies: Record<string, () => Promise<any>> = {
      'create-shopping': async () => {
        const item_name = String(formData.get('item_name') || '');
        const supplier_name = String(formData.get('supplier_name') || '');
        const quantity = Number(formData.get('quantity') || 1);
        const unit = String(formData.get('unit') || 'pcs');
        const estimated_cost = Number(formData.get('estimated_cost') || 0);
        return successResponse(await ProcurementService.createShoppingItem({ item_name, supplier_name, quantity, unit, estimated_cost, status: 'pending' }));
      },
      'update-status': async () => {
        const status = (formData.get('status') || 'ordered') as any;
        return successResponse(await ProcurementService.updateShoppingStatus(id, status));
      },
    };

    const handler = strategies[intent];
    if (!handler) throw new ApiError(`Intent '${intent}' tidak didukung`, 400);
    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: 'action:procurement' });
    return errorResponse(error);
  }
}
