import React, { createElement, useState, type ReactNode } from 'react';
import {
  Div,
  Row,
  Col,
  Span,
  Button,
  Badge,
  Icon,
  Modal,
  Select,
  ConfirmDialog,
  TableActionGroup,
  TableActionButton,
  modals,
  ui,
  type DataTableCardColumn,
  type TableTabItem,
  type ActiveFilterItem,
} from '~/builder';
import { ADMIN_WA, getWhatsAppLink } from '~/constants/brand';
import {
  type OrderItem,
  type OrderState,
  ORDER_STATUS_BADGES,
  PAYMENT_STATUS_BADGES,
  PRINT_STATUS_BADGES,
  ORDER_STATUS_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
} from '~/schemas/order.schema';

// ============================================================================
// Order Tabs Config (BAAK / Kinau Style)
// ============================================================================

export const ORDER_TABS: TableTabItem[] = [
  { key: 'reguler', label: 'Pesanan Reguler', icon: 'Building2' },
  { key: 'kkn', label: 'Pesanan KKN / Kampus', icon: 'GraduationCap' },
  { key: 'all', label: 'Semua Pesanan', icon: 'Layers' },
];

// ============================================================================
// Active Filter Badges Helper
// ============================================================================

export function getActiveFilterBadges(
  urlState: OrderState,
  updateUrlState: (s: Partial<OrderState>) => void
): ActiveFilterItem[] {
  const list: ActiveFilterItem[] = [];

  if (urlState.year) {
    list.push({
      key: 'year',
      label: 'Tahun',
      value: urlState.year,
      onRemove: () => updateUrlState({ year: '' }),
    });
  }

  if (urlState.status && urlState.status !== 'all') {
    const opt = ORDER_STATUS_OPTIONS.find((o) => o.value === urlState.status);
    list.push({
      key: 'status',
      label: 'Status Produksi',
      value: opt?.label || urlState.status,
      onRemove: () => updateUrlState({ status: 'all' }),
    });
  }

  if (urlState.payment_status && urlState.payment_status !== 'all') {
    const pLabel =
      urlState.payment_status === 'paid'
        ? 'Lunas'
        : urlState.payment_status === 'down_payment' || urlState.payment_status === 'partial_dp'
        ? 'DP Terbayar'
        : 'Belum Bayar';
    list.push({
      key: 'payment_status',
      label: 'Status Bayar',
      value: pLabel,
      onRemove: () => updateUrlState({ payment_status: 'all' }),
    });
  }

  if (urlState.order_type && urlState.order_type !== 'all') {
    list.push({
      key: 'order_type',
      label: 'Tipe Pesanan',
      value: urlState.order_type,
      onRemove: () => updateUrlState({ order_type: 'all' }),
    });
  }

  if (urlState.category && urlState.category !== 'all') {
    const opt = PRODUCT_CATEGORY_OPTIONS.find((o) => o.value === urlState.category);
    list.push({
      key: 'category',
      label: 'Kategori',
      value: opt?.label || urlState.category,
      onRemove: () => updateUrlState({ category: 'all' }),
    });
  }

  if (urlState.kkn_institution) {
    list.push({
      key: 'kkn_institution',
      label: 'Institusi KKN',
      value: urlState.kkn_institution,
      onRemove: () => updateUrlState({ kkn_institution: '' }),
    });
  }

  return list;
}

// ============================================================================
// Order Filter Modal (Exact match to kinauid-frontend OrderFilterModal.tsx)
// ============================================================================

