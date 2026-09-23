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
  STATUS_CODE_BADGES,
  type ErrorLogItem,
  type ErrorLogState,
} from '~/schemas/system.schema';

export const ERROR_LOG_TABS: TableTabItem[] = [
  { key: 'all', label: 'Semua Log' },
  { key: 'unresolved', label: 'Belum Selesai', icon: 'AlertTriangle' },
  { key: '500', label: '500 Server Error', icon: 'ServerCrash' },
  { key: '4xx', label: '4xx Client Error', icon: 'AlertCircle' },
  { key: 'resolved', label: 'Resolved (Selesai)', icon: 'CheckCircle2' },
];

export function getActiveErrorLogFilterBadges(
  urlState: ErrorLogState,
  updateUrlState: (state: Partial<ErrorLogState>) => void
): ActiveFilterItem[] {
  const badges: ActiveFilterItem[] = [];

  if (urlState.tab && urlState.tab !== 'all') {
    badges.push({
      key: 'tab',
      label: `Filter: ${urlState.tab.toUpperCase()}`,
      value: urlState.tab,
      onRemove: () => updateUrlState({ tab: 'all' }),
    });
  }

  return badges;
}

export function createErrorLogTableColumns(
  send: { submit: (data: any, opts: any) => void },
  onOpenDetail?: (log: ErrorLogItem) => void
): DataTableCardColumn<ErrorLogItem>[] {
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });

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
      id: 'status',
      name: 'STATUS',
      width: '150px',
      cell: (row) => {
        const conf = STATUS_CODE_BADGES[row.statusCode] || {
          label: `${row.statusCode} Error`,
          variant: 'danger',
        };
        return createElement(
          'div',
          { className: 'flex items-center gap-1.5' },
          Badge({ label: conf.label, variant: conf.variant, dot: true })
        );
      },
    },
    {
      id: 'endpoint',
      name: 'ENDPOINT & METHOD',
      minWidth: '220px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'space-y-0.5 py-1 min-w-0' },
          createElement(
            'div',
            { className: 'flex items-center gap-2' },
            createElement(
              'span',
              {
                className: `text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  row.method === 'POST'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : row.method === 'DELETE'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`,
              },
              row.method
            ),
            createElement(
              'span',
              { className: 'text-xs font-mono font-bold text-slate-800 truncate' },
              row.endpoint
            )
          ),
          createElement(
            'div',
            { className: 'text-[10px] text-slate-400 font-mono truncate' },
            row.url
          )
        ),
    },
    {
      id: 'message',
      name: 'PESAN ERROR & EXCEPTION',
      grow: 2,
      minWidth: '280px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'space-y-1 py-1 min-w-0' },
          createElement(
            'p',
            { className: 'text-xs font-semibold text-rose-700 leading-snug line-clamp-2 font-mono' },
            row.errorMessage
          ),
          row.stackTrace
            ? createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => onOpenDetail?.(row),
                  className:
                    'inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition cursor-pointer',
                },
                UI.Icon('FileCode', { size: 12 }),
                'Lihat Stack Trace'
              )
            : null
        ),
    },
    {
      id: 'actor',
      name: 'AKTOR & IP',
      width: '160px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'space-y-0.5 leading-tight' },
          createElement('div', { className: 'text-xs font-medium text-slate-800 truncate' }, row.user),
          createElement(
            'div',
            { className: 'text-[10px] text-slate-400 font-mono flex items-center gap-1' },
            UI.Icon('Globe', { size: 10 }),
            row.ip
          )
        ),
    },
    {
      id: 'timestamp',
      name: 'WAKTU & LATENCY',
      width: '150px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'space-y-0.5 leading-tight' },
          createElement('div', { className: 'text-xs text-slate-700 font-mono' }, row.timestamp),
          createElement(
            'span',
            { className: 'text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold' },
            `⚡ ${row.latency}`
          )
        ),
    },
    {
      id: 'actions',
      name: 'RESOLVE',
      width: '110px',
      right: true,
      cell: (row) =>
        createElement(
          'div',
          { className: 'flex items-center justify-end gap-1.5' },
          createElement(
            'button',
            {
              type: 'button',
              title: row.resolved ? 'Tandai Belum Selesai' : 'Tandai Selesai (Resolve)',
              onClick: () => post('resolve-error-log', row.id),
              className: `px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                row.resolved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
              }`,
            },
            UI.Icon(row.resolved ? 'CheckCircle2' : 'Check', { size: 13 }),
            row.resolved ? 'Solved' : 'Resolve'
          )
        ),
    },
  ];
}

