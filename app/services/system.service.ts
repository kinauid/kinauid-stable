import type { ActionFunctionArgs } from 'react-router';
import {
  cacheData,
  invalidateCacheByTag,
  ApiError,
  errorResponse,
  successResponse,
} from '~/builder';
import { setFlashMessage, flashRedirect } from '~/lib/flash.server';
import { ErrorCatch } from '~/lib/api';
import {
  CreateBugReportSchema,
  ResolveErrorSchema,
  UpdateTicketStatusSchema,
  type ErrorLogItem,
  type ErrorLogState,
  type TicketItem,
  type TicketState,
  type CreateBugReportInput,
} from '~/schemas/system.schema';

// ============================================================================
// IN-MEMORY REPOSITORY (Demo Logs & Tickets Store)
// ============================================================================

let ERROR_LOGS_STORE: ErrorLogItem[] = [
  {
    id: 'err-0941',
    timestamp: '2026-09-23 14:12:05',
    statusCode: 500,
    method: 'POST',
    endpoint: '/api/orders/kkn/upload-csv',
    errorMessage: 'PostgresPoolTimeoutError: Connection pool exhausted (max 20 connections reached)',
    stackTrace: 'Error: Connection pool exhausted\n    at Pool.connect (/server/db/pool.js:42:15)\n    at OrderRepository.bulkInsert (/server/repos/orders.js:180:9)\n    at async handleUpload (/server/routes/orders.js:88:20)',
    url: '/app/order-list?tab=kkn&batch=2026-1',
    user: 'admin@kinau.id',
    ip: '182.1.24.110',
    latency: '3420ms',
    resolved: false,
    environment: 'production',
  },
  {
    id: 'err-0940',
    timestamp: '2026-09-23 13:58:30',
    statusCode: 500,
    method: 'GET',
    endpoint: '/api/finance/reports/cashflow',
    errorMessage: 'SyntaxError: Unexpected token < in JSON at position 0',
    stackTrace: 'SyntaxError: Unexpected token < in JSON at position 0\n    at JSON.parse (<anonymous>)\n    at CashflowService.getSummary (/server/services/cashflow.js:94:12)',
    url: '/app/finance/cashflow?month=09&year=2026',
    user: 'finance@kinau.id',
    ip: '103.20.18.5',
    latency: '820ms',
    resolved: false,
    environment: 'production',
  },
  {
    id: 'err-0939',
    timestamp: '2026-09-23 13:30:12',
    statusCode: 404,
    method: 'GET',
    endpoint: '/api/drive/customer/file/raw-artwork-74892.ai',
    errorMessage: 'FileNotFound: Asset with hash #74892 does not exist in Wasabi S3 bucket',
    stackTrace: 'NoSuchKey: The specified key does not exist\n    at S3Client.getObject (/node_modules/@aws-sdk/client-s3/index.js:120:10)',
    url: '/app/drive/customer?folder=itera_kkn',
    user: 'designer@kinau.id',
    ip: '182.1.24.110',
    latency: '145ms',
    resolved: true,
    environment: 'production',
  },
  {
    id: 'err-0938',
    timestamp: '2026-09-23 12:15:40',
    statusCode: 400,
    method: 'POST',
    endpoint: '/api/order-form/validate',
    errorMessage: 'ZodValidationError: order_items[0].size is required for apparel category',
    stackTrace: 'ZodError: [\n  {\n    "code": "invalid_type",\n    "expected": "string",\n    "received": "undefined",\n    "path": ["order_items", 0, "size"]\n  }\n]',
    url: '/app/order-form',
    user: 'staff_kasir@kinau.id',
    ip: '36.80.12.99',
    latency: '68ms',
    resolved: true,
    environment: 'production',
  },
  {
    id: 'err-0937',
    timestamp: '2026-09-23 11:04:19',
    statusCode: 502,
    method: 'GET',
    endpoint: '/api/print-area/queue-stream',
    errorMessage: 'BadGatewayError: Sublimation printer queue agent socket timed out after 10000ms',
    stackTrace: 'SocketTimeoutError: Connection timed out\n    at Socket.emit (/events.js:400:28)\n    at PrinterQueueBridge.poll (/server/printers.js:45:8)',
    url: '/app/print-area?tab=production',
    user: 'operator_print@kinau.id',
    ip: '192.168.1.50',
    latency: '10020ms',
    resolved: false,
    environment: 'production',
  },
];