export function OrderFilterModal({
  open,
  onClose,
  filters = {},
  onApply,
  onReset,
  viewMode = 'reguler',
}: {
  open: boolean;
  onClose: () => void;
  filters: OrderState;
  onApply: (f: Partial<OrderState>) => void;
  onReset: () => void;
  viewMode?: 'reguler' | 'kkn' | 'all';
}) {
  const [tempFilters, setTempFilters] = useState<Partial<OrderState>>({ ...filters });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2017 }, (_, i) => (currentYear - i).toString());

  const handleApply = () => {
    onApply(tempFilters);
    onClose();
  };

  const handleReset = () => {
    setTempFilters({ year: '', status: 'all', payment_status: 'all', order_type: 'all', category: 'all', kkn_institution: '' });
    onReset();
    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: 'Filter Berdasarkan',
      description: 'Sesuaikan kriteria filter untuk mempersempit daftar pesanan.',
      size: 'md',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-1' },
      // 1. Tahun
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Tahun Pesanan'),
        createElement(
          'select',
          {
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] outline-none',
            value: tempFilters.year || '',
            onChange: (e: any) => setTempFilters({ ...tempFilters, year: e.target.value }),
          },
          createElement('option', { value: '' }, 'Semua Tahun'),
          years.map((y) => createElement('option', { key: y, value: y }, y))
        )
      ),

      // 2. Status Produksi
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Status Produksi'),
        createElement(
          'select',
          {
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] outline-none',
            value: tempFilters.status || 'all',
            onChange: (e: any) => setTempFilters({ ...tempFilters, status: e.target.value }),
          },
          createElement('option', { value: 'all' }, 'Semua Status'),
          createElement('option', { value: 'pending' }, 'Pending'),
          createElement('option', { value: 'confirmed' }, 'Diproses'),
          createElement('option', { value: 'in_production' }, 'Produksi'),
          createElement('option', { value: 'completed' }, 'Selesai'),
          createElement('option', { value: 'cancelled' }, 'Dibatalkan')
        )
      ),

      // 3. Status Pembayaran
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Status Pembayaran'),
        createElement(
          'select',
          {
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] outline-none',
            value: tempFilters.payment_status || 'all',
            onChange: (e: any) => setTempFilters({ ...tempFilters, payment_status: e.target.value }),
          },
          createElement('option', { value: 'all' }, 'Semua Status Bayar'),
          createElement('option', { value: 'paid' }, 'Lunas'),
          createElement('option', { value: 'partial_dp' }, 'DP (Down Payment)'),
          createElement('option', { value: 'unpaid' }, 'Belum Bayar')
        )
      ),

      // 4. Tipe Pesanan / Kategori
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Tipe Pesanan / Kategori'),
        createElement(
          'select',
          {
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] outline-none',
            value: tempFilters.category || tempFilters.order_type || 'all',
            onChange: (e: any) => setTempFilters({ ...tempFilters, category: e.target.value, order_type: e.target.value }),
          },
          PRODUCT_CATEGORY_OPTIONS.map((opt) =>
            createElement('option', { key: opt.value, value: opt.value }, opt.label)
          )
        )
      ),

      // 5. Institusi KKN (hanya tampil jika di mode KKN)
      viewMode === 'kkn'
        ? createElement(
            'div',
            { className: 'space-y-1.5' },
            createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Institusi Kampus / KKN'),
            createElement(
              'select',
              {
                className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] outline-none',
                value: tempFilters.kkn_institution || '',
                onChange: (e: any) => setTempFilters({ ...tempFilters, kkn_institution: e.target.value }),
              },
              createElement('option', { value: '' }, 'Semua Institusi'),
              createElement('option', { value: 'Universitas Indonesia' }, 'Universitas Indonesia'),
              createElement('option', { value: 'Universitas Brawijaya' }, 'Universitas Brawijaya'),
              createElement('option', { value: 'Universitas Islam Malang (UNISMA)' }, 'Universitas Islam Malang (UNISMA)'),
              createElement('option', { value: 'Universitas Gadjah Mada' }, 'Universitas Gadjah Mada')
            )
          )
        : null,

      // Modal Footer Actions
      createElement(
        'div',
        { className: 'flex items-center gap-3 pt-4 border-t border-slate-100 justify-end' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: handleReset,
            className: 'px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer',
          },
          'Reset'
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: handleApply,
            className: 'px-4 py-2 bg-[#103557] text-white rounded-lg text-xs font-bold hover:bg-[#0c2842] shadow-2xs transition-all cursor-pointer',
          },
          'Terapkan Filter'
        )
      )
    )
  );
}

export function safeParseObject(data: any): Record<string, any> {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return { value: data };
  }
}

// ============================================================================
// Order Customer Cell (Instansi / Pemesan)
// ============================================================================

