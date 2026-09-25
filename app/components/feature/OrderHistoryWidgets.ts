import React, { createElement, useState, useRef } from 'react';
import {
  Icon,
  Modal,
  Button,
  modals,
  ConfirmDialog,
  TableActionGroup,
  TableActionButton,
  type DataTableCardColumn,
  type TableTabItem,
  type ActiveFilterItem,
} from '~/builder';
import type { OrderItem, OrderState } from '~/schemas/order.schema';
import { OrderCustomerCell, OrderProductListCell } from './OrderListWidgets';
import { toast } from 'sonner';

export function getActiveHistoryFilterBadges(
  urlState: OrderState,
  updateUrlState: (s: Partial<OrderState>) => void
): ActiveFilterItem[] {
  const list: ActiveFilterItem[] = [];

  if (urlState.search) {
    list.push({
      key: 'search',
      label: 'Pencarian',
      value: urlState.search,
      onRemove: () => updateUrlState({ search: '' }),
    });
  }

  if (urlState.portfolio_only) {
    list.push({
      key: 'portfolio_only',
      label: 'Portofolio',
      value: 'Hanya yang Tampil di Web',
      onRemove: () => updateUrlState({ portfolio_only: false }),
    });
  }

  return list;
}

// ============================================================================
// Order History Table Columns
// ============================================================================

