import React, { createElement, useState, useEffect, useRef, type ReactNode } from 'react';
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
  type DataTableCardColumn,
  type TableTabItem,
  type ActiveFilterItem,
} from '~/builder';
import {
  type ProductItem,
  type ProductCategoryItem,
  type ProductPriceRule,
  type ProductVariant,
  type ProductDriveFolder,
  type ProductState,
  PRODUCT_TABS,
  PRODUCT_TYPE_OPTIONS,
  DRIVE_FOLDER_OPTIONS,
} from '~/schemas/product.schema';
import { formatCurrency, formatNumberInput, parseCurrency } from '~/utils/format';
import { getResourceUrl } from '~/utils/resource';
import { toast } from 'sonner';
import { cn } from '~/lib/utils';



// Helper to sanitize undefined / null strings from backend
export function sanitizeString(val?: string | null): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (trimmed === 'undefined' || trimmed === 'null') return '';
  return trimmed;
}

// ============================================================================
// 1. Price Input Component (Clean Currency Formatter with Rp Prefix)
// ============================================================================

export function PriceInput({
  value,
  placeholder = '0',
  className = '',
  onChange,
  disabled = false,
}: {
  value?: number;
  placeholder?: string;
  className?: string;
  onChange?: (val: number) => void;
  disabled?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(formatNumberInput(value || ''));
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setDisplayValue(formatNumberInput(value || ''));
      prevValueRef.current = value;
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setDisplayValue(formatNumberInput(raw));
    const parsed = parseCurrency(raw);
    onChange?.(parsed);
  };

  return createElement(
    'div',
    { className: `relative flex-1 ${className}` },
    createElement(
      'span',
      { className: 'absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none' },
      'Rp'
    ),
    createElement('input', {
      type: 'text',
      disabled,
      className:
        'w-full border border-slate-300 rounded-lg p-2 pl-8 text-xs md:text-sm font-bold text-right text-slate-800 outline-none focus:ring-1 focus:ring-[#103557] focus:border-[#103557] transition-all bg-white disabled:bg-slate-50 disabled:text-slate-400',
      value: displayValue,
      placeholder,
      onChange: handleInputChange,
    })
  );
}

// ============================================================================
// 2. Active Filter Badges Helper
// ============================================================================

export function getProductActiveFilterBadges(
  urlState: ProductState,
  categories: ProductCategoryItem[],
  updateUrlState: (s: Partial<ProductState>) => void
): ActiveFilterItem[] {
  const list: ActiveFilterItem[] = [];

  if (urlState.category && urlState.category !== 'all') {
    const opt = categories.find((c) => String(c.id) === String(urlState.category));
    list.push({
      key: 'category',
      label: 'Kategori',
      value: opt?.name || urlState.category,
      onRemove: () => updateUrlState({ category: 'all' }),
    });
  }

  if (urlState.show_in_dashboard && urlState.show_in_dashboard !== 'all') {
    list.push({
      key: 'show_in_dashboard',
      label: 'Dashboard',
      value: urlState.show_in_dashboard === '1' ? 'Ditampilkan' : 'Disembunyikan',
      onRemove: () => updateUrlState({ show_in_dashboard: 'all' }),
    });
  }

  return list;
}

// ============================================================================
// 3. Product Cell Renderers
// ============================================================================

export function ProductItemCell(product: ProductItem) {
  const rawImg = sanitizeString(product.image);
  const imgUrl = rawImg ? getResourceUrl(rawImg) : '';
  const desc = sanitizeString(product.description);
  const hasImage = Boolean(imgUrl);

  return createElement(
    'div',
    { className: 'flex items-center gap-3 py-1.5' },
    createElement(
      'div',
      {
        className:
          'w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center',
      },
      hasImage
        ? createElement('img', {
            src: imgUrl,
            className: 'w-full h-full object-cover',
            alt: product.name,
          })
        : Icon('Tag', { className: 'w-5 h-5 text-slate-400' })
    ),
    createElement(
      'div',
      { className: 'min-w-0 max-w-[240px]' },
      createElement(
        'div',
        { className: 'font-bold text-xs md:text-sm text-slate-900 truncate' },
        product.name
      ),
      desc
        ? createElement(
            'div',
            { className: 'text-[11px] text-slate-500 truncate max-w-[220px]' },
            desc
          )
        : null
    )
  );
}

export function ProductPriceCell(product: ProductItem) {
  const defaultVariant = product.product_variants?.find((v) => +v.is_default === 1);
  const basePrice = defaultVariant
    ? defaultVariant.base_price
    : product.product_price_rules?.[0]?.price || product.total_price || 0;

  const hasVariantsWithoutDefault =
    (product.product_variants?.length || 0) > 0 && !defaultVariant;

  return createElement(
    'div',
    { className: 'space-y-0.5' },
    createElement(
      'div',
      { className: 'font-bold text-xs md:text-sm text-slate-900' },
      formatCurrency(basePrice)
    ),
    hasVariantsWithoutDefault
      ? createElement(
          'span',
          { className: 'text-[10px] text-rose-500 font-bold block' },
          '⚠ Default belum diset'
        )
      : product.product_price_rules && product.product_price_rules.length > 1
      ? createElement(
          'span',
          { className: 'text-[10px] text-emerald-600 font-medium block' },
          `${product.product_price_rules.length} level grosir`
        )
      : null
  );
}

// ============================================================================
// 4. Product Expanded Row Component (Collapsible Preview matching Reference)
// ============================================================================