export function OrderCustomerCell(order: OrderItem) {
  const isKkn = +(order.is_kkn ?? 0) === 1;
  const isSponsor = +(order.is_sponsor ?? 0) === 1;
  const kknDetail = safeParseObject(order.kkn_detail);
  const kknVal = kknDetail?.value ?? (typeof order.kkn_detail === 'string' ? order.kkn_detail : '');

  const phoneVal = String(order.customer_phone || order.pic_phone || ADMIN_WA);
  const waUrl = getWhatsAppLink(
    phoneVal,
    `Halo ${String(order.customer_name || order.pic_name || '')}, saya ingin bertanya tentang pemesanan ${order.order_number}`
  );

  return createElement(
    'div',
    { className: 'py-1 space-y-0.5' },
    createElement(
      'div',
      { className: 'font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap' },
      isKkn
        ? createElement(
            'div',
            { className: 'flex items-center gap-1.5 flex-wrap' },
            createElement(
              'span',
              { className: 'whitespace-nowrap font-bold text-slate-900' },
              order.kkn_type?.toLowerCase() === 'ppm' ? `Kelompok ${kknVal}` : `Desa ${kknVal || order.institution_name}`
            ),
            order.kkn_period
              ? createElement(
                  'span',
                  {
                    className:
                      'inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200',
                  },
                  `Periode ${order.kkn_period}`
                )
              : null
          )
        : createElement(
            'span',
            { className: 'font-bold text-slate-900 break-words' },
            String(order.institution_name || order.customer_name || '')
          ),
      isSponsor
        ? createElement(
            'span',
            {
              className:
                'inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap',
            },
            Icon('Handshake', { className: 'w-2.5 h-2.5 mr-0.5' }),
            'PARTNER'
          )
        : null
    ),
    createElement(
      'div',
      { className: 'text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5' },
      createElement(
        'span',
        null,
        isKkn && order.institution_name ? `${order.institution_name} ${order.kkn_year || ''} -` : ''
      ),
      createElement('span', null, String(order.pic_name || order.customer_name || '-')),
      (order.customer_phone || order.pic_phone)
        ? createElement(
            'a',
            {
              href: waUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5',
            },
            `(${String(order.pic_phone || order.customer_phone)})`
          )
        : null
    )
  );
}

// ============================================================================
// Order Drive Links Cell
// ============================================================================

export function OrderDriveLinksCell(order: OrderItem) {
  const link = `https://kinau.id/public/drive-link/${order.order_number}`;

  const copyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(link);
    }
  };

  return createElement(
    'div',
    { className: 'flex flex-col gap-1 py-1' },
    createElement(
      'div',
      { className: 'flex items-center gap-1.5 flex-wrap' },
      createElement(
        'button',
        {
          type: 'button',
          onClick: copyLink,
          className:
            'inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer',
        },
        Icon('Copy', { className: 'w-2.5 h-2.5' }),
        'Salin Link'
      ),
      createElement(
        'a',
        {
          href: `/public/drive-link/${order.order_number}`,
          target: '_blank',
          rel: 'noopener noreferrer',
          className:
            'inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-100 shadow-2xs transition-colors',
        },
        Icon('ExternalLink', { className: 'w-2.5 h-2.5' }),
        'Buka Drive'
      )
    )
  );
}

// ============================================================================
// Order Payment Proof Cell (Exact match to kinauid-frontend order-columns.tsx)
// ============================================================================

export function OrderPaymentProofCell(order: OrderItem, send: any) {
  const hasDpProof = Boolean(order.dp_payment_proof && order.dp_payment_proof.trim() !== '');
  const hasPaidProof = Boolean(order.payment_proof && order.payment_proof.trim() !== '');

  const canUploadDp =
    (order.payment_status === 'partial_dp' || order.payment_status === 'down_payment' || order.payment_status === 'none' || order.payment_status === 'unpaid') &&
    !hasDpProof;

  const canUploadPaid =
    ((order.payment_status === 'partial_dp' && !hasDpProof) ||
      (hasDpProof && !order.payment_proof) ||
      (order.payment_status === 'paid' && !hasPaidProof) ||
      order.payment_status === 'none' ||
      order.payment_status === 'unpaid');

  const openUploadModal = (source: 'down_payment' | 'paid') => {
    modals.open('UPLOAD_PAYMENT_PROOF_MODAL', {
      order,
      sourceUpload: source,
      onSubmit: (payload: any) =>
        send.submit({ intent: 'update-payment-proof', id: order.id, ...payload }, { method: 'post' }),
    });
  };

  const openViewModal = () => {
    modals.open('VIEW_PAYMENT_PROOF_MODAL', {
      order,
      onDeleteProof: (field: string) =>
        send.submit({ intent: 'delete-payment-proof', id: order.id, field }, { method: 'post' }),
    });
  };

  const buttonBase =
    'w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer';
  const activeBtn = 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs';
  const disabledBtn = 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed';
  const successBtn = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';

  return createElement(
    'div',
    { className: 'w-[180px] max-w-[190px] py-1 flex flex-col gap-1' },
    // 1. Upload Bukti DP
    createElement(
      'button',
      {
        type: 'button',
        disabled: !canUploadDp && !hasDpProof,
        onClick: () => (hasDpProof ? openViewModal() : openUploadModal('down_payment')),
        className: `${buttonBase} ${hasDpProof ? successBtn : canUploadDp ? activeBtn : disabledBtn}`,
      },
      hasDpProof ? Icon('Check', { className: 'w-3 h-3 text-emerald-600' }) : Icon('Upload', { className: 'w-3 h-3 text-slate-500' }),
      'Upload Bukti Bayar (DP)'
    ),

    // 2. Upload Bukti Lunas
    createElement(
      'button',
      {
        type: 'button',
        disabled: !canUploadPaid && !hasPaidProof,
        onClick: () => (hasPaidProof ? openViewModal() : openUploadModal('paid')),
        className: `${buttonBase} ${hasPaidProof ? successBtn : canUploadPaid ? activeBtn : disabledBtn}`,
      },
      hasPaidProof ? Icon('Check', { className: 'w-3 h-3 text-emerald-600' }) : Icon('Upload', { className: 'w-3 h-3 text-slate-500' }),
      'Upload Bukti Bayar (LUNAS)'
    ),

    // 3. Lihat Bukti Link
    (hasDpProof || hasPaidProof)
      ? createElement(
          'button',
          {
            type: 'button',
            onClick: openViewModal,
            className:
              'mt-0.5 text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center justify-center gap-1 cursor-pointer py-0.5',
          },
          Icon('Image', { className: 'w-3 h-3' }),
          'Lihat Bukti Bayar'
        )
      : null
  );
}

