import { z } from 'zod';
import type { BadgeProps } from '~/builder';

// ============================================================================
// 1. ERROR LOGS SCHEMA & TYPES (Vercel / Sentry Style)
// ============================================================================

export interface ErrorLogItem {
  id: string;
  timestamp: string;
  statusCode: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  errorMessage: string;
  stackTrace?: string;
  url: string;
  user: string;
  ip: string;
  latency: string;
  resolved: boolean;
  environment: 'production' | 'preview';
}

export interface ErrorLogState {
  search: string;
  tab: 'all' | '500' | '4xx' | 'unresolved' | 'resolved';
  statusCode?: string;
  method?: string;
  page: number;
}

export const ResolveErrorSchema = z.object({
  id: z.string().min(1, 'ID Error log wajib diisi'),
});

// ============================================================================
// 2. TICKETS SCHEMA & TYPES
// ============================================================================

export interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  targetRoute: string;
  appVersion?: string;
  category: 'ui_bug' | 'data_error' | 'performance' | 'feature_request' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface TicketState {
  search: string;
  tab: 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
  category?: string;
  priority?: string;
  page: number;
}

export const CreateBugReportSchema = z.object({
  title: z.string().min(3, 'Judul aduan minimal 3 karakter'),
  description: z.string().min(5, 'Deskripsi kendala minimal 5 karakter'),
  category: z.enum(['ui_bug', 'data_error', 'performance', 'feature_request', 'other']).default('ui_bug'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  targetRoute: z.string().default('/'),
  appVersion: z.string().optional(),
  reporterName: z.string().default('Staff Kinau'),
  reporterEmail: z.string().email().default('staff@kinau.id'),
  reporterPhone: z.string().optional(),
});

export type CreateBugReportInput = z.infer<typeof CreateBugReportSchema>;

export const UpdateTicketStatusSchema = z.object({
  id: z.string().min(1, 'ID Tiket wajib diisi'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

// ============================================================================
// 3. UI BADGE & OPTION CONSTANTS
// ============================================================================

export const STATUS_CODE_BADGES: Record<number, { label: string; variant: BadgeProps['variant'] }> = {
  500: { label: '500 Server Error', variant: 'danger' },
  502: { label: '502 Bad Gateway', variant: 'danger' },
  503: { label: '503 Service Unavailable', variant: 'danger' },
  400: { label: '400 Bad Request', variant: 'warning' },
  401: { label: '401 Unauthorized', variant: 'warning' },
  403: { label: '403 Forbidden', variant: 'warning' },
  404: { label: '404 Not Found', variant: 'secondary' },
  200: { label: '200 OK', variant: 'success' },
};

export const TICKET_STATUS_BADGES: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  open: { label: 'Open (Baru)', variant: 'danger' },
  in_progress: { label: 'Sedang Ditangani', variant: 'warning' },
  resolved: { label: 'Selesai / Solved', variant: 'success' },
  closed: { label: 'Ditutup (Closed)', variant: 'secondary' },
};

export const TICKET_PRIORITY_BADGES: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  critical: { label: 'Kritis (Blocker)', variant: 'danger' },
  high: { label: 'Tinggi', variant: 'warning' },
  medium: { label: 'Sedang', variant: 'info' },
  low: { label: 'Rendah', variant: 'secondary' },
};

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  ui_bug: '🎨 Kendala Tampilan (UI/UX)',
  data_error: '📊 Ketidaksesuaian Data',
  performance: '⚡ Loading Lambat / Macet',
  feature_request: '💡 Usulan Fitur Baru',
  other: '📝 Lainnya',
};