export function ProductExpandedRow(product: ProductItem) {
  const priceRules = product.product_price_rules || [];
  const variants = product.product_variants || [];
  const desc = sanitizeString(product.description);

  return createElement(
    'div',
    { className: 'px-6 py-4 bg-[#F8FAFC] border-t border-slate-100' },
    createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl' },
      // 1. Aturan Harga Grosir
      createElement(
        'div',
        null,
        createElement(
          'h4',
          { className: 'text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5' },
          Icon('DollarSign', { className: 'w-3 h-3 text-slate-400' }),
          'Aturan Harga Grosir'
        ),
        priceRules.length > 0
          ? createElement(
              'div',
              { className: 'space-y-1.5' },
              priceRules.map((rule, idx) =>
                createElement(
                  'div',
                  {
                    key: idx,
                    className:
                      'flex justify-between items-center text-xs bg-white px-3 py-2 rounded-lg border border-slate-200/80 shadow-2xs',
                  },
                  createElement(
                    'span',
                    { className: 'text-slate-600' },
                    '≥ ',
                    createElement('span', { className: 'font-bold text-[#1E293B]' }, rule.min_qty),
                    ' pcs'
                  ),
                  createElement(
                    'span',
                    { className: 'font-bold text-[#103557]' },
                    formatCurrency(rule.price)
                  )
                )
              )
            )
          : createElement('p', { className: 'text-xs text-slate-400 italic' }, 'Tidak ada aturan grosir')
      ),
      // 2. Variasi Produk
      createElement(
        'div',
        null,
        createElement(
          'h4',
          { className: 'text-[10px] font-bold text-[#0097B2] uppercase tracking-widest mb-2 flex items-center gap-1.5' },
          Icon('Layers', { className: 'w-3 h-3 text-[#0097B2]' }),
          'Variasi Produk'
        ),
        variants.length > 0
          ? createElement(
              'div',
              { className: 'space-y-1.5' },
              variants.map((v, idx) => {
                const isDefault = +v.is_default === 1;
                return createElement(
                  'div',
                  {
                    key: idx,
                    className: cn(
                      'flex justify-between items-center text-xs px-3 py-2 rounded-lg border shadow-2xs transition-colors',
                      isDefault ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-slate-200/80'
                    ),
                  },
                  createElement(
                    'div',
                    { className: 'flex items-center gap-1.5' },
                    isDefault
                      ? Icon('Star', { className: 'w-3.5 h-3.5 text-amber-500 fill-amber-500' })
                      : null,
                    createElement(
                      'span',
                      { className: isDefault ? 'text-amber-900 font-bold' : 'text-[#1E293B] font-medium' },
                      v.variant_name
                    ),
                    isDefault
                      ? createElement(
                          'span',
                          {
                            className:
                              'text-[8px] bg-amber-200/90 text-amber-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider',
                          },
                          'Default'
                        )
                      : null
                  ),
                  createElement(
                    'span',
                    { className: cn('font-bold', isDefault ? 'text-amber-900' : 'text-[#103557]') },
                    `+${formatCurrency(v.base_price)}`
                  )
                );
              })
            )
          : createElement('p', { className: 'text-xs text-slate-400 italic' }, 'Tidak ada variasi')
      )
    ),
    // 3. Deskripsi
    desc
      ? createElement(
          'div',
          { className: 'mt-4 pt-3 border-t border-slate-200/60 max-w-4xl' },
          createElement(
            'h4',
            { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1' },
            'Deskripsi'
          ),
          createElement('p', { className: 'text-xs text-slate-600 leading-relaxed' }, desc)
        )
      : null
  );
}

// ============================================================================
// 5. Product Table Columns
// ============================================================================

