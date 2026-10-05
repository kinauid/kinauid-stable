import { z } from 'zod';

export interface PublicDesignTemplate {
  id: string | number;
  name: string;
  category: 'idcard' | 'lanyard' | 'selempang' | 'kaos';
  base_image?: string;
  preview_url?: string;
  style_mode?: string;
  rules?: any;
}

export interface PublicDesignData {
  domain: string;
  orderData: {
    id: string;
    order_number: string;
    institution_name: string;
    pic_name?: string;
    pic_phone?: string;
    status: string;
    design_status?: string; // 'pending', 'approved', 'revision_requested'
    notes?: string;
    preview_url?: string;
  } | null;
  templates: PublicDesignTemplate[];
  activeTemplate: PublicDesignTemplate | null;
}

export const ApproveDesignSchema = z.object({
  intent: z.literal('approve-design').or(z.literal('approve_design')),
  order_number: z.string().min(1, 'Nomor order wajib diisi'),
  approved_by: z.string().optional().default('Klien'),
  notes: z.string().optional().default(''),
});

export const RequestRevisionSchema = z.object({
  intent: z.literal('request-revision').or(z.literal('request_revision')),
  order_number: z.string().min(1, 'Nomor order wajib diisi'),
  notes: z.string().min(3, 'Catatan revisi minimal 3 karakter'),
});

export const UploadClientResultSchema = z.object({
  intent: z.literal('upload-result').or(z.literal('upload_result')),
  order_number: z.string().min(1),
  file_url: z.string().min(1),
  file_name: z.string().min(1),
  folder_id: z.string().optional().nullable(),
});
