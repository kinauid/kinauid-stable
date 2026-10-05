import type { ActionFunctionArgs } from 'react-router';
import { createElement } from 'react';
import { createPage, createMeta, Div, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type OrderState } from '~/schemas/order.schema';
import { OrderService, handleOrderAction } from '~/services/order.service';
import { renderDesktopOrderListTable } from '~/components/feature/OrderListWidgets';
import { MobileOrderList } from '~/components/mobile';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff', 'manager'], permissions: ['order:read'] };
export const meta = createMeta({ title: 'Daftar Pesanan Produksi — Kinau ID', description: 'Monitoring alur produksi dan antrean cetak jersey/apparel.' });

export const loader = withMiddleware([withTelemetry('loader:app.order-list'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return OrderService.getOrders(extractUrlState<OrderState>(request, { tab: 'reguler', search: '', status: 'all', category: 'all', payment_status: 'all', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleOrderAction(args);

export default createPage<InferLoader<typeof loader>, any, OrderState>(
  ({ data, urlState, updateUrlState, send, navigate, isLoading, isNavigating }) => Div(
    { className: 'w-full space-y-4 select-none' },
    Div({ className: 'block md:hidden' }, createElement(MobileOrderList, { data, urlState, updateUrlState, send, navigate, isLoading, isNavigating })),
    Div({ className: 'hidden md:block' }, renderDesktopOrderListTable({ data, urlState, updateUrlState, send, navigate, isLoading, isNavigating }))
  ),
  { defaultState: { tab: 'reguler', search: '', status: 'all', category: 'all', payment_status: 'all', page: 1 } }
);