let TICKETS_STORE: TicketItem[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'TKT-2026-001',
    title: 'Gagal Ekspor Rekap Pesanan KKN ke Format Excel',
    description: 'Saat menekan tombol Ekspor Excel di halaman pesanan KKN, tombol berputar terus dan muncul notifikasi 500 pool timeout.',
    reporterName: 'Rayhanda Putra',
    reporterEmail: 'admin@kinau.id',
    reporterPhone: '+6281234567890',
    targetRoute: '/app/order-list?tab=kkn&year=2026',
    category: 'data_error',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2026-09-23 14:15:00',
    updatedAt: '2026-09-23 14:18:20',
    assignedTo: 'Backend Team',
  },
  {
    id: 'tkt-002',
    ticketNumber: 'TKT-2026-002',
    title: 'Tombol Preview Bukti Transfer Terkadang Blank di Safari Mobile',
    description: 'Ketika membuka bukti transfer format WebP dari iPhone, gambar tidak muncul dan hanya ada placeholder abu-abu.',
    reporterName: 'Ditha (Kasir Workshop)',
    reporterEmail: 'kasir@kinau.id',
    reporterPhone: '+6282278005701',
    targetRoute: '/app/order-list?tab=reguler',
    category: 'ui_bug',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-09-23 13:40:10',
    updatedAt: '2026-09-23 13:40:10',
    assignedTo: 'Frontend Team',
  },
  {
    id: 'tkt-003',
    ticketNumber: 'TKT-2026-003',
    title: 'Usulan Penambahan Filter Kategori Produk Jersey Sublimasi',
    description: 'Mohon ditambahkan filter cepat untuk memisahkan pesanan jersey futsal, badminton, dan jaket windbreaker pada antrean cetak.',
    reporterName: 'Ahmad Operator Cetak',
    reporterEmail: 'operator@kinau.id',
    reporterPhone: '+6285712345678',
    targetRoute: '/app/print-area',
    category: 'feature_request',
    priority: 'low',
    status: 'resolved',
    createdAt: '2026-09-22 16:30:00',
    updatedAt: '2026-09-23 10:00:00',
    assignedTo: 'Product Team',
  },
];

// ============================================================================
// SYSTEM SERVICE (Business Logic & Data Access)
// ============================================================================

export const SystemService = {
  async getErrorLogs(state: ErrorLogState) {
    const rawLogs = await cacheData(
      'system:error-logs:raw',
      10,
      async () => [...ERROR_LOGS_STORE],
      { tags: ['error-logs'], staleWhileRevalidateSeconds: 30 }
    );

    const q = (state.search || '').toLowerCase();
    const filtered = rawLogs.filter((log) => {
      const matchSearch =
        !q ||
        log.errorMessage.toLowerCase().includes(q) ||
        log.endpoint.toLowerCase().includes(q) ||
        log.url.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (state.tab === '500') return log.statusCode >= 500;
      if (state.tab === '4xx') return log.statusCode >= 400 && log.statusCode < 500;
      if (state.tab === 'unresolved') return !log.resolved;
      if (state.tab === 'resolved') return log.resolved;

      return true;
    });

    const total500 = rawLogs.filter((l) => l.statusCode >= 500).length;
    const unresolvedCount = rawLogs.filter((l) => !l.resolved).length;
    const resolvedCount = rawLogs.filter((l) => l.resolved).length;

    return {
      logs: filtered,
      totalCount: rawLogs.length,
      filteredCount: filtered.length,
      unresolvedCount,
      total500,
      resolvedCount,
    };
  },

  async resolveErrorLog(id: string): Promise<boolean> {
    const log = ERROR_LOGS_STORE.find((l) => l.id === id);
    if (!log) return false;
    log.resolved = !log.resolved;
    invalidateCacheByTag('error-logs');
    return true;
  },

  async getTickets(state: TicketState) {
    const rawTickets = await cacheData(
      'system:tickets:raw',
      10,
      async () => [...TICKETS_STORE],
      { tags: ['tickets'], staleWhileRevalidateSeconds: 30 }
    );

    const q = (state.search || '').toLowerCase();
    const filtered = rawTickets.filter((t) => {
      const matchSearch =
        !q ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.reporterName.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (state.tab && state.tab !== 'all') return t.status === state.tab;
      if (state.category && state.category !== 'all') return t.category === state.category;
      if (state.priority && state.priority !== 'all') return t.priority === state.priority;

      return true;
    });

    const openCount = rawTickets.filter((t) => t.status === 'open').length;
    const inProgressCount = rawTickets.filter((t) => t.status === 'in_progress').length;
    const resolvedCount = rawTickets.filter((t) => t.status === 'resolved').length;

    return {
      tickets: filtered,
      totalCount: rawTickets.length,
      filteredCount: filtered.length,
      openCount,
      inProgressCount,
      resolvedCount,
    };
  },

  async createBugReport(input: CreateBugReportInput): Promise<TicketItem> {
    const ticketNumber = `TKT-2026-${String(TICKETS_STORE.length + 1).padStart(3, '0')}`;
    const newTicket: TicketItem = {
      id: `tkt-${Date.now().toString().slice(-4)}`,
      ticketNumber,
      title: input.title,
      description: input.description,
      reporterName: input.reporterName || 'Staff Kinau',
      reporterEmail: input.reporterEmail || 'staff@kinau.id',
      reporterPhone: input.reporterPhone,
      targetRoute: input.targetRoute || '/',
      appVersion: input.appVersion || 'v0.0.1',
      category: input.category,
      priority: input.priority,
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      assignedTo: 'Triage IT Support',
    };

    TICKETS_STORE.unshift(newTicket);
    invalidateCacheByTag('tickets');
    return newTicket;
  },

  async updateTicketStatus(id: string, status: TicketItem['status']): Promise<boolean> {
    const ticket = TICKETS_STORE.find((t) => t.id === id);
    if (!ticket) return false;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    invalidateCacheByTag('tickets');
    return true;
  },
};

