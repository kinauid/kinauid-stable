import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Select, Table, ConfirmDialog, modals, BadgeColumn, TextColumn, TableActions, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { TRANSACTION_TYPE_BADGES, TRANSACTION_CATEGORY_OPTIONS, type TransactionItem, type FinanceState } from '~/schemas/finance.schema';
import { FinanceService, handleFinanceAction } from '~/services/finance.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'finance'], permissions: ['finance:read'] };
export const meta = createMeta({ title: 'Arus Kas & Transaksi — Kinau ID', description: 'Monitoring mutasi kas, pemasukan omset, dan pengeluaran operasional.' });

export const loader = withMiddleware([withTelemetry('loader:finance.cashflow'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<FinanceState>(request, { search: '', type: 'all', category: 'all', page: 1 });
    return successResponse(await FinanceService.getTransactions(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:finance.cashflow' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleFinanceAction(args);

export default createPage<InferLoader<typeof loader>, any, FinanceState>((ctx) => {
  const { data, urlState, updateUrlState, send } = ctx;
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Arus Kas & Buku Transaksi', subtitle: 'Pencatatan real-time arus kas masuk, pengadaan bahan, dan beban operasional.',
      badges: [{ label: `${data?.totalCount ?? 0} Transaksi`, variant: 'outline' }],
      actions: [Button({ label: 'Catat Transaksi', icon: 'Plus', variant: 'primary', size: 'sm', onClick: () => modals.open('CREATE_TRANSACTION_MODAL', { onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) })],
    }),
    StatsGrid([{ label: 'Total Pemasukan', value: `Rp ${(data?.totalIncome || 0).toLocaleString('id-ID')}`, icon: 'ArrowDownLeft', color: 'green' }, { label: 'Total Pengeluaran', value: `Rp ${(data?.totalExpense || 0).toLocaleString('id-ID')}`, icon: 'ArrowUpRight', color: 'red' }, { label: 'Arus Kas Bersih', value: `Rp ${(data?.netCashflow || 0).toLocaleString('id-ID')}`, icon: 'Wallet', color: 'cyan' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), filters: [Select({ name: 'type', value: urlState.type ?? 'all', onChange: (e) => updateUrlState({ type: e.target.value }), options: [{ value: 'all', label: 'Semua Jenis Mutasi' }, { value: 'income', label: 'Pemasukan (+)' }, { value: 'expense', label: 'Pengeluaran (-)' }], className: 'w-44' }), Select({ name: 'category', value: urlState.category ?? 'all', onChange: (e) => updateUrlState({ category: e.target.value }), options: TRANSACTION_CATEGORY_OPTIONS, className: 'w-48' })], showReset: Boolean(urlState.search || (urlState.type && urlState.type !== 'all') || (urlState.category && urlState.category !== 'all')), onReset: () => updateUrlState({ search: '', type: 'all', category: 'all' }) }),
    Table<TransactionItem>({ data: data?.transactions ?? [], keyField: 'id', columns: [TextColumn({ key: 'journal_code', header: 'No. Jurnal', className: 'font-mono font-bold text-xs' }), TextColumn({ key: 'date', header: 'Tanggal' }), TextColumn({ key: 'description', header: 'Uraian Transaksi' }), TextColumn({ key: 'account_name', header: 'Buku Kas / Bank' }), BadgeColumn({ key: 'type', map: TRANSACTION_TYPE_BADGES }), TextColumn({ key: 'amount', header: 'Nominal', accessor: (t) => `${t.type === 'income' ? '+' : '-'} Rp ${t.amount.toLocaleString('id-ID')}`, className: 'font-bold' }), TableActions<TransactionItem>([{ icon: 'Trash2', variant: 'danger', onClick: (t) => ConfirmDialog.delete({ name: `Jurnal ${t.journal_code}`, onConfirm: () => post('delete-transaction', t.id || '') }) }])] })
  );
}, { defaultState: { search: '', type: 'all', category: 'all', page: 1 } });
