import { createElement } from 'react';
import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, PageHeader, ClientOnly, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { CustomizerService, handleCustomizerAction } from '~/services/customizer.service';
import { TShirtCustomizerWidget } from '~/components/feature/TShirtCustomizerWidget';

export const metaAccess: MetaAccessConfig = { roles: ['customer', 'admin', 'staff', 'editor', 'viewer'] };
export const meta = createMeta({ title: 'Studio Desain Kaos 3D Live — Kinau ID', description: 'Kustomisasi pola warna, nameset, dan logo pada model kaos 3D interaktif.' });

export const loader = withMiddleware([withTelemetry('loader:design.customizer'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async () => {
  return CustomizerService.getCustomizerData();
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleCustomizerAction(args);

export default createPage<InferLoader<typeof loader>>(({ data, send, isSubmitting }) =>
  Div({ className: 'space-y-6 max-w-7xl mx-auto' },
    PageHeader({
      title: 'Studio Kustom Kaos & Jersey 3D',
      subtitle: 'Sesuaikan pola warna, nomor punggung, dan sponsor secara langsung pada simulasi 3D 360°.',
      badges: [{ label: 'WebGL 3D Realtime', variant: 'primary' }, { label: 'Sublimasi HD', variant: 'outline' }],
    }),
    ClientOnly(() =>
      createElement(TShirtCustomizerWidget, {
        initialConfig: data?.initialConfig,
        isSubmitting,
        onSave: (cfg) => send.submit({ intent: 'save-design', config: JSON.stringify(cfg) }, { method: 'post' }),
        onOrder: (cfg) => send.submit({ intent: 'order-custom-design', config: JSON.stringify(cfg) }, { method: 'post' }),
      })
    )
  )
);