export function createOrderHistoryTableColumns(
  send: any,
  navigate?: (path: string) => void
): DataTableCardColumn<OrderItem>[] {
  return [
    {
      key: 'no',
      header: 'No',
      width: '45px',
      center: true,
      cell: (_row, idx) =>
        createElement('span', { className: 'text-xs font-semibold text-slate-500' }, (idx ?? 0) + 1),
    },
    {
      key: 'is_portfolio',
      header: 'Tampil di Web?',
      width: '110px',
      center: true,
      cell: (row) => {
        const isShow = Boolean(row.is_portfolio);
        return createElement(
          'button',
          {
            type: 'button',
            title: isShow ? 'Aktif tampil di Portofolio Landing Page (Klik untuk sembunyikan)' : 'Tidak tampil di Landing Page (Klik untuk tampilkan)',
            onClick: (e: any) => {
              e.stopPropagation();
              const nextVal = isShow ? 0 : 1;
              toast.info(
                nextVal === 1
                  ? `Mengaktifkan portofolio "${row.institution_name || row.customer_name}" di Landing Page...`
                  : `Menonaktifkan portofolio "${row.institution_name || row.customer_name}" dari Landing Page...`
              );
              send.submit(
                {
                  intent: 'toggle-portfolio',
                  id: row.id,
                  is_portfolio: nextVal,
                },
                { method: 'post' }
              );
            },
            className: `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isShow ? 'bg-blue-600 shadow-xs' : 'bg-slate-300'
            }`,
          },
          createElement('span', {
            className: `pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isShow ? 'translate-x-5' : 'translate-x-0'
            }`,
          })
        );
      },
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
      key: 'tanggal',
      header: 'Tanggal Pesanan',
      width: '110px',
      cell: (row) =>
        createElement(
          'span',
          { className: 'text-xs text-slate-600 font-medium' },
          row.created_at || '-'
        ),
    },
    {
      key: 'totalAmount',
      header: 'Total Bayar',
      width: '130px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement(
            'div',
            { className: 'font-bold text-xs text-slate-900' },
            `Rp ${(row.grand_total || 0).toLocaleString('id-ID')}`
          ),
          createElement(
            'span',
            {
              className:
                'inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200',
            },
            'LUNAS'
          )
        ),
    },
    {
      key: 'images',
      header: 'Foto Portofolio',
      minWidth: '130px',
      center: true,
      cell: (row) => {
        const imgs = row.portfolio_images || [];
        if (imgs.length === 0) {
          return createElement(
            'span',
            { className: 'text-[11px] text-slate-400 italic' },
            'Belum ada foto'
          );
        }
        return createElement(
          'div',
          { className: 'flex items-center justify-center -space-x-2 overflow-hidden py-1' },
          imgs.slice(0, 3).map((img, i) =>
            createElement('img', {
              key: i,
              src: img.startsWith('http') || img.startsWith('data:') ? img : `https://kinauid-backend.vercel.app/uploads/${img}`,
              alt: `Portfolio ${i + 1}`,
              className:
                'inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-sm bg-slate-100',
              onError: (e: any) => {
                e.target.src = 'https://placehold.co/100x100?text=Foto';
              },
            })
          ),
          imgs.length > 3
            ? createElement(
                'span',
                {
                  className:
                    'inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white shadow-sm',
                },
                `+${imgs.length - 3}`
              )
            : null
        );
      },
    },
    {
      key: 'ulasan',
      header: 'Rating & Ulasan',
      minWidth: '180px',
      cell: (row) => {
        const rating = Number(row.rating) || 5;
        const review = row.review || '';
        return createElement(
          'div',
          { className: 'space-y-1' },
          createElement(
            'div',
            { className: 'flex items-center gap-0.5' },
            Array.from({ length: 5 }).map((_, i) =>
              Icon('Star', {
                className: `w-3.5 h-3.5 ${
                  i < rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200 fill-slate-100'
                }`,
              })
            ),
            createElement(
              'span',
              { className: 'ml-1 text-[10px] font-bold text-slate-600' },
              `${rating}.0`
            )
          ),
          review
            ? createElement(
                'p',
                { className: 'text-[11px] text-slate-600 line-clamp-2 italic' },
                `"${review}"`
              )
            : createElement(
                'span',
                { className: 'text-[10px] text-slate-400 italic' },
                'Belum ada ulasan teks'
              )
        );
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      width: '100px',
      center: true,
      cell: (row) =>
        createElement(
          TableActionGroup,
          { size: 'sm' },
          createElement(TableActionButton, {
            icon: 'Edit3',
            title: 'Edit Portofolio & Ulasan',
            variant: 'info',
            onClick: () => {
              modals.open('EDIT_PORTFOLIO_MODAL', {
                order: row,
                onSubmit: (payload: any) =>
                  send.submit(
                    { intent: 'update-portfolio', id: row.id, ...payload },
                    { method: 'post' }
                  ),
              });
            },
          }),
          createElement(TableActionButton, {
            icon: 'FileText',
            title: 'Lihat Nota',
            variant: 'warning',
            onClick: () => {
              modals.open('VIEW_NOTA_MODAL', { order: row });
            },
          }),
          createElement(TableActionButton, {
            icon: 'Trash2',
            title: 'Hapus dari Arsip',
            variant: 'danger',
            onClick: () =>
              ConfirmDialog.delete({
                name: `Arsip ${row.order_number}`,
                onConfirm: () =>
                  send.submit({ intent: 'delete-order', id: row.id }, { method: 'post' }),
              }),
          })
        ),
    },
  ];
}

// ============================================================================
// Mobile Card Renderer for Order History
// ============================================================================

