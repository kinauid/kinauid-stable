import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Select, Table, ConfirmDialog, modals, BadgeColumn, TextColumn, TableActions, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { ASSET_STATUS_BADGES, ASSET_CATEGORY_OPTIONS, type AssetItem, type AssetManageState } from '~/schemas/asset.schema';
import { AssetService, handleAssetAction } from '~/services/asset.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['asset:read'] };
export const meta = createMeta({ title: 'Inventaris Mesin & Aset — Kinau ID', description: 'Monitoring mesin printing, heat press & workstation IT.' });

export const loader = withMiddleware([withTelemetry('loader:asset.inventory'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<AssetManageState>(request, { search: '', category: 'all', status: 'all', page: 1 });
    return successResponse(await AssetService.getAssets(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:asset.inventory' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleAssetAction(args);

export default createPage<InferLoader<typeof loader>, any, AssetManageState>((ctx) => {
  const { data, urlState, updateUrlState, send } = ctx;
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Inventaris Mesin & Fasilitas', subtitle: 'Monitoring utilisasi mesin sublimasi, heat press, dan perlengkapan.',
      badges: [{ label: `${data?.totalUnits ?? 0} Unit Aset`, variant: 'outline' }],
      actions: [Button({ label: 'Registrasi Aset', icon: 'Plus', variant: 'primary', size: 'sm', onClick: () => modals.open('CREATE_ASSET_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) })],
    }),
    StatsGrid([{ label: 'Total Unit Aset', value: data?.totalUnits, icon: 'Cpu', color: 'cyan' }, { label: 'Nilai Total Investasi', value: `Rp ${(data?.totalValue || 0).toLocaleString('id-ID')}`, icon: 'Coins', color: 'green' }, { label: 'Kategori Fasilitas', value: '5 Kategori', icon: 'Tag', color: 'purple' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), filters: [Select({ name: 'category', value: urlState.category ?? 'all', onChange: (e) => updateUrlState({ category: e.target.value }), options: ASSET_CATEGORY_OPTIONS, className: 'w-48' })], showReset: Boolean(urlState.search || (urlState.category && urlState.category !== 'all')), onReset: () => updateUrlState({ search: '', category: 'all' }) }),
    Table<AssetItem>({ data: data?.assets ?? [], keyField: 'id', columns: [TextColumn({ key: 'asset_name', header: 'Nama Mesin / Peralatan', className: 'font-bold' }), TextColumn({ key: 'category', header: 'Kategori' }), TextColumn({ key: 'location', header: 'Penempatan' }), TextColumn({ key: 'total_unit', header: 'Jumlah Unit' }), BadgeColumn({ key: 'status', map: ASSET_STATUS_BADGES }), TableActions<AssetItem>([{ icon: 'Trash2', variant: 'danger', onClick: (a) => ConfirmDialog.delete({ name: a.asset_name, onConfirm: () => post('delete-asset', a.id || '') }) }])] })
  );
}, { defaultState: { search: '', category: 'all', status: 'all', page: 1 } });
