import { createElement, useState } from 'react';
import {
  UI,
  Badge,
  Modal,
  type DataTableCardColumn,
  type TableTabItem,
  type ActiveFilterItem,
} from '~/builder';
import {
  TICKET_STATUS_BADGES,
  TICKET_PRIORITY_BADGES,
  TICKET_CATEGORY_LABELS,
  type TicketItem,
  type TicketState,
} from '~/schemas/system.schema';
import { ADMIN_WA, getWhatsAppLink } from '~/constants/brand';

export const TICKET_TABS: TableTabItem[] = [
  { key: 'all', label: 'Semua Tiket' },
  { key: 'open', label: 'Open (Baru)', icon: 'Inbox' },
  { key: 'in_progress', label: 'Sedang Ditangani', icon: 'Clock' },
  { key: 'resolved', label: 'Selesai', icon: 'CheckCircle' },
  { key: 'closed', label: 'Ditutup', icon: 'Archive' },
];

export function getActiveTicketFilterBadges(
  urlState: TicketState,
  updateUrlState: (state: Partial<TicketState>) => void
): ActiveFilterItem[] {
  const badges: ActiveFilterItem[] = [];

  if (urlState.tab && urlState.tab !== 'all') {
    badges.push({
      key: 'tab',
      label: `Status: ${urlState.tab.toUpperCase()}`,
      value: urlState.tab,
      onRemove: () => updateUrlState({ tab: 'all' }),
    });
  }

  if (urlState.category && urlState.category !== 'all') {
    badges.push({
      key: 'category',
      label: `Kategori: ${urlState.category}`,
      value: urlState.category,
      onRemove: () => updateUrlState({ category: 'all' }),
    });
  }

  return badges;
}

export function createTicketTableColumns(
  send: { submit: (data: any, opts: any) => void },
  onOpenDetail?: (ticket: TicketItem) => void
): DataTableCardColumn<TicketItem>[] {
  const post = (intent: string, payload: any) => send.submit({ intent, ...payload }, { method: 'post' });

  return [
    {
      id: 'no',
      name: 'NO',
      width: '50px',
      center: true,
      cell: (_row, idx) =>
        createElement('span', { className: 'text-xs font-mono text-slate-400 font-semibold' }, (idx ?? 0) + 1),
    },
    {
      id: 'ticket',
      name: 'NOMOR & ADUAN',
      minWidth: '260px',
      grow: 2,
      cell: (row) =>
        createElement(
          'div',
          { className: 'space-y-1 py-1 min-w-0' },
          createElement(
            'div',
            { className: 'flex items-center gap-2 flex-wrap' },
            createElement(
              'span',
              { className: 'px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs font-bold' },
              row.ticketNumber
            ),
            createElement(
              'span',
              { className: 'text-[11px] font-semibold text-slate-500' },
              TICKET_CATEGORY_LABELS[row.category] || row.category
            )
          ),
          createElement(
            'h4',
            { className: 'text-xs font-bold text-slate-900 leading-snug line-clamp-1' },
            row.title
          ),
          createElement(
            'p',
            { className: 'text-[11px] text-slate-500 line-clamp-1' },
            row.description
          )
        ),
    },
    {
      id: 'targetRoute',
      name: 'RUTE HALAMAN TERKAIT',
      width: '180px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'space-y-1 min-w-0' },
          createElement(
            'span',
            {
              title: row.targetRoute,
              className:
                'inline-block max-w-[170px] truncate text-[10px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md',
            },
            row.targetRoute || '/'
          ),
          row.appVersion &&
            createElement(
              'div',
              { className: 'flex items-center gap-1 text-[9px] font-mono text-slate-500 font-medium' },
              createElement('span', { className: 'w-1.5 h-1.5 rounded-full bg-emerald-500' }),
              `Build: ${row.appVersion}`
            )
        ),
    },
    {
      id: 'reporter',
      name: 'PELAPOR / PIC',
      width: '180px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'space-y-0.5 leading-tight' },
          createElement('div', { className: 'text-xs font-bold text-slate-800 truncate' }, row.reporterName),
          createElement('div', { className: 'text-[10px] text-slate-500 font-mono truncate' }, row.reporterEmail),
          row.reporterPhone
            ? createElement(
                'a',
                {
                  href: getWhatsAppLink(row.reporterPhone, `Halo ${row.reporterName}, terkait tiket aduan ${row.ticketNumber}...`),
                  target: '_blank',
                  rel: 'noreferrer',
                  className: 'text-[10px] text-emerald-600 hover:underline font-medium inline-flex items-center gap-1',
                },
                UI.Icon('MessageCircle', { size: 10 }),
                row.reporterPhone
              )
            : null
        ),
    },
    {
      id: 'priority',
      name: 'PRIORITAS',
      width: '120px',
      cell: (row) => {
        const conf = TICKET_PRIORITY_BADGES[row.priority] || { label: row.priority, variant: 'secondary' };
        return Badge({ label: conf.label, variant: conf.variant, size: 'sm', dot: true });
      },
    },
    {
      id: 'status',
      name: 'STATUS TIKET',
      width: '140px',
      cell: (row) => {
        const conf = TICKET_STATUS_BADGES[row.status] || { label: row.status, variant: 'secondary' };
        return Badge({ label: conf.label, variant: conf.variant, size: 'sm' });
      },
    },
    {
      id: 'actions',
      name: 'AKSI',
      width: '130px',
      right: true,
      cell: (row) =>
        createElement(
          'div',
          { className: 'flex items-center justify-end gap-1.5' },
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => onOpenDetail?.(row),
              title: 'Lihat Detail Tiket',
              className: 'p-1.5 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer',
            },
            UI.Icon('Eye', { size: 14 })
          ),
          createElement(
            'select',
            {
              value: row.status,
              onChange: (e: any) => post('update-ticket-status', { id: row.id, status: e.target.value }),
              className:
                'text-[10px] font-bold p-1 bg-white border border-slate-200 rounded-lg focus:border-[#103557] cursor-pointer outline-hidden',
            },
            createElement('option', { value: 'open' }, 'Open'),
            createElement('option', { value: 'in_progress' }, 'Proses'),
            createElement('option', { value: 'resolved' }, 'Solved'),
            createElement('option', { value: 'closed' }, 'Closed')
          )
        ),
    },
  ];
}

