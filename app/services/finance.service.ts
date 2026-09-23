import type { ActionFunctionArgs } from 'react-router';
import {
  TransactionSchema,
  AccountSchema,
  type TransactionItem,
  type AccountItem,
  type FinanceState,
  type AccountState,
} from '~/schemas/finance.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';

let ACCOUNTS_DB: AccountItem[] = [
  {
    id: 'acc-1',
    code: '1-101',
    name: 'Kas Tunai Workshop',
    type: 'asset',
    balance: 14500000,
    is_bank: false,
  },
  {
    id: 'acc-2',
    code: '1-102',
    name: 'BCA Bisnis (Utama)',
    type: 'asset',
    balance: 85200000,
    is_bank: true,
    account_number: '7410293841',
    account_holder: 'PT KINAU APPAREL INDONESIA',
  },
  {
    id: 'acc-3',
    code: '1-103',
    name: 'Mandiri Operasional',
    type: 'asset',
    balance: 32450000,
    is_bank: true,
    account_number: '137001928374',
    account_holder: 'PT KINAU APPAREL INDONESIA',
  },
  {
    id: 'acc-4',
    code: '4-101',
    name: 'Pendapatan Penjualan Jersey',
    type: 'income',
    balance: 154800000,
    is_bank: false,
  },
  {
    id: 'acc-5',
    code: '5-101',
    name: 'Beban Pokok Kain & Sublim',
    type: 'expense',
    balance: 68500000,
    is_bank: false,
  },
];

let TRANSACTIONS_DB: TransactionItem[] = [
  {
    id: 'trx-1',
    journal_code: 'JRN-2026-001',
    type: 'income',
    category: 'Penjualan Jersey',
    amount: 6000000,
    account_id: 'acc-2',
    account_name: 'BCA Bisnis (Utama)',
    date: '2026-09-18',
    description: 'Pelunasan Order KNU-2026-091 (Bank Mandiri Runners)',
    status: 'posted',
  },
  {
    id: 'trx-2',
    journal_code: 'JRN-2026-002',
    type: 'expense',
    category: 'Bahan Baku & Kain',
    amount: 4750000,
    account_id: 'acc-2',
    account_name: 'BCA Bisnis (Utama)',
    date: '2026-09-19',
    description: 'Pembelian 5 Roll Kain Dryfit Milano ke PT Surya Texindo',
    status: 'posted',
  },
  {
    id: 'trx-3',
    journal_code: 'JRN-2026-003',
    type: 'income',
    category: 'Penjualan Jersey',
    amount: 3240000,
    account_id: 'acc-3',
    account_name: 'Mandiri Operasional',
    date: '2026-09-20',
    description: 'DP 50% Order KNU-2026-089 (FEB UI 2026)',
    status: 'posted',
  },
  {
    id: 'trx-4',
    journal_code: 'JRN-2026-004',
    type: 'expense',
    category: 'Tinta & Kertas Sublim',
    amount: 1600000,
    account_id: 'acc-1',
    account_name: 'Kas Tunai Workshop',
    date: '2026-09-20',
    description: 'Restock 4 Botol Tinta Cyan & Magenta Sublimasi',
    status: 'posted',
  },
  {
    id: 'trx-5',
    journal_code: 'JRN-2026-005',
    type: 'expense',
    category: 'Listrik & Utilitas',
    amount: 1850000,
    account_id: 'acc-3',
    account_name: 'Mandiri Operasional',
    date: '2026-09-21',
    description: 'Tagihan PLN Token Industri Workshop September',
    status: 'posted',
  },
];

export class FinanceService {
  static async getTransactions(state: FinanceState = {}) {
    return cacheData(`finance_transactions:${JSON.stringify(state)}`, 60, async () => {
      let items = [...TRANSACTIONS_DB];

      if (state.search) {
        const q = state.search.toLowerCase();
        items = items.filter(
          (t) =>
            t.journal_code.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.account_name.toLowerCase().includes(q)
        );
      }

      if (state.type && state.type !== 'all') {
        items = items.filter((t) => t.type === state.type);
      }

      if (state.category && state.category !== 'all') {
        items = items.filter((t) => t.category === state.category);
      }

      const totalIncome = TRANSACTIONS_DB.filter((t) => t.type === 'income' && t.status === 'posted').reduce(
        (sum, t) => sum + t.amount,
        0
      );

      const totalExpense = TRANSACTIONS_DB.filter((t) => t.type === 'expense' && t.status === 'posted').reduce(
        (sum, t) => sum + t.amount,
        0
      );

      const netCashflow = totalIncome - totalExpense;

      return {
        transactions: items,
        totalCount: TRANSACTIONS_DB.length,
        filteredCount: items.length,
        totalIncome,
        totalExpense,
        netCashflow,
      };
    }, { tags: ['finance'] });
  }

