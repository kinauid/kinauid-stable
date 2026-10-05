import type { ActionFunctionArgs } from 'react-router';
import { createElement } from 'react';
import { createPage, createMeta, Div, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type OrderManageState } from '~/schemas/order.schema';
import { OrderService, handleOrderAction } from '~/services/order.service';
import { renderDesktopOrderManage } from '~/components/feature/OrderListWidgets';
import { MobileOrderDetail } from '~/components/mobile';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['order:manage'] };
export const meta = createMeta({ title: 'Detail & Pipeline Produksi — Kinau ID', description: 'Monitoring antrean dan status pengerjaan pesanan apparel.' });

export const loader = withMiddleware([withTelemetry('loader:order.manage'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  const state = extractUrlState<OrderManageState>(request, { id: '', search: '', status: 'all', category: 'all', page: 1 });
  return OrderService.getOrderManageData(state);
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleOrderAction(args);

export default createPage<InferLoader<typeof loader>, any, OrderManageState>(({ data, urlState, updateUrlState, send, navigate }) => Div(
  { className: 'w-full max-w-6xl mx-auto select-none space-y-5' },
  Div(
    { className: 'block md:hidden' },
    data?.selectedOrder
      ? createElement(MobileOrderDetail, { order: data.selectedOrder, onBack: () => navigate('/app/order-list'), send, navigate })
      : Div({ className: 'p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-500 text-xs font-semibold' }, 'Pesanan tidak ditemukan.')
  ),
  renderDesktopOrderManage({ data, urlState, updateUrlState, send, navigate })
), { defaultState: { id: '', search: '', status: 'all', category: 'all', page: 1 } });

