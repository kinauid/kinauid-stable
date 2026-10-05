import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type ErrorLogState } from '~/schemas/system.schema';
import { SystemService, handleSystemAction } from '~/services/system.service';
import { renderErrorLogsFeature } from '~/components/feature/SystemLogWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager'], permissions: ['system:read'] };
export const meta = createMeta({ title: 'Error Telemetry & Logs — Kinau ID', description: 'Monitoring live exception dan error server/client.' });

export const loader = withMiddleware([withTelemetry('loader:app.system.error-logs'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return SystemService.getErrorLogs(extractUrlState<ErrorLogState>(request, { tab: 'all', search: '', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleSystemAction(args);

export default createPage<InferLoader<typeof loader>, any, ErrorLogState>(
  ({ data, urlState, updateUrlState, send, isLoading, isNavigating }) =>
    renderErrorLogsFeature({ data, urlState, updateUrlState, send, isLoading, isNavigating }),
  { defaultState: { tab: 'all', search: '', page: 1 } }
);
