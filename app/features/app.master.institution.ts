import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Select, Table, ConfirmDialog, modals, BadgeColumn, TextColumn, TableActions, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { INSTITUTION_TYPE_BADGES, INSTITUTION_TYPE_OPTIONS, type InstitutionItem, type InstitutionManageState } from '~/schemas/master.schema';
import { MasterService, handleInstitutionAction } from '~/services/master.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['institution:read'] };
export const meta = createMeta({ title: 'Master Institusi & Klien — Kinau ID', description: 'Kelola data kampus, sekolah & korporat.' });

export const loader = withMiddleware([withTelemetry('loader:master.institution'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<InstitutionManageState>(request, { search: '', type: 'all', page: 1 });
    return successResponse(await MasterService.getInstitutions(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:master.institution' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleInstitutionAction(args);

export default createPage<InferLoader<typeof loader>, any, InstitutionManageState>((ctx) => {
  const { data, urlState, updateUrlState, send } = ctx;
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Master Institusi & Klien', subtitle: 'Direktori universitas, sekolah, dan organisasi mitra.',
      badges: [{ label: `${data?.totalCount ?? 0} Institusi`, variant: 'outline' }],
      actions: [Button({ label: 'Tambah Institusi', icon: 'Building2', variant: 'primary', size: 'sm', onClick: () => modals.open('CREATE_INSTITUTION_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) })],
    }),
    StatsGrid([{ label: 'Total Mitra', value: data?.totalCount, icon: 'GraduationCap', color: 'cyan' }, { label: 'Universitas / PT', value: data?.institutions?.filter((i: InstitutionItem) => i.type === 'Universitas').length, icon: 'Building', color: 'green' }, { label: 'Korporat / Bisnis', value: data?.institutions?.filter((i: InstitutionItem) => i.type === 'Korporat').length, icon: 'Briefcase', color: 'purple' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), filters: [Select({ name: 'type', value: urlState.type ?? 'all', onChange: (e) => updateUrlState({ type: e.target.value }), options: INSTITUTION_TYPE_OPTIONS, className: 'w-48' })], showReset: Boolean(urlState.search || (urlState.type && urlState.type !== 'all')), onReset: () => updateUrlState({ search: '', type: 'all' }) }),
    Table<InstitutionItem>({ data: data?.institutions ?? [], keyField: 'id', columns: [TextColumn({ key: 'name', header: 'Nama Institusi', className: 'font-bold' }), BadgeColumn({ key: 'type', map: INSTITUTION_TYPE_BADGES }), TextColumn({ key: 'city', header: 'Kota / Lokasi' }), TextColumn({ key: 'contact_person', header: 'PIC' }), TextColumn({ key: 'discount_rate', header: 'Diskon (%)' }), TableActions<InstitutionItem>([{ icon: 'Trash2', variant: 'danger', onClick: (i) => ConfirmDialog.delete({ name: i.name, onConfirm: () => post('delete-institution', i.id || '') }) }])] })
  );
}, { defaultState: { search: '', type: 'all', page: 1 } });
