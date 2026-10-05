import type { ActionFunctionArgs } from 'react-router';
import { cacheData } from '~/utils/cache';
import { successResponse, errorResponse } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type CustomerSupportData,
  type CustomerSupportState,
  type FaqItem,
  CreateSupportTicketSchema,
} from '~/schemas/customer-support.schema';

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

export class CustomerSupportService {
  /**
   * Fetches support FAQs and CS info
   */
  static async getSupportData(state: CustomerSupportState = {}): Promise<CustomerSupportData> {
    return cacheData('customer_support_faqs', 60, async () => {
      try {
        const faqs: FaqItem[] = [
          {
            id: '1',
            question: 'Berapa lama proses pengerjaan ID Card dan Tali Lanyard?',
            answer:
              'Waktu pengerjaan standar adalah 2-4 hari kerja setelah desain di-ACC dan DP 50% diterima. Untuk pemesanan kilat/express (1 hari jadi) tersedia biaya tambahan proporsional.',
            category: 'order',
          },
          {
            id: '2',
            question: 'Bagaimana cara mengirim file logo dan nama peserta ID Card?',
            answer:
              'Anda dapat mengunggah file spreadsheet excel (.xlsx) berisi daftar nama/NIM dan foto peserta melalui menu Drive Pelanggan atau langsung dikirim via WhatsApp CS.',
            category: 'design',
          },
          {
            id: '3',
            question: 'Metode pembayaran apa saja yang didukung?',
            answer:
              'Kami mendukung transfer Bank BCA, BRI, Mandiri, BSI, QRIS All Payment (Gopay, OVO, ShopeePay), serta pembayaran tunai langsung di kantor workshop Kinau Studio.',
            category: 'payment',
          },
          {
            id: '4',
            question: 'Apakah bisa kirim ke luar kota / luar pulau Jawa?',
            answer:
              'Tentu saja, kami bermitra resmi dengan ekspedisi J&T Cargo, Baraka Express, Lion Parcel, dan Dakota Cargo dengan tarif khusus merchandise partai besar.',
            category: 'shipping',
          },
        ];

        const csContacts = [
          {
            name: 'CS Kinau Malang',
            role: 'Customer Care & Antrean Order',
            whatsapp: '6281234567890',
            available_hours: 'Setiap Hari 08:00 - 21:00 WIB',
          },
          {
            name: 'Divisi Desain & ACC',
            role: 'Konsultasi Mockup & File Cetak',
            whatsapp: '6289876543210',
            available_hours: 'Senin - Sabtu 09:00 - 17:00 WIB',
          },
        ];

        return {
          faqs,
          recentTickets: [
            {
              id: 't-1',
              ticket_number: 'TCK-2026-004',
              subject: 'Konfirmasi update resi ekspedisi Baraka Cargo',
              status: 'resolved',
              created_at: '2026-10-02',
            },
          ],
          csContacts,
        };
      } catch (error) {
        ErrorCatch({ error, context: 'CustomerSupportService.getSupportData' });
        return {
          faqs: [],
          recentTickets: [],
          csContacts: [],
        };
      }
    });
  }

  /**
   * Action Strategy Dispatcher for Customer Support
   */
  static async handleSupportAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'create-ticket' || intent === 'create_ticket') {
        const parsed = CreateSupportTicketSchema.safeParse({ ...rawData, intent: 'create-ticket' });
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || 'Input tiket tidak valid' }, { status: 400 });
        }
        return successResponse({
          ticket: true,
          message: 'Tiket bantuan berhasil dibuat. Tim CS Kinau akan menghubungi WhatsApp Anda dalam 15 menit!',
        });
      }

      return Response.json({ error: `Intent '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'CustomerSupportService.handleSupportAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