export function renderOrderHistoryMobileCard(
  order: OrderItem,
  idx: number,
  send: any,
  navigate?: (path: string) => void
) {
  const isShow = Boolean(order.is_portfolio);
  const rating = Number(order.rating) || 5;

  return createElement(
    'div',
    {
      key: order.id || idx,
      className:
        'bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs hover:border-blue-300 transition-colors',
    },
    createElement(
      'div',
      { className: 'flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5' },
      createElement(
        'div',
        { className: 'space-y-0.5' },
        createElement('div', { className: 'font-bold text-sm text-slate-900' }, order.customer_name),
        createElement(
          'div',
          { className: 'text-[11px] text-slate-500 font-mono' },
          `${order.order_number} · ${order.created_at || '-'}`
        )
      ),
      createElement(
        'button',
        {
          type: 'button',
          onClick: () =>
            send.submit(
              {
                intent: 'toggle-portfolio',
                id: order.id,
                is_portfolio: isShow ? 0 : 1,
              },
              { method: 'post' }
            ),
          className: `px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
            isShow
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`,
        },
        isShow ? '✓ Tampil di Web' : 'Sembunyi'
      )
    ),
    createElement(
      'div',
      { className: 'text-xs text-slate-700' },
      createElement('span', { className: 'font-semibold' }, order.product_name),
      createElement('span', { className: 'text-slate-500 ml-1' }, `(${order.total_qty} pcs)`)
    ),
    createElement(
      'div',
      { className: 'flex items-center justify-between text-xs pt-1' },
      createElement(
        'div',
        { className: 'flex items-center gap-1' },
        Array.from({ length: 5 }).map((_, i) =>
          Icon('Star', {
            className: `w-3.5 h-3.5 ${
              i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
            }`,
          })
        )
      ),
      createElement(
        'div',
        { className: 'font-bold text-sm text-slate-900' },
        `Rp ${(order.grand_total || 0).toLocaleString('id-ID')}`
      )
    ),
    createElement(
      'div',
      { className: 'flex items-center justify-end gap-2 pt-2 border-t border-slate-100' },
      createElement(Button, {
        label: 'Edit Portofolio',
        icon: 'Edit3',
        variant: 'secondary',
        size: 'sm',
        onClick: () => {
          modals.open('EDIT_PORTFOLIO_MODAL', {
            order,
            onSubmit: (payload: any) =>
              send.submit(
                { intent: 'update-portfolio', id: order.id, ...payload },
                { method: 'post' }
              ),
          });
        },
      }),
      createElement(Button, {
        label: 'Nota',
        icon: 'FileText',
        variant: 'outline',
        size: 'sm',
        onClick: () => {
          modals.open('VIEW_NOTA_MODAL', { order });
        },
      })
    )
  );
}

// ============================================================================
// Modal: Edit Portfolio & Review
// ============================================================================

