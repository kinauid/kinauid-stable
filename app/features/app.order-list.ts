import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, DataTableCard, modals, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type OrderItem, type OrderState } from '~/schemas/order.schema';
import { OrderService, handleOrderAction } from '~/services/order.service';
import { ORDER_TABS, getActiveFilterBadges, createOrderTableColumns, renderOrderMobileCard } from '~/components/feature/OrderListWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff', 'manager'], permissions: ['order:read'] };
export const meta = createMeta({ title: 'Daftar Pesanan Produksi — Kinau ID', description: 'Monitoring alur produksi dan antrean cetak jersey/apparel.' });

export const loader = withMiddleware([withTelemetry('loader:app.order-list'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return OrderService.getOrders(extractUrlState<OrderState>(request, { tab: 'reguler', search: '', status: 'all', category: 'all', payment_status: 'all', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleOrderAction(args);

export default createPage<InferLoader<typeof loader>, any, OrderState>(
  ({ data, urlState, updateUrlState, send, navigate, isLoading, isNavigating }) => Div(
    { className: 'w-full space-y-4' },
    DataTableCard<OrderItem>({
      title: 'Manajemen Daftar Pesanan',
      subtitle: 'Monitoring alur produksi jersey sublim, ID card, dan sablon konveksi.',
      totalItems: data?.filteredCount ?? 0,
      isLoading: isLoading || isNavigating,
      stats: [
        { label: 'Pesanan Berjalan', value: `${data?.activePipelines ?? 0} Aktif`, icon: 'Clock', color: 'amber', description: `${data?.completedCount ?? 0} pesanan selesai (${Math.round(((data?.completedCount ?? 0) / Math.max(1, data?.totalCount ?? 1)) * 100)}%)`, trend: `${data?.activePipelines ?? 0} dari ${data?.totalCount ?? 0} pesanan` },
        { label: 'Siap Kirim / Ambil', value: `${data?.readyToShipCount ?? 0} Pesanan`, icon: 'Truck', color: 'cyan', description: `${data?.printedCount ?? 0} tercetak · ${data?.unprintedCount ?? 0} antrean cetak`, trend: `${data?.readyToShipCount ?? 0} siap kirim` },
        { label: 'Total Omset Pesanan', value: `Rp ${(data?.totalRevenue || 0).toLocaleString('id-ID')}`, icon: 'Banknote', color: 'green', description: `Rata-rata Rp ${(Math.round((data?.totalRevenue || 0) / Math.max(1, data?.totalCount || 1))).toLocaleString('id-ID')} / pesanan`, trend: `${data?.totalCount ?? 0} transaksi tercatat` },
      ],
      banner: { title: 'Monitoring Alur Produksi & Drive', description: 'Pastikan file artwork telah diverifikasi sebelum mengubah status ke Siap Cetak.', icon: 'ShieldCheck' },
      tabs: ORDER_TABS, activeTab: urlState.tab, onTabChange: (tab) => updateUrlState({ tab: tab as any }),
      searchValue: urlState.search, onSearchChange: (search) => updateUrlState({ search }),
      mainActions: [{ action: 'add', label: 'Order Baru', onClick: () => modals.open('CREATE_ORDER_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) }],
      activeFilterCount: getActiveFilterBadges(urlState, updateUrlState).length,
      activeFilters: getActiveFilterBadges(urlState, updateUrlState),
      onFilterClick: () => modals.open('ORDER_FILTER_MODAL', { filters: urlState, viewMode: urlState.tab, onApply: (f: any) => updateUrlState(f), onReset: () => updateUrlState({ year: '', status: 'all', payment_status: 'all', order_type: 'all', category: 'all', kkn_institution: '' }) }),
      onResetFilters: () => updateUrlState({ search: '', year: '', status: 'all', category: 'all', order_type: 'all', payment_status: 'all', kkn_institution: '' }),
      columns: createOrderTableColumns(send, navigate), data: data?.orders ?? [],
      renderMobileCard: (order, idx) => renderOrderMobileCard(order, idx, send, navigate),
    })
  ),
  { defaultState: { tab: 'reguler', search: '', status: 'all', category: 'all', payment_status: 'all', page: 1 } }
);