export function createProductTableColumns(
  send: any,
  categories: ProductCategoryItem[]
): DataTableCardColumn<ProductItem>[] {
  return [
    {
      key: 'no',
      header: 'No',
      width: '45px',
      center: true,
      cell: (_row, idx) => createElement('span', { className: 'text-xs font-semibold text-slate-500' }, (idx ?? 0) + 1),
    },
    {
      key: 'product',
      header: 'Produk',
      minWidth: '240px',
      cell: (row) => ProductItemCell(row),
    },
    {
      key: 'category',
      header: 'Kategori',
      width: '150px',
      cell: (row) => {
        const cat = categories.find((c) => String(c.id) === String(row.category_id));
        const rawLabel = cat?.name || row.category_name;
        const label = sanitizeString(rawLabel) || 'Lainnya';
        return createElement(
          'span',
          {
            className:
              'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0097B2] bg-[#E2EEF7] border border-[#0097B2]/20',
          },
          label
        );
      },
    },
    {
      key: 'price',
      header: 'Harga Dasar',
      width: '140px',
      cell: (row) => ProductPriceCell(row),
    },
    {
      key: 'variants',
      header: 'Variasi',
      width: '90px',
      center: true,
      cell: (row) => {
        const count = row.product_variants?.length || 0;
        return count > 0
          ? createElement(
              'span',
              {
                className:
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-[#103557] bg-slate-100 border border-slate-200',
              },
              `${count} varian`
            )
          : createElement('span', { className: 'text-xs text-slate-400' }, '—');
      },
    },
    {
      key: 'show_in_dashboard',
      header: 'Tampil',
      width: '80px',
      center: true,
      cell: (row) => {
        const isShow = +(row.show_in_dashboard ?? 0) > 0;
        return createElement(
          'button',
          {
            type: 'button',
            onClick: (e: any) => {
              e.stopPropagation();
              const nextVal = isShow ? 0 : 1;
              toast.info(
                nextVal === 1
                  ? `Mengaktifkan tampilan "${row.name}" di Landing Page...`
                  : `Menyembunyikan "${row.name}" dari Landing Page...`
              );
              send.submit(
                { intent: 'toggle_dashboard', id: row.id, show_in_dashboard: row.show_in_dashboard },
                { method: 'post' }
              );
            },
            className: cn(
              'p-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95',
              isShow
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            ),
            title: isShow
              ? 'Tampil di Landing Page & Form (Klik untuk sembunyikan)'
              : 'Disembunyikan (Klik untuk tampilkan di Landing Page)',
          },
          isShow
            ? Icon('Eye', { className: 'w-4 h-4 text-emerald-600' })
            : Icon('EyeOff', { className: 'w-4 h-4 text-slate-400' })
        );
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      width: '135px',
      center: true,
      cell: (row) =>
        createElement(
          TableActionGroup,
          { size: 'sm' },
          createElement(TableActionButton, {
            icon: 'Eye',
            title: 'Lihat Detail & Aturan Harga',
            variant: 'info',
            onClick: () => modals.open('VIEW_PRODUCT_DETAIL_MODAL', { product: row }),
          }),
          createElement(TableActionButton, {
            icon: 'Pencil',
            title: 'Edit Produk',
            variant: 'primary',
            onClick: () =>
              modals.open('CREATE_PRODUCT_MODAL', {
                product: row,
                categories,
                onSubmit: (v: any) => send.submit({ intent: 'update_product', ...v }, { method: 'post' }),
              }),
          }),
          createElement(TableActionButton, {
            icon: 'Copy',
            title: 'Duplikat Produk',
            variant: 'warning',
            onClick: () =>
              send.submit(
                {
                  intent: 'duplicate_product',
                  id: row.id,
                  name: row.name,
                  category_id: row.category_id,
                  category_name: sanitizeString(row.category_name),
                  description: sanitizeString(row.description),
                  image: sanitizeString(row.image),
                  type: row.type,
                  show_in_dashboard: row.show_in_dashboard,
                  product_price_rules: JSON.stringify(row.product_price_rules || []),
                  product_variants: JSON.stringify(row.product_variants || []),
                },
                { method: 'post' }
              ),
          }),
          createElement(TableActionButton, {
            icon: 'Trash2',
            title: 'Hapus Produk',
            variant: 'danger',
            onClick: () =>
              ConfirmDialog.delete({
                name: `Produk "${row.name}"`,
                onConfirm: () => send.submit({ intent: 'delete_product', id: row.id }, { method: 'post' }),
              }),
          })
        ),
    },
  ];
}

// ============================================================================
// 6. Category Table Columns
// ============================================================================

export function createCategoryTableColumns(send: any): DataTableCardColumn<ProductCategoryItem>[] {
  return [
    {
      key: 'no',
      header: 'No',
      width: '45px',
      center: true,
      cell: (_row, idx) => createElement('span', { className: 'text-xs font-semibold text-slate-500' }, (idx ?? 0) + 1),
    },
    {
      key: 'name',
      header: 'Nama Kategori',
      minWidth: '180px',
      cell: (row) =>
        createElement(
          'div',
          { className: 'py-1' },
          createElement('div', { className: 'font-bold text-xs md:text-sm text-slate-900' }, row.name),
          row.description
            ? createElement('div', { className: 'text-[11px] text-slate-500 truncate max-w-[200px]' }, row.description)
            : null
        ),
    },
    {
      key: 'default_drive_folders',
      header: 'Folder Drive Default',
      minWidth: '240px',
      cell: (row) => {
        let folders: any[] = [];
        const raw = row.default_drive_folders;
        if (Array.isArray(raw)) folders = raw;
        else if (raw) {
          try {
            folders = JSON.parse(raw);
          } catch {
            folders = [];
          }
        }

        if (folders.length === 0) {
          return createElement('span', { className: 'text-xs text-slate-400 italic' }, 'Belum ada folder default');
        }

        return createElement(
          'div',
          { className: 'flex flex-wrap gap-1.5 py-1' },
          folders.map((f: any, i: number) =>
            createElement(
              'span',
              {
                key: i,
                className:
                  'inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-full',
              },
              Icon('Folder', { className: 'w-2.5 h-2.5' }),
              typeof f === 'string' ? f : f.name
            )
          )
        );
      },
    },
    {
      key: 'product_count',
      header: 'Jumlah Produk',
      width: '120px',
      center: true,
      cell: (row) =>
        createElement(
          'span',
          {
            className:
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200',
          },
          `${row.product_count ?? 0} item`
        ),
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
            icon: 'Pencil',
            title: 'Edit Kategori',
            variant: 'primary',
            onClick: () =>
              modals.open('CREATE_CATEGORY_MODAL', {
                category: row,
                onSubmit: (v: any) => send.submit({ intent: 'update_category', ...v }, { method: 'post' }),
              }),
          }),
          createElement(TableActionButton, {
            icon: 'Trash2',
            title: 'Hapus Kategori',
            variant: 'danger',
            onClick: () =>
              ConfirmDialog.delete({
                name: `Kategori "${row.name}"`,
                onConfirm: () => send.submit({ intent: 'delete_category', id: row.id }, { method: 'post' }),
              }),
          })
        ),
    },
  ];
}

// ============================================================================
// 6. Product Create / Edit Modal (Pure White bg-white border border-slate-200)
// ============================================================================