export function EditPortfolioModal({
  open,
  onClose,
  order,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  order: OrderItem;
  onSubmit: (payload: any) => void;
}) {
  const [images, setImages] = useState<string[]>(
    order?.portfolio_images || (Array.isArray(order?.images) ? order.images : [])
  );
  const [review, setReview] = useState(order?.review || '');
  const [rating, setRating] = useState(Number(order?.rating) || 5);
  const [isPortfolio, setIsPortfolio] = useState(Boolean(order?.is_portfolio));
  const [newImageUrl, setNewImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImages((prev) => [...prev, String(event.target?.result)]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSave = () => {
    onSubmit({
      images,
      review,
      rating,
      is_portfolio: isPortfolio ? 1 : 0,
    });
    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: 'Edit Portofolio & Ulasan Pesanan',
      description: `Kelola foto hasil produksi, rating bintang, dan testimoni untuk ${order?.order_number || ''}`,
      size: 'lg',
    },
    createElement(
      'div',
      { className: 'space-y-5 pt-2' },
      // 1. Toggle Showcase
      createElement(
        'div',
        {
          className:
            'flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl',
        },
        createElement(
          'div',
          { className: 'space-y-0.5' },
          createElement(
            'label',
            { className: 'text-xs font-bold text-blue-950 block' },
            'Tampilkan di Landing Page Portofolio?'
          ),
          createElement(
            'p',
            { className: 'text-[11px] text-blue-700' },
            'Jika diaktifkan, foto dan ulasan ini akan muncul di galeri publik landing page.'
          )
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setIsPortfolio(!isPortfolio),
            className: `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isPortfolio ? 'bg-blue-600' : 'bg-slate-300'
            }`,
          },
          createElement('span', {
            className: `pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isPortfolio ? 'translate-x-5' : 'translate-x-0'
            }`,
          })
        )
      ),

      // 2. Foto Hasil Produksi
      createElement(
        'div',
        { className: 'space-y-2' },
        createElement(
          'label',
          { className: 'block text-xs font-bold text-slate-800' },
          'Foto Hasil Produksi / Cetak'
        ),
        createElement(
          'div',
          { className: 'grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1' },
          images.map((img, idx) =>
            createElement(
              'div',
              { key: idx, className: 'relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs' },
              createElement('img', {
                src: img.startsWith('http') || img.startsWith('data:') ? img : `https://kinauid-backend.vercel.app/uploads/${img}`,
                alt: `Foto ${idx + 1}`,
                className: 'w-full h-full object-cover',
              }),
              createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => handleRemoveImage(idx),
                  className:
                    'absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer hover:bg-rose-700',
                },
                Icon('X', { className: 'w-3.5 h-3.5' })
              )
            )
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => fileInputRef.current?.click(),
              className:
                'aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 transition-all cursor-pointer',
            },
            Icon('UploadCloud', { className: 'w-6 h-6 mb-1 text-slate-400' }),
            createElement('span', { className: 'text-[11px] font-bold' }, 'Upload Foto')
          ),
          createElement('input', {
            type: 'file',
            ref: fileInputRef,
            multiple: true,
            accept: 'image/*',
            onChange: handleFileUpload,
            className: 'hidden',
          })
        ),
        createElement(
          'div',
          { className: 'flex gap-2 pt-1' },
          createElement('input', {
            type: 'text',
            value: newImageUrl,
            onChange: (e: any) => setNewImageUrl(e.target.value),
            placeholder: 'Atau tempel URL gambar...',
            className:
              'flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          }),
          createElement(
            'button',
            {
              type: 'button',
              onClick: handleAddUrl,
              className:
                'px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer',
            },
            'Tambah'
          )
        )
      ),

      // 3. Rating Bintang
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement(
          'label',
          { className: 'block text-xs font-bold text-slate-800' },
          'Rating Kepuasan Pelanggan (1–5 Bintang)'
        ),
        createElement(
          'div',
          { className: 'flex items-center gap-2 pt-1' },
          [1, 2, 3, 4, 5].map((star) =>
            createElement(
              'button',
              {
                key: star,
                type: 'button',
                onClick: () => setRating(star),
                className: 'p-1 hover:scale-110 transition-transform cursor-pointer',
              },
              Icon('Star', {
                className: `w-7 h-7 ${
                  star <= rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200 fill-slate-100'
                }`,
              })
            )
          ),
          createElement(
            'span',
            { className: 'ml-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md' },
            `${rating} dari 5 Bintang`
          )
        )
      ),

      // 4. Testimoni / Ulasan Pelanggan
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement(
          'label',
          { className: 'block text-xs font-bold text-slate-800' },
          'Ulasan / Testimoni Pelanggan'
        ),
        createElement('textarea', {
          rows: 3,
          value: review,
          onChange: (e: any) => setReview(e.target.value),
          placeholder: 'Tuliskan ulasan hasil pesanan dari pelanggan atau kutipan testimoni...',
          className:
            'w-full border border-slate-300 rounded-lg p-3 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] outline-none',
        })
      ),

      // Actions Footer
      createElement(
        'div',
        { className: 'flex items-center justify-end gap-2 pt-3 border-t border-slate-200' },
        createElement(Button, {
          label: 'Batal',
          variant: 'outline',
          size: 'md',
          onClick: onClose,
        }),
        createElement(Button, {
          label: 'Simpan Portofolio',
          icon: 'Check',
          variant: 'primary',
          size: 'md',
          onClick: handleSave,
        })
      )
    )
  );
}

// ============================================================================
// Modal: Add Old Production Archive
// ============================================================================

