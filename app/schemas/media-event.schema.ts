import { z } from 'zod';

export interface MediaEventData {
  id: string | number;
  slug: string;
  title: string;
  organization: string;
  description: string;
  frame_url: string;
  aspect_ratio: '1:1' | '9:16' | '4:5';
  caption_template: string;
  hashtags: string[];
  total_downloads: number;
  event_date?: string;
}

export interface MediaEventState {
  slug?: string;
}

export const RecordTwibbonDownloadSchema = z.object({
  intent: z.literal('record-download').or(z.literal('record_download')),
  slug: z.string().min(1),
});