export function CreateOrEditProductModal({
  open,
  onClose,
  product,
  categories = [],
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  product?: ProductItem | null;
  categories?: ProductCategoryItem[];
  onSubmit?: (data: any) => void;
}) {
  const isEditing = Boolean(product && product.id);

  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState<string | number>(product?.category_id || '');
  const [description, setDescription] = useState(product?.description || '');
  const [image, setImage] = useState(product?.image || '');
  const [type, setType] = useState(product?.type || 'single');
  const [showInDashboard, setShowInDashboard] = useState(
    product ? +(product.show_in_dashboard ?? 1) > 0 : true
  );

  const [priceRules, setPriceRules] = useState<ProductPriceRule[]>(
    product?.product_price_rules?.length ? [...product.product_price_rules] : [{ min_qty: 1, price: 0 }]
  );

  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.product_variants?.length
      ? [...product.product_variants]
      : [{ variant_name: 'Standar', base_price: 0, is_default: 1 }]
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(sanitizeString(product?.name));
      setCategoryId(product?.category_id || (categories[0]?.id ?? ''));
      setDescription(sanitizeString(product?.description));
      setImage(sanitizeString(product?.image));
      setType(product?.type || 'single');
      setShowInDashboard(product ? +(product.show_in_dashboard ?? 1) > 0 : true);
      setPriceRules(
        product?.product_price_rules?.length ? [...product.product_price_rules] : [{ min_qty: 1, price: 0 }]
      );
      setVariants(
        product?.product_variants?.length
          ? [...product.product_variants]
          : [{ variant_name: 'Standar', base_price: 0, is_default: 1 }]
      );
      setIsSaving(false);
    }
  }, [open, product, categories]);

  if (!open) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('https://kinauid-backend.vercel.app/storage/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          const url = json?.data?.url || json?.summary?.url || json?.url;
          if (url) {
            setImage(url);
          }
        }
      } catch (err) {
        console.warn('Image upload failed', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Price Rules Handlers
  const addPriceRule = () => {
    const lastRule = priceRules[priceRules.length - 1];
    const nextMin = lastRule ? Number(lastRule.min_qty) + 10 : 10;
    setPriceRules([...priceRules, { min_qty: nextMin, price: 0 }]);
  };

  const updatePriceRule = (idx: number, field: 'min_qty' | 'price', val: number) => {
    const copy = [...priceRules];
    copy[idx] = { ...copy[idx], [field]: val };
    setPriceRules(copy);
  };

  const removePriceRule = (idx: number) => {
    setPriceRules(priceRules.filter((_, i) => i !== idx));
  };

  // Variants Handlers
  const addVariant = () => {
    setVariants([...variants, { variant_name: '', base_price: 0, is_default: 0 }]);
  };

  const updateVariant = (idx: number, field: 'variant_name' | 'base_price', val: any) => {
    const copy = [...variants];
    copy[idx] = { ...copy[idx], [field]: val };
    setVariants(copy);
  };

  const setDefaultVariant = (idx: number) => {
    setVariants(
      variants.map((v, i) => ({
        ...v,
        is_default: i === idx ? 1 : 0,
      }))
    );
  };

  const removeVariant = (idx: number) => {
    const filtered = variants.filter((_, i) => i !== idx);
    if (filtered.length > 0 && !filtered.some((v) => +v.is_default === 1)) {
      filtered[0].is_default = 1;
    }
    setVariants(filtered);
  };

  const hasVariantsWithoutDefault =
    variants.length > 0 && !variants.some((v) => +v.is_default === 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const selectedCat = categories.find((c) => String(c.id) === String(categoryId));

    onSubmit?.({
      id: product?.id,
      name: name.trim(),
      category_id: categoryId ? Number(categoryId) : null,
      category_name: sanitizeString(selectedCat?.name) || 'Lainnya',
      type,
      description: sanitizeString(description),
      image: sanitizeString(image),
      show_in_dashboard: showInDashboard ? 1 : 0,
      product_price_rules: JSON.stringify(priceRules),
      product_variants: JSON.stringify(variants),
    });

    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: isEditing ? 'Edit Produk' : 'Tambah Produk Baru',
      description: 'Atur detail katalog, aturan harga grosir, dan opsi variasi produk.',
      size: 'lg',
    },
    createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-4 pt-1 text-slate-800' },
      // Grid Row 1: Nama & Gambar
      createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        createElement(
          'div',
          { className: 'space-y-1.5' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Nama Produk *'),
          createElement('input', {
            type: 'text',
            required: true,
            value: name,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
            placeholder: 'misal: Jersey Sublim Fullprint Dryfit',
            className:
              'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] focus:border-[#103557] outline-none font-medium',
          })
        ),
        createElement(
          'div',
          { className: 'space-y-1.5' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Gambar Produk'),
          createElement(
            'div',
            { className: 'flex items-center gap-3' },
            image
              ? createElement(
                  'div',
                  { className: 'relative w-11 h-11 rounded-xl border border-slate-200 overflow-hidden shrink-0 group' },
                  createElement('img', { src: image, className: 'w-full h-full object-cover', alt: 'Preview' }),
                  createElement(
                    'button',
                    {
                      type: 'button',
                      onClick: () => setImage(''),
                      className:
                        'absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
                      title: 'Hapus Gambar',
                    },
                    Icon('X', { className: 'w-4 h-4' })
                  )
                )
              : null,
            createElement(
              'button',
              {
                type: 'button',
                disabled: isUploading,
                onClick: () => fileInputRef.current?.click(),
                className:
                  'flex-1 flex items-center justify-center gap-2 p-2 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50',
              },
              isUploading
                ? Icon('Loader2', { className: 'w-3.5 h-3.5 animate-spin text-slate-500' })
                : Icon('Upload', { className: 'w-3.5 h-3.5 text-slate-500' }),
              isUploading ? 'Mengunggah...' : image ? 'Ganti Foto' : 'Upload Foto'
            ),
            createElement('input', {
              type: 'file',
              ref: fileInputRef,
              accept: 'image/*',
              onChange: handleImageUpload,
              className: 'hidden',
            })
          )
        )
      ),

      // Grid Row 2: Kategori & Tipe
      createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        createElement(
          'div',
          { className: 'space-y-1.5' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Kategori Produk'),
          createElement(
            'select',
            {
              value: categoryId,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value),
              className:
                'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] focus:border-[#103557] outline-none cursor-pointer',
            },
            categories.map((c) => createElement('option', { key: c.id, value: c.id }, c.name))
          )
        ),
        createElement(
          'div',
          { className: 'space-y-1.5' },
          createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Tipe Produk'),
          createElement(
            'select',
            {
              value: type,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as any),
              className:
                'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] focus:border-[#103557] outline-none cursor-pointer',
            },
            PRODUCT_TYPE_OPTIONS.map((opt) => createElement('option', { key: opt.value, value: opt.value }, opt.label))
          )
        )
      ),

      // Row 3: Deskripsi
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Deskripsi Singkat'),
        createElement('textarea', {
          rows: 2,
          value: description,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value),
          placeholder: 'Spesifikasi bahan, keunggulan, atau catatan pengerjaan...',
          className:
            'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] focus:border-[#103557] outline-none resize-none',
        })
      ),

      // Row 4: Aturan Harga Grosir (Tiers)
      createElement(
        'div',
        { className: 'p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5' },
        createElement(
          'div',
          { className: 'flex items-center justify-between' },
          createElement(
            'div',
            { className: 'text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5' },
            Icon('DollarSign', { className: 'w-3.5 h-3.5 text-[#103557]' }),
            'Aturan Harga Grosir'
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: addPriceRule,
              className: 'text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer',
            },
            Icon('Plus', { className: 'w-3 h-3' }),
            'Tambah Aturan'
          )
        ),
        priceRules.length === 0
          ? createElement('p', { className: 'text-xs text-slate-400 italic' }, 'Belum ada aturan harga grosir.')
          : priceRules.map((rule, idx) =>
              createElement(
                'div',
                {
                  key: idx,
                  className: 'flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs',
                },
                createElement('span', { className: 'text-xs font-semibold text-slate-500 whitespace-nowrap' }, 'Min Qty:'),
                createElement('input', {
                  type: 'number',
                  min: 1,
                  value: rule.min_qty,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => updatePriceRule(idx, 'min_qty', Number(e.target.value)),
                  className:
                    'w-16 border border-slate-300 rounded p-1 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-[#103557]',
                }),
                createElement('span', { className: 'text-xs font-semibold text-slate-500 whitespace-nowrap' }, 'Harga:'),
                createElement(PriceInput, {
                  value: rule.price,
                  onChange: (val) => updatePriceRule(idx, 'price', val),
                }),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => removePriceRule(idx),
                    className: 'p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer',
                    title: 'Hapus Aturan',
                  },
                  Icon('Trash2', { className: 'w-3.5 h-3.5' })
                )
              )
            )
      ),

      // Row 5: Variasi Produk
      createElement(
        'div',
        { className: 'p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-2.5' },
        hasVariantsWithoutDefault
          ? createElement(
              'div',
              { className: 'p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 flex items-center gap-1.5' },
              Icon('AlertTriangle', { className: 'w-4 h-4 text-rose-600' }),
              'PENTING: Pilih salah satu varian default dengan mengklik ikon bintang!'
            )
          : null,
        createElement(
          'div',
          { className: 'flex items-center justify-between' },
          createElement(
            'div',
            { className: 'text-xs font-bold text-[#103557] uppercase tracking-wide flex items-center gap-1.5' },
            Icon('Layers', { className: 'w-3.5 h-3.5 text-[#103557]' }),
            'Variasi Produk'
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: addVariant,
              className: 'text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer',
            },
            Icon('Plus', { className: 'w-3 h-3' }),
            'Tambah Variasi'
          )
        ),
        variants.length === 0
          ? createElement('p', { className: 'text-xs text-slate-400 italic' }, 'Belum ada variasi produk.')
          : variants.map((v, idx) => {
              const isDefault = +v.is_default === 1;
              return createElement(
                'div',
                {
                  key: idx,
                  className: `flex items-center gap-2 p-2 rounded-lg border shadow-2xs transition-all ${
                    isDefault ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-slate-200'
                  }`,
                },
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => setDefaultVariant(idx),
                    className: `p-1 rounded cursor-pointer ${isDefault ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'}`,
                    title: isDefault ? 'Variasi Default Terpilih' : 'Jadikan Default',
                  },
                  Icon('Star', { className: `w-4 h-4 ${isDefault ? 'fill-amber-500 text-amber-500' : ''}` })
                ),
                createElement('input', {
                  type: 'text',
                  placeholder: 'Nama variasi (misal: Lengan Panjang)',
                  value: v.variant_name,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateVariant(idx, 'variant_name', e.target.value),
                  className:
                    'flex-1 border border-slate-300 rounded p-1.5 text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-[#103557] bg-white',
                }),
                createElement('span', { className: 'text-xs font-semibold text-slate-500 whitespace-nowrap' }, '+ Harga:'),
                createElement(PriceInput, {
                  value: v.base_price,
                  onChange: (val) => updateVariant(idx, 'base_price', val),
                }),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => removeVariant(idx),
                    className: 'p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer',
                    title: 'Hapus Variasi',
                  },
                  Icon('Trash2', { className: 'w-3.5 h-3.5' })
                )
              );
            })
      ),

      // Row 6: Toggle Dashboard Checkbox
      createElement(
        'label',
        { className: 'flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none py-1' },
        createElement('input', {
          type: 'checkbox',
          checked: showInDashboard,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setShowInDashboard(e.target.checked),
          className: 'rounded border-slate-300 text-[#103557] focus:ring-[#103557] cursor-pointer w-4 h-4',
        }),
        'Tampilkan produk di Dashboard & Formulir Order'
      ),

      // Modal Footer Actions
      createElement(
        'div',
        { className: 'flex items-center gap-2 pt-3 border-t border-slate-100 justify-end' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className:
              'px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer',
          },
          'Batal'
        ),
        createElement(
          'button',
          {
            type: 'submit',
            disabled: isSaving || !name.trim(),
            className:
              'px-5 py-2 bg-[#103557] text-white rounded-lg text-xs font-bold hover:bg-[#0c2842] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed',
          },
          isSaving ? Icon('Loader2', { className: 'w-3.5 h-3.5 animate-spin' }) : null,
          isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Produk'
        )
      )
    )
  );
}