export function renderTicketMobileCard(
  row: TicketItem,
  idx: number,
  send: { submit: (data: any, opts: any) => void },
  onOpenDetail?: (ticket: TicketItem) => void
) {
  const post = (intent: string, payload: any) => send.submit({ intent, ...payload }, { method: 'post' });
  const statusConf = TICKET_STATUS_BADGES[row.status] || { label: row.status, variant: 'secondary' };
  const priorityConf = TICKET_PRIORITY_BADGES[row.priority] || { label: row.priority, variant: 'secondary' };

  return createElement(
    'div',
    {
      key: row.id,
      className: 'p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 font-sans select-none',
    },
    createElement(
      'div',
      { className: 'flex items-center justify-between' },
      createElement(
        'div',
        { className: 'flex items-center gap-2' },
        createElement('span', { className: 'text-xs font-mono font-bold text-slate-400' }, `#${idx + 1}`),
        createElement('span', { className: 'px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold' }, row.ticketNumber),
        Badge({ label: priorityConf.label, variant: priorityConf.variant, size: 'sm', dot: true })
      ),
      Badge({ label: statusConf.label, variant: statusConf.variant, size: 'sm' })
    ),
    createElement(
      'div',
      { className: 'space-y-1' },
      createElement('h4', { className: 'text-sm font-bold text-slate-900 leading-snug' }, row.title),
      createElement('p', { className: 'text-xs text-slate-600 line-clamp-2' }, row.description)
    ),
    createElement(
      'div',
      { className: 'flex items-center justify-between pt-2 border-t border-slate-100 text-xs' },
      createElement('span', { className: 'text-[11px] text-slate-500 font-mono truncate max-w-[150px]' }, row.targetRoute),
      createElement(
        'div',
        { className: 'flex items-center gap-1.5' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => onOpenDetail?.(row),
            className: 'px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 cursor-pointer',
          },
          'Detail'
        ),
        createElement(
          'select',
          {
            value: row.status,
            onChange: (e: any) => post('update-ticket-status', { id: row.id, status: e.target.value }),
            className: 'text-xs font-bold p-1 bg-white border border-slate-200 rounded-lg',
          },
          createElement('option', { value: 'open' }, 'Open'),
          createElement('option', { value: 'in_progress' }, 'Proses'),
          createElement('option', { value: 'resolved' }, 'Solved')
        )
      )
    )
  );
}

export function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: TicketItem | null;
  onClose: () => void;
}) {
  if (!ticket) return null;

  return Modal(
    {
      open: Boolean(ticket),
      onClose,
      title: `Detail Tiket Aduan #${ticket.ticketNumber}`,
      description: `Dilaporkan oleh: ${ticket.reporterName} • ${ticket.createdAt}`,
      size: 'md',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-1 font-sans text-xs' },
      createElement(
        'div',
        { className: 'grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl' },
        createElement('div', null, createElement('span', { className: 'text-slate-400 text-[10px] block' }, 'Kategori'), createElement('span', { className: 'font-bold text-slate-800' }, TICKET_CATEGORY_LABELS[ticket.category] || ticket.category)),
        createElement('div', null, createElement('span', { className: 'text-slate-400 text-[10px] block' }, 'Prioritas'), createElement('span', { className: 'font-bold text-slate-800' }, ticket.priority.toUpperCase())),
        createElement('div', null, createElement('span', { className: 'text-slate-400 text-[10px] block' }, 'Status'), createElement('span', { className: 'font-bold text-blue-700' }, ticket.status.toUpperCase())),
        createElement('div', null, createElement('span', { className: 'text-slate-400 text-[10px] block' }, 'PIC Pelapor'), createElement('span', { className: 'font-bold text-slate-800' }, `${ticket.reporterName} (${ticket.reporterEmail})`))
      ),
      createElement(
        'div',
        { className: 'space-y-1' },
        createElement('label', { className: 'font-bold text-slate-700 block' }, 'Subjek Aduan:'),
        createElement('div', { className: 'p-2.5 bg-slate-100 rounded-xl font-bold text-slate-900' }, ticket.title)
      ),
      createElement(
        'div',
        { className: 'space-y-1' },
        createElement('label', { className: 'font-bold text-slate-700 block' }, 'Deskripsi Lengkap:'),
        createElement('div', { className: 'p-3 bg-white border border-slate-200 rounded-xl leading-relaxed text-slate-700 whitespace-pre-wrap' }, ticket.description)
      ),
      createElement(
        'div',
        { className: 'space-y-1' },
        createElement(
          'div',
          { className: 'flex items-center justify-between' },
          createElement('label', { className: 'font-bold text-slate-700 block' }, 'Rute Halaman Target:'),
          ticket.appVersion &&
            createElement(
              'span',
              { className: 'text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md' },
              `App Build: ${ticket.appVersion}`
            )
        ),
        createElement('div', { className: 'p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 break-all select-all' }, ticket.targetRoute)
      ),
      createElement(
        'div',
        { className: 'flex justify-end pt-2 border-t border-slate-100' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className: 'px-4 py-2 bg-[#103557] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer',
          },
          'Tutup'
        )
      )
    )
  );
}