export function renderErrorLogMobileCard(
  row: ErrorLogItem,
  idx: number,
  send: { submit: (data: any, opts: any) => void },
  onOpenDetail?: (log: ErrorLogItem) => void
) {
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });
  const conf = STATUS_CODE_BADGES[row.statusCode] || { label: `${row.statusCode}`, variant: 'danger' };

  return createElement(
    'div',
    {
      key: row.id,
      className:
        'p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 font-sans select-none',
    },
    createElement(
      'div',
      { className: 'flex items-center justify-between' },
      createElement(
        'div',
        { className: 'flex items-center gap-2' },
        createElement('span', { className: 'text-xs font-mono font-bold text-slate-400' }, `#${idx + 1}`),
        Badge({ label: conf.label, variant: conf.variant, dot: true })
      ),
      createElement(
        'span',
        { className: 'text-[10px] font-mono text-slate-500 font-semibold' },
        `⚡ ${row.latency}`
      )
    ),
    createElement(
      'div',
      { className: 'space-y-1' },
      createElement(
        'div',
        { className: 'flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 truncate' },
        createElement('span', { className: 'text-blue-600' }, row.method),
        createElement('span', null, row.endpoint)
      ),
      createElement('p', { className: 'text-xs text-rose-700 font-mono font-semibold' }, row.errorMessage)
    ),
    createElement(
      'div',
      { className: 'flex items-center justify-between pt-2 border-t border-slate-100 text-xs' },
      createElement('span', { className: 'text-[11px] text-slate-500 font-mono' }, row.timestamp),
      createElement(
        'div',
        { className: 'flex items-center gap-2' },
        row.stackTrace
          ? createElement(
              'button',
              {
                type: 'button',
                onClick: () => onOpenDetail?.(row),
                className: 'px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700 cursor-pointer',
              },
              'Trace'
            )
          : null,
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => post('resolve-error-log', row.id),
            className: `px-2 py-1 rounded text-xs font-bold cursor-pointer ${
              row.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`,
          },
          row.resolved ? 'Solved' : 'Resolve'
        )
      )
    )
  );
}

export function ErrorLogDetailModal({
  log,
  onClose,
}: {
  log: ErrorLogItem | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && log.stackTrace) {
      navigator.clipboard.writeText(log.stackTrace);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return Modal(
    {
      open: Boolean(log),
      onClose,
      title: `Detail Error Log [${log.statusCode}] ${log.endpoint}`,
      description: `Waktu kejadian: ${log.timestamp} • Aktor: ${log.user} (${log.ip})`,
      size: 'lg',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-1 font-sans' },
      // Summary Details Grid
      createElement(
        'div',
        { className: 'grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs' },
        createElement('div', null, createElement('span', { className: 'text-slate-400 block text-[10px]' }, 'Method & Status'), createElement('span', { className: 'font-bold text-slate-800 font-mono' }, `${log.method} • ${log.statusCode}`)),
        createElement('div', null, createElement('span', { className: 'text-slate-400 block text-[10px]' }, 'Latency'), createElement('span', { className: 'font-bold text-slate-800 font-mono' }, log.latency)),
        createElement('div', null, createElement('span', { className: 'text-slate-400 block text-[10px]' }, 'Environment'), createElement('span', { className: 'font-bold text-emerald-700 capitalize' }, log.environment)),
        createElement('div', null, createElement('span', { className: 'text-slate-400 block text-[10px]' }, 'Status Resolve'), createElement('span', { className: `font-bold ${log.resolved ? 'text-emerald-700' : 'text-rose-700'}` }, log.resolved ? 'Resolved' : 'Unresolved'))
      ),

      // Target URL
      createElement(
        'div',
        { className: 'space-y-1' },
        createElement('label', { className: 'text-xs font-bold text-slate-700 block' }, 'Full Target Route & Query Parameters:'),
        createElement('div', { className: 'p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800 break-all select-all' }, log.url)
      ),

      // Stack Trace Terminal Box (Vercel Style)
      createElement(
        'div',
        { className: 'space-y-1' },
        createElement(
          'div',
          { className: 'flex items-center justify-between' },
          createElement('label', { className: 'text-xs font-bold text-slate-700' }, 'Server Exception Stack Trace:'),
          createElement(
            'button',
            {
              type: 'button',
              onClick: handleCopy,
              className: 'text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer',
            },
            UI.Icon(copied ? 'Check' : 'Copy', { size: 13 }),
            copied ? 'Tersalin ke Clipboard!' : 'Salin Stack Trace'
          )
        ),
        createElement(
          'pre',
          {
            className:
              'p-4 rounded-xl bg-[#0F172A] text-[#F8FAFC] text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed scrollbar-thin select-all border border-slate-800',
          },
          log.stackTrace || log.errorMessage
        )
      ),

      // Footer
      createElement(
        'div',
        { className: 'flex justify-end pt-2 border-t border-slate-100' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className: 'px-4 py-2 bg-[#103557] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer',
          },
          'Tutup'
        )
      )
    )
  );
}