// ============================================================================
// 7. Category Create / Edit Modal
// ============================================================================

export function CreateOrEditCategoryModal({
  open,
  onClose,
  category,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  category?: ProductCategoryItem | null;
  onSubmit?: (data: any) => void;
}) {
  const isEditing = Boolean(category && category.id);
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [driveFolders, setDriveFolders] = useState<ProductDriveFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(sanitizeString(category?.name));
      setDescription(sanitizeString(category?.description));
      let parsed: ProductDriveFolder[] = [];
      const raw = category?.default_drive_folders;
      if (Array.isArray(raw)) {
        parsed = raw.map((item) =>
          typeof item === 'string'
            ? { name: item, is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: false, is_sablon_belakang: false }
            : item
        );
      } else if (raw) {
        try {
          const json = JSON.parse(raw);
          parsed = json.map((item: any) =>
            typeof item === 'string'
              ? { name: item, is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: false, is_sablon_belakang: false }
              : item
          );
        } catch {}
      }
      setDriveFolders(parsed);
      setNewFolderName('');
      setIsSaving(false);
    }
  }, [open, category]);

  if (!open) return null;

  const addFolder = () => {
    const t = newFolderName.trim();
    if (!t || driveFolders.some((f) => f.name.toLowerCase() === t.toLowerCase())) return;
    setDriveFolders([
      ...driveFolders,
      { name: t, is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: false, is_sablon_belakang: false },
    ]);
    setNewFolderName('');
  };

  const removeFolder = (idx: number) => {
    setDriveFolders(driveFolders.filter((_, i) => i !== idx));
  };

  const togglePurpose = (idx: number, key: keyof Omit<ProductDriveFolder, 'name'>) => {
    setDriveFolders(
      driveFolders.map((f, i) => {
        if (i !== idx) return f;
        return {
          ...f,
          [key]: !f[key],
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    onSubmit?.({
      id: category?.id,
      name: name.trim(),
      description: sanitizeString(description),
      default_drive_folders: JSON.stringify(driveFolders),
    });
    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: isEditing ? 'Edit Kategori Produk' : 'Tambah Kategori Baru',
      description: 'Atur kategori produk dan folder Google Drive otomatis yang dibuat saat order diterima.',
      size: 'md',
    },
    createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-4 pt-1 text-slate-800' },
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Nama Kategori *'),
        createElement('input', {
          type: 'text',
          required: true,
          value: name,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
          placeholder: 'misal: Jersey Sublimasi & Sablon',
          className:
            'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] focus:border-[#103557] outline-none font-medium',
        })
      ),

      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Deskripsi Kategori'),
        createElement('input', {
          type: 'text',
          value: description,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value),
          placeholder: 'Keterangan kelompok produk...',
          className:
            'w-full border border-slate-300 rounded-lg p-2.5 text-xs md:text-sm bg-white focus:ring-1 focus:ring-[#103557] focus:border-[#103557] outline-none',
        })
      ),

      // Drive Folders Builder
      createElement(
        'div',
        { className: 'p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2.5' },
        createElement(
          'div',
          { className: 'text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5' },
          Icon('Folder', { className: 'w-3.5 h-3.5 text-amber-600' }),
          'Folder Drive Default'
        ),
        createElement(
          'p',
          { className: 'text-[11px] text-amber-700' },
          'Folder di bawah ini akan otomatis digenerate di Drive pelanggan ketika pesanan kategori ini dibuat.'
        ),

        driveFolders.length > 0
          ? createElement(
              'div',
              { className: 'space-y-2' },
              driveFolders.map((f, idx) =>
                createElement(
                  'div',
                  {
                    key: idx,
                    className: 'p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs space-y-1.5',
                  },
                  createElement(
                    'div',
                    { className: 'flex items-center justify-between' },
                    createElement(
                      'div',
                      { className: 'font-bold text-xs text-slate-800 flex items-center gap-1.5' },
                      Icon('Folder', { className: 'w-3.5 h-3.5 text-amber-500' }),
                      f.name
                    ),
                    createElement(
                      'button',
                      {
                        type: 'button',
                        onClick: () => removeFolder(idx),
                        className: 'text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer',
                        title: 'Hapus Folder',
                      },
                      Icon('Trash2', { className: 'w-3 h-3' })
                    )
                  ),
                  createElement(
                    'div',
                    { className: 'flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-slate-100' },
                    DRIVE_FOLDER_OPTIONS.map(({ key, label }) =>
                      createElement(
                        'label',
                        { key, className: 'inline-flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer' },
                        createElement('input', {
                          type: 'checkbox',
                          checked: Boolean(f[key]),
                          onChange: () => togglePurpose(idx, key),
                          className: 'rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3 h-3 cursor-pointer',
                        }),
                        label
                      )
                    )
                  )
                )
              )
            )
          : createElement('p', { className: 'text-xs text-slate-400 italic' }, 'Belum ada folder default.'),

        createElement(
          'div',
          { className: 'flex items-center gap-2 pt-1' },
          createElement('input', {
            type: 'text',
            value: newFolderName,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value),
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFolder();
              }
            },
            placeholder: 'Nama folder baru (misal: 01. Mockup Desain)...',
            className:
              'flex-1 border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
          }),
          createElement(
            'button',
            {
              type: 'button',
              onClick: addFolder,
              className:
                'px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer',
            },
            'Tambah'
          )
        )
      ),

      // Footer
      createElement(
        'div',
        { className: 'flex items-center gap-2 pt-3 border-t border-slate-100 justify-end' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className:
              'px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer',
          },
          'Batal'
        ),
        createElement(
          'button',
          {
            type: 'submit',
            disabled: isSaving || !name.trim(),
            className:
              'px-5 py-2 bg-[#103557] text-white rounded-lg text-xs font-bold hover:bg-[#0c2842] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed',
          },
          isSaving ? Icon('Loader2', { className: 'w-3.5 h-3.5 animate-spin' }) : null,
          isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Kategori'
        )
      )
    )
  );
}

