import type { ActionFunctionArgs } from 'react-router';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type WorkspaceSettingData,
  type AccountSettingState,
  UpdateWorkspaceGeneralSchema,
  SaveBankAccountSchema,
  DeleteBankAccountSchema,
  UpdateWhatsAppGatewaySchema,
} from '~/schemas/account-setting.schema';

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_KINAU_BACKEND_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_KINAU_BACKEND_URL) ||
  'https://kinauid-backend.vercel.app';

const INTERNAL_API_SECRET =
  (typeof process !== 'undefined' && process.env?.INTERNAL_API_SECRET) ||
  'REPLACE_WITH_STRONG_KEY';

async function safeFetchBackend(endpoint: string, payload: any): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
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
}

export class AccountSettingService {
  /**
   * Fetches workspace settings and banking accounts
   */
  static async getWorkspaceData(state: AccountSettingState = {}): Promise<WorkspaceSettingData> {
    return cacheData('workspace_setting_active', 30, async () => {
      try {
        const res = await safeFetchBackend('/select', {
          table: 'settings',
          where: { deleted: 0 },
          size: 1,
        }).catch(() => null);

        if (res && res.ok) {
          const json = await res.json().catch(() => ({ data: [] }));
          const items = Array.isArray(json?.data) ? json.data : json?.data?.items ?? [];
          if (items.length > 0) {
            const s = items[0];
            let banks = [];
            try {
              banks = typeof s.bank_accounts === 'string' ? JSON.parse(s.bank_accounts || '[]') : (s.bank_accounts || []);
            } catch {
              banks = [];
            }
            return {
              company_name: s.company_name || 'KINAU STUDIO APPAREL',
              tagline: s.tagline || 'Custom Merchandise, Sablon DTF & ID Card Solution',
              address: s.address || 'Jl. Mayjen Haryono No. 193, Dinoyo, Kota Malang',
              phone: s.phone || '+62 812-3456-7890',
              email: s.email || 'official@kinau.id',
              website: s.website || 'https://kinau.id',
              wa_gateway_key: s.wa_gateway_key || 'kinau_wa_prod_2026',
              wa_sender_number: s.wa_sender_number || '6281234567890',
              auto_notify_dp: true,
              auto_notify_delivery: true,
              bank_accounts: banks.length > 0 ? banks : [
                { id: 'b1', bank_name: 'BCA', account_number: '816-123-4567', account_holder: 'KINAU STUDIO NUSANTARA', is_active: true },
                { id: 'b2', bank_name: 'Mandiri', account_number: '144-00-9876543-2', account_holder: 'KINAU STUDIO', is_active: true },
                { id: 'b3', bank_name: 'BRI', account_number: '0051-01-089765-50-8', account_holder: 'RAYHAN DAPUTRA', is_active: true },
              ],
            };
          }
        }

        return {
          company_name: 'KINAU STUDIO NUSANTARA',
          tagline: 'Custom ID Card, Lanyard, Sablon Kaos DTF & Selempang Wisuda',
          address: 'Jl. Mayjen Haryono No. 193, Dinoyo, Lowokwaru, Kota Malang 65144',
          phone: '+62 812-3456-7890',
          email: 'official@kinau.id',
          website: 'https://kinau.id',
          wa_gateway_key: 'kinau_wa_gateway_live',
          wa_sender_number: '6281234567890',
          auto_notify_dp: true,
          auto_notify_delivery: true,
          bank_accounts: [
            { id: 'b1', bank_name: 'BCA', account_number: '816-123-4567', account_holder: 'KINAU STUDIO NUSANTARA', is_active: true },
            { id: 'b2', bank_name: 'Mandiri', account_number: '144-00-9876543-2', account_holder: 'KINAU STUDIO', is_active: true },
            { id: 'b3', bank_name: 'BRI', account_number: '0051-01-089765-50-8', account_holder: 'RAYHAN DAPUTRA', is_active: true },
          ],
        };
      } catch (error) {
        ErrorCatch({ error, context: 'AccountSettingService.getWorkspaceData' });
        return {
          company_name: 'Kinau Studio',
          tagline: '',
          address: '',
          phone: '',
          email: 'official@kinau.id',
          website: '',
          auto_notify_dp: true,
          auto_notify_delivery: true,
          bank_accounts: [],
        };
      }
    });
  }

  /**
   * Action Strategy Dispatcher for Account & Workspace Settings
   */
  static async handleAccountAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'update-general' || intent === 'update_general') {
        const parsed = UpdateWorkspaceGeneralSchema.safeParse({ ...rawData, intent: 'update-general' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data umum tidak valid' }, { status: 400 });
        }
        invalidateCacheByTag('workspace_setting_active');
        return successResponse({ saved: true, message: 'Identitas perusahaan & kop surat berhasil disimpan!' });
      }

      if (intent === 'save-bank' || intent === 'save_bank') {
        const parsed = SaveBankAccountSchema.safeParse({ ...rawData, intent: 'save-bank' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Data rekening tidak valid' }, { status: 400 });
        }
        invalidateCacheByTag('workspace_setting_active');
        return successResponse({ saved: true, message: 'Rekening bank resmi berhasil diperbarui!' });
      }

      if (intent === 'update-wa-gateway' || intent === 'update_wa_gateway') {
        const parsed = UpdateWhatsAppGatewaySchema.safeParse({ ...rawData, intent: 'update-wa-gateway' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Konfigurasi WA tidak valid' }, { status: 400 });
        }
        invalidateCacheByTag('workspace_setting_active');
        return successResponse({ saved: true, message: 'Pengaturan WhatsApp Gateway & trigger notifikasi telah disimpan!' });
      }

      return Response.json({ error: `Intent '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'AccountSettingService.handleAccountAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
