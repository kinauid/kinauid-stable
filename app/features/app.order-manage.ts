import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Select, Table, modals, BadgeColumn, TextColumn, TableActions, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { ORDER_STATUS_BADGES, PAYMENT_STATUS_BADGES, ORDER_STATUS_OPTIONS, PRODUCT_CATEGORY_OPTIONS, type OrderItem, type OrderState } from '~/schemas/order.schema';
import { OrderService, handleOrderAction } from '~/services/order.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['order:manage'] };
export const meta = createMeta({ title: 'Pipeline Produksi — Kinau ID', description: 'Monitoring antrean dan status pengerjaan pesanan apparel.' });

export const loader = withMiddleware([withTelemetry('loader:order.manage'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<OrderState>(request, { search: '', status: 'all', category: 'all', page: 1 });
    return successResponse(await OrderService.getOrders(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:order.manage' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleOrderAction(args);

export default createPage<InferLoader<typeof loader>, any, OrderState>((ctx) => {
  const { data, urlState, updateUrlState, send } = ctx;

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Pipeline Antrean Produksi', subtitle: 'Monitoring progres pengerjaan pesanan & status pembagian kerja.',
      badges: [{ label: `${data?.activePipelines ?? 0} Order Aktif`, variant: 'primary' }],
      actions: [Button({ label: 'Input Pesanan', icon: 'Plus', variant: 'primary', size: 'sm', onClick: () => modals.open('CREATE_ORDER_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) })],
    }),
    StatsGrid([{ label: 'Total Antrean Order', value: data?.totalCount, icon: 'Layers', color: 'cyan' }, { label: 'Sedang Dikerjakan', value: data?.activePipelines, icon: 'Flame', color: 'amber' }, { label: 'Total Nilai Pesanan', value: `Rp ${(data?.totalRevenue || 0).toLocaleString('id-ID')}`, icon: 'Coins', color: 'green' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), filters: [Select({ name: 'status', value: urlState.status ?? 'all', onChange: (e) => updateUrlState({ status: e.target.value }), options: ORDER_STATUS_OPTIONS, className: 'w-48' }), Select({ name: 'category', value: urlState.category ?? 'all', onChange: (e) => updateUrlState({ category: e.target.value }), options: PRODUCT_CATEGORY_OPTIONS, className: 'w-44' })], showReset: Boolean(urlState.search || (urlState.status && urlState.status !== 'all') || (urlState.category && urlState.category !== 'all')), onReset: () => updateUrlState({ search: '', status: 'all', category: 'all' }) }),
    Table<OrderItem>({ data: data?.orders ?? [], keyField: 'id', columns: [TextColumn({ key: 'order_number', header: 'No. Order', className: 'font-mono font-bold text-xs' }), TextColumn({ key: 'customer_name', header: 'Pemesan & Institusi', accessor: (o) => `${o.customer_name}${o.institution_name ? ` (${o.institution_name})` : ''}` }), TextColumn({ key: 'product_name', header: 'Produk & Qty', accessor: (o) => `${o.product_name} • ${o.total_qty} pcs` }), TextColumn({ key: 'deadline_at', header: 'Deadline', accessor: (o) => o.deadline_at || '—' }), BadgeColumn({ key: 'status', map: ORDER_STATUS_BADGES }), BadgeColumn({ key: 'payment_status', map: PAYMENT_STATUS_BADGES }), TableActions<OrderItem>([{ icon: 'ArrowRightCircle', variant: 'primary', label: 'Ubah Status', onClick: (o) => modals.open('UPDATE_ORDER_STATUS_MODAL', { orderId: o.id, currentStatus: o.status, onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) }])] })
  );
}, { defaultState: { search: '', status: 'all', category: 'all', page: 1 } });