// ============================================================================
// Order Columns Definition (Matching kinauid-frontend order-columns.tsx)
// ============================================================================

export function createOrderTableColumns(send: any, navigate?: (path: string) => void): DataTableCardColumn<OrderItem>[] {
  return [
    {
      key: 'no',
      header: 'No',
      width: '45px',
      center: true,
      cell: (_row, idx) => createElement('span', { className: 'text-xs font-semibold text-slate-500' }, (idx ?? 0) + 1),
    },
    {
      key: 'instansi',
      header: 'Instansi / Pemesan',
      minWidth: '220px',
      cell: (row) => OrderCustomerCell(row),
    },
    {
      key: 'jenisPesanan',
      header: 'Nama Item',
      minWidth: '140px',
      cell: (row) => {
        if (Array.isArray(row.order_items) && row.order_items.length > 0) {
          return createElement(
            'ul',
            { className: 'list-disc list-inside text-xs text-slate-800 space-y-0.5' },
            row.order_items.map((it: any, i: number) =>
              createElement('li', { key: i, className: 'truncate max-w-[180px]' }, it.product_name || row.product_name)
            )
          );
        }
        return createElement('span', { className: 'text-xs font-medium text-slate-800' }, row.product_name);
      },
    },
    {
      key: 'item_variant',
      header: 'Varian Item',
      width: '120px',
      cell: (row) => {
        if (Array.isArray(row.order_items) && row.order_items.length > 0) {
          return createElement(
            'ul',
            { className: 'list-disc list-inside text-xs text-slate-600 space-y-0.5' },
            row.order_items.map((it: any, i: number) =>
              createElement('li', { key: i, className: 'truncate max-w-[140px]' }, it.variant_name || row.category || 'Standar')
            )
          );
        }
        return createElement('span', { className: 'text-xs text-slate-600' }, row.category || 'Standar');
      },
    },
    {
      key: 'jumlah',
      header: 'Jumlah',
      width: '75px',
      center: true,
      cell: (row) => {
        if (Array.isArray(row.order_items) && row.order_items.length > 0) {
          return createElement(
            'div',
            { className: 'space-y-0.5 text-center' },
            row.order_items.map((it: any, i: number) =>
              createElement('div', { key: i, className: 'text-xs font-bold text-slate-900' }, `${it.qty || 1} pcs`)
            )
          );
        }
        return createElement('span', { className: 'text-xs font-bold text-slate-900' }, `${row.total_qty} pcs`);
      },
    },
    {
      key: 'deadline',
      header: 'Deadline',
      width: '100px',
      cell: (row) => createElement('span', { className: 'text-xs text-slate-600 font-medium' }, row.deadline_at || '-'),
    },
    {
      key: 'totalAmount',
      header: 'Total Bayar',
      width: '130px',
      cell: (row) => {
        const pBadge = PAYMENT_STATUS_BADGES[row.payment_status] || { label: row.payment_status, variant: 'danger' };
        return createElement(
          'div',
          { className: 'space-y-1' },
          createElement('div', { className: 'font-bold text-xs text-slate-900' }, `Rp ${(row.grand_total || 0).toLocaleString('id-ID')}`),
          createElement(
            'span',
            {
              className: `inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                row.payment_status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : row.payment_status === 'partial_dp' || row.payment_status === 'down_payment'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`,
            },
            pBadge.label
          )
        );
      },
    },
    {
      key: 'link',
      header: 'Folder Drive',
      minWidth: '140px',
      cell: (row) => OrderDriveLinksCell(row),
    },
    {
      key: 'statusPengerjaan',
      header: 'Status Produksi',
      width: '135px',
      cell: (row) => {
        return createElement(
          'select',
          {
            value: row.status,
            onChange: (e: any) => send.submit({ intent: 'update-status', id: row.id, status: e.target.value }, { method: 'post' }),
            className:
              'text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs text-slate-700 focus:ring-1 focus:ring-[#103557] outline-none cursor-pointer',
          },
          ORDER_STATUS_OPTIONS.filter((o) => o.value !== 'all').map((opt) =>
            createElement('option', { key: opt.value, value: opt.value }, opt.label)
          )
        );
      },
    },
    {
      key: 'statusPembayaran',
      header: 'Status Pembayaran',
      width: '190px',
      cell: (row) => OrderPaymentProofCell(row, send),
    },
    {
      key: 'status_printed',
      header: 'Status Cetak',
      width: '115px',
      center: true,
      cell: (row) =>
        createElement(
          'div',
          { className: 'flex flex-col items-center gap-1' },
          createElement(
            'span',
            {
              className: `px-2 py-0.5 rounded text-[10px] font-bold ${
                row.status_printed === 'printed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`,
            },
            row.status_printed === 'printed' ? 'TER-CETAK' : 'Antrean'
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                send.submit(
                  {
                    intent: 'update-status-printed',
                    id: row.id,
                    status_printed: row.status_printed === 'printed' ? 'unprinted' : 'printed',
                  },
                  { method: 'post' }
                ),
              className: 'text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer',
            },
            row.status_printed === 'printed' ? 'Cetak Ulang' : 'Set Selesai Cetak'
          )
        ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      width: '120px',
      center: true,
      cell: (row) =>
        createElement(
          TableActionGroup,
          { size: 'sm' },
          createElement(TableActionButton, {
            icon: 'FileText',
            title: 'Lihat Nota',
            variant: 'warning',
            onClick: () => {
              modals.open('VIEW_NOTA_MODAL', { order: row });
            },
          }),
          createElement(TableActionButton, {
            icon: 'Pencil',
            title: 'Edit Pesanan',
            variant: 'primary',
            onClick: () => {
              if (navigate) navigate(`/app/order-manage?id=${row.id}`);
            },
          }),
          createElement(TableActionButton, {
            icon: 'Trash2',
            title: 'Hapus Pesanan',
            variant: 'danger',
            onClick: () =>
              ConfirmDialog.delete({
                name: `Pesanan ${row.order_number}`,
                onConfirm: () => send.submit({ intent: 'delete-order', id: row.id }, { method: 'post' }),
              }),
          })
        ),
    },
  ];
}

