import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type DesignTemplateItem,
  type DesignCategory,
  type SelempangAsset,
  type DesignDashboardData,
  type DesignState,
  SaveDesignTemplateSchema,
  DeleteDesignTemplateSchema,
} from '~/schemas/design-template.schema';

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

export class DesignTemplateService {
  /**
   * Fetches design templates and assets by category
   */
  static async getDesignDashboardData(state: DesignState = {}): Promise<DesignDashboardData> {
    const activeCategory = state.category || 'idcard';

    return cacheData(
      `design_templates:${activeCategory}:${state.search || ''}`,
      15,
      async () => {
        try {
          const res = await safeFetchBackend('/select', {
            table: 'x_twibbon_templates',
            where: { deleted: 0 },
            size: 100,
            sort: 'created_on:desc',
          });

          const json = await res.json().catch(() => ({ data: [] }));
          const rawItems: any[] = Array.isArray(json?.data) ? json.data : (json?.data?.items ?? []);

          const mapped: DesignTemplateItem[] = rawItems.length > 0
            ? rawItems.map((t) => {
                let cat: DesignCategory = 'idcard';
                if (t.category === 'twibbon-lanyard' || t.category === 'lanyard') cat = 'lanyard';
                else if (t.category === 'selempang') cat = 'selempang';

                let parsedRules = [];
                try {
                  parsedRules = typeof t.rules === 'string' ? JSON.parse(t.rules || '[]') : (t.rules || []);
                } catch {
                  parsedRules = [];
                }

                return {
                  id: String(t.id),
                  name: t.name || 'Template Desain Kinau',
                  category: cat,
                  base_image: t.base_image || t.image_url || 'https://data.kinau.web.id/sample-idcard-template.png',
                  preview_url: t.preview_url || t.base_image,
                  style_mode: t.style_mode === 'static' ? 'static' : 'dynamic',
                  rules: parsedRules,
                  created_on: t.created_on || new Date().toISOString(),
                };
              })
            : [
                {
                  id: '1',
                  name: 'Master ID Card KKN UNISMA 2026',
                  category: 'idcard',
                  base_image: 'https://data.kinau.web.id/sample-idcard-template.png',
                  style_mode: 'dynamic',
                  rules: [
                    { id: 'r1', type: 'photo', label: 'Foto Peserta', x: 20, y: 35, width: 60, height: 80 },
                    { id: 'r2', type: 'text', label: 'Nama Lengkap', x: 10, y: 125, width: 80, height: 20, fontColor: '#1e1b4b' },
                    { id: 'r3', type: 'text', label: 'Kelompok / Divisi', x: 10, y: 150, width: 80, height: 15, fontColor: '#4f46e5' },
                  ],
                  created_on: new Date().toISOString(),
                },
                {
                  id: '2',
                  name: 'Master Lanyard Strip Panitia 2cm',
                  category: 'lanyard',
                  base_image: 'https://data.kinau.web.id/sample-lanyard-template.png',
                  style_mode: 'static',
                  rules: [
                    { id: 'r4', type: 'text', label: 'Nama Acara & Slogan', x: 10, y: 400, width: 80, height: 20, fontColor: '#ffffff' },
                  ],
                  created_on: new Date().toISOString(),
                },
                {
                  id: '3',
                  name: 'Master Selempang Wisuda Bludru List Pita',
                  category: 'selempang',
                  base_image: 'https://data.kinau.web.id/sample-selempang-template.png',
                  style_mode: 'dynamic',
                  rules: [
                    { id: 'r5', type: 'text', label: 'Nama & Gelar Sarjana', x: 15, y: 300, width: 70, height: 30, fontColor: '#f59e0b' },
                  ],
                  created_on: new Date().toISOString(),
                },
              ];

          const selempangAssets: SelempangAsset[] = [
            { id: '1', name: 'Monotype Corsiva (Bordir Klasik)', type: 'font', preview_url: '', color: '#f59e0b' },
            { id: '2', name: 'Times New Roman Bold', type: 'font', preview_url: '', color: '#ffffff' },
            { id: '3', name: 'Kain Bludru Hitam Pekat', type: 'fabric', preview_url: '', color: '#0f172a' },
            { id: '4', name: 'Kain Bludru Merah Maroon', type: 'fabric', preview_url: '', color: '#881337' },
            { id: '5', name: 'Kain Bludru Biru Navy', type: 'fabric', preview_url: '', color: '#1e3a8a' },
          ];

          return {
            templates: mapped,
            selempangAssets,
            activeCategory,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'DesignTemplateService.getDesignDashboardData' });
          return {
            templates: [],
            selempangAssets: [],
            activeCategory,
          };
        }
      }
    );
  }

  /**
   * Saves or updates a design template
   */
  static async saveTemplate(data: any) {
    try {
      const isNew = !data.id || String(data.id).startsWith('tpl-');
      const payload = {
        name: data.name,
        category: data.category,
        base_image: data.base_image,
        style_mode: data.style_mode,
        rules: typeof data.rules === 'string' ? data.rules : JSON.stringify(data.rules || []),
        modified_on: new Date().toISOString(),
        deleted: 0,
      };

      if (isNew) {
        await safeFetchBackend('/insert', {
          table: 'x_twibbon_templates',
          data: {
            ...payload,
            created_on: new Date().toISOString(),
          },
        });
      } else {
        await safeFetchBackend('/update', {
          table: 'x_twibbon_templates',
          data: payload,
          where: isNaN(Number(data.id)) ? { id: data.id } : { id: Number(data.id) },
        });
      }

      invalidateCacheByTag('design_templates');
      return { success: true, message: 'Template desain berhasil disimpan!' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'DesignTemplateService.saveTemplate' });
      return { success: false, message: error?.message || 'Gagal menyimpan template desain' };
    }
  }

  /**
   * Soft-deletes a design template
   */
  static async deleteTemplate(id: string) {
    try {
      await safeFetchBackend('/update', {
        table: 'x_twibbon_templates',
        data: { deleted: 1, modified_on: new Date().toISOString() },
        where: isNaN(Number(id)) ? { id } : { id: Number(id) },
      });

      invalidateCacheByTag('design_templates');
      return { success: true, message: 'Template desain telah dihapus' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'DesignTemplateService.deleteTemplate' });
      return { success: false, message: error?.message || 'Gagal menghapus template' };
    }
  }

  /**
   * Action Handler Strategy Dispatcher for Single-File Feature Builder
   */
  static async handleDesignTemplateAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'save-template' || intent === 'save_template') {
        const parsed = SaveDesignTemplateSchema.safeParse({ ...rawData, intent: 'save-template' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data template tidak valid' }, { status: 400 });
        }
        const res = await DesignTemplateService.saveTemplate(parsed.data);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ saved: true, message: res.message });
      }

      if (intent === 'delete-template' || intent === 'delete_template') {
        const parsed = DeleteDesignTemplateSchema.safeParse({ ...rawData, intent: 'delete-template' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'ID template tidak valid' }, { status: 400 });
        }
        const res = await DesignTemplateService.deleteTemplate(parsed.data.id);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ deleted: true, message: res.message });
      }

      return Response.json({ error: `Intent aksi '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'DesignTemplateService.handleDesignTemplateAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