// ============================================================================
// 8. Product Detail Modal (Aturan Grosir, Variasi & Deskripsi Preview)
// ============================================================================

export function ProductDetailModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product?: ProductItem | null;
}) {
  if (!open || !product) return null;

  const imgUrl = sanitizeString(product.image);
  const desc = sanitizeString(product.description);
  const hasImage = Boolean(imgUrl);
  const rawCat = product.category_name;
  const catLabel = sanitizeString(rawCat) || 'Kategori Umum';

  return Modal(
    {
      open,
      onClose,
      title: product.name,
      description: `Detail spesifikasi dan skema harga untuk produk ${product.code ? `[${product.code}]` : ''}`,
      size: 'md',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-1 text-slate-800' },
      // Header Detail
      createElement(
        'div',
        { className: 'flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200' },
        hasImage
          ? createElement('img', {
              src: imgUrl,
              className: 'w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0',
              alt: product.name,
            })
          : createElement(
              'div',
              { className: 'w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0' },
              Icon('Tag', { className: 'w-6 h-6' })
            ),
        createElement(
          'div',
          { className: 'min-w-0 flex-1 space-y-0.5' },
          createElement('div', { className: 'font-bold text-sm text-slate-900 truncate' }, product.name),
          createElement(
            'div',
            { className: 'text-xs text-[#0097B2] font-semibold' },
            catLabel
          ),
          desc
            ? createElement('p', { className: 'text-xs text-slate-500 line-clamp-2' }, desc)
            : null
        )
      ),

      // Aturan Harga Grosir
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement(
          'div',
          { className: 'text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5' },
          Icon('DollarSign', { className: 'w-3.5 h-3.5 text-[#103557]' }),
          'Aturan Harga Grosir'
        ),
        product.product_price_rules?.length
          ? createElement(
              'div',
              { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2' },
              product.product_price_rules.map((rule, idx) =>
                createElement(
                  'div',
                  {
                    key: idx,
                    className: 'flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs',
                  },
                  createElement('span', { className: 'text-slate-600 font-medium' }, `≥ ${rule.min_qty} pcs`),
                  createElement('span', { className: 'font-black text-[#103557]' }, formatCurrency(rule.price))
                )
              )
            )
          : createElement('p', { className: 'text-xs text-slate-400 italic' }, 'Tidak ada aturan harga grosir.')
      ),

      // Variasi Produk
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement(
          'div',
          { className: 'text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5' },
          Icon('Layers', { className: 'w-3.5 h-3.5 text-[#103557]' }),
          'Variasi Produk'
        ),
        product.product_variants?.length
          ? createElement(
              'div',
              { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2' },
              product.product_variants.map((v, idx) => {
                const isDefault = +v.is_default === 1;
                return createElement(
                  'div',
                  {
                    key: idx,
                    className: `flex justify-between items-center p-2 rounded-lg border text-xs shadow-2xs ${
                      isDefault ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-slate-200'
                    }`,
                  },
                  createElement(
                    'div',
                    { className: 'flex items-center gap-1.5' },
                    isDefault ? Icon('Star', { className: 'w-3.5 h-3.5 fill-amber-500 text-amber-500' }) : null,
                    createElement('span', { className: isDefault ? 'font-bold text-amber-900' : 'text-slate-800' }, v.variant_name),
                    isDefault
                      ? createElement('span', { className: 'text-[9px] font-bold text-amber-700 bg-amber-200/80 px-1 py-0.2 rounded' }, 'DEFAULT')
                      : null
                  ),
                  createElement('span', { className: 'font-bold text-slate-900' }, `+${formatCurrency(v.base_price)}`)
                );
              })
            )
          : createElement('p', { className: 'text-xs text-slate-400 italic' }, 'Tidak ada variasi.')
      ),

      // Footer
      createElement(
        'div',
        { className: 'pt-3 border-t border-slate-100 flex justify-end' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className: 'px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          },
          'Tutup'
        )
      )
    )
  );
}