  static async getAccounts(state: AccountState = {}) {
    return cacheData(`finance_accounts:${JSON.stringify(state)}`, 60, async () => {
      let items = [...ACCOUNTS_DB];

      if (state.search) {
        const q = state.search.toLowerCase();
        items = items.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.code.toLowerCase().includes(q) ||
            (a.account_number && a.account_number.includes(q))
        );
      }

      if (state.type && state.type !== 'all') {
        items = items.filter((a) => a.type === state.type);
      }

      const totalLiquidAssets = ACCOUNTS_DB.filter((a) => a.type === 'asset').reduce(
        (sum, a) => sum + a.balance,
        0
      );

      return {
        accounts: items,
        totalCount: ACCOUNTS_DB.length,
        filteredCount: items.length,
        totalLiquidAssets,
      };
    }, { tags: ['finance'] });
  }

  static async getFinancialReports(period: string = '2026-09') {
    return cacheData(`finance_reports:${period}`, 60, async () => {
      const grossRevenue = 154800000;
      const cogs = 68500000;
      const grossProfit = grossRevenue - cogs;
      const opex = 28400000;
      const netProfit = grossProfit - opex;

      const totalAssets = ACCOUNTS_DB.filter((a) => a.type === 'asset').reduce((s, a) => s + a.balance, 0);
      const totalLiabilities = 18500000;
      const totalEquity = totalAssets - totalLiabilities;

      return {
        period,
        grossRevenue,
        cogs,
        grossProfit,
        opex,
        netProfit,
        profitMargin: Math.round((netProfit / grossRevenue) * 100),
        totalAssets,
        totalLiabilities,
        totalEquity,
      };
    }, { tags: ['finance'] });
  }

  static async createTransaction(data: Partial<TransactionItem>) {
    const nextNum = TRANSACTIONS_DB.length + 1;
    const journal_code = `JRN-2026-00${nextNum}`;
    const amount = Number(data.amount) || 0;
    const type = (data.type as any) || 'income';

    const account = ACCOUNTS_DB.find((a) => a.id === data.account_id) || ACCOUNTS_DB[0];

    const newTrx: TransactionItem = {
      id: `trx-${Date.now()}`,
      journal_code,
      type,
      category: data.category || 'Lain-lain',
      amount,
      account_id: account.id,
      account_name: account.name,
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || 'Transaksi baru',
      status: 'posted',
    };

    const parsed = TransactionSchema.safeParse(newTrx);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Data transaksi tidak valid', 400);
    }

    if (type === 'income') {
      account.balance += amount;
    } else {
      account.balance -= amount;
    }

    TRANSACTIONS_DB.unshift(parsed.data);
    invalidateCacheByTag('finance');
    return parsed.data;
  }

  static async createAccount(data: Partial<AccountItem>) {
    const newAcc: AccountItem = {
      id: `acc-${Date.now()}`,
      code: data.code || `1-10${ACCOUNTS_DB.length + 1}`,
      name: data.name || 'Akun Baru',
      type: (data.type as any) || 'asset',
      balance: Number(data.balance) || 0,
      is_bank: Boolean(data.is_bank),
      account_number: data.account_number || '',
      account_holder: data.account_holder || '',
    };

    const parsed = AccountSchema.safeParse(newAcc);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Data rekening tidak valid', 400);
    }

    ACCOUNTS_DB.push(parsed.data);
    invalidateCacheByTag('finance');
    return parsed.data;
  }

  static async deleteTransaction(id: string) {
    const idx = TRANSACTIONS_DB.findIndex((t) => t.id === id);
    if (idx === -1) throw new ApiError('Transaksi tidak ditemukan', 404);

    const [deleted] = TRANSACTIONS_DB.splice(idx, 1);
    const account = ACCOUNTS_DB.find((a) => a.id === deleted.account_id);
    if (account) {
      if (deleted.type === 'income') {
        account.balance -= deleted.amount;
      } else {
        account.balance += deleted.amount;
      }
    }

    invalidateCacheByTag('finance');
    return { success: true, deleted_id: id };
  }
}

export async function handleFinanceAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'create-transaction');
    const id = String(formData.get('id') || '');

    const strategies: Record<string, () => Promise<any>> = {
      'create-transaction': async () => {
        const type = String(formData.get('type') || 'income');
        const category = String(formData.get('category') || 'Penjualan Jersey');
        const amount = Number(formData.get('amount') || 0);
        const account_id = String(formData.get('account_id') || 'acc-2');
        const date = String(formData.get('date') || '');
        const description = String(formData.get('description') || '');

        const created = await FinanceService.createTransaction({
          type: type as any,
          category,
          amount,
          account_id,
          date,
          description,
        });
        return successResponse(created);
      },
      'create-account': async () => {
        const code = String(formData.get('code') || '');
        const name = String(formData.get('name') || '');
        const type = String(formData.get('type') || 'asset');
        const balance = Number(formData.get('balance') || 0);
        const is_bank = formData.get('is_bank') === 'true' || formData.get('is_bank') === '1' || formData.get('is_bank') === 'on';
        const account_number = String(formData.get('account_number') || '');
        const account_holder = String(formData.get('account_holder') || '');

        const created = await FinanceService.createAccount({
          code,
          name,
          type: type as any,
          balance,
          is_bank,
          account_number,
          account_holder,
        });
        return successResponse(created);
      },
      'delete-transaction': async () => {
        return successResponse(await FinanceService.deleteTransaction(id));
      },
      'close-period': async () => {
        invalidateCacheByTag('finance');
        return successResponse({ closed: true, message: 'Tutup buku periode berhasil dieksekusi' });
      },
    };

    const handler = strategies[intent];
    if (!handler) throw new ApiError(`Intent '${intent}' tidak didukung`, 400);
    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: 'action:finance' });
    return errorResponse(error);
  }
}
