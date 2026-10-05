import type { ActionFunctionArgs } from 'react-router';
import { createElement } from 'react';
import { createPage, createMeta, Div, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { OverviewService } from '~/services/overview.service';
import { handleFinanceAction } from '~/services/finance.service';
import { renderDesktopDashboard } from '~/components/feature/DashboardWidgets';
import { MobileDashboardOverviewWidget } from '~/components/mobile';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager', 'staff', 'finance'], permissions: ['finance:read'] };
export const meta = createMeta({ title: 'Performa Perusahaan — Kinau ID Workshop', description: 'Monitoring alur produksi dan antrean cetak jersey/apparel.' });

export const loader = withMiddleware([withTelemetry('loader:dashboard'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async () => {
  try {
    return successResponse(await OverviewService.getOverviewSummary());
  } catch (error) {
    ErrorCatch({ error, context: 'loader:dashboard' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleFinanceAction(args);

export default createPage<InferLoader<typeof loader>>(({ data, user }) => Div(
  { className: 'w-full max-w-7xl mx-auto select-none' },
  Div({ className: 'block md:hidden' }, createElement(MobileDashboardOverviewWidget, { data, user })),
  renderDesktopDashboard(data)
));
