import { z } from 'zod';

export const DriveItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama file/folder wajib diisi'),
  type: z.enum(['folder', 'file', 'design', 'image', 'document', 'vector']),
  size: z.string().optional(),
  parent_id: z.string().nullable().default(null),
  updated_at: z.string().default(() => new Date().toISOString()),
  url: z.string().optional(),
  extension: z.string().optional(),
  owner: z.string().default('Internal Kinau'),
});

export type DriveItem = z.infer<typeof DriveItemSchema>;

export interface DriveState {
  folderId?: string;
  search?: string;
  viewMode?: 'grid' | 'table';
  sortBy?: 'name' | 'date' | 'size';
}

export const FILE_ICONS: Record<string, string> = {
  folder: 'Folder',
  design: 'Palette',
  image: 'Image',
  document: 'FileText',
  vector: 'Sparkles',
  file: 'File',
};
