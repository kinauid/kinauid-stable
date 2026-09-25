import { createElement } from 'react';
import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, ClientOnly, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { OfficeService, handleOfficeAction } from '~/services/office.service';
import { VirtualOffice3D } from '~/components/feature/VirtualOffice3D';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager', 'staff', 'customer', 'editor', 'viewer'] };
export const meta = createMeta({ title: 'Meet your team — 3D Virtual Office | Kinau ID', description: 'Simulasi denah kantor virtual 3D Isometric real-time dengan status kerja tim dan workstation.' });

export const loader = withMiddleware([withTelemetry('loader:office.overview'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async () => {
  return OfficeService.getOfficeData();
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleOfficeAction(args);

export default createPage<InferLoader<typeof loader>>(({ data, send }) =>
  Div({ className: 'max-w-7xl mx-auto py-2' },
    ClientOnly(() =>
      createElement(VirtualOffice3D, {
        agents: data?.agents ?? [],
        zones: data?.zones ?? [],
        onUpdateStatus: (agentId, status) => send.submit({ intent: 'update-agent-status', agentId, status }, { method: 'post' }),
        onAssignTask: (agentId, task, project) => send.submit({ intent: 'assign-agent-task', agentId, task, project: project || '' }, { method: 'post' }),
        onPingAgent: (agentId) => send.submit({ intent: 'ping-agent', agentId }, { method: 'post' }),
      })
    )
  )
);
