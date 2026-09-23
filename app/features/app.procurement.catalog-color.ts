import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Table, TextColumn, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { type CatalogColorItem, type ProcurementState } from '~/schemas/procurement.schema';
import { ProcurementService, handleProcurementAction } from '~/services/procurement.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['procurement:read'] };
export const meta = createMeta({ title: 'Katalog Warna & Pantone — Kinau ID', description: 'Standar warna printing jersey & kain.' });

export const loader = withMiddleware([withTelemetry('loader:procurement.color'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<ProcurementState>(request, { search: '', page: 1 });
    return successResponse(await ProcurementService.getCatalogColors(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:procurement.color' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleProcurementAction(args);

export default createPage<InferLoader<typeof loader>, any, ProcurementState>((ctx) => {
  const { data, urlState, updateUrlState } = ctx;

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({ title: 'Katalog Warna Standar', subtitle: 'Referensi kode hex, pantone, dan warna resmi Kinau ID.', badges: [{ label: `${data?.totalCount ?? 0} Warna Terdaftar`, variant: 'outline' }] }),
    StatsGrid([{ label: 'Total Warna', value: data?.totalCount, icon: 'Palette', color: 'cyan' }, { label: 'Standar Warna', value: 'Pantone TCX', icon: 'CheckCircle2', color: 'green' }, { label: 'Profil Warna Mesin', value: 'CMYK FOGRA39', icon: 'Printer', color: 'purple' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), searchPlaceholder: 'Cari kode warna atau nama...', showReset: Boolean(urlState.search), onReset: () => updateUrlState({ search: '' }) }),
    Table<CatalogColorItem>({ data: data?.colors ?? [], keyField: 'id', columns: [TextColumn({ key: 'code', header: 'Kode Warna', className: 'font-mono font-bold' }), TextColumn({ key: 'name', header: 'Nama Warna' }), TextColumn({ key: 'hex', header: 'HEX Code' }), TextColumn({ key: 'pantone', header: 'Pantone Ref' })] })
  );
}, { defaultState: { search: '', page: 1 } });
