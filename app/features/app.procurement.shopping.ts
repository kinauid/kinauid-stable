import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Table, modals, BadgeColumn, TextColumn, TableActions, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { SHOPPING_STATUS_BADGES, type ShoppingItem, type ProcurementState } from '~/schemas/procurement.schema';
import { ProcurementService, handleProcurementAction } from '~/services/procurement.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['procurement:read'] };
export const meta = createMeta({ title: 'Rencana Belanja Pengadaan — Kinau ID', description: 'Daftar belanja bahan baku produksi.' });

export const loader = withMiddleware([withTelemetry('loader:procurement.shopping'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<ProcurementState>(request, { search: '', status: 'all', page: 1 });
    return successResponse(await ProcurementService.getShoppingList(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:procurement.shopping' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleProcurementAction(args);

export default createPage<InferLoader<typeof loader>, any, ProcurementState>((ctx) => {
  const { data, urlState, updateUrlState, send } = ctx;
  const post = (intent: string, id: string, status: string) => send.submit({ intent, id, status }, { method: 'post' });

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Rencana Belanja & Pengadaan', subtitle: 'Monitoring daftar belanja kain, aksesoris, dan packaging.',
      badges: [{ label: `${data?.totalCount ?? 0} Item Belanja`, variant: 'outline' }],
      actions: [Button({ label: 'Tambah Rencana Belanja', icon: 'ShoppingCart', variant: 'primary', size: 'sm', onClick: () => modals.open('CREATE_SHOPPING_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) })],
    }),
    StatsGrid([{ label: 'Total Item Pengadaan', value: data?.totalCount, icon: 'ShoppingBag', color: 'cyan' }, { label: 'Estimasi Total Biaya', value: `Rp ${(data?.totalCost || 0).toLocaleString('id-ID')}`, icon: 'Receipt', color: 'green' }, { label: 'Status Pengadaan', value: 'Terkoordinasi', icon: 'CheckCircle', color: 'purple' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), searchPlaceholder: 'Cari barang pengadaan...', showReset: Boolean(urlState.search), onReset: () => updateUrlState({ search: '' }) }),
    Table<ShoppingItem>({ data: data?.items ?? [], keyField: 'id', columns: [TextColumn({ key: 'item_name', header: 'Nama Bahan / Barang', className: 'font-bold' }), TextColumn({ key: 'supplier_name', header: 'Supplier' }), TextColumn({ key: 'quantity', header: 'Jumlah' }), TextColumn({ key: 'unit', header: 'Satuan' }), TextColumn({ key: 'estimated_cost', header: 'Estimasi Biaya' }), BadgeColumn({ key: 'status', map: SHOPPING_STATUS_BADGES }), TableActions<ShoppingItem>([{ icon: 'Check', variant: 'primary', onClick: (s) => post('update-status', s.id || '', 'received') }])] })
  );
}, { defaultState: { search: '', status: 'all', page: 1 } });
