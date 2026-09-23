import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, PageHeader, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { OrderConfiguratorWidget } from '~/components/feature';
import { handleOrderAction } from '~/services/order.service';

export const metaAccess: MetaAccessConfig = { roles: ['customer', 'admin', 'staff', 'editor', 'viewer'] };
export const meta = createMeta({ title: 'Studio Desain Jersey Custom — Kinau ID', description: 'Kustomisasi motif, pola kain, warna gradasi, dan nameset secara visual.' });

export const loader = withMiddleware([withTelemetry('loader:customer.configure'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async () => {
  try {
    return successResponse({ ready: true });
  } catch (error) {
    ErrorCatch({ error, context: 'loader:customer.configure' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleOrderAction(args);

export default createPage<InferLoader<typeof loader>>((ctx) => {
  const { isSubmitting } = ctx;

  return Div({ className: 'space-y-6 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Studio Konfigurator Jersey Pro', subtitle: 'Pilih motif grafis, material kain dryfit, perpaduan warna pantone, dan personalisasi nameset.',
      badges: [{ label: 'Visual 2D / 3D Live Engine', variant: 'primary' }, { label: 'Min. Order 12 Pcs', variant: 'outline' }],
    }),
    OrderConfiguratorWidget({ isSubmitting })
  );
});
