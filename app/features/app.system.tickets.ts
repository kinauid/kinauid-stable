import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type TicketState } from '~/schemas/system.schema';
import { SystemService, handleSystemAction } from '~/services/system.service';
import { renderTicketsFeature } from '~/components/feature/TicketWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager', 'staff'], permissions: ['ticket:read'] };
export const meta = createMeta({ title: 'Tiket Aduan & Kendala — Kinau ID', description: 'Pelacakan tiket aduan dan kendala teknis sistem.' });

export const loader = withMiddleware([withTelemetry('loader:app.system.tickets'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return SystemService.getTickets(extractUrlState<TicketState>(request, { tab: 'all', category: 'all', priority: 'all', search: '', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleSystemAction(args);

export default createPage<InferLoader<typeof loader>, any, TicketState>(
  ({ data, urlState, updateUrlState, send, isLoading, isNavigating }) =>
    renderTicketsFeature({ data, urlState, updateUrlState, send, isLoading, isNavigating }),
  { defaultState: { tab: 'all', category: 'all', priority: 'all', search: '', page: 1 } }
);