// ============================================================================
// 9. Product Filter Modal
// ============================================================================

export function ProductFilterModal({
  open,
  onClose,
  filters = {},
  categories = [],
  onApply,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filters: ProductState;
  categories: ProductCategoryItem[];
  onApply: (f: Partial<ProductState>) => void;
  onReset: () => void;
}) {
  const [tempFilters, setTempFilters] = useState<Partial<ProductState>>({ ...filters });

  useEffect(() => {
    if (open) {
      setTempFilters({ ...filters });
    }
  }, [open, filters]);

  if (!open) return null;

  const handleApply = () => {
    onApply(tempFilters);
    onClose();
  };

  const handleReset = () => {
    setTempFilters({ category: 'all', show_in_dashboard: 'all' });
    onReset();
    onClose();
  };

  return Modal(
    {
      open,
      onClose,
      title: 'Filter Katalog Produk',
      description: 'Persempit tampilan daftar produk berdasarkan kategori dan visibilitas.',
      size: 'sm',
    },
    createElement(
      'div',
      { className: 'space-y-4 pt-1 text-slate-800' },
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Kategori Produk'),
        createElement(
          'select',
          {
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
            value: tempFilters.category || 'all',
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setTempFilters({ ...tempFilters, category: e.target.value }),
          },
          createElement('option', { value: 'all' }, 'Semua Kategori'),
          categories.map((c) => createElement('option', { key: c.id, value: c.id }, c.name))
        )
      ),

      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement('label', { className: 'block text-xs font-bold text-slate-700' }, 'Visibilitas Dashboard'),
        createElement(
          'select',
          {
            className: 'w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none',
            value: tempFilters.show_in_dashboard || 'all',
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setTempFilters({ ...tempFilters, show_in_dashboard: e.target.value }),
          },
          createElement('option', { value: 'all' }, 'Semua Status'),
          createElement('option', { value: '1' }, 'Ditampilkan di Dashboard'),
          createElement('option', { value: '0' }, 'Disembunyikan dari Dashboard')
        )
      ),

      // Footer
      createElement(
        'div',
        { className: 'flex items-center gap-2 pt-3 border-t border-slate-100 justify-end' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: handleReset,
            className: 'px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer',
          },
          'Reset'
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: handleApply,
            className: 'px-4 py-2 bg-[#103557] text-white rounded-lg text-xs font-bold hover:bg-[#0c2842] cursor-pointer shadow-2xs',
          },
          'Terapkan Filter'
        )
      )
    )
  );
}

