import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type PublicDesignData,
  type PublicDesignTemplate,
  ApproveDesignSchema,
  RequestRevisionSchema,
  UploadClientResultSchema,
} from '~/schemas/public-design.schema';

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

export class PublicDesignService {
  /**
   * Retrieves public design link data for client approval and photo twibbon generator
   */
  static async getPublicDesignData(domain: string): Promise<PublicDesignData> {
    if (!domain) {
      return { domain: '', orderData: null, templates: [], activeTemplate: null };
    }

    const cleanDomain = domain.trim();

    return cacheData(
      `public_design:${cleanDomain}`,
      15,
      async () => {
        try {
          const isOrderNumber = cleanDomain.startsWith('ORD-') || cleanDomain.includes('ORD');

          // 1. Fetch Order Data
          const orderRes = await safeFetchBackend('/select', {
            table: 'orders',
            where: isOrderNumber ? { order_number: cleanDomain } : { institution_domain: cleanDomain },
            size: 1,
          });

          const orderJson = await orderRes.json().catch(() => ({ data: [] }));
          const orderList = Array.isArray(orderJson?.data) ? orderJson.data : (orderJson?.data?.items ?? []);
          const order = orderList[0] || null;

          // 2. Fetch Templates
          const tplRes = await safeFetchBackend('/select', {
            table: 'x_twibbon_templates',
            where: { deleted: 0 },
            size: 20,
          }).catch(() => null);

          const tplJson = tplRes ? await tplRes.json().catch(() => ({ data: [] })) : { data: [] };
          const rawTemplates: any[] = Array.isArray(tplJson?.data) ? tplJson.data : (tplJson?.data?.items ?? []);

          const mappedTemplates: PublicDesignTemplate[] = rawTemplates.length > 0
            ? rawTemplates.map((t) => ({
                id: t.id,
                name: t.name || 'Template Desain Kinau',
                category: t.category || 'idcard',
                base_image: t.base_image || t.image_url,
                preview_url: t.preview_url || t.base_image,
                style_mode: t.style_mode || 'standard',
                rules: typeof t.rules === 'string' ? JSON.parse(t.rules || '{}') : t.rules,
              }))
            : [
                {
                  id: 1,
                  name: 'Template ID Card Panitia Official',
                  category: 'idcard',
                  base_image: 'https://data.kinau.web.id/sample-idcard-template.png',
                  preview_url: 'https://data.kinau.web.id/sample-idcard-template.png',
                  style_mode: 'portrait',
                },
                {
                  id: 2,
                  name: 'Template Lanyard Strip Official',
                  category: 'lanyard',
                  base_image: 'https://data.kinau.web.id/sample-lanyard-template.png',
                  preview_url: 'https://data.kinau.web.id/sample-lanyard-template.png',
                  style_mode: 'strip',
                },
              ];

          const activeTemplate = mappedTemplates[0] || null;

          return {
            domain: cleanDomain,
            orderData: order
              ? {
                  id: String(order.id),
                  order_number: order.order_number || cleanDomain,
                  institution_name: order.institution_name || 'Instansi Pemesan',
                  pic_name: order.pic_name,
                  pic_phone: order.pic_phone,
                  status: order.status || 'processing',
                  design_status: order.design_status || 'pending',
                  notes: order.notes,
                  preview_url: order.preview_url || mappedTemplates[0]?.preview_url,
                }
              : null,
            templates: mappedTemplates,
            activeTemplate,
          };
        } catch (error) {
          ErrorCatch({ error, context: 'PublicDesignService.getPublicDesignData' });
          return {
            domain: cleanDomain,
            orderData: null,
            templates: [],
            activeTemplate: null,
          };
        }
      }
    );
  }

  /**
   * Approves design for production
   */
  static async approveDesign(orderNumber: string, notes?: string) {
    try {
      await safeFetchBackend('/update', {
        table: 'orders',
        data: {
          design_status: 'approved',
          notes: notes ? `[Design Approved: ${notes}]` : '[Design Approved]',
          modified_on: new Date().toISOString(),
        },
        where: { order_number: orderNumber },
      });

      invalidateCacheByTag('public_design');
      invalidateCacheByTag('orders');
      return { success: true, message: 'Desain berhasil disetujui! Pesanan akan segera masuk ke antrean cetak.' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'PublicDesignService.approveDesign' });
      return { success: false, message: error?.message || 'Gagal menyetujui desain' };
    }
  }

  /**
   * Requests revision from designer
   */
  static async requestRevision(orderNumber: string, notes: string) {
    try {
      await safeFetchBackend('/update', {
        table: 'orders',
        data: {
          design_status: 'revision_requested',
          notes: `[Revisi Diminta: ${notes}]`,
          modified_on: new Date().toISOString(),
        },
        where: { order_number: orderNumber },
      });

      invalidateCacheByTag('public_design');
      invalidateCacheByTag('orders');
      return { success: true, message: 'Permintaan revisi telah dikirim ke tim desainer Kinau.' };
    } catch (error: any) {
      ErrorCatch({ error, context: 'PublicDesignService.requestRevision' });
      return { success: false, message: error?.message || 'Gagal mengirim permintaan revisi' };
    }
  }

  /**
   * Action Handler Strategy Dispatcher for Single-File Feature Builder
   */
  static async handlePublicDesignAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'approve-design' || intent === 'approve_design') {
        const parsed = ApproveDesignSchema.safeParse({ ...rawData, intent: 'approve-design' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data approval tidak valid' }, { status: 400 });
        }
        const res = await PublicDesignService.approveDesign(parsed.data.order_number, parsed.data.notes);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ approved: true, message: res.message });
      }

      if (intent === 'request-revision' || intent === 'request_revision') {
        const parsed = RequestRevisionSchema.safeParse({ ...rawData, intent: 'request-revision' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Catatan revisi tidak valid' }, { status: 400 });
        }
        const res = await PublicDesignService.requestRevision(parsed.data.order_number, parsed.data.notes);
        if (!res.success) return Response.json({ error: res.message }, { status: 400 });
        return successResponse({ revision_sent: true, message: res.message });
      }

      return Response.json({ error: `Intent aksi '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'PublicDesignService.handlePublicDesignAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
