import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, DataTableCard, modals, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type AdminUserItem, type AdminManageState } from '~/schemas/admin.schema';
import { AdminService, handleAdminAction } from '~/services/admin.service';
import { ADMIN_TABS, getActiveAdminFilterBadges, createAdminTableColumns, renderAdminMobileCard } from '~/components/feature/AdminManageWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'editor'], permissions: ['user:read'], redirectTo: '/login' };
export const meta = createMeta({ title: 'Manajemen Akun Pengguna — RBAC Protected', description: 'Kelola pengguna, staf operasional, dan hak akses peran.' });

export const loader = withMiddleware([withTelemetry('loader:dashboard.admin.manage'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request, user }) => {
  return AdminService.getUsers(extractUrlState<AdminManageState>(request, { search: '', role: 'all', status: 'all', simulatedRole: 'admin', page: 1, isCreateModalOpen: false }), user);
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleAdminAction(args);

export default createPage<InferLoader<typeof loader>, any, AdminManageState>(
  ({ data, urlState, updateUrlState, send, can, isLoading, isNavigating }) => Div(
    { className: 'w-full space-y-4' },
    DataTableCard<AdminUserItem>({
      title: 'Manajemen Akun Pengguna & Staf (RBAC)',
      subtitle: 'Pengaturan otorisasi, penambahan staf workshop, pembekuan akun, dan simulasi role permission.',
      totalItems: data?.filteredCount ?? 0,
      isLoading: isLoading || isNavigating,
      stats: [
        { label: 'Total Pengguna', value: `${data?.totalCount ?? 0} Akun`, icon: 'Users', color: 'blue', description: `${data?.users?.filter((u: AdminUserItem) => u.status === 'active').length ?? 0} akun berstatus aktif`, trend: `${data?.totalCount ?? 0} terdaftar` },
        { label: 'Akses Otorisasi Anda', value: can('user:delete') ? 'Super Admin' : can('user:update') ? 'Editor / Staff' : 'Viewer', icon: 'ShieldAlert', color: 'amber', description: can('user:delete') ? 'Akses penuh seluruh modul & kontrol sistem' : 'Akses terbatas operasional', trend: 'RBAC Enforced' },
        { label: 'Status Clean Core', value: 'Ready (v2.4)', icon: 'Zap', color: 'green', description: 'Sinkronisasi PostgreSQL & Zero-Logic Architecture', trend: 'Terproteksi TLS 1.3' },
      ],
      banner: { title: 'Sistem Otorisasi & Akses Berjenjang (RBAC)', description: 'Perubahan role dan status akun akan langsung berlaku pada sesi aktif berikutnya.', icon: 'ShieldCheck' },
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
