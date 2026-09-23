import type { ActionFunctionArgs } from 'react-router';
import { useState, createElement } from 'react';
import { createPage, createMeta, Div, DataTableCard, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type TicketItem, type TicketState } from '~/schemas/system.schema';
import { SystemService, handleSystemAction } from '~/services/system.service';
import { TICKET_TABS, getActiveTicketFilterBadges, createTicketTableColumns, renderTicketMobileCard, TicketDetailModal } from '~/components/feature/TicketWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager', 'staff'], permissions: ['ticket:read'] };
export const meta = createMeta({ title: 'Tiket Aduan & Kendala — Kinau ID', description: 'Pelacakan tiket aduan dan kendala teknis sistem.' });

export const loader = withMiddleware([withTelemetry('loader:app.system.tickets'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return SystemService.getTickets(extractUrlState<TicketState>(request, { tab: 'all', category: 'all', priority: 'all', search: '', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleSystemAction(args);

export default createPage<InferLoader<typeof loader>, any, TicketState>(
  ({ data, urlState, updateUrlState, send, isLoading, isNavigating }) => {
    const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null);
    return Div({ className: 'w-full space-y-4' },
      DataTableCard<TicketItem>({
        title: 'Tiket Aduan & Bug Report',
        subtitle: 'Daftar aduan pengguna, pelacakan rute kendala, dan resolusi tiket operasional.',
        totalItems: data?.filteredCount ?? 0,
        isLoading: isLoading || isNavigating,
        stats: [
          { label: 'Tiket Terbuka (Open)', value: `${data?.openCount ?? 0} Tiket`, icon: 'Inbox', color: 'amber', description: 'Aduan baru butuh eskalasi PIC', trend: `${data?.openCount ?? 0} butuh penanganan` },
          { label: 'Sedang Dikerjakan', value: `${data?.inProgressCount ?? 0} Tiket`, icon: 'Clock', color: 'cyan', description: 'Dalam investigasi tim teknis', trend: 'In Progress' },
          { label: 'Tiket Selesai (Resolved)', value: `${data?.resolvedCount ?? 0} Tiket`, icon: 'CheckCircle', color: 'green', description: `${Math.round(((data?.resolvedCount ?? 0) / Math.max(1, data?.totalCount ?? 1)) * 100)}% tingkat resolusi tiket`, trend: `${data?.totalCount ?? 0} total tiket tercatat` },
        ],
        banner: { title: 'Pusat Eskalasi Aduan & Bug Tracking', description: 'Gunakan tombol floating di kanan bawah untuk merekam tiket dengan live detection rute URL otomatis.', icon: 'LifeBuoy' },
        tabs: TICKET_TABS, activeTab: urlState.tab, onTabChange: (tab) => updateUrlState({ tab: tab as any }),
        searchValue: urlState.search, onSearchChange: (search) => updateUrlState({ search }),
        activeFilterCount: getActiveTicketFilterBadges(urlState, updateUrlState).length,
        activeFilters: getActiveTicketFilterBadges(urlState, updateUrlState),
        onResetFilters: () => updateUrlState({ search: '', tab: 'all', category: 'all', priority: 'all' }),
        columns: createTicketTableColumns(send, (t) => setActiveTicket(t)), data: data?.tickets ?? [],
        renderMobileCard: (t, idx) => renderTicketMobileCard(t, idx, send, (item) => setActiveTicket(item)),
      }),
      createElement(TicketDetailModal, { ticket: activeTicket, onClose: () => setActiveTicket(null) })
    );
  },
  { defaultState: { tab: 'all', category: 'all', priority: 'all', search: '', page: 1 } }
);
