import type { ActionFunctionArgs } from 'react-router';
import { useState, createElement } from 'react';
import { createPage, createMeta, Div, DataTableCard, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type ErrorLogItem, type ErrorLogState } from '~/schemas/system.schema';
import { SystemService, handleSystemAction } from '~/services/system.service';
import { ERROR_LOG_TABS, getActiveErrorLogFilterBadges, createErrorLogTableColumns, renderErrorLogMobileCard, ErrorLogDetailModal } from '~/components/feature/SystemLogWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager'], permissions: ['system:read'] };
export const meta = createMeta({ title: 'Error Telemetry & Logs — Kinau ID', description: 'Monitoring live exception dan error server/client.' });

export const loader = withMiddleware([withTelemetry('loader:app.system.error-logs'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return SystemService.getErrorLogs(extractUrlState<ErrorLogState>(request, { tab: 'all', search: '', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleSystemAction(args);

export default createPage<InferLoader<typeof loader>, any, ErrorLogState>(
  ({ data, urlState, updateUrlState, send, isLoading, isNavigating }) => {
    const [activeDetail, setActiveDetail] = useState<ErrorLogItem | null>(null);
    return Div({ className: 'w-full space-y-4' },
      DataTableCard<ErrorLogItem>({
        title: 'Error Telemetry & System Logs',
        subtitle: 'Pemantauan crash, exception HTTP 500/4xx, dan stack trace error real-time.',
        totalItems: data?.filteredCount ?? 0,
        isLoading: isLoading || isNavigating,
        stats: [
          { label: 'Belum Selesai (Unresolved)', value: `${data?.unresolvedCount ?? 0} Error`, icon: 'AlertTriangle', color: 'rose', description: `${data?.total500 ?? 0} insiden status 500 Server Error`, trend: `${data?.unresolvedCount ?? 0} butuh penanganan` },
          { label: '500 Internal Server Error', value: `${data?.total500 ?? 0} Insiden`, icon: 'ServerCrash', color: 'amber', description: 'Exception fatal database / pool timeout / syntax', trend: 'Prioritas Perbaikan' },
          { label: 'Total Error Selesai', value: `${data?.resolvedCount ?? 0} Resolved`, icon: 'CheckCircle2', color: 'green', description: `${Math.round(((data?.resolvedCount ?? 0) / Math.max(1, data?.totalCount ?? 1)) * 100)}% tingkat penyelesaian`, trend: `${data?.totalCount ?? 0} total log tercatat` },
        ],
        banner: { title: 'Vercel-Style Error Diagnostics & Telemetry', description: 'Klik tombol Trace pada setiap baris untuk melihat dan menyalin stack trace error.', icon: 'ShieldAlert' },
        tabs: ERROR_LOG_TABS, activeTab: urlState.tab, onTabChange: (tab) => updateUrlState({ tab: tab as any }),
        searchValue: urlState.search, onSearchChange: (search) => updateUrlState({ search }),
        activeFilterCount: getActiveErrorLogFilterBadges(urlState, updateUrlState).length,
        activeFilters: getActiveErrorLogFilterBadges(urlState, updateUrlState),
        onResetFilters: () => updateUrlState({ search: '', tab: 'all' }),
        columns: createErrorLogTableColumns(send, (log) => setActiveDetail(log)), data: data?.logs ?? [],
        renderMobileCard: (log, idx) => renderErrorLogMobileCard(log, idx, send, (l) => setActiveDetail(l)),
      }),
      createElement(ErrorLogDetailModal, { log: activeDetail, onClose: () => setActiveDetail(null) })
    );
  },
  { defaultState: { tab: 'all', search: '', page: 1 } }
);
