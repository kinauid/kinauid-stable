import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, DataTableCard, modals, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type OrderItem, type OrderState } from '~/schemas/order.schema';
import { OrderService, handleOrderAction } from '~/services/order.service';
import { getActiveHistoryFilterBadges, createOrderHistoryTableColumns, renderOrderHistoryMobileCard } from '~/components/feature/OrderHistoryWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff', 'manager'], permissions: ['order:read'] };
export const meta = createMeta({ title: 'Riwayat Pesanan & Portofolio — Kinau ID', description: 'Kelola arsip pesanan selesai, ulasan pelanggan, dan portofolio showcase.' });

export const loader = withMiddleware([withTelemetry('loader:app.order-history'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return OrderService.getOrderHistory(extractUrlState<OrderState>(request, { search: '', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleOrderAction(args);

export default createPage<InferLoader<typeof loader>, any, OrderState>(
  ({ data, urlState, updateUrlState, send, navigate, isLoading, isNavigating }) => Div(
    { className: 'w-full space-y-4' },
    DataTableCard<OrderItem>({
      title: 'Riwayat Pesanan & Arsip',
      subtitle: 'Kelola arsip pesanan yang telah selesai, ulasan kepuasan, dan tayangan portofolio landing page.',
      totalItems: data?.filteredCount ?? 0,
      isLoading: isLoading || isNavigating,
      stats: [
        { label: 'Total Arsip Selesai', value: `${data?.totalCount ?? 0} Pesanan`, icon: 'Archive', color: 'blue', description: `${data?.showcaseCount ?? 0} tampil di portofolio landing page`, trend: `${data?.totalCount ?? 0} arsip terekam` },
        { label: 'Portofolio Showcase', value: `${data?.showcaseCount ?? 0} Ditampilkan`, icon: 'Sparkles', color: 'green', description: `${data?.reviewedCount ?? 0} pesanan memiliki ulasan bintang`, trend: `${Math.round(((data?.showcaseCount ?? 0) / Math.max(1, data?.totalCount ?? 1)) * 100)}% showcase rate` },
        { label: 'Total Nilai Omset Arsip', value: `Rp ${(data?.totalRevenue || 0).toLocaleString('id-ID')}`, icon: 'Banknote', color: 'cyan', description: 'Akumulasi nilai pesanan yang telah tuntas & settle', trend: `${data?.totalCount ?? 0} transaksi tuntas` },
      ],
      banner: { title: 'Galeri Portofolio & Ulasan Publik', description: 'Aktifkan toggle "Tampil di Web" untuk mempublikasikan foto hasil produksi dan testimoni pelanggan ke landing page utama.', icon: 'Sparkles' },
      searchValue: urlState.search, onSearchChange: (search) => updateUrlState({ search }),
      mainActions: [{ action: 'add', label: 'Tambah Arsip Lama', onClick: () => modals.open('ADD_ARCHIVE_MODAL', { onSubmit: (v: any) => send.submit({ intent: 'create-archive', ...v }, { method: 'post' }) }) }],
      activeFilterCount: getActiveHistoryFilterBadges(urlState, updateUrlState).length,
      activeFilters: getActiveHistoryFilterBadges(urlState, updateUrlState),
      onResetFilters: () => updateUrlState({ search: '' }),
      columns: createOrderHistoryTableColumns(send, navigate), data: data?.orders ?? [],
      renderMobileCard: (order, idx) => renderOrderHistoryMobileCard(order, idx, send, navigate),
    })
  ),
  { defaultState: { search: '', page: 1 } }
);
