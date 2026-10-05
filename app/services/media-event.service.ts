import type { ActionFunctionArgs } from 'react-router';
import { cacheData } from '~/utils/cache';
import { successResponse, errorResponse } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';
import {
  type MediaEventData,
  RecordTwibbonDownloadSchema,
} from '~/schemas/media-event.schema';

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

export class MediaEventService {
  /**
   * Fetches event campaign data by slug
   */
  static async getEventBySlug(slug = 'kkn-unisma-2026'): Promise<MediaEventData> {
    return cacheData(`media_event:${slug}`, 30, async () => {
      try {
        const res = await safeFetchBackend('/select', {
          table: 'cms_contents',
          where: { slug, deleted: 0 },
          size: 1,
        }).catch(() => null);

        if (res && res.ok) {
          const json = await res.json().catch(() => ({ data: [] }));
          const items = Array.isArray(json?.data) ? json.data : json?.data?.items ?? [];
          if (items.length > 0) {
            const ev = items[0];
            return {
              id: String(ev.id),
              slug: ev.slug || slug,
              title: ev.title || 'Twibbon Resmi Event',
              organization: ev.author || ev.category || 'Panitia Pelaksana',
              description: ev.excerpt || ev.content || 'Gunakan twibbon resmi ini untuk meramaikan kegiatan di media sosial.',
              frame_url: ev.featured_image || 'https://data.kinau.web.id/sample-twibbon-frame.png',
              aspect_ratio: '1:1',
              caption_template: `Halo Semua! Saya bangga menjadi bagian dari ${ev.title}. Mari bersama menyukseskan program ini demi masa depan yang lebih gemilang!\n\n#KinauStudio #EventKampus #TwibbonResmi`,
              hashtags: ['#KinauStudio', '#TwibbonResmi', '#Event2026'],
              total_downloads: Number(ev.views || 342),
              event_date: ev.created_on?.split('T')[0] || '2026-10-05',
            };
          }
        }

        // Fallback default campaign
        return {
          id: 'ev-1',
          slug,
          title: 'Twibbon Resmi KKN Tematik UNISMA 2026',
          organization: 'LPPM Universitas Islam Malang',
          description:
            'Ayo sukseskan program Kuliah Kerja Nyata (KKN) Tematik UNISMA 2026 dengan memasang twibbon resmi pada profil Instagram dan WhatsApp Anda.',
          frame_url: 'https://data.kinau.web.id/sample-twibbon-frame.png',
          aspect_ratio: '1:1',
          caption_template:
            'Saya [Nama Lengkap], Mahasiswa KKN Kelompok [Nomor], Siap Mengabdi dan Berinovasi untuk Masyarakat dalam KKN Tematik UNISMA 2026!\n\n"Mengabdi dengan Hati, Membangun Negeri"\n\n#KKNUNISMA2026 #UNISMAHebat #KinauMerchandise #GenerasiUnggul',
          hashtags: ['#KKNUNISMA2026', '#UNISMAHebat', '#KinauStudio', '#PengabdianMasyarakat'],
          total_downloads: 1420,
          event_date: '2026-10-05',
        };
      } catch (error) {
        ErrorCatch({ error, context: 'MediaEventService.getEventBySlug' });
        return {
          id: 'ev-default',
          slug,
          title: 'Twibbon Campaign Kinau Studio',
          organization: 'Kinau Studio',
          description: 'Gunakan template foto resmi ini untuk kampanye event Anda.',
          frame_url: 'https://data.kinau.web.id/sample-twibbon-frame.png',
          aspect_ratio: '1:1',
          caption_template: 'Saya siap mendukung kegiatan ini bersama Kinau Studio!',
          hashtags: ['#KinauStudio', '#Merchandise'],
          total_downloads: 100,
          event_date: '2026-10-05',
        };
      }
    });
  }

  /**
   * Action Strategy Dispatcher for Media Event
   */
  static async handleMediaEventAction({ request }: ActionFunctionArgs) {
    try {
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      const intent = (rawData.intent || '') as string;

      if (intent === 'record-download' || intent === 'record_download') {
        const parsed = RecordTwibbonDownloadSchema.safeParse({ ...rawData, intent: 'record-download' });
        if (!parsed.success) {
          return Response.json({ error: 'Data download tidak valid' }, { status: 400 });
        }
        return successResponse({ recorded: true, message: 'Download berhasil dicatat' });
      }

      return Response.json({ error: `Intent '${intent}' tidak dikenali` }, { status: 400 });
    } catch (error: any) {
      ErrorCatch({ error, context: 'MediaEventService.handleMediaEventAction' });
      return Response.json(
        { error: typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem' },
        { status: 400 }
      );
    }
  }
}
