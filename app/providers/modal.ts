import React, { createElement } from 'react';
import { create } from 'zustand';
import { Modal, Form, Input, Select, Button, SubmitButton, UI, ui } from '~/builder';
import { SUPPLIER_CATEGORY_OPTIONS, INSTITUTION_TYPE_OPTIONS } from '~/schemas/master.schema';
import { ASSET_CATEGORY_OPTIONS } from '~/schemas/asset.schema';
import { PRODUCT_CATEGORY_OPTIONS, ORDER_STATUS_OPTIONS } from '~/schemas/order.schema';
import { TRANSACTION_CATEGORY_OPTIONS, ACCOUNT_TYPE_OPTIONS } from '~/schemas/finance.schema';

export interface ModalState {
  activeModals: Record<string, { isOpen: boolean; props?: Record<string, any> }>;
  open: (id: string, props?: Record<string, any>) => void;
  close: (id?: string) => void;
  closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModals: {},
  open: (id: string, props?: Record<string, any>) =>
    set((state) => ({
      activeModals: {
        ...state.activeModals,
        [id]: { isOpen: true, props: props || {} },
      },
    })),
  close: (id?: string) =>
    set((state) => {
      if (!id) return { activeModals: {} };
      const updated = { ...state.activeModals };
      delete updated[id];
      return { activeModals: updated };
    }),
  closeAll: () => set({ activeModals: {} }),
}));

export const modals = {
  open: (id: string, props?: Record<string, any>) => useModalStore.getState().open(id, props),
  close: (id?: string) => useModalStore.getState().close(id),
  closeAll: () => useModalStore.getState().closeAll(),
  isOpen: (id: string): boolean => Boolean(useModalStore.getState().activeModals[id]?.isOpen),
  getProps: (id: string): Record<string, any> => useModalStore.getState().activeModals[id]?.props || {},
};

export function CreateSupplierModal({ open, onClose, onSubmit, isSubmitting = false }: any) {
  return Modal(
    { open, onClose, title: 'Tambah Supplier Baru', description: 'Masukkan data kontak & kategori supplier material.' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-supplier' }),
      Input({ name: 'name', label: 'Nama Supplier', placeholder: 'misal: PT Surya Texindo', required: true }),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'contact_person', label: 'PIC Kontak', placeholder: 'Budi Santoso' }),
        Input({ name: 'phone', label: 'No. WhatsApp', placeholder: '08123456789', required: true })
      ),
      Select({ name: 'category', label: 'Kategori Material', options: SUPPLIER_CATEGORY_OPTIONS.filter(o => o.value !== 'all') }),
      Input({ name: 'address', label: 'Alamat Kantor / Gudang', placeholder: 'Bandung, Jawa Barat' }),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Simpan Supplier', isSubmitting })
      )
    )
  );
}

export function CreateInstitutionModal({ open, onClose, onSubmit, isSubmitting = false }: any) {
  return Modal(
    { open, onClose, title: 'Tambah Institusi / Klien', description: 'Registrasi data kampus, sekolah, atau korporat.' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-institution' }),
      Input({ name: 'name', label: 'Nama Institusi', placeholder: 'misal: Universitas Indonesia', required: true }),
      ui('div').grid(2, 'gap-3').childrenOf(
        Select({ name: 'type', label: 'Tipe Institusi', options: INSTITUTION_TYPE_OPTIONS.filter(o => o.value !== 'all') }),
        Input({ name: 'city', label: 'Kota / Lokasi', placeholder: 'Depok, Jawa Barat' })
      ),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'contact_person', label: 'Koordinator / PIC', placeholder: 'Dr. Sarah' }),
        Input({ name: 'discount_rate', label: 'Diskon Khusus (%)', type: 'number', defaultValue: '0' })
      ),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Simpan Institusi', isSubmitting })
      )
    )
  );
}

