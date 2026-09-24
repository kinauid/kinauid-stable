import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { OrderFormService, handleOrderFormAction } from '~/services/order-form.service';
import { OrderFormWidget } from '~/components/feature/OrderFormWidgets';

export const metaAccess: MetaAccessConfig = {
  roles: ['admin', 'staff', 'manager'],
  permissions: ['order:create'],
  redirectTo: '/login',
};

export const meta = createMeta({
  title: 'Input Pesanan Produksi — Kinau ID',
  description: 'Formulir input pesanan baru, kalkulasi harga grosir & varian, serta sinkronisasi folder drive.',
});

export const loader = withMiddleware(
  [withTelemetry('loader:app.order-form'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })],
  async () => OrderFormService.getInitialData()
);
(loader as any).metaAccess = metaAccess;

export const action = (args: ActionFunctionArgs) => handleOrderFormAction(args);

export default createPage<InferLoader<typeof loader>>(
  (ctx) => Div({ className: 'w-full max-w-6xl mx-auto space-y-6' }, OrderFormWidget(ctx))
);
