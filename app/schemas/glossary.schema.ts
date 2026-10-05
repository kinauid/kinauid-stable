import { z } from 'zod';

export interface TermItem {
  slug: string;
  name: string;
  cat: string;
  icon: string;
  desc: string;
}

export interface GlossaryState {
  search?: string;
  category?: string;
}

export const GlossaryStateSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});
