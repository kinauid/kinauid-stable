import { z } from 'zod';

export type DesignCategory = 'idcard' | 'lanyard' | 'selempang';
export type StyleMode = 'dynamic' | 'static';

export interface DesignRuleItem {
  id: string;
  type: 'text' | 'dropdown' | 'photo' | 'logo';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  options?: string[];
  fontFamily?: string;
  fontColor?: string;
}

export interface DesignTemplateItem {
  id: string;
  name: string;
  category: DesignCategory;
  base_image: string;
  preview_url?: string;
  style_mode: StyleMode;
  rules: DesignRuleItem[];
  created_on: string;
}

export interface SelempangAsset {
  id: string;
  name: string;
  type: 'font' | 'fabric' | 'logo';
  preview_url: string;
  color?: string;
}

export interface DesignDashboardData {
  templates: DesignTemplateItem[];
  selempangAssets: SelempangAsset[];
  activeCategory: DesignCategory;
}

export interface DesignState {
  category?: DesignCategory;
  search?: string;
}

export const SaveDesignTemplateSchema = z.object({
  intent: z.literal('save-template').or(z.literal('save_template')),
  id: z.string().optional().nullable(),
  name: z.string().min(1, 'Nama template wajib diisi'),
  category: z.enum(['idcard', 'lanyard', 'selempang']).default('idcard'),
  base_image: z.string().min(1, 'Gambar frame base wajib diisi'),
  style_mode: z.enum(['dynamic', 'static']).default('dynamic'),
  rules: z.string().optional().default('[]'),
});

export const DeleteDesignTemplateSchema = z.object({
  intent: z.literal('delete-template').or(z.literal('delete_template')),
  id: z.string().min(1, 'ID template wajib diisi'),
});
