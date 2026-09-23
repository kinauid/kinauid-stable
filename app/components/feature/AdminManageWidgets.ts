import { createElement } from 'react';
import {
  UI,
  Badge,
  ConfirmDialog,
  type DataTableCardColumn,
  type TableTabItem,
  type ActiveFilterItem,
} from '~/builder';
import {
  ROLE_BADGES,
  STATUS_BADGES,
  type AdminUserItem,
  type AdminManageState,
} from '~/schemas/admin.schema';

export const ADMIN_TABS: TableTabItem[] = [
  { key: 'all', label: 'Semua Pengguna' },
  { key: 'admin', label: 'Administrator', icon: 'ShieldCheck' },
  { key: 'editor', label: 'Operator & Staff', icon: 'UserCheck' },
  { key: 'viewer', label: 'Viewer & Tamu', icon: 'Eye' },
];

export function getActiveAdminFilterBadges(
  urlState: AdminManageState,
  updateUrlState: (state: Partial<AdminManageState>) => void
): ActiveFilterItem[] {
  const badges: ActiveFilterItem[] = [];

  if (urlState.role && urlState.role !== 'all') {
    badges.push({
      key: 'role',
      label: `Role: ${urlState.role.toUpperCase()}`,
      value: urlState.role,
      onRemove: () => updateUrlState({ role: 'all' }),
    });
  }

  if (urlState.status && urlState.status !== 'all') {
    badges.push({
      key: 'status',
      label: `Status: ${urlState.status.toUpperCase()}`,
      value: urlState.status,
      onRemove: () => updateUrlState({ status: 'all' }),
    });
  }

  return badges;
}

export function createAdminTableColumns(
  send: { submit: (data: any, opts: any) => void },
  canDelete = true
): DataTableCardColumn<AdminUserItem>[] {
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });

  return [
    {
      id: 'no',
      name: 'NO',
      width: '60px',
      center: true,
      cell: (_row, idx) =>
        createElement('span', { className: 'text-xs font-mono text-slate-400 font-semibold' }, (idx ?? 0) + 1),
    },
    {
      id: 'user',
      name: 'PROFIL PENGGUNA',
      minWidth: '240px',
      grow: 2,
      cell: (row) => {
        const initials = row.name
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'US';

        return createElement(
          'div',
          { className: 'flex items-center gap-3 py-1 min-w-0' },
          createElement(
            'div',
            {
              className:
                'w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center font-bold text-xs text-[#103557] shrink-0 shadow-2xs',
            },
            initials
          ),
          createElement(
            'div',
            { className: 'min-w-0' },
            createElement('div', { className: 'text-xs font-bold text-slate-900 truncate leading-tight' }, row.name),
            createElement('div', { className: 'text-[11px] text-slate-500 font-mono truncate' }, row.email)
          )
        );
      },
    },
    {
      id: 'role',
      name: 'HAK AKSES / ROLE',
      width: '150px',
      cell: (row) => {
        const conf = ROLE_BADGES[row.role] || { label: row.role, variant: 'secondary' };
        return Badge({
          label: conf.label,
          variant: conf.variant,
          size: 'sm',
          dot: true,
        });
      },
    },
    {
      id: 'status',
      name: 'STATUS AKUN',
      width: '140px',
      cell: (row) => {
        const conf = STATUS_BADGES[row.status] || { label: row.status, variant: 'secondary' };
        return Badge({
          label: conf.label,
          variant: conf.variant,
          size: 'sm',
        });
      },
    },
    {
      id: 'lastActive',
      name: 'AKTIVITAS TERAKHIR',
      width: '160px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'flex items-center gap-1.5 text-xs text-slate-600 font-medium' },
          UI.Icon('Clock', { size: 13, className: 'text-slate-400 shrink-0' }),
          createElement('span', null, row.lastActive || 'Baru saja')
        ),
    },
    {
      id: 'createdAt',
      name: 'TERDAFTAR',
      width: '130px',
      cell: (row) =>
        createElement('span', { className: 'text-xs text-slate-500 font-mono' }, row.createdAt || '2026-01-01'),
    },
    {
      id: 'actions',
      name: 'AKSI',
      width: '100px',
      right: true,
      cell: (row) =>
        createElement(
          'div',
          { className: 'flex items-center justify-end gap-1.5' },
          createElement(
            'button',
            {
              type: 'button',
              title: row.status === 'active' ? 'Bekukan Akun (Freeze)' : 'Aktifkan Akun',
              onClick: () => post('toggle-status', row.id),
              className: `p-1.5 rounded-lg border transition-colors cursor-pointer ${
                row.status === 'active'
                  ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              }`,
            },
            UI.Icon(row.status === 'active' ? 'Lock' : 'Unlock', { size: 14 })
          ),
          canDelete
            ? createElement(
                'button',
                {
                  type: 'button',
                  title: 'Hapus Akun Pengguna',
                  onClick: () =>
                    ConfirmDialog.delete({
                      name: row.name,
                      onConfirm: () => post('delete-user', row.id),
                    }),
                  className:
                    'p-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer',
                },
                UI.Icon('Trash2', { size: 14 })
              )
            : null
        ),
    },
  ];
}

export function renderAdminMobileCard(
  row: AdminUserItem,
  idx: number,
  send: { submit: (data: any, opts: any) => void },
  canDelete = true
) {
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });
  const roleConf = ROLE_BADGES[row.role] || { label: row.role, variant: 'secondary' };
  const statusConf = STATUS_BADGES[row.status] || { label: row.status, variant: 'secondary' };

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
        { className: 'flex items-center gap-2.5' },
        createElement(
          'span',
          { className: 'text-xs font-mono font-bold text-slate-400' },
          `#${idx + 1}`
        ),
        Badge({ label: roleConf.label, variant: roleConf.variant, size: 'sm', dot: true })
      ),
      Badge({ label: statusConf.label, variant: statusConf.variant, size: 'sm' })
    ),
    createElement(
      'div',
      { className: 'space-y-0.5' },
      createElement('h4', { className: 'text-sm font-bold text-slate-900 leading-tight' }, row.name),
      createElement('p', { className: 'text-xs text-slate-500 font-mono' }, row.email)
    ),
    createElement(
      'div',
      { className: 'flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100' },
      createElement('span', null, `Aktif: ${row.lastActive}`),
      createElement(
        'div',
        { className: 'flex items-center gap-1.5' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => post('toggle-status', row.id),
            className:
              'px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 text-xs font-semibold cursor-pointer',
          },
          row.status === 'active' ? 'Freeze' : 'Aktifkan'
        ),
        canDelete
          ? createElement(
              'button',
              {
                type: 'button',
                onClick: () =>
                  ConfirmDialog.delete({
                    name: row.name,
                    onConfirm: () => post('delete-user', row.id),
                  }),
                className:
                  'px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 text-xs font-semibold cursor-pointer',
              },
              'Hapus'
            )
          : null
      )
    )
  );
}
