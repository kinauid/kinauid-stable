import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, DataTableCard, modals, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type AdminUserItem, type AdminManageState } from '~/schemas/admin.schema';
import { AdminService, handleAdminAction } from '~/services/admin.service';
import { ADMIN_TABS, getActiveAdminFilterBadges, createAdminTableColumns, renderAdminMobileCard } from '~/components/feature/AdminManageWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'editor'], permissions: ['user:read'], redirectTo: '/login' };
export const meta = createMeta({ title: 'Manajemen Staf & Pengguna - Kinau Studio' });

export const loader = withMiddleware([withTelemetry('loader:app.user'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request, user }) => {
  return AdminService.getUsers(extractUrlState<AdminManageState>(request, { search: '', role: 'all', status: 'all', simulatedRole: 'admin', page: 1, isCreateModalOpen: false }), user);
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleAdminAction(args);

export default createPage<InferLoader<typeof loader>, any, AdminManageState>(
  ({ data, urlState, updateUrlState, send, can, isLoading, isNavigating }) => Div(
    { className: 'w-full space-y-4 max-w-7xl mx-auto pb-10' },
    DataTableCard<AdminUserItem>({
      title: 'Manajemen Staf & Pengguna',
      subtitle: 'Pengaturan otorisasi, penambahan staf workshop, dan kontrol hak akses peran.',
      totalItems: data?.filteredCount ?? 0,
      isLoading: isLoading || isNavigating,
      stats: [
        { label: 'Total Staf & User', value: `${data?.totalCount ?? 0} Akun`, icon: 'Users', color: 'blue', trend: 'Terverifikasi' },
        { label: 'Hak Akses Anda', value: can('user:delete') ? 'Super Admin' : 'Staff Operasional', icon: 'ShieldAlert', color: 'amber', trend: 'RBAC Active' },
        { label: 'Status Keamanan', value: 'Terproteksi', icon: 'ShieldCheck', color: 'green', trend: 'Active' },
      ],
      tabs: ADMIN_TABS, activeTab: urlState.role || 'all', onTabChange: (tab) => updateUrlState({ role: tab as any }),
      searchValue: urlState.search, onSearchChange: (search) => updateUrlState({ search }),
      mainActions: [{ action: 'add', label: 'Tambah Pengguna Baru', disabled: !can('user:create'), onClick: () => modals.open('CREATE_USER_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) }],
      activeFilterCount: getActiveAdminFilterBadges(urlState, updateUrlState).length,
      activeFilters: getActiveAdminFilterBadges(urlState, updateUrlState),
      onResetFilters: () => updateUrlState({ search: '', role: 'all', status: 'all' }),
      columns: createAdminTableColumns(send, can('user:delete')), data: data?.users ?? [],
      renderMobileCard: (row, idx) => renderAdminMobileCard(row, idx, send, can('user:delete')),
    })
  ),
  { defaultState: { search: '', role: 'all', status: 'all', simulatedRole: 'admin', page: 1, isCreateModalOpen: false } }
);