// ============================================================================
// Modals: UploadPaymentProofModal, ViewPaymentProofModal, ViewNotaModal
// ============================================================================

export function UploadPaymentProofModal({ open, onClose, order, sourceUpload = 'down_payment', onSubmit }: any) {
  const [targetBank, setTargetBank] = useState<string>('bca');
  const [proofUrl, setProofUrl] = useState<string>('/capkinau.png');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  if (!open || !order) return null;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit?.({
      payment_proof: sourceUpload === 'paid' ? proofUrl : undefined,
      dp_payment_proof: sourceUpload === 'down_payment' ? proofUrl : undefined,
      payment_method: targetBank,
      payment_status: sourceUpload === 'paid' ? 'paid' : 'down_payment',
      source_upload: sourceUpload,
    });
    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: sourceUpload === 'down_payment' ? 'Upload Bukti Bayar DP' : 'Upload Bukti Pelunasan',
      description: `Unggah struk / resi bukti transfer untuk pesanan #${order.order_number}.`,
      size: 'sm',
    },
    createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-4 pt-1' },
      // Detail Singkat Pesanan
      createElement(
        'div',
        { className: 'p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs' },
        createElement(
          'div',
          { className: 'flex justify-between font-semibold text-slate-700' },
          createElement('span', null, 'Pemesan:'),
          createElement('span', { className: 'text-slate-900 font-bold' }, order.institution_name || order.customer_name)
        ),
        createElement(
          'div',
          { className: 'flex justify-between font-semibold text-slate-700' },
          createElement('span', null, 'Total Tagihan:'),
          createElement('span', { className: 'text-[#103557] font-black' }, `Rp ${(order.grand_total || 0).toLocaleString('id-ID')}`)
        )
      ),

      // Rekening Tujuan
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Rekening / Kas Tujuan'),
        createElement(
          'select',
          {
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
            value: targetBank,
            onChange: (e: any) => setTargetBank(e.target.value),
          },
          createElement('option', { value: 'bca' }, 'BCA Bisnis (123-456-7890 a/n PT Kinau Apparel)'),
          createElement('option', { value: 'mandiri' }, 'Mandiri Operasional (987-654-3210 a/n Kinau)'),
          createElement('option', { value: 'bri' }, 'BRI Kas Produksi (554-123-999 a/n Kinau ID)'),
          createElement('option', { value: 'cash' }, 'Kas Tunai Workshop (Direct Cash)')
        )
      ),

      // Upload Input
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'File Bukti Transfer'),
        createElement('input', {
          type: 'file',
          accept: 'image/*',
          className:
            'w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#103557] hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1',
          onChange: (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              setProofUrl(url);
            }
          },
        }),
        createElement('p', { className: 'text-[11px] text-slate-500' }, 'Format JPG, PNG, atau WebP maks. 5MB.')
      ),

      // Live Image Preview
      proofUrl
        ? createElement(
            'div',
            { className: 'border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center max-h-48 overflow-hidden' },
            createElement('img', { src: proofUrl, alt: 'Preview Bukti', className: 'max-h-40 object-contain rounded' })
          )
        : null,

      // Modal Actions
      createElement(
        'div',
        { className: 'flex items-center gap-2 pt-3 border-t border-slate-100 justify-end' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className: 'px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer',
          },
          'Batal'
        ),
        createElement(
          'button',
          {
            type: 'submit',
            className: 'px-4 py-2 bg-[#103557] text-white rounded-lg text-xs font-bold hover:bg-[#0c2842] shadow-2xs cursor-pointer',
          },
          'Simpan Bukti'
        )
      )
    )
  );
}

