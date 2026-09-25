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
import { ADMIN_WA, getWhatsAppLink, getGoogleMapsLink, WORKSHOP_ADDRESS } from '~/constants/brand';
import {
  type OrderItem,
  type OrderState,
  BANK_ACCOUNTS_PRESET,
  ORDER_STATUS_BADGES,
  PAYMENT_STATUS_BADGES,
  PRINT_STATUS_BADGES,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
} from '~/schemas/order.schema';
import { getResourceUrl } from '~/utils/resource';
import { formatCurrency, formatFullDate } from '~/utils/format';

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
// Order Filter Modal
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
  viewMode?: string;
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
          ORDER_STATUS_OPTIONS.map((opt) => createElement('option', { key: opt.value, value: opt.value }, opt.label))
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
          PAYMENT_STATUS_OPTIONS.map((opt) => createElement('option', { key: opt.value, value: opt.value }, opt.label))
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

export function safeParseArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
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

  const phoneVal = String(order.pic_phone || order.customer_phone || ADMIN_WA);
  const waUrl = getWhatsAppLink(
    phoneVal,
    `Halo ${String(order.pic_name || order.customer_name || '')}, saya ingin bertanya tentang pemesanan ${order.order_number}`
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
      (order.pic_phone || order.customer_phone)
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
// Order Product List Cell (Detail Daftar Produk & Varian)
// ============================================================================

export function OrderProductListCell(order: OrderItem) {
  const items = Array.isArray(order.order_items) && order.order_items.length > 0 ? order.order_items : [];

  if (items.length === 0) {
    return createElement(
      'div',
      { className: 'py-1 space-y-0.5' },
      createElement('div', { className: 'font-medium text-xs text-slate-900 break-words' }, order.product_name),
      createElement('span', { className: 'text-[10px] font-medium text-slate-500' }, order.category || 'Standar')
    );
  }

  return createElement(
    'div',
    { className: 'py-1 space-y-1 max-w-[200px]' },
    items.map((it: any, idx: number) =>
      createElement(
        'div',
        { key: idx, className: 'flex items-start justify-between gap-1.5 text-xs pb-1 border-b border-slate-100 last:border-0 last:pb-0' },
        createElement(
          'div',
          { className: 'min-w-0' },
          createElement('div', { className: 'font-semibold text-slate-900 truncate' }, it.product_name || order.product_name),
          it.variant_name
            ? createElement('span', { className: 'text-[10px] text-slate-500 block truncate' }, it.variant_name)
            : null
        ),
        createElement(
          'span',
          { className: 'text-[10px] font-bold text-[#103557] bg-slate-100 px-1.5 py-0.5 rounded shrink-0' },
          `${it.qty || 1} pcs`
        )
      )
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
// Order Payment Proof Cell
// ============================================================================

export function OrderPaymentProofCell(order: OrderItem, send: any) {
  const hasDpProof = Boolean(order.dp_payment_proof && order.dp_payment_proof.trim() !== '');
  const hasPaidProof = Boolean(order.payment_proof && order.payment_proof.trim() !== '');

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
  const successBtn = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold hover:bg-emerald-100';

  return createElement(
    'div',
    { className: 'w-[180px] max-w-[190px] py-1 flex flex-col gap-1' },
    // 1. Upload Bukti DP
    createElement(
      'button',
      {
        type: 'button',
        onClick: () => (hasDpProof ? openViewModal() : openUploadModal('down_payment')),
        className: `${buttonBase} ${hasDpProof ? successBtn : activeBtn}`,
        title: hasDpProof ? 'Lihat Bukti DP (Status: DP Diterima)' : 'Unggah Bukti DP',
      },
      hasDpProof ? Icon('Check', { className: 'w-3 h-3 text-emerald-600' }) : Icon('Upload', { className: 'w-3 h-3 text-slate-500' }),
      hasDpProof ? 'Bukti DP (DP Diterima)' : 'Upload Bukti Bayar (DP)'
    ),

    // 2. Upload Bukti Lunas
    createElement(
      'button',
      {
        type: 'button',
        onClick: () => (hasPaidProof ? openViewModal() : openUploadModal('paid')),
        className: `${buttonBase} ${hasPaidProof ? successBtn : activeBtn}`,
        title: hasPaidProof ? 'Lihat Bukti Lunas (Status: Lunas)' : 'Unggah Bukti Pelunasan',
      },
      hasPaidProof ? Icon('Check', { className: 'w-3 h-3 text-emerald-600' }) : Icon('Upload', { className: 'w-3 h-3 text-slate-500' }),
      hasPaidProof ? 'Bukti Lunas (LUNAS)' : 'Upload Bukti (LUNAS)'
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
// Order Portfolio Cell (Showcase Toggle & Photos Preview)
// ============================================================================

export function OrderPortfolioCell(order: OrderItem, send: any) {
  const isPortfolio = Boolean(order.is_portfolio);
  const images = Array.isArray(order.portfolio_images) ? order.portfolio_images : [];

  const handleToggle = () => {
    send.submit(
      {
        intent: 'toggle-portfolio',
        id: order.id,
        is_portfolio: isPortfolio ? '0' : '1',
      },
      { method: 'post' }
    );
  };

  const handleOpenPortfolioModal = () => {
    modals.open('ORDER_PORTFOLIO_MODAL', {
      order,
      onSubmit: (payload: any) =>
        send.submit({ intent: 'update-portfolio', id: order.id, ...payload }, { method: 'post' }),
    });
  };

  return createElement(
    'div',
    { className: 'flex flex-col items-center gap-1 py-1' },
    createElement(
      'button',
      {
        type: 'button',
        onClick: handleToggle,
        title: isPortfolio ? 'Hapus dari Portofolio' : 'Tampilkan di Portofolio',
        className: `inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
          isPortfolio
            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-2xs'
            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
        }`,
      },
      Icon(isPortfolio ? 'Star' : 'Star', {
        className: `w-3 h-3 ${isPortfolio ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`
      }),
      isPortfolio ? 'Showcase' : 'Jadikan Portofolio'
    ),
    createElement(
      'button',
      {
        type: 'button',
        onClick: handleOpenPortfolioModal,
        className: 'text-[10px] text-slate-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer',
      },
      Icon('Camera', { className: 'w-2.5 h-2.5' }),
      images.length > 0 ? `${images.length} Foto Siap` : 'Kelola Foto'
    )
  );
}

// ============================================================================
// Order Columns Definition
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
      key: 'daftar_produk',
      header: 'Daftar Produk & Varian',
      minWidth: '180px',
      cell: (row) => OrderProductListCell(row),
    },
    {
      key: 'jumlah',
      header: 'Jumlah',
      width: '75px',
      center: true,
      cell: (row) => createElement('span', { className: 'text-xs font-bold text-slate-900' }, `${row.total_qty} pcs`),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      width: '95px',
      cell: (row) => createElement('span', { className: 'text-xs text-slate-600 font-medium' }, row.deadline_at || '-'),
    },
    {
      key: 'totalAmount',
      header: 'Total Bayar',
      width: '135px',
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
      key: 'statusPembayaran',
      header: 'Status Pembayaran',
      width: '190px',
      cell: (row) => OrderPaymentProofCell(row, send),
    },
    {
      key: 'portofolio',
      header: 'Portofolio',
      width: '135px',
      center: true,
      cell: (row) => OrderPortfolioCell(row, send),
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
      key: 'link',
      header: 'Folder Drive',
      minWidth: '130px',
      cell: (row) => OrderDriveLinksCell(row),
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
          (row.status === 'completed' || row.payment_status === 'paid')
            ? createElement(TableActionButton, {
                icon: 'CheckCircle2',
                title: 'Settle & Pindahkan ke Riwayat Arsip',
                variant: 'success',
                onClick: () =>
                  ConfirmDialog.confirm({
                    title: 'Settle & Arsipkan Pesanan?',
                    text: `Pesanan ${row.order_number} (${row.customer_name}) akan disettle dan dipindahkan ke Riwayat Pesanan & Portofolio Showcase.`,
                    confirmButtonText: 'Ya, Settle & Arsipkan',
                    onConfirm: () =>
                      send.submit(
                        { intent: 'settle-order', id: row.id, is_portfolio: row.is_portfolio ? 1 : 0 },
                        { method: 'post' }
                      ),
                  }),
              })
            : null,
          createElement(TableActionButton, {
            icon: 'FileText',
            title: 'Lihat Nota',
            variant: 'warning',
            onClick: () => {
              modals.open('VIEW_NOTA_MODAL', { order: row });
            },
          }),
          createElement(TableActionButton, {
            icon: 'Camera',
            title: 'Portofolio',
            variant: 'info',
            onClick: () => {
              modals.open('ORDER_PORTFOLIO_MODAL', {
                order: row,
                onSubmit: (payload: any) =>
                  send.submit({ intent: 'update-portfolio', id: row.id, ...payload }, { method: 'post' }),
              });
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
// Modals: UploadPaymentProofModal, ViewPaymentProofModal, ZoomProofModal, OrderPortfolioModal, ViewNotaModal
// ============================================================================

export function UploadPaymentProofModal({ open, onClose, order, sourceUpload = 'down_payment', onSubmit }: any) {
  const [targetBank, setTargetBank] = useState<string>('bsi');
  const [proofUrl, setProofUrl] = useState<string>('/capkinau.png');
  const [paidAmount, setPaidAmount] = useState<number>(() => {
    if (sourceUpload === 'down_payment') {
      return order?.dp_amount || Math.round((order?.grand_total || 0) * 0.5);
    }
    return order?.grand_total || 0;
  });

  if (!open || !order) return null;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit?.({
      payment_proof: sourceUpload === 'paid' ? proofUrl : undefined,
      dp_payment_proof: sourceUpload === 'down_payment' ? proofUrl : undefined,
      payment_method: targetBank,
      payment_status: sourceUpload === 'paid' ? 'paid' : 'down_payment',
      paid_amount: paidAmount,
      source_upload: sourceUpload,
    });
    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: sourceUpload === 'down_payment' ? 'Upload Bukti Bayar (DP)' : 'Upload Bukti Pelunasan',
      description:
        sourceUpload === 'down_payment'
          ? `Unggah bukti transfer uang muka untuk pesanan #${order.order_number}. Status otomatis menjadi DP Diterima.`
          : `Unggah bukti transfer pelunasan untuk pesanan #${order.order_number}. Status otomatis menjadi Lunas.`,
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
          createElement('option', { value: 'bsi' }, 'Bank Syariah Indonesia (BSI) - 7366544822 (PT KINAU DIGITAL KREATIF)'),
          BANK_ACCOUNTS_PRESET.map((bank) =>
            createElement('option', { key: bank.id, value: bank.id }, `${bank.name} (${bank.account_number})`)
          )
        )
      ),

      // Nominal Pembayaran
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Nominal Ditransfer (Rp)'),
        createElement('input', {
          type: 'number',
          value: paidAmount,
          onChange: (e: any) => setPaidAmount(Number(e.target.value) || 0),
          className:
            'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none font-bold text-slate-900',
          required: true,
        })
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
        createElement('p', { className: 'text-[11px] text-slate-500' }, 'Format JPG, PNG, atau WebP.')
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
      // Status Info Banner
      createElement(
        'div',
        { className: 'p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4 flex-wrap' },
        createElement(
          'div',
          { className: 'space-y-0.5' },
          createElement('span', { className: 'text-xs text-slate-500 font-medium block' }, 'Status Pembayaran Saat Ini:'),
          createElement(
            'div',
            { className: 'flex items-center gap-2' },
            createElement(
              'span',
              {
                className: `inline-block px-2.5 py-1 rounded text-xs font-bold ${
                  order.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : order.payment_status === 'down_payment' || order.payment_status === 'partial_dp'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`,
              },
              PAYMENT_STATUS_BADGES[order.payment_status]?.label ||
                (order.payment_status === 'paid'
                  ? 'Lunas'
                  : order.payment_status === 'down_payment'
                  ? 'DP Terbayar'
                  : 'Belum Bayar')
            ),
            order.payment_status === 'paid'
              ? createElement(
                  'span',
                  { className: 'text-[11px] text-emerald-700 font-medium flex items-center gap-1' },
                  Icon('CheckCircle', { className: 'w-3.5 h-3.5' }),
                  'Pembayaran Telah Lunas'
                )
              : order.payment_status === 'down_payment'
              ? createElement('span', { className: 'text-[11px] text-amber-700 font-medium' }, 'DP Diterima, menunggu pelunasan.')
              : null
          )
        ),
        createElement(
          'div',
          { className: 'text-right' },
          createElement('span', { className: 'text-[11px] text-slate-400 block' }, 'Sinkronisasi Otomatis'),
          createElement('span', { className: 'text-xs font-semibold text-slate-600' }, 'Status terbarui saat upload bukti')
        )
      ),

      // Dual Proof Cards
      createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        // 1. Bukti DP
        order.dp_payment_proof
          ? createElement(
              'div',
              { className: 'border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2' },
              createElement(
                'div',
                { className: 'flex items-center justify-between' },
                createElement(
                  'span',
                  { className: 'px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200' },
                  'Bukti DP (Status: DP Diterima)'
                ),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      ConfirmDialog.delete({
                        name: 'Bukti Pembayaran DP',
                        onConfirm: () => {
                          onDeleteProof?.('dp_payment_proof');
                        },
                      });
                    },
                    className: 'p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer',
                    title: 'Hapus Bukti DP',
                  },
                  Icon('Trash2', { className: 'w-3.5 h-3.5' })
                )
              ),
              createElement(
                'div',
                {
                  onClick: () =>
                    modals.open('ZOOM_PROOF_MODAL', {
                      proofUrl: getResourceUrl(order.dp_payment_proof),
                      title: 'Bukti Pembayaran DP',
                    }),
                  className:
                    'w-full h-56 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2 cursor-zoom-in hover:border-slate-400 transition-colors',
                },
                createElement('img', {
                  src: getResourceUrl(order.dp_payment_proof),
                  alt: 'Bukti DP',
                  className: 'max-h-full max-w-full object-contain',
                })
              ),
              createElement('p', { className: 'text-[10px] text-center text-slate-500' }, 'Klik gambar untuk memperbesar')
            )
          : createElement(
              'div',
              {
                className:
                  'border border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-1 text-slate-400',
              },
              Icon('Upload', { className: 'w-6 h-6 text-slate-300' }),
              createElement('p', { className: 'text-xs font-semibold' }, 'Belum ada bukti DP'),
              createElement('p', { className: 'text-[10px]' }, 'Upload melalui tabel pesanan')
            ),

        // 2. Bukti Lunas
        order.payment_proof
          ? createElement(
              'div',
              { className: 'border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2' },
              createElement(
                'div',
                { className: 'flex items-center justify-between' },
                createElement(
                  'span',
                  { className: 'px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200' },
                  'Bukti Pelunasan (Status: Lunas)'
                ),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      ConfirmDialog.delete({
                        name: 'Bukti Pelunasan',
                        onConfirm: () => {
                          onDeleteProof?.('payment_proof');
                        },
                      });
                    },
                    className: 'p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer',
                    title: 'Hapus Bukti Pelunasan',
                  },
                  Icon('Trash2', { className: 'w-3.5 h-3.5' })
                )
              ),
              createElement(
                'div',
                {
                  onClick: () =>
                    modals.open('ZOOM_PROOF_MODAL', {
                      proofUrl: getResourceUrl(order.payment_proof),
                      title: 'Bukti Pelunasan',
                    }),
                  className:
                    'w-full h-56 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2 cursor-zoom-in hover:border-slate-400 transition-colors',
                },
                createElement('img', {
                  src: getResourceUrl(order.payment_proof),
                  alt: 'Bukti Pelunasan',
                  className: 'max-h-full max-w-full object-contain',
                })
              ),
              createElement('p', { className: 'text-[10px] text-center text-slate-500' }, 'Klik gambar untuk memperbesar')
            )
          : createElement(
              'div',
              {
                className:
                  'border border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-1 text-slate-400',
              },
              Icon('Upload', { className: 'w-6 h-6 text-slate-300' }),
              createElement('p', { className: 'text-xs font-semibold' }, 'Belum ada bukti pelunasan'),
              createElement('p', { className: 'text-[10px]' }, 'Upload melalui tabel pesanan')
            )
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

export function ZoomProofModal({ open, onClose, proofUrl, title = 'Bukti Pembayaran' }: any) {
  if (!open || !proofUrl) return null;

  return Modal(
    {
      open,
      onClose,
      title: title,
      description: 'Pratinjau resolusi penuh bukti transfer.',
      size: 'xl',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-1' },
      createElement(
        'div',
        { className: 'w-full max-h-[70vh] bg-slate-900 rounded-xl flex items-center justify-center p-2 overflow-auto' },
        createElement('img', { src: proofUrl, alt: 'Zoom Bukti', className: 'max-h-[65vh] max-w-full object-contain rounded' })
      ),
      createElement(
        'div',
        { className: 'flex items-center justify-between pt-2' },
        createElement(
          'a',
          {
            href: proofUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline',
          },
          Icon('ExternalLink', { className: 'w-3.5 h-3.5' }),
          'Buka di Tab Baru'
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
// Order Portfolio Showcase Modal
// ============================================================================

export function OrderPortfolioModal({ open, onClose, order, onSubmit }: any) {
  const [isPortfolio, setIsPortfolio] = useState<boolean>(() => Boolean(order?.is_portfolio));
  const [images, setImages] = useState<string[]>(() => {
    if (Array.isArray(order?.portfolio_images)) return [...order.portfolio_images];
    return [];
  });
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  if (!open || !order) return null;

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit?.({
      is_portfolio: isPortfolio ? '1' : '0',
      images: JSON.stringify(images),
    });
    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: `Portofolio Showcase #${order.order_number}`,
      description: 'Kelola foto dokumentasi hasil produksi untuk ditampilkan di portofolio publik.',
      size: 'md',
    },
    createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-4 pt-1' },
      // Toggle Switch
      createElement(
        'div',
        { className: 'p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between' },
        createElement(
          'div',
          null,
          createElement('h4', { className: 'text-xs font-bold text-slate-900' }, 'Tampilkan di Portofolio Publik'),
          createElement('p', { className: 'text-[11px] text-slate-500' }, 'Aktifkan agar hasil pesanan ini muncul di halaman showcase & katalog web.')
        ),
        createElement('input', {
          type: 'checkbox',
          checked: isPortfolio,
          onChange: (e: any) => setIsPortfolio(e.target.checked),
          className: 'w-5 h-5 accent-[#103557] rounded cursor-pointer',
        })
      ),

      // Input Add Photo URL / Upload
      createElement(
        'div',
        { className: 'space-y-2' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Tambah Foto Hasil Produksi'),
        createElement(
          'div',
          { className: 'flex gap-2' },
          createElement('input', {
            type: 'text',
            placeholder: 'https://.../foto-produk.jpg atau nama file',
            value: newImageUrl,
            onChange: (e: any) => setNewImageUrl(e.target.value),
            className: 'flex-1 border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          }),
          createElement(
            'button',
            {
              type: 'button',
              onClick: handleAddImage,
              className: 'px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 cursor-pointer',
            },
            'Tambah'
          )
        ),
        createElement(
          'div',
          null,
          createElement('input', {
            type: 'file',
            accept: 'image/*',
            className: 'w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#103557] cursor-pointer',
            onChange: (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setImages([...images, url]);
              }
            },
          })
        )
      ),

      // Gallery Grid
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, `Galeri Foto (${images.length})`),
        images.length === 0
          ? createElement('div', { className: 'p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300' }, 'Belum ada foto portofolio.')
          : createElement(
              'div',
              { className: 'grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1' },
              images.map((imgUrl, i) =>
                createElement(
                  'div',
                  { key: i, className: 'relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square' },
                  createElement('img', { src: getResourceUrl(imgUrl), alt: `Foto ${i + 1}`, className: 'w-full h-full object-cover' }),
                  createElement(
                    'button',
                    {
                      type: 'button',
                      onClick: () => handleRemoveImage(i),
                      className: 'absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer',
                    },
                    Icon('Trash2', { className: 'w-3 h-3' })
                  )
                )
              )
            )
      ),

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
          'Simpan Portofolio'
        )
      )
    )
  );
}

// ============================================================================
// Print Nota Template & View Nota Modal (Seragam dengan Referensi NotaTemplate)
// ============================================================================

export interface PrintNotaTemplateProps {
  order: any;
  items?: any[];
  className?: string;
}

export const PrintNotaTemplate = React.forwardRef<HTMLDivElement, PrintNotaTemplateProps>(
  ({ order, items, className = '' }, ref) => {
    if (!order) return null;

    // Resolve order items safely
    const parsedItems = items || (Array.isArray(order.order_items) ? order.order_items : safeParseArray(order.order_items));
    const resolvedItems =
      parsedItems.length > 0
        ? parsedItems
        : [
            {
              product_name: order.product_name || 'Pesanan Merchandise Custom',
              variant_name: order.category ? `Kategori: ${order.category}` : '',
              qty: Number(order.total_qty) || 1,
              price_rule_value:
                Number(order.unit_price) || (Number(order.grand_total) || 0) / (Number(order.total_qty) || 1),
              variant_price: 0,
              variant_final_price: Number(order.grand_total) || Number(order.subtotal) || 0,
              notes: order.notes,
            },
          ];

    // Compute Subtotals & Amounts
    const computedItemsSubtotal = resolvedItems.reduce((sum: number, it: any) => {
      const itTotal = Number(it.variant_final_price) || 0;
      if (itTotal > 0) return sum + itTotal;
      const q = Number(it.qty) || 1;
      const p = (Number(it.price_rule_value) || 0) + (Number(it.variant_price) || 0) || Number(it.unit_price) || 0;
      return sum + (p > 0 ? q * p : Number(it.subtotal) || 0);
    }, 0);

    const discountAmount =
      Number(order.discount_total) || Number(order.discount_value) || Number(order.discount) || 0;
    const grandTotal =
      Number(order.grand_total) ||
      Number(order.total_amount) ||
      (computedItemsSubtotal > 0 ? Math.max(0, computedItemsSubtotal - discountAmount) : 0);
    const subtotal = computedItemsSubtotal > 0 ? computedItemsSubtotal : grandTotal + discountAmount;
    const total = discountAmount > 0 ? Math.max(0, subtotal - discountAmount) : grandTotal;
    const paid = Number(order.dp_amount) || Number(order.paid_amount) || 0;
    const remain = Math.max(0, total - paid);
    const isPaidOff =
      order.payment_status === 'paid' || (paid >= total && total > 0) || remain === 0 || !!order.payment_proof;

    // Customer & Instansi Resolution
    const isKkn = +(order.is_kkn ?? 0) === 1;
    const isSponsor = +(order.is_sponsor ?? 0) === 1;
    const kknDetail = safeParseObject(order.kkn_detail);
    const kknVal = kknDetail?.value ?? (typeof order.kkn_detail === 'string' ? order.kkn_detail : '');

    const pemesanName = isKkn
      ? order.kkn_type?.toLowerCase() === 'ppm'
        ? `Kelompok ${kknVal || order.institution_name}`
        : `Desa ${kknVal || order.institution_name}`
      : order.institution_name || order.customer_name || 'Pelanggan Kinau';

    const picDisplay = order.pic_name
      ? +order.is_personal !== 1
        ? `PJ: ${order.pic_name} (${order.pic_phone || order.customer_phone || '-'})`
        : order.pic_phone || order.customer_phone
      : order.customer_name && order.customer_name !== pemesanName
      ? `PIC: ${order.customer_name} (${order.customer_phone || '-'})`
      : order.customer_phone
      ? `Telp: ${order.customer_phone}`
      : null;

    // Status Badges
    const pBadge = PAYMENT_STATUS_BADGES[order.payment_status] || {
      label:
        order.payment_status === 'paid'
          ? 'Lunas'
          : order.payment_status === 'down_payment' || order.payment_status === 'partial_dp'
          ? 'DP Terbayar'
          : 'Belum Bayar',
    };
    const sBadge = ORDER_STATUS_BADGES[order.status] || {
      label:
        order.status === 'done' || order.status === 'completed'
          ? 'Selesai'
          : order.status === 'confirmed' || order.status === 'in_production'
          ? 'Diproses'
          : 'Pending',
    };

    return createElement(
      'div',
      {
        ref,
        className: `p-6 sm:p-8 bg-white text-gray-800 font-sans w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col print:p-0 print:max-w-none print:min-h-0 print:w-full ${className}`,
      },
      // Content Wrapper
      createElement(
        'div',
        { className: 'flex-1' },
        // 1. Header Section
        createElement(
          'div',
          { className: 'flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6' },
          createElement(
            'div',
            null,
            createElement(
              'div',
              { className: 'flex items-center gap-2 mb-2' },
              createElement('img', {
                src: '/kinau-logo.png',
                alt: 'Kinau',
                className: 'w-28 h-auto object-contain',
              })
            ),
            createElement(
              'div',
              { className: 'mb-1' },
              createElement('p', { className: 'text-[11px] font-bold text-gray-800 leading-tight uppercase' }, 'PT Kinau Digital Kreatif'),
              createElement(
                'div',
                { className: 'text-[9px] text-gray-500 font-mono mt-0.5 uppercase' },
                createElement('p', null, 'NIB: 0204260115049'),
                createElement('p', null, 'NPWP: 05.091.550.3-232.3000')
              )
            )
          ),
          createElement(
            'div',
            { className: 'text-right' },
            createElement('h2', { className: 'text-2xl font-black text-gray-900 uppercase tracking-tighter' }, 'NOTA PESANAN'),
            createElement('p', { className: 'text-sm font-mono text-gray-600 font-bold' }, `#${order.order_number || order.id}`),
            createElement(
              'p',
              { className: 'text-xs text-gray-500 mt-0.5' },
              `Tanggal: ${formatFullDate(order.created_on || order.created_at || order.created_by?.created_at)}`
            )
          )
        ),

        // 2. Info Pelanggan & Deadline Grid
        createElement(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8' },
          // Pemesan Box
          createElement(
            'div',
            { className: 'bg-gray-50 p-4 rounded-lg border border-gray-200' },
            createElement(
              'div',
              { className: 'flex justify-between items-start mb-1' },
              createElement('h3', { className: 'text-[10px] font-bold text-gray-400 uppercase tracking-wider' }, 'Pemesan'),
              isSponsor
                ? createElement(
                    'span',
                    {
                      className:
                        'bg-purple-600/10 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider',
                    },
                    'Partner / Sponsor'
                  )
                : null
            ),
            createElement('p', { className: 'font-bold text-lg text-gray-900 leading-tight' }, pemesanName),
            picDisplay ? createElement('p', { className: 'text-sm text-gray-600 mt-1' }, picDisplay) : null
          ),
          // Deadline & Status Box
          createElement(
            'div',
            { className: 'bg-gray-50 p-4 rounded-lg border border-gray-200' },
            createElement(
              'div',
              { className: 'flex justify-between items-start mb-2' },
              createElement(
                'div',
                null,
                createElement('h3', { className: 'text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1' }, 'Deadline'),
                createElement('p', { className: 'font-bold text-sm text-gray-900' }, formatFullDate(order.deadline_at || order.deadline))
              )
            ),
            createElement(
              'div',
              { className: 'flex justify-between items-center pt-2 border-t border-gray-200/60' },
              createElement(
                'div',
                null,
                createElement('h3', { className: 'text-[10px] font-bold text-gray-400 uppercase mb-1' }, 'Status Pembayaran'),
                createElement(
                  'span',
                  {
                    className: `text-xs font-bold px-2 py-1 text-white rounded uppercase ${
                      order.payment_status === 'paid'
                        ? 'bg-emerald-600'
                        : order.payment_status === 'down_payment' || order.payment_status === 'partial_dp'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`,
                  },
                  pBadge.label
                )
              ),
              createElement(
                'div',
                { className: 'text-right' },
                createElement('h3', { className: 'text-[10px] font-bold text-gray-400 uppercase mb-1' }, 'Status'),
                createElement(
                  'span',
                  {
                    className: `text-xs font-bold px-2 py-1 rounded uppercase ${
                      order.status === 'done' || order.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : order.status === 'pending'
                        ? 'bg-amber-500 text-white'
                        : order.status === 'confirmed' || order.status === 'in_production'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`,
                  },
                  sBadge.label
                )
              )
            )
          )
        ),

        // 3. Tabel Items
        createElement(
          'table',
          { className: 'w-full mb-8' },
          createElement(
            'thead',
            null,
            createElement(
              'tr',
              { className: 'border-b-2 border-gray-800' },
              createElement('th', { className: 'text-left py-3 text-xs font-bold uppercase text-gray-600' }, 'Deskripsi Produk'),
              createElement('th', { className: 'text-right py-3 text-xs font-bold uppercase text-gray-600 w-20' }, 'Qty'),
              createElement('th', { className: 'text-right py-3 text-xs font-bold uppercase text-gray-600 w-32' }, 'Harga'),
              createElement('th', { className: 'text-right py-3 text-xs font-bold uppercase text-gray-600 w-32' }, 'Subtotal')
            )
          ),
          createElement(
            'tbody',
            { className: 'divide-y divide-gray-200' },
            resolvedItems.map((item: any, idx: number) => {
              const unitPrice =
                (Number(item.price_rule_value) || 0) + (Number(item.variant_price) || 0) ||
                Number(item.unit_price) ||
                0;
              const finalPrice =
                Number(item.variant_final_price) ||
                (unitPrice > 0 ? unitPrice * (Number(item.qty) || 1) : Number(item.subtotal) || 0);

              return createElement(
                'tr',
                { key: idx, className: 'break-inside-avoid' },
                createElement(
                  'td',
                  { className: 'py-4 text-sm' },
                  createElement('span', { className: 'font-semibold text-gray-900' }, item.product_name || order.product_name),
                  item.variant_name
                    ? createElement('span', { className: 'text-blue-600 font-medium' }, ` (${item.variant_name})`)
                    : null,
                  item.notes
                    ? createElement('p', { className: 'text-[10px] text-gray-500 mt-0.5' }, item.notes)
                    : null
                ),
                createElement('td', { className: 'py-4 text-right text-sm text-gray-800' }, `${item.qty || 1}`),
                createElement('td', { className: 'py-4 text-right text-sm text-gray-800' }, formatCurrency(unitPrice)),
                createElement('td', { className: 'py-4 text-right font-bold text-sm text-gray-900' }, formatCurrency(finalPrice))
              );
            })
          )
        ),

        // 4. Ringkasan Biaya & Informasi Pembayaran
        createElement(
          'div',
          { className: 'flex flex-col sm:flex-row justify-between gap-6 mb-4' },
          // Informasi Pembayaran Box
          createElement(
            'div',
            { className: 'flex-1 p-4 bg-gray-50 border border-gray-200 rounded-lg' },
            createElement(
              'h3',
              { className: 'text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2' },
              createElement('span', { className: 'w-1 h-4 bg-gray-800 rounded' }),
              'Informasi Pembayaran'
            ),
            createElement(
              'div',
              { className: 'bg-white p-3 rounded border border-gray-200' },
              createElement('p', { className: 'text-sm font-semibold text-gray-800 mb-1' }, 'Bank Syariah Indonesia (BSI)'),
              createElement('p', { className: 'text-lg font-mono font-bold text-gray-900 tracking-wide' }, '7366544822'),
              createElement('p', { className: 'text-xs text-gray-600 mt-1.5' }, 'a.n PT KINAU DIGITAL KREATIF')
            )
          ),
          // Ringkasan Biaya Box
          createElement(
            'div',
            { className: 'w-full sm:w-72 space-y-2' },
            createElement(
              'div',
              { className: 'flex justify-between text-sm' },
              createElement('span', { className: 'text-gray-500' }, 'Total Tagihan'),
              createElement('span', { className: 'font-bold text-gray-900' }, formatCurrency(subtotal))
            ),
            discountAmount > 0
              ? createElement(
                  React.Fragment,
                  null,
                  createElement(
                    'div',
                    { className: 'flex justify-between text-sm' },
                    createElement('span', { className: 'text-gray-500' }, 'Diskon'),
                    createElement('span', { className: 'font-medium text-rose-600' }, `-${formatCurrency(discountAmount)}`)
                  ),
                  createElement(
                    'div',
                    { className: 'flex justify-between text-sm' },
                    createElement('span', { className: 'text-gray-500' }, 'Setelah Diskon'),
                    createElement('span', { className: 'font-bold text-gray-900' }, formatCurrency(total))
                  )
                )
              : null,
            createElement(
              'div',
              { className: 'flex justify-between text-sm' },
              createElement('span', { className: 'text-gray-500' }, 'Sudah Bayar (DP)'),
              createElement('span', { className: 'font-medium text-emerald-600' }, formatCurrency(paid))
            ),
            createElement(
              'div',
              { className: 'flex justify-between border-t border-gray-800 pt-2 text-sm' },
              createElement('span', { className: 'font-black text-gray-900 uppercase' }, 'SISA PEMBAYARAN'),
              createElement(
                'span',
                { className: `font-black ${isPaidOff ? 'text-emerald-600' : 'text-rose-600'}` },
                formatCurrency(remain)
              )
            ),
            isPaidOff
              ? createElement(
                  'div',
                  { className: 'flex items-center justify-end gap-1.5 text-[10px] text-emerald-600 font-black uppercase tracking-wider mt-1' },
                  Icon('CheckCircle', { className: 'w-3.5 h-3.5 text-emerald-600' }),
                  'PESANAN LUNAS'
                )
              : null
          )
        ),

        // 5. Footer Cetak (Terms & Signature Stamp)
        createElement(
          'div',
          { className: 'mt-6 pt-4 border-t border-dashed border-gray-200 flex justify-between items-end' },
          createElement(
            'div',
            { className: 'max-w-md' },
            createElement(
              'p',
              { className: 'text-xs text-gray-700' },
              'Link akses bukti pesanan: ',
              createElement(
                'span',
                { className: 'text-blue-600 font-semibold' },
                `kinau.id/public/drive-link/${order.order_number || order.id}`
              )
            ),
            createElement(
              'div',
              { className: 'text-[10px] text-gray-400 leading-relaxed mt-2' },
              createElement('p', { className: 'font-bold text-gray-600 mb-0.5' }, 'Syarat & Ketentuan:'),
              createElement('p', null, '1. Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.'),
              createElement('p', null, '2. Bukti nota ini sah sebagai bukti pengambilan barang.'),
              createElement(
                'p',
                null,
                '3. Nota ini digunakan untuk claim garansi atau cetak ulang jika cacat produksi (Oleh PJ atau pemesan bersangkutan).'
              ),
              createElement('p', null, '4. Cap basah dapat diminta, dengan membawa hardcopy nota ini pada saat pengambilan.')
            )
          ),
          createElement(
            'div',
            { className: 'text-center w-40 pt-1 relative' },
            createElement('p', { className: 'text-[10px] uppercase font-bold text-gray-700' }, 'Hormat Kami,'),
            createElement(
              'div',
              { className: 'relative h-16 flex items-center justify-center' },
              isPaidOff
                ? createElement('img', {
                    src: '/capkinau.png',
                    alt: 'Cap Kinau',
                    className: 'absolute w-24 opacity-80 pointer-events-none select-none',
                    style: { transform: 'rotate(-20deg)' },
                  })
                : null
            ),
            createElement('p', { className: 'text-xs border-t border-gray-800 font-bold text-gray-900 pt-1' }, 'Admin Kinau.id')
          )
        )
      ),

      // 6. Fixed Bottom Contact Footer
      createElement(
        'div',
        { className: 'mt-auto pt-6 border-t-2 border-gray-800' },
        createElement(
          'div',
          { className: 'text-center' },
          createElement('p', { className: 'text-xs font-bold text-gray-700 mb-2.5 tracking-wider uppercase' }, 'HUBUNGI KAMI'),
          createElement(
            'div',
            { className: 'flex flex-wrap justify-center gap-x-6 gap-y-1 text-[10px] text-gray-600' },
            createElement(
              'div',
              { className: 'flex items-center gap-1' },
              createElement('span', { className: 'font-semibold' }, 'WhatsApp:'),
              createElement('span', null, ADMIN_WA)
            ),
            createElement(
              'div',
              { className: 'flex items-center gap-1' },
              createElement('span', { className: 'font-semibold' }, 'Instagram:'),
              createElement('span', null, '@kinauid')
            ),
            createElement(
              'div',
              { className: 'flex items-center gap-1' },
              createElement('span', { className: 'font-semibold' }, 'Email:'),
              createElement('span', null, 'admin@kinau.id')
            ),
            createElement(
              'div',
              { className: 'flex items-center gap-1' },
              createElement('span', { className: 'font-semibold' }, 'Website:'),
              createElement('span', null, 'www.kinau.id')
            )
          ),
          createElement(
            'p',
            { className: 'text-[9px] text-gray-400 mt-2' },
            'Jalan Terusan Jl. Murai 1 No.7 , Kel. Korpri Raya, Kec. Sukarame, Kota Bandar Lampung, Lampung.'
          )
        )
      ),

      // 7. Embedded Print Style Block
      createElement('style', {
        dangerouslySetInnerHTML: {
          __html: `
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              @page { margin: 10mm; size: auto; }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .bg-gray-200 { background-color: #e5e7eb !important; }
              .no-print { display: none !important; }
            }
          `,
        },
      })
    );
  }
);

PrintNotaTemplate.displayName = 'PrintNotaTemplate';

// ============================================================================
// View Nota Modal Component
// ============================================================================

export function ViewNotaModal({ open, onClose, order }: any) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  if (!open || !order) return null;

  const driveLink = `https://kinau.id/public/drive-link/${order.order_number || order.id}`;
  const hasProof = Boolean(
    (order.dp_payment_proof && order.dp_payment_proof.trim() !== '') ||
      (order.payment_proof && order.payment_proof.trim() !== '')
  );
  const waUrl = getWhatsAppLink(
    ADMIN_WA,
    `Halo Admin Kinau, saya ingin menanyakan perihal nota pesanan #${order.order_number || order.id} (${order.institution_name || order.customer_name})`
  );
  const mapsUrl = getGoogleMapsLink('Kinau ID Percetakan Bandar Lampung');

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(driveLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyAccount = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText('7366544822');
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleOpenProof = () => {
    modals.open('VIEW_PAYMENT_PROOF_MODAL', {
      order,
    });
  };

  return Modal(
    {
      open,
      onClose,
      title: `Nota Resmi #${order.order_number || order.id}`,
      description: 'Pratinjau lembar nota resmi dan dokumen transaksi PT Kinau Digital Kreatif.',
      size: 'xl',
      bodyClassName: 'p-0 space-y-0 flex flex-col min-h-0',
    },
    createElement(
      'div',
      { className: 'flex flex-col flex-1 min-h-0 overflow-hidden' },
      // Interactive Quick Action Bar in Modal Preview (Hidden on Print)
      createElement(
        'div',
        {
          className:
            'p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0 no-print',
        },
        createElement(
          'div',
          { className: 'flex items-center gap-2 flex-wrap' },
          createElement(
            'a',
            {
              href: mapsUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
              className:
                'px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors',
            },
            Icon('MapPin', { className: 'w-3.5 h-3.5 text-rose-500' }),
            'Lokasi Workshop'
          ),
          createElement(
            'a',
            {
              href: waUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
              className:
                'px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5 transition-colors',
            },
            Icon('Phone', { className: 'w-3.5 h-3.5 text-emerald-600' }),
            'Hubungi Admin WA'
          ),
          hasProof
            ? createElement(
                'button',
                {
                  type: 'button',
                  onClick: handleOpenProof,
                  className:
                    'px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 transition-colors cursor-pointer',
                },
                Icon('Eye', { className: 'w-3.5 h-3.5 text-blue-600' }),
                'Lihat Bukti Bayar'
              )
            : null
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: handleCopyAccount,
            className:
              'px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer',
          },
          Icon(copiedAccount ? 'Check' : 'Copy', {
            className: `w-3.5 h-3.5 ${copiedAccount ? 'text-emerald-600' : 'text-slate-500'}`,
          }),
          copiedAccount ? 'No. Rekening Disalin!' : 'Salin BSI 7366544822'
        )
      ),

      // Scrollable Document Sheet
      createElement(
        'div',
        {
          className:
            'flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible space-y-4',
        },
        createElement(
          'div',
          {
            className:
              'bg-white shadow-md rounded-lg overflow-hidden border border-slate-200/80 mx-auto print:shadow-none print:border-none print:rounded-none',
          },
          createElement(PrintNotaTemplate, { order })
        ),
        // Customer Review Section (if present)
        order.review || order.rating
          ? createElement(
              'div',
              {
                className:
                  'max-w-[210mm] mx-auto bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1.5 no-print',
              },
              createElement(
                'h4',
                { className: 'text-xs font-bold text-amber-900 uppercase tracking-wider' },
                'Ulasan & Rating Pelanggan:'
              ),
              createElement(
                'div',
                { className: 'flex items-center gap-1' },
                Array.from({ length: 5 }).map((_, i) =>
                  createElement(
                    'span',
                    { key: i },
                    Icon('Star', {
                      className: `w-4 h-4 ${i < (order.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`,
                    })
                  )
                )
              ),
              order.review ? createElement('p', { className: 'text-xs italic text-amber-950 mt-1' }, `"${order.review}"`) : null
            )
          : null
      ),

      // Bottom Modal Actions (Hidden on Print)
      createElement(
        'div',
        {
          className:
            'flex items-center justify-between p-3.5 sm:p-4 bg-white border-t border-slate-200 gap-3 shrink-0 no-print',
        },
        createElement(
          'div',
          { className: 'flex items-center gap-2' },
          createElement(
            'button',
            {
              type: 'button',
              onClick: handleCopyLink,
              className:
                'px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer',
            },
            Icon(copiedLink ? 'Check' : 'Copy', {
              className: `w-3.5 h-3.5 ${copiedLink ? 'text-emerald-600' : 'text-slate-500'}`,
            }),
            copiedLink ? 'Link Tersalin!' : 'Salin Link Drive'
          ),
          createElement(
            'a',
            {
              href: `/public/drive-link/${order.order_number || order.id}`,
              target: '_blank',
              rel: 'noopener noreferrer',
              className:
                'px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 flex items-center gap-1.5 transition-colors',
            },
            Icon('ExternalLink', { className: 'w-3.5 h-3.5' }),
            'Buka Drive'
          )
        ),
        createElement(
          'div',
          { className: 'flex items-center gap-2.5' },
          createElement(
            'button',
            {
              type: 'button',
              onClick: onClose,
              className:
                'px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer',
            },
            'Tutup'
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: handlePrint,
              className:
                'px-4 py-2 bg-[#103557] text-white rounded-lg text-xs font-bold hover:bg-[#0c2842] shadow-2xs flex items-center gap-2 transition-all cursor-pointer',
            },
            Icon('Printer', { className: 'w-4 h-4' }),
            'Cetak Nota (Print)'
          )
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
          icon: 'Camera',
          title: 'Portofolio',
          variant: 'info',
          onClick: () => {
            modals.open('ORDER_PORTFOLIO_MODAL', {
              order,
              onSubmit: (payload: any) =>
                send.submit({ intent: 'update-portfolio', id: order.id, ...payload }, { method: 'post' }),
            });
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
