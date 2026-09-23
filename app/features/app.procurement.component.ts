import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Table, TextColumn, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { type ProcurementComponentItem, type ProcurementState } from '~/schemas/procurement.schema';
import { ProcurementService, handleProcurementAction } from '~/services/procurement.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['procurement:read'] };
export const meta = createMeta({ title: 'Komponen & Bahan Baku — Kinau ID', description: 'Inventaris bahan kain, kerah, dan resleting.' });

export const loader = withMiddleware([withTelemetry('loader:procurement.component'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<ProcurementState>(request, { search: '', category: 'all', page: 1 });
    return successResponse(await ProcurementService.getComponents(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:procurement.component' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleProcurementAction(args);

export default createPage<InferLoader<typeof loader>, any, ProcurementState>((ctx) => {
  const { data, urlState, updateUrlState } = ctx;

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({ title: 'Komponen & Stok Bahan', subtitle: 'Monitoring stok kain dryfit, aksesoris, dan material jersey.', badges: [{ label: `${data?.totalCount ?? 0} Jenis Komponen`, variant: 'outline' }] }),
    StatsGrid([{ label: 'Total Item Komponen', value: data?.totalCount, icon: 'Layers', color: 'cyan' }, { label: 'Kategori Produk', value: 'Jersey & Apparel', icon: 'Tag', color: 'purple' }, { label: 'Status Stok Gudang', value: 'Aman (Tersedia)', icon: 'ShieldCheck', color: 'green' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), searchPlaceholder: 'Cari nama kain atau aksesoris...', showReset: Boolean(urlState.search), onReset: () => updateUrlState({ search: '' }) }),
    Table<ProcurementComponentItem>({ data: data?.components ?? [], keyField: 'id', columns: [TextColumn({ key: 'name', header: 'Nama Bahan Baku', className: 'font-bold' }), TextColumn({ key: 'category', header: 'Kategori' }), TextColumn({ key: 'stock', header: 'Stok Saat Ini' }), TextColumn({ key: 'unit', header: 'Satuan' }), TextColumn({ key: 'min_stock', header: 'Batas Minimum' })] })
  );
}, { defaultState: { search: '', category: 'all', page: 1 } });