export function ViewPaymentProofModal({ open, onClose, order, onDeleteProof }: any) {
  if (!open || !order) return null;

  return Modal(
    {
      open,
      onClose,
      title: `Bukti Pembayaran #${order.order_number}`,
      description: `Lampiran bukti transfer untuk ${order.institution_name || order.customer_name}.`,
      size: 'lg',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-1' },
      createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        // 1. Bukti DP
        order.dp_payment_proof
          ? createElement(
              'div',
              { className: 'border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2' },
              createElement(
                'div',
                { className: 'flex items-center justify-between' },
                createElement('span', { className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200' }, 'Bukti DP'),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      ConfirmDialog.delete({
                        name: 'Bukti Pembayaran DP',
                        onConfirm: () => {
                          onDeleteProof?.('dp_payment_proof');
                          onClose();
                        },
                      });
                    },
                    className: 'p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer',
                  },
                  Icon('Trash2', { className: 'w-3.5 h-3.5' })
                )
              ),
              createElement(
                'div',
                { className: 'w-full h-56 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2' },
                createElement('img', { src: order.dp_payment_proof, alt: 'Bukti DP', className: 'max-h-full max-w-full object-contain' })
              )
            )
          : null,

        // 2. Bukti Lunas
        order.payment_proof
          ? createElement(
              'div',
              { className: 'border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2' },
              createElement(
                'div',
                { className: 'flex items-center justify-between' },
                createElement('span', { className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200' }, 'Bukti Pelunasan'),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      ConfirmDialog.delete({
                        name: 'Bukti Pelunasan',
                        onConfirm: () => {
                          onDeleteProof?.('payment_proof');
                          onClose();
                        },
                      });
                    },
                    className: 'p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer',
                  },
                  Icon('Trash2', { className: 'w-3.5 h-3.5' })
                )
              ),
              createElement(
                'div',
                { className: 'w-full h-56 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2' },
                createElement('img', { src: order.payment_proof, alt: 'Bukti Lunas', className: 'max-h-full max-w-full object-contain' })
              )
            )
          : null
      ),
      createElement(
        'div',
        { className: 'flex justify-end pt-3 border-t border-slate-100' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className: 'px-4 py-2 bg-[#103557] text-white rounded-lg text-xs font-bold hover:bg-[#0c2842] cursor-pointer',
          },
          'Tutup'
        )
      )
    )
  );
}

