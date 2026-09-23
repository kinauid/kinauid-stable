import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Card, Row, Span, H3, Button, PageHeader, StatsGrid, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { FinanceService, handleFinanceAction } from '~/services/finance.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'finance'], permissions: ['finance:read'] };
export const meta = createMeta({ title: 'Laporan Laba Rugi & Neraca — Kinau ID', description: 'Ikhtisar laporan laba rugi, HPP apparel, dan neraca keuangan usaha.' });

export const loader = withMiddleware([withTelemetry('loader:finance.reports'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async () => {
  try {
    return successResponse(await FinanceService.getFinancialReports('2026-09'));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:finance.reports' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleFinanceAction(args);

export default createPage<InferLoader<typeof loader>>((ctx) => {
  const { data, send } = ctx;
  const post = (intent: string) => send.submit({ intent }, { method: 'post' });

  return Div({ className: 'space-y-6 max-w-6xl mx-auto' },
    PageHeader({ title: 'Laporan Laba Rugi & Neraca', subtitle: `Ikhtisar performa finansial, efisiensi HPP, dan marjin laba periode ${data?.period ?? '2026-09'}.`, badges: [{ label: `Net Margin: ${data?.profitMargin ?? 0}%`, variant: 'success' }], actions: [Button({ label: 'Tutup Buku Periode', icon: 'Lock', variant: 'outline', size: 'sm', onClick: () => post('close-period') })] }),
    StatsGrid([{ label: 'Total Pendapatan Usaha', value: `Rp ${(data?.grossRevenue || 0).toLocaleString('id-ID')}`, icon: 'TrendingUp', color: 'green' }, { label: 'Beban Pokok Produksi (HPP)', value: `Rp ${(data?.cogs || 0).toLocaleString('id-ID')}`, icon: 'Package', color: 'amber' }, { label: 'Laba Bersih Usaha', value: `Rp ${(data?.netProfit || 0).toLocaleString('id-ID')}`, icon: 'BadgePercent', color: 'cyan' }]),
    Row({ className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
      Card({ title: 'Ringkasan Laba Rugi (P&L)', className: 'space-y-2' },
        Row({ className: 'justify-between py-1 border-b border-[var(--border)] text-xs' }, Span(null, 'Pendapatan Kotor'), Span({ className: 'font-bold font-mono' }, `Rp ${(data?.grossRevenue || 0).toLocaleString('id-ID')}`)),
        Row({ className: 'justify-between py-1 border-b border-[var(--border)] text-xs text-amber-500' }, Span(null, 'HPP Produksi (COGS)'), Span({ className: 'font-bold font-mono' }, `- Rp ${(data?.cogs || 0).toLocaleString('id-ID')}`)),
        Row({ className: 'justify-between py-1 border-b border-[var(--border)] text-xs text-red-400' }, Span(null, 'Beban Operasional (OPEX)'), Span({ className: 'font-bold font-mono' }, `- Rp ${(data?.opex || 0).toLocaleString('id-ID')}`)),
        Row({ className: 'justify-between pt-2 text-sm font-black' }, Span(null, 'Laba Bersih'), H3({ className: 'text-[var(--primary)] font-mono' }, `Rp ${(data?.netProfit || 0).toLocaleString('id-ID')}`))
      ),
      Card({ title: 'Posisi Neraca & Ekuitas (Balance Sheet)', className: 'space-y-2' },
        Row({ className: 'justify-between py-1 border-b border-[var(--border)] text-xs' }, Span(null, 'Total Aset Likuid (Kas/Bank)'), Span({ className: 'font-bold font-mono text-emerald-500' }, `Rp ${(data?.totalAssets || 0).toLocaleString('id-ID')}`)),
        Row({ className: 'justify-between py-1 border-b border-[var(--border)] text-xs text-amber-500' }, Span(null, 'Total Liabilitas'), Span({ className: 'font-bold font-mono' }, `Rp ${(data?.totalLiabilities || 0).toLocaleString('id-ID')}`)),
        Row({ className: 'justify-between pt-2 text-sm font-black' }, Span(null, 'Total Ekuitas Bersih'), H3({ className: 'text-cyan-500 font-mono' }, `Rp ${(data?.totalEquity || 0).toLocaleString('id-ID')}`))
      )
    )
  );
});
