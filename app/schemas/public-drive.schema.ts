import { z } from 'zod';

export interface DriveFolderItem {
  id: string | number;
  folder_name: string;
  parent_id?: string | number | null;
  level?: number;
  purpose?: string | null;
  product_name?: string | null;
  created_on?: string;
  isSystem?: boolean;
}

export interface DriveFileItem {
  id: string | number;
  folder_id?: string | number | null;
  file_name: string;
  file_url: string;
  file_size?: string | number;
  mime_type?: string;
  extension?: string;
  created_on?: string;
}

export interface PublicDriveData {
  domain: string;
  orderData: any | null;
  current_folder: DriveFolderItem | null;
  folders: DriveFolderItem[];
  files: DriveFileItem[];
  breadcrumbs: { id: string | number | null; name: string }[];
}

export const CreateFolderSchema = z.object({
  intent: z.literal('create_folder'),
  folder_name: z.string().min(1, 'Nama folder wajib diisi'),
  parent_id: z.string().optional().nullable(),
  order_number: z.string().min(1),
});

export const CreateFileSchema = z.object({
  intent: z.literal('create_file'),
  file_name: z.string().min(1, 'Nama file wajib diisi'),
  file_url: z.string().url('URL file tidak valid'),
  folder_id: z.string().optional().nullable(),
  order_number: z.string().min(1),
  file_size: z.string().optional(),
});