export function ViewNotaModal({ open, onClose, order }: any) {
  if (!open || !order) return null;

  return Modal(
    {
      open,
      onClose,
      title: `Nota Pemesanan #${order.order_number}`,
      description: 'Detail pesanan resmi dan bukti transaksi Kinau Apparel.',
      size: 'lg',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-1' },
      // Header Brand
      createElement(
        'div',
        { className: 'flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl' },
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement('h3', { className: 'font-black text-base tracking-tight text-white' }, 'KINAU APPAREL & MERCHANDISE'),
          createElement('p', { className: 'text-xs text-slate-300' }, 'Workshop Konveksi & Sublimasi Digital Printing')
        ),
        createElement(
          'div',
          { className: 'text-right' },
          createElement('div', { className: 'text-xs font-mono font-bold text-amber-400' }, `#${order.order_number}`),
          createElement('div', { className: 'text-[11px] text-slate-300' }, order.created_at || '2026-03-23')
        )
      ),

      // Customer Info
      createElement(
        'div',
        { className: 'grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs' },
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement('span', { className: 'text-slate-500 font-bold block uppercase text-[10px]' }, 'Instansi / Klien:'),
          createElement('div', { className: 'font-bold text-slate-900 text-sm' }, order.institution_name || order.customer_name),
          createElement('div', { className: 'text-slate-600' }, `PIC: ${order.customer_name} (${order.customer_phone || '-'})`)
        ),
        createElement(
          'div',
          { className: 'space-y-1 text-right' },
          createElement('span', { className: 'text-slate-500 font-bold block uppercase text-[10px]' }, 'Status & Deadline:'),
          createElement('div', { className: 'font-bold text-slate-900' }, `Deadline: ${order.deadline_at || '-'}`),
          createElement('div', { className: 'text-emerald-700 font-bold' }, `Status: ${order.status?.toUpperCase()}`)
        )
      ),

      // Items Table
      createElement(
        'div',
        { className: 'border border-slate-200 rounded-xl overflow-hidden' },
        createElement(
          'table',
          { className: 'w-full text-xs text-left' },
          createElement(
            'thead',
            { className: 'bg-slate-100 text-slate-700 font-bold border-b border-slate-200' },
            createElement(
              'tr',
              null,
              createElement('th', { className: 'p-2.5' }, 'Deskripsi Item'),
              createElement('th', { className: 'p-2.5 text-center' }, 'Qty'),
              createElement('th', { className: 'p-2.5 text-right' }, 'Harga Satuan'),
              createElement('th', { className: 'p-2.5 text-right' }, 'Total')
            )
          ),
          createElement(
            'tbody',
            { className: 'divide-y divide-slate-100' },
            createElement(
              'tr',
              null,
              createElement(
                'td',
                { className: 'p-2.5 font-semibold text-slate-900' },
                order.product_name,
                createElement('p', { className: 'text-[10px] text-slate-500 font-normal mt-0.5' }, order.notes || 'Spesifikasi standar Kinau')
              ),
              createElement('td', { className: 'p-2.5 text-center font-bold' }, `${order.total_qty} pcs`),
              createElement('td', { className: 'p-2.5 text-right' }, `Rp ${(order.unit_price || 0).toLocaleString('id-ID')}`),
              createElement('td', { className: 'p-2.5 text-right font-bold text-slate-900' }, `Rp ${(order.subtotal || order.grand_total || 0).toLocaleString('id-ID')}`)
            )
          )
        )
      ),

      // Pricing Summary
      createElement(
        'div',
        { className: 'p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs' },
        createElement(
          'div',
          { className: 'flex justify-between text-slate-600' },
          createElement('span', null, 'Subtotal:'),
          createElement('span', { className: 'font-semibold' }, `Rp ${(order.subtotal || order.grand_total || 0).toLocaleString('id-ID')}`)
        ),
        (order.discount || 0) > 0
          ? createElement(
              'div',
              { className: 'flex justify-between text-rose-600' },
              createElement('span', null, 'Diskon Khusus:'),
              createElement('span', { className: 'font-semibold' }, `- Rp ${(order.discount || 0).toLocaleString('id-ID')}`)
            )
          : null,
        createElement(
          'div',
          { className: 'flex justify-between text-sm font-black text-[#103557] pt-1.5 border-t border-slate-200' },
          createElement('span', null, 'Total Pembayaran:'),
          createElement('span', null, `Rp ${(order.grand_total || 0).toLocaleString('id-ID')}`)
        )
      ),

      // Footer
      createElement(
        'div',
        { className: 'flex items-center justify-between pt-3 border-t border-slate-100' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              if (typeof window !== 'undefined') window.print();
            },
            className: 'px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer',
          },
          Icon('Printer', { className: 'w-3.5 h-3.5' }),
          'Cetak Nota (Print)'
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className: 'px-4 py-2 bg-[#103557] text-white rounded-lg text-xs font-bold hover:bg-[#0c2842] cursor-pointer',
          },
          'Tutup'
        )
      )
    )
  );
}