export function AddArchiveModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
}) {
  const [formData, setFormData] = useState({
    institution_name: '',
    pic_name: '',
    pic_phone: '',
    product_name: '',
    total_qty: '' as any,
    total_amount: '' as any,
    order_date: new Date().toISOString().split('T')[0],
    review: '',
    rating: 5,
    is_portfolio: true,
    is_kkn: false,
    images: [] as string[],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, String(event.target?.result)],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSave = () => {
    if (!formData.institution_name.trim()) return;
    onSubmit({
      ...formData,
      is_portfolio: formData.is_portfolio ? 1 : 0,
      is_kkn: formData.is_kkn ? 1 : 0,
    });
    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: 'Tambah Arsip Produksi Lama',
      description: 'Catat riwayat pesanan terdahulu untuk dimasukkan ke dalam galeri portofolio & arsip.',
      size: 'lg',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-2' },
      createElement(
        'div',
        { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Nama Instansi / Komunitas *'),
          createElement('input', {
            type: 'text',
            required: true,
            value: formData.institution_name,
            onChange: (e: any) => setFormData({ ...formData, institution_name: e.target.value }),
            placeholder: 'Contoh: BEM FKIP Unila',
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          })
        ),
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Nama PIC / Pemesan'),
          createElement('input', {
            type: 'text',
            value: formData.pic_name,
            onChange: (e: any) => setFormData({ ...formData, pic_name: e.target.value }),
            placeholder: 'Contoh: Rian Pratama',
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          })
        ),
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Produk yang Diproduksi *'),
          createElement('input', {
            type: 'text',
            value: formData.product_name,
            onChange: (e: any) => setFormData({ ...formData, product_name: e.target.value }),
            placeholder: 'Contoh: Jersey Milano Fullprint',
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          })
        ),
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Tanggal Pesanan'),
          createElement('input', {
            type: 'date',
            value: formData.order_date,
            onChange: (e: any) => setFormData({ ...formData, order_date: e.target.value }),
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          })
        ),
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Jumlah Qty (Pcs)'),
          createElement('input', {
            type: 'number',
            value: formData.total_qty ?? '',
            placeholder: 'Contoh: 50',
            onChange: (e: any) => setFormData({ ...formData, total_qty: e.target.value ? Number(e.target.value) : '' }),
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          })
        ),
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Total Nilai Pesanan (Rp)'),
          createElement('input', {
            type: 'number',
            value: formData.total_amount ?? '',
            placeholder: 'Contoh: 6250000',
            onChange: (e: any) => setFormData({ ...formData, total_amount: e.target.value ? Number(e.target.value) : '' }),
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          })
        )
      ),

      // Foto & Ulasan
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Ulasan / Testimoni'),
        createElement('textarea', {
          rows: 2,
          value: formData.review,
          onChange: (e: any) => setFormData({ ...formData, review: e.target.value }),
          className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
        })
      ),

      // Upload Foto
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Foto Hasil Produksi'),
        createElement(
          'div',
          { className: 'flex items-center gap-2' },
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => fileInputRef.current?.click(),
              className: 'px-3 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer',
            },
            Icon('UploadCloud', { className: 'w-4 h-4 text-slate-500' }),
            'Pilih Foto'
          ),
          createElement('span', { className: 'text-xs text-slate-500' }, `${formData.images.length} foto dipilih`),
          createElement('input', {
            type: 'file',
            ref: fileInputRef,
            multiple: true,
            accept: 'image/*',
            onChange: handleFileUpload,
            className: 'hidden',
          })
        )
      ),

      // Checkbox Tampil
      createElement(
        'label',
        { className: 'flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-1' },
        createElement('input', {
          type: 'checkbox',
          checked: formData.is_portfolio,
          onChange: (e: any) => setFormData({ ...formData, is_portfolio: e.target.checked }),
          className: 'rounded border-slate-300 text-[#103557] focus:ring-[#103557]',
        }),
        'Langsung tampilkan di Portofolio Landing Page'
      ),

      // Actions Footer
      createElement(
        'div',
        { className: 'flex items-center justify-end gap-2 pt-3 border-t border-slate-200' },
        createElement(Button, {
          label: 'Batal',
          variant: 'outline',
          size: 'md',
          onClick: onClose,
        }),
        createElement(Button, {
          label: 'Simpan Arsip',
          icon: 'Check',
          variant: 'primary',
          size: 'md',
          onClick: handleSave,
        })
      )
    )
  );
}