export function CreateShoppingModal({ open, onClose, onSubmit, isSubmitting = false }: any) {
  return Modal(
    { open, onClose, title: 'Tambah Rencana Belanja', description: 'Catat pengadaan bahan baku & material produksi.' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-shopping' }),
      Input({ name: 'item_name', label: 'Nama Barang / Kain', placeholder: 'misal: Dryfit Milano (Roll)', required: true }),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'supplier_name', label: 'Supplier Rekomendasi', placeholder: 'PT Surya Texindo' }),
        Input({ name: 'quantity', label: 'Jumlah / Kuantitas', type: 'number', defaultValue: '1', required: true })
      ),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'unit', label: 'Satuan', defaultValue: 'roll' }),
        Input({ name: 'estimated_cost', label: 'Estimasi Biaya (Rp)', type: 'number', placeholder: '1500000' })
      ),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Tambah ke Daftar', isSubmitting })
      )
    )
  );
}

export function CreateFolderModal({ open, onClose, onSubmit, isSubmitting = false, parentId }: any) {
  return Modal(
    { open, onClose, title: 'Buat Folder Baru', description: 'Buat folder untuk mengelompokkan desain & dokumen kerja.' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-folder' }),
      UI.input({ type: 'hidden', name: 'parent_id', value: parentId || '' }),
      Input({ name: 'name', label: 'Nama Folder', placeholder: 'misal: Desain Jersey Futsal 2026', required: true }),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Buat Folder', isSubmitting })
      )
    )
  );
}

export function CreateAssetModal({ open, onClose, onSubmit, isSubmitting = false }: any) {
  return Modal(
    { open, onClose, title: 'Registrasi Aset Baru', description: 'Catat inventaris mesin produksi, printer, atau workstation IT.' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-asset' }),
      Input({ name: 'asset_name', label: 'Nama Aset / Mesin', placeholder: 'misal: Mesin Sublimasi EPSON F6330', required: true }),
      ui('div').grid(2, 'gap-3').childrenOf(
        Select({ name: 'category', label: 'Kategori Mesin/Aset', options: ASSET_CATEGORY_OPTIONS.filter(o => o.value !== 'all') }),
        Input({ name: 'location', label: 'Lokasi Penempatan', placeholder: 'Ruang Printing 1', required: true })
      ),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'total_unit', label: 'Jumlah Unit', type: 'number', defaultValue: '1', required: true }),
        Input({ name: 'total_value', label: 'Nilai Aset per Unit (Rp)', type: 'number', placeholder: '50000000', required: true })
      ),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Simpan Aset', isSubmitting })
      )
    )
  );
}

export function CreateOrderModal({ open, onClose, onSubmit, isSubmitting = false }: any) {
  return Modal(
    { open, onClose, title: 'Input Order Produksi Baru', description: 'Masukkan rincian pesanan jersey / apparel klien.' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-order' }),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'customer_name', label: 'Nama Pemesan', placeholder: 'misal: Ilham Ramadhan', required: true }),
        Input({ name: 'customer_phone', label: 'No. WhatsApp', placeholder: '081234567890', required: true })
      ),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'institution_name', label: 'Institusi / Komunitas', placeholder: 'misal: FEB UI 2026' }),
        Select({ name: 'category', label: 'Kategori Produk', options: PRODUCT_CATEGORY_OPTIONS.filter(o => o.value !== 'all') })
      ),
      Input({ name: 'product_name', label: 'Nama Item / Desain', placeholder: 'misal: Jersey Futsal Cyber Navy', required: true }),
      ui('div').grid(3, 'gap-3').childrenOf(
        Input({ name: 'total_qty', label: 'Qty (Pcs)', type: 'number', defaultValue: '24', required: true }),
        Input({ name: 'unit_price', label: 'Harga Satuan (Rp)', type: 'number', defaultValue: '135000', required: true }),
        Input({ name: 'deadline_at', label: 'Deadline Selesai', type: 'date' })
      ),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Buat Pesanan', isSubmitting })
      )
    )
  );
}