// ============================================================================
// 10. Mobile Card Renderers
// ============================================================================

export function renderProductMobileCard(
  product: ProductItem,
  idx: number,
  send: any,
  categories: ProductCategoryItem[]
) {
  const cat = categories.find((c) => String(c.id) === String(product.category_id));
  const rawLabel = cat?.name || product.category_name;
  const catLabel = sanitizeString(rawLabel) || 'Lainnya';
  const rawImg = sanitizeString(product.image);
  const imgUrl = rawImg ? getResourceUrl(rawImg) : '';
  const hasImage = Boolean(imgUrl);

  return createElement(
    'div',
    {
      key: product.id || idx,
      className: 'bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3',
    },
    createElement(
      'div',
      { className: 'flex items-start gap-3' },
      hasImage
        ? createElement('img', {
            src: imgUrl,
            className: 'w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0',
            alt: product.name,
          })
        : createElement(
            'div',
            { className: 'w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0' },
            Icon('Tag', { className: 'w-5 h-5' })
          ),
      createElement(
        'div',
        { className: 'flex-1 min-w-0' },
        createElement('div', { className: 'font-bold text-sm text-slate-900 truncate' }, product.name),
        createElement(
          'span',
          { className: 'inline-block mt-0.5 text-[10px] font-bold text-[#0097B2] bg-[#E2EEF7] px-2 py-0.2 rounded' },
          catLabel
        ),
        createElement(
          'div',
          { className: 'font-extrabold text-sm text-[#103557] mt-1' },
          formatCurrency(product.total_price || product.price || 0)
        )
      )
    ),
    createElement(
      'div',
      { className: 'flex items-center justify-between pt-2 border-t border-slate-100' },
      createElement(
        'span',
        { className: 'text-xs text-slate-500 font-medium' },
        `${product.product_variants?.length || 0} varian · ${product.product_price_rules?.length || 0} level harga`
      ),
      createElement(
        'div',
        { className: 'flex items-center gap-1' },
        createElement(TableActionButton, {
          icon: 'Eye',
          title: 'Detail',
          variant: 'info',
          onClick: () => modals.open('VIEW_PRODUCT_DETAIL_MODAL', { product }),
        }),
        createElement(TableActionButton, {
          icon: 'Pencil',
          title: 'Edit',
          variant: 'primary',
          onClick: () =>
            modals.open('CREATE_PRODUCT_MODAL', {
              product,
              categories,
              onSubmit: (v: any) => send.submit({ intent: 'update_product', ...v }, { method: 'post' }),
            }),
        }),
        createElement(TableActionButton, {
          icon: 'Trash2',
          title: 'Hapus',
          variant: 'danger',
          onClick: () =>
            ConfirmDialog.delete({
              name: `Produk "${product.name}"`,
              onConfirm: () => send.submit({ intent: 'delete_product', id: product.id }, { method: 'post' }),
            }),
        })
      )
    )
  );
}
