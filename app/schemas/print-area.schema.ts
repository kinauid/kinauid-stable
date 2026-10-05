import { z } from 'zod';

export type PrintCategory = 'idcard' | 'lanyard' | 'prod3';
export type PrintStatus = 'waiting' | 'done' | 'processing';

export interface PrintSlot {
  id: string;
  fileId: string;
  fileName: string;
  order_number: string;
  parentId: string;
  data?: string;
  qtyNeeded: number;
  hookColor: string;
  isMasterColor: boolean;
  side?: 1 | 2;
  isBack?: boolean;
}

export interface PrintOrderFolder {
  id: string;
  folder_name: string;
  order_number?: string;
  files?: Array<{
    id: string;
    name: string;
    file_url: string;
  }>;
}

export interface PrintOrder {
  id: string;
  order_number: string;
  institution_name: string;
  pic_name?: string;
  pic_phone?: string;
  status_printed: string;
  status: string;
  created_on: string;
  order_items?: any[];
  order_upload_folders?: PrintOrderFolder[];
  driveFolderId?: string;
}

export interface PrintAreaState {
  category?: PrintCategory;
  search?: string;
}

export const UpdatePrintStatusSchema = z.object({
  intent: z.literal('update-status').or(z.literal('update_status')),
  id: z.string().min(1, 'ID Order wajib diisi'),
  status: z.enum(['waiting', 'done', 'processing']).default('done'),
});

export const FetchFolderFilesSchema = z.object({
  intent: z.literal('get-folder-files'),
  folder_id: z.string().min(1, 'Folder ID wajib diisi'),
});