// ============================================================================
// SERVICE STRATEGY DISPATCHER (Zero-Logic Action Handler)
// ============================================================================

export async function handleSystemAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  try {
    const intentHandlers: Record<string, () => Promise<Response>> = {
      'create-bug-report': async () => {
        const parsed = CreateBugReportSchema.safeParse({
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category') || 'ui_bug',
          priority: formData.get('priority') || 'medium',
          targetRoute: formData.get('targetRoute') || '/',
          appVersion: formData.get('appVersion') || undefined,
          reporterName: formData.get('reporterName') || 'Staff Kinau',
          reporterEmail: formData.get('reporterEmail') || 'staff@kinau.id',
          reporterPhone: formData.get('reporterPhone') || undefined,
        });

        if (!parsed.success) return errorResponse(parsed.error);

        const ticket = await SystemService.createBugReport(parsed.data);
        const cookie = await setFlashMessage(request, {
          type: 'success',
          message: `Laporan berhasil dikirim! No. Tiket: ${ticket.ticketNumber}`,
        });

        const redirectTo = String(formData.get('redirectTo') || request.headers.get('Referer') || '/app/system/tickets');
        return flashRedirect(redirectTo, cookie);
      },

      'resolve-error-log': async () => {
        const parsed = ResolveErrorSchema.safeParse({
          id: formData.get('id'),
        });
        if (!parsed.success) return errorResponse(parsed.error);

        await SystemService.resolveErrorLog(parsed.data.id);
        const cookie = await setFlashMessage(request, {
          type: 'success',
          message: 'Status error log berhasil diperbarui.',
        });
        return flashRedirect('/app/system/error-logs', cookie);
      },

      'update-ticket-status': async () => {
        const parsed = UpdateTicketStatusSchema.safeParse({
          id: formData.get('id'),
          status: formData.get('status'),
        });
        if (!parsed.success) return errorResponse(parsed.error);

        await SystemService.updateTicketStatus(parsed.data.id, parsed.data.status);
        const cookie = await setFlashMessage(request, {
          type: 'success',
          message: `Status tiket diubah ke ${parsed.data.status}`,
        });
        return flashRedirect('/app/system/tickets', cookie);
      },
    };

    const handler = intentHandlers[intent];
    if (!handler) {
      return errorResponse(ApiError.badRequest(`Intent '${intent}' tidak valid`));
    }

    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: `action:system:${intent}` });
    return errorResponse(error);
  }
}

export default SystemService;
