import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Select, Table, modals, TextColumn, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { ACCOUNT_TYPE_OPTIONS, type AccountItem, type AccountState } from '~/schemas/finance.schema';
import { FinanceService, handleFinanceAction } from '~/services/finance.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'finance'], permissions: ['finance:read'] };
export const meta = createMeta({ title: 'Kas & Rekening Bank — Kinau ID', description: 'Manajemen buku kas, rekening perbankan, dan struktur Chart of Accounts.' });

export const loader = withMiddleware([withTelemetry('loader:finance.account'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<AccountState>(request, { search: '', type: 'all', page: 1 });
    return successResponse(await FinanceService.getAccounts(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:finance.account' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleFinanceAction(args);

export default createPage<InferLoader<typeof loader>, any, AccountState>((ctx) => {
  const { data, urlState, updateUrlState, send } = ctx;

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Buku Kas & Rekening Bank', subtitle: 'Manajemen saldo likuid workshop, rekening perbankan usaha, dan klasifikasi COA.',
      badges: [{ label: `${data?.totalCount ?? 0} Akun Terdaftar`, variant: 'outline' }],
      actions: [Button({ label: 'Tambah Akun', icon: 'Plus', variant: 'primary', size: 'sm', onClick: () => modals.open('CREATE_ACCOUNT_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) })],
    }),
    StatsGrid([{ label: 'Total Saldo Likuid Kas/Bank', value: `Rp ${(data?.totalLiquidAssets || 0).toLocaleString('id-ID')}`, icon: 'Landmark', color: 'green' }, { label: 'Rekening Bank Aktif', value: `${data?.accounts?.filter((a: any) => a.is_bank).length ?? 0} Rekening`, icon: 'CreditCard', color: 'blue' }, { label: 'Buku Kas Workshop', value: '1 Kas Fisik', icon: 'Coins', color: 'amber' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), filters: [Select({ name: 'type', value: urlState.type ?? 'all', onChange: (e) => updateUrlState({ type: e.target.value }), options: ACCOUNT_TYPE_OPTIONS, className: 'w-48' })], showReset: Boolean(urlState.search || (urlState.type && urlState.type !== 'all')), onReset: () => updateUrlState({ search: '', type: 'all' }) }),
    Table<AccountItem>({ data: data?.accounts ?? [], keyField: 'id', columns: [TextColumn({ key: 'code', header: 'Kode Akun', className: 'font-mono font-bold text-xs' }), TextColumn({ key: 'name', header: 'Nama Akun / Buku Kas', className: 'font-bold' }), TextColumn({ key: 'account_number', header: 'Informasi Rekening', accessor: (a) => a.is_bank ? `${a.account_number} • ${a.account_holder}` : 'Kas Tunai Kasir' }), TextColumn({ key: 'type', header: 'Tipe', accessor: (a) => a.type.toUpperCase(), className: 'text-xs uppercase font-mono' }), TextColumn({ key: 'balance', header: 'Saldo Terkini', accessor: (a) => `Rp ${a.balance.toLocaleString('id-ID')}`, className: 'font-mono font-bold' })] })
  );
}, { defaultState: { search: '', type: 'all', page: 1 } });