export function UpdateOrderStatusModal({ open, onClose, onSubmit, isSubmitting = false, orderId, currentStatus }: any) {
  return Modal(
    { open, onClose, title: 'Update Tahapan Produksi', description: `Perbarui status pengerjaan pesanan ${orderId || ''}.` },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'update-status' }),
      UI.input({ type: 'hidden', name: 'id', value: orderId || '' }),
      Select({
        name: 'status',
        label: 'Status Pengerjaan Baru',
        defaultValue: currentStatus || 'in_production',
        options: ORDER_STATUS_OPTIONS.filter(o => o.value !== 'all')
      }),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Update Status', isSubmitting })
      )
    )
  );
}

export function CreateTransactionModal({ open, onClose, onSubmit, isSubmitting = false }: any) {
  return Modal(
    { open, onClose, title: 'Catat Transaksi Keuangan', description: 'Entri mutasi kas, pembayaran invoice, atau biaya operasional.' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-transaction' }),
      ui('div').grid(2, 'gap-3').childrenOf(
        Select({
          name: 'type',
          label: 'Jenis Transaksi',
          options: [
            { value: 'income', label: 'Pemasukan (+)' },
            { value: 'expense', label: 'Pengeluaran (-)' },
          ],
        }),
        Select({ name: 'category', label: 'Kategori Biaya / Omset', options: TRANSACTION_CATEGORY_OPTIONS.filter(o => o.value !== 'all') })
      ),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'amount', label: 'Nominal (Rp)', type: 'number', placeholder: '5000000', required: true }),
        Select({
          name: 'account_id',
          label: 'Buku Kas / Rekening',
          options: [
            { value: 'acc-2', label: 'BCA Bisnis (Utama)' },
            { value: 'acc-3', label: 'Mandiri Operasional' },
            { value: 'acc-1', label: 'Kas Tunai Workshop' },
          ],
        })
      ),
      Input({ name: 'date', label: 'Tanggal Transaksi', type: 'date', defaultValue: new Date().toISOString().split('T')[0] }),
      Input({ name: 'description', label: 'Keterangan & Rujukan', placeholder: 'misal: Pembelian kain roll atau pelunasan invoice', required: true }),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Simpan Transaksi', isSubmitting })
      )
    )
  );
}

export function CreateAccountModal({ open, onClose, onSubmit, isSubmitting = false }: any) {
  return Modal(
    { open, onClose, title: 'Tambah Rekening / Akun COA', description: 'Registrasi rekening bank baru atau akun pembukuan.' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-account' }),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'code', label: 'Kode Akun', placeholder: 'misal: 1-104', required: true }),
        Input({ name: 'name', label: 'Nama Akun / Bank', placeholder: 'misal: BNI Bisnis', required: true })
      ),
      ui('div').grid(2, 'gap-3').childrenOf(
        Select({ name: 'type', label: 'Klasifikasi Akun', options: ACCOUNT_TYPE_OPTIONS.filter(o => o.value !== 'all') }),
        Input({ name: 'balance', label: 'Saldo Awal (Rp)', type: 'number', defaultValue: '0' })
      ),
      ui('div').grid(2, 'gap-3').childrenOf(
        Input({ name: 'account_number', label: 'Nomor Rekening', placeholder: '1234567890' }),
        Input({ name: 'account_holder', label: 'Atas Nama', placeholder: 'PT KINAU APPAREL' })
      ),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Simpan Rekening', isSubmitting })
      )
    )
  );
}

