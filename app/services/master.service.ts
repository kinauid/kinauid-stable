import type { ActionFunctionArgs } from 'react-router';
import {
  SupplierSchema,
  InstitutionSchema,
  type SupplierItem,
  type InstitutionItem,
  type SupplierManageState,
  type InstitutionManageState,
} from '~/schemas/master.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';

let SUPPLIERS_DB: SupplierItem[] = [
  { id: 'sup-1', name: 'PT Surya Texindo Pratama', contact_person: 'Budi Santoso', phone: '081234567890', address: 'Bandung, Jawa Barat', category: 'Kain & Material', status: 'active' },
  { id: 'sup-2', name: 'CV Indo Zipper Mandiri', contact_person: 'Agus Wijaya', phone: '081987654321', address: 'Surabaya, Jawa Timur', category: 'Aksesoris & Resleting', status: 'active' },
  { id: 'sup-3', name: 'SubliColor Ink Nusantara', contact_person: 'Rina Marlina', phone: '081345678912', address: 'Jakarta Barat', category: 'Tinta & Percetakan', status: 'active' },
  { id: 'sup-4', name: 'Packindo Box Solution', contact_person: 'Hendra Gunawan', phone: '081567890123', address: 'Semarang, Jawa Tengah', category: 'Packaging & Label', status: 'inactive' },
];

let INSTITUTIONS_DB: InstitutionItem[] = [
  { id: 'inst-1', name: 'Universitas Indonesia', type: 'Universitas', city: 'Depok', contact_person: 'Prof. Dimas', phone: '081211112222', discount_rate: 10 },
  { id: 'inst-2', name: 'Institut Teknologi Bandung', type: 'Universitas', city: 'Bandung', contact_person: 'Dr. Sarah', phone: '081233334444', discount_rate: 10 },
  { id: 'inst-3', name: 'SMA Negeri 1 Jakarta', type: 'Sekolah', city: 'Jakarta', contact_person: 'Drs. Supriyadi', phone: '081255556666', discount_rate: 5 },
  { id: 'inst-4', name: 'Bank Mandiri Corporate', type: 'Korporat', city: 'Jakarta Selatan', contact_person: 'Maya Putri', phone: '081277778888', discount_rate: 15 },
];

export class MasterService {
  static async getSuppliers(state: SupplierManageState = {}) {
    return cacheData(`suppliers:${JSON.stringify(state)}`, 60, async () => {
      let items = [...SUPPLIERS_DB];
      if (state.search) {
        const q = state.search.toLowerCase();
        items = items.filter(s => s.name.toLowerCase().includes(q) || s.phone.includes(q));
      }
      if (state.category && state.category !== 'all') {
        items = items.filter(s => s.category === state.category);
      }
      if (state.status && state.status !== 'all') {
        items = items.filter(s => s.status === state.status);
      }

      return {
        suppliers: items,
        totalCount: SUPPLIERS_DB.length,
        filteredCount: items.length,
      };
    }, { tags: ['suppliers'] });
  }

  static async createSupplier(data: SupplierItem) {
    const parsed = SupplierSchema.safeParse(data);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message || 'Input supplier tidak valid', 400);

    const newSupplier: SupplierItem = { ...parsed.data, id: `sup-${Date.now()}` };
    SUPPLIERS_DB.unshift(newSupplier);
    invalidateCacheByTag('suppliers');
    return newSupplier;
  }

  static async deleteSupplier(id: string) {
    SUPPLIERS_DB = SUPPLIERS_DB.filter(s => s.id !== id);
    invalidateCacheByTag('suppliers');
    return { id, deleted: true };
  }

  static async getInstitutions(state: InstitutionManageState = {}) {
    return cacheData(`institutions:${JSON.stringify(state)}`, 60, async () => {
      let items = [...INSTITUTIONS_DB];
      if (state.search) {
        const q = state.search.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(q) || (i.city && i.city.toLowerCase().includes(q)));
      }
      if (state.type && state.type !== 'all') {
        items = items.filter(i => i.type === state.type);
      }

      return {
        institutions: items,
        totalCount: INSTITUTIONS_DB.length,
        filteredCount: items.length,
      };
    }, { tags: ['institutions'] });
  }

  static async createInstitution(data: InstitutionItem) {
    const parsed = InstitutionSchema.safeParse(data);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message || 'Input institusi tidak valid', 400);

    const newInst: InstitutionItem = { ...parsed.data, id: `inst-${Date.now()}` };
    INSTITUTIONS_DB.unshift(newInst);
    invalidateCacheByTag('institutions');
    return newInst;
  }

  static async deleteInstitution(id: string) {
    INSTITUTIONS_DB = INSTITUTIONS_DB.filter(i => i.id !== id);
    invalidateCacheByTag('institutions');
    return { id, deleted: true };
  }
}

export async function handleSupplierAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'create-supplier');
    const id = String(formData.get('id') || '');

    const strategies: Record<string, () => Promise<any>> = {
      'create-supplier': async () => {
        const name = String(formData.get('name') || '');
        const phone = String(formData.get('phone') || '');
        const category = String(formData.get('category') || 'Kain & Material');
        const contact_person = String(formData.get('contact_person') || '');
        const address = String(formData.get('address') || '');
        return successResponse(await MasterService.createSupplier({ name, phone, category, contact_person, address, status: 'active' }));
      },
      'delete-supplier': async () => {
        if (!id) throw new ApiError('ID supplier wajib disertakan', 400);
        return successResponse(await MasterService.deleteSupplier(id));
      },
    };

    const handler = strategies[intent];
    if (!handler) throw new ApiError(`Intent '${intent}' tidak didukung`, 400);
    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: 'action:master.supplier' });
    return errorResponse(error);
  }
}

export async function handleInstitutionAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'create-institution');
    const id = String(formData.get('id') || '');

    const strategies: Record<string, () => Promise<any>> = {
      'create-institution': async () => {
        const name = String(formData.get('name') || '');
        const type = (formData.get('type') || 'Universitas') as any;
        const city = String(formData.get('city') || '');
        const contact_person = String(formData.get('contact_person') || '');
        const discount_rate = Number(formData.get('discount_rate') || 0);
        return successResponse(await MasterService.createInstitution({ name, type, city, contact_person, discount_rate }));
      },
      'delete-institution': async () => {
        if (!id) throw new ApiError('ID institusi wajib disertakan', 400);
        return successResponse(await MasterService.deleteInstitution(id));
      },
    };

    const handler = strategies[intent];
    if (!handler) throw new ApiError(`Intent '${intent}' tidak didukung`, 400);
    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: 'action:master.institution' });
    return errorResponse(error);
  }
}
