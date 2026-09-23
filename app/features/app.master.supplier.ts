import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Select, Table, ConfirmDialog, modals, BadgeColumn, TextColumn, TableActions, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { SUPPLIER_STATUS_BADGES, SUPPLIER_CATEGORY_OPTIONS, type SupplierItem, type SupplierManageState } from '~/schemas/master.schema';
import { MasterService, handleSupplierAction } from '~/services/master.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['supplier:read'] };
export const meta = createMeta({ title: 'Master Supplier — Kinau ID', description: 'Kelola supplier material.' });

export const loader = withMiddleware([withTelemetry('loader:master.supplier'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<SupplierManageState>(request, { search: '', category: 'all', status: 'all', page: 1 });
    return successResponse(await MasterService.getSuppliers(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:master.supplier' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleSupplierAction(args);

export default createPage<InferLoader<typeof loader>, any, SupplierManageState>((ctx) => {
  const { data, urlState, updateUrlState, send } = ctx;
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({ title: 'Master Supplier', subtitle: 'Daftar mitra penyedia kain & material.', badges: [{ label: `${data?.totalCount ?? 0} Supplier`, variant: 'outline' }], actions: [Button({ label: 'Tambah Supplier', icon: 'Plus', variant: 'primary', size: 'sm', onClick: () => modals.open('CREATE_SUPPLIER_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) })] }),
    StatsGrid([{ label: 'Total Supplier', value: data?.totalCount, icon: 'Truck', color: 'cyan' }, { label: 'Supplier Aktif', value: data?.suppliers?.filter((s: SupplierItem) => s.status === 'active').length, icon: 'CheckCircle2', color: 'green' }, { label: 'Kategori Material', value: '4 Kategori', icon: 'Package', color: 'purple' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), filters: [Select({ name: 'category', value: urlState.category ?? 'all', onChange: (e) => updateUrlState({ category: e.target.value }), options: SUPPLIER_CATEGORY_OPTIONS, className: 'w-48' })], showReset: Boolean(urlState.search || (urlState.category && urlState.category !== 'all')), onReset: () => updateUrlState({ search: '', category: 'all' }) }),
    Table<SupplierItem>({ data: data?.suppliers ?? [], keyField: 'id', columns: [TextColumn({ key: 'name', header: 'Nama Supplier', className: 'font-bold' }), TextColumn({ key: 'category', header: 'Kategori' }), TextColumn({ key: 'contact_person', header: 'PIC Kontak' }), TextColumn({ key: 'phone', header: 'No. Telepon' }), BadgeColumn({ key: 'status', map: SUPPLIER_STATUS_BADGES }), TableActions<SupplierItem>([{ icon: 'Trash2', variant: 'danger', onClick: (s) => ConfirmDialog.delete({ name: s.name, onConfirm: () => post('delete-supplier', s.id || '') }) }])] })
  );
}, { defaultState: { search: '', category: 'all', status: 'all', page: 1 } });