export function CreateUserModal({ open, onClose, onSubmit, isSubmitting = false }: any) {
  return Modal(
    { open, onClose, title: 'Tambah Pengguna Baru', description: 'Tambahkan akun pengguna dan atur hak akses peran (RBAC).' },
    Form(
      { method: 'post', className: 'space-y-3', onSubmit: (v: any) => { onSubmit?.(v); onClose(); } },
      UI.input({ type: 'hidden', name: 'intent', value: 'create-user' }),
      Input({ name: 'name', label: 'Nama Lengkap', placeholder: 'misal: Sarah Jenkins', required: true }),
      Input({ name: 'email', label: 'Alamat Email', type: 'email', placeholder: 'sarah@kinau.id', required: true }),
      ui('div').grid(2, 'gap-3').childrenOf(
        Select({
          name: 'role',
          label: 'Peran (Role)',
          defaultValue: 'editor',
          options: [
            { value: 'admin', label: 'Admin (Full Akses)' },
            { value: 'editor', label: 'Editor (Akses Edit)' },
            { value: 'viewer', label: 'Viewer (Hanya Lihat)' },
          ],
        }),
        Select({
          name: 'status',
          label: 'Status Akun',
          defaultValue: 'active',
          options: [
            { value: 'active', label: 'Active (Aktif)' },
            { value: 'pending', label: 'Pending (Menunggu)' },
            { value: 'suspended', label: 'Suspended (Dibekukan)' },
          ],
        })
      ),
      ui('div').class('pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]').childrenOf(
        Button({ label: 'Batal', variant: 'ghost', onClick: onClose }),
        SubmitButton({ label: 'Simpan Pengguna', isSubmitting })
      )
    )
  );
}

import {
  OrderFilterModal,
  UploadPaymentProofModal,
  ViewPaymentProofModal,
  ZoomProofModal,
  OrderPortfolioModal,
  ViewNotaModal,
} from '~/components/feature/OrderListWidgets';
import {
  EditPortfolioModal,
  AddArchiveModal,
} from '~/components/feature/OrderHistoryWidgets';
import {
  CreateOrEditProductModal,
  CreateOrEditCategoryModal,
  ProductDetailModal,
  ProductFilterModal,
} from '~/components/feature/ProductListWidgets';

const MODAL_REGISTRY: Record<string, React.ComponentType<any>> = {
  CREATE_USER_MODAL: CreateUserModal,
  CREATE_SUPPLIER_MODAL: CreateSupplierModal,
  CREATE_INSTITUTION_MODAL: CreateInstitutionModal,
  CREATE_SHOPPING_MODAL: CreateShoppingModal,
  CREATE_FOLDER_MODAL: CreateFolderModal,
  CREATE_ASSET_MODAL: CreateAssetModal,
  CREATE_ORDER_MODAL: CreateOrderModal,
  ORDER_FILTER_MODAL: OrderFilterModal,
  UPLOAD_PAYMENT_PROOF_MODAL: UploadPaymentProofModal,
  VIEW_PAYMENT_PROOF_MODAL: ViewPaymentProofModal,
  ZOOM_PROOF_MODAL: ZoomProofModal,
  ORDER_PORTFOLIO_MODAL: OrderPortfolioModal,
  EDIT_PORTFOLIO_MODAL: EditPortfolioModal,
  ADD_ARCHIVE_MODAL: AddArchiveModal,
  VIEW_NOTA_MODAL: ViewNotaModal,
  UPDATE_ORDER_STATUS_MODAL: UpdateOrderStatusModal,
  CREATE_TRANSACTION_MODAL: CreateTransactionModal,
  CREATE_ACCOUNT_MODAL: CreateAccountModal,
  CREATE_PRODUCT_MODAL: CreateOrEditProductModal,
  CREATE_CATEGORY_MODAL: CreateOrEditCategoryModal,
  VIEW_PRODUCT_DETAIL_MODAL: ProductDetailModal,
  PRODUCT_FILTER_MODAL: ProductFilterModal,
};

export function registerModal(id: string, component: React.ComponentType<any>) {
  MODAL_REGISTRY[id] = component;
}

export function GlobalModalRenderer(): React.ReactElement {
  const activeModals = useModalStore((state) => state.activeModals);

  const renderedElements = Object.entries(activeModals).map(([id, config]) => {
    if (!config.isOpen) return null;
    const Component = MODAL_REGISTRY[id];
    if (Component) {
      return createElement(Component, {
        key: id,
        open: config.isOpen,
        onClose: () => modals.close(id),
        ...config.props,
      });
    }
    return null;
  });

  return createElement(React.Fragment, null, ...renderedElements);
}

export default modals;