// ============================================================================
// Responsive Mobile Card Renderer
// ============================================================================

export function renderOrderMobileCard(order: OrderItem, index: number, send: any, navigate?: (path: string) => void) {
  const pBadge = PAYMENT_STATUS_BADGES[order.payment_status] || { label: order.payment_status, variant: 'danger' };
  const sBadge = ORDER_STATUS_BADGES[order.status] || { label: order.status, variant: 'outline' };

  return createElement(
    'div',
    {
      key: order.id,
      className: 'bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3',
    },
    // Top Row: No. Order & Status Badge
    createElement(
      'div',
      { className: 'flex items-center justify-between gap-2' },
      createElement(
        'div',
        { className: 'flex items-center gap-1.5' },
        createElement('span', { className: 'text-xs font-mono font-bold text-[#103557]' }, `#${order.order_number}`),
        order.is_kkn
          ? createElement('span', { className: 'px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700' }, 'KKN')
          : null
      ),
      createElement(
        'span',
        {
          className: `px-2 py-0.5 rounded text-[10px] font-bold ${
            order.status === 'completed'
              ? 'bg-emerald-50 text-emerald-700'
              : order.status === 'in_production'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-slate-100 text-slate-700'
          }`,
        },
        sBadge.label
      )
    ),

    // Instansi & PIC
    createElement(
      'div',
      { className: 'space-y-0.5' },
      createElement('h4', { className: 'font-bold text-sm text-slate-900' }, order.institution_name || order.customer_name),
      createElement('p', { className: 'text-xs text-slate-500' }, `PIC: ${order.customer_name} (${order.customer_phone || '-'})`)
    ),

    // Product Info & Price
    createElement(
      'div',
      { className: 'flex items-center justify-between text-xs py-2 border-y border-slate-100' },
      createElement('span', { className: 'text-slate-600' }, `${order.product_name} (${order.total_qty} pcs)`),
      createElement('span', { className: 'font-bold text-slate-900' }, `Rp ${(order.grand_total || 0).toLocaleString('id-ID')}`)
    ),

    // Payment proof row on mobile
    createElement(
      'div',
      { className: 'py-1' },
      OrderPaymentProofCell(order, send)
    ),

    // Bottom Action Row
    createElement(
      'div',
      { className: 'flex items-center justify-between gap-2 pt-2 border-t border-slate-100' },
      createElement(
        'span',
        {
          className: `px-2 py-0.5 rounded text-[10px] font-bold ${
            order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`,
        },
        pBadge.label
      ),
      createElement(
        TableActionGroup,
        { size: 'sm' },
        createElement(TableActionButton, {
          icon: 'FileText',
          title: 'Nota',
          variant: 'warning',
          onClick: () => {
            modals.open('VIEW_NOTA_MODAL', { order });
          },
        }),
        createElement(TableActionButton, {
          icon: 'Pencil',
          title: 'Edit',
          variant: 'primary',
          onClick: () => {
            if (navigate) navigate(`/app/order-manage?id=${order.id}`);
          },
        }),
        createElement(TableActionButton, {
          icon: 'Trash2',
          title: 'Hapus',
          variant: 'danger',
          onClick: () =>
            ConfirmDialog.delete({
              name: `Pesanan ${order.order_number}`,
              onConfirm: () => send.submit({ intent: 'delete-order', id: order.id }, { method: 'post' }),
            }),
        })
      )
    )
  );
}

