import { z } from 'zod';

export const TransactionSchema = z.object({
  id: z.string(),
  journal_code: z.string(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(2, 'Kategori wajib diisi'),
  amount: z.number().min(1, 'Nominal transaksi minimal Rp 1'),
  account_id: z.string(),
  account_name: z.string(),
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
  description: z.string().min(3, 'Deskripsi transaksi wajib diisi'),
  proof_image: z.string().optional(),
  status: z.enum(['posted', 'draft', 'void']).default('posted'),
});

export const AccountSchema = z.object({
  id: z.string(),
  code: z.string().min(2, 'Kode akun wajib diisi'),
  name: z.string().min(2, 'Nama akun wajib diisi'),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']).default('asset'),
  balance: z.number().default(0),
  is_bank: z.boolean().default(false),
  account_number: z.string().optional(),
  account_holder: z.string().optional(),
});

export type TransactionItem = z.infer<typeof TransactionSchema>;
export type AccountItem = z.infer<typeof AccountSchema>;

export interface FinanceState {
  search?: string;
  type?: string;
  category?: string;
  account_id?: string;
  period?: string;
  page?: number;
}

export interface AccountState {
  search?: string;
  type?: string;
  page?: number;
}

export const TRANSACTION_TYPE_BADGES: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'outline' }> = {
  income: { label: 'Pemasukan (+)', variant: 'success' },
  expense: { label: 'Pengeluaran (-)', variant: 'danger' },
  posted: { label: 'Terposting', variant: 'info' },
  draft: { label: 'Draft', variant: 'outline' },
  void: { label: 'Dibatalkan', variant: 'warning' },
};

export const TRANSACTION_CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'Penjualan Jersey', label: 'Penjualan Jersey & Custom' },
  { value: 'Penjualan Merchandise', label: 'Penjualan Merchandise / Kaos' },
  { value: 'Bahan Baku & Kain', label: 'Pengadaan Kain & Roll' },
  { value: 'Tinta & Kertas Sublim', label: 'Tinta & Kertas Sublimasi' },
  { value: 'Biaya Jahit & Vendor', label: 'Upah Jahit & Bordir Vendor' },
  { value: 'Gaji & Bonus Karyawan', label: 'Gaji Operator & Staf' },
  { value: 'Listrik & Utilitas', label: 'Listrik & Operasional Workshop' },
  { value: 'Lain-lain', label: 'Biaya Lain-lain' },
];

export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'all', label: 'Semua Tipe Akun' },
  { value: 'asset', label: 'Aset / Kas & Bank' },
  { value: 'liability', label: 'Kewajiban / Hutang' },
  { value: 'equity', label: 'Modal / Ekuitas' },
  { value: 'income', label: 'Pendapatan Usaha' },
  { value: 'expense', label: 'Beban Operasional' },
];
