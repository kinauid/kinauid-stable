import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Table, BadgeColumn, TextColumn, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { ORDER_STATUS_BADGES, PAYMENT_STATUS_BADGES, type OrderItem, type OrderState } from '~/schemas/order.schema';
import { OrderService, handleOrderAction } from '~/services/order.service';

export const metaAccess: MetaAccessConfig = { roles: ['customer', 'admin', 'staff'], permissions: ['order:read'] };
export const meta = createMeta({ title: 'Status Pesanan Saya — Kinau ID', description: 'Lacak tahapan produksi dan rincian pesanan apparel Anda.' });

export const loader = withMiddleware([withTelemetry('loader:customer.orders'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<OrderState>(request, { search: '', page: 1 });
    return successResponse(await OrderService.getOrders(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:customer.orders' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleOrderAction(args);

export default createPage<InferLoader<typeof loader>, any, OrderState>((ctx) => {
  const { data, urlState, updateUrlState, navigate } = ctx;

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Status & Pelacakan Pesanan', subtitle: 'Pantau secara transparan tahapan desain, sublimasi, jahit, hingga pengiriman.',
      badges: [{ label: `${data?.orders?.length ?? 0} Pesanan Aktif`, variant: 'primary' }],
      actions: [Button({ label: 'Buat Desain Jersey', icon: 'Sparkles', variant: 'primary', size: 'sm', onClick: () => navigate('/customer/configure') })],
    }),
    StatsGrid([{ label: 'Pesanan Diproses', value: data?.activePipelines, icon: 'Clock', color: 'amber' }, { label: 'Siap Dikirim', value: data?.orders?.filter((o: any) => o.status === 'ready_to_ship').length, icon: 'Truck', color: 'cyan' }, { label: 'Pesanan Selesai', value: data?.orders?.filter((o: any) => o.status === 'completed').length, icon: 'CheckCircle2', color: 'green' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), showReset: Boolean(urlState.search), onReset: () => updateUrlState({ search: '' }) }),
    Table<OrderItem>({ data: data?.orders ?? [], keyField: 'id', columns: [TextColumn({ key: 'order_number', header: 'Nomor Order', className: 'font-mono font-bold text-xs' }), TextColumn({ key: 'product_name', header: 'Item & Kuantitas', accessor: (o) => `${o.product_name} • ${o.total_qty} pcs` }), TextColumn({ key: 'deadline_at', header: 'Target Selesai', accessor: (o) => o.deadline_at || 'Menyesuaikan antrean' }), BadgeColumn({ key: 'status', map: ORDER_STATUS_BADGES }), BadgeColumn({ key: 'payment_status', map: PAYMENT_STATUS_BADGES })] })
  );
}, { defaultState: { search: '', page: 1 } });
