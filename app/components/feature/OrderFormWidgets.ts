import React, { createElement, useState, useEffect, useCallback } from 'react';
import {
  Icon,
  Button,
} from '~/builder';
import { toast } from 'sonner';
import {
  type CatalogProduct,
  type InstitutionOption,
  type OrderFormData,
  type OrderFormItem,
  type OrderFormInitialData,
  INSTANSI_MODE_OPTIONS,
  KKN_TYPE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
} from '~/schemas/order-form.schema';
import { getWhatsAppLink } from '~/constants/brand';

// ============================================================================
// FORMATTERS & UTILS
// ============================================================================

export function formatCurrency(n: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.max(0, n || 0));
}

export function parseCurrency(str: string | number): number {
  if (!str) return 0;
  return Number(String(str).replace(/[^0-9]/g, '')) || 0;
}

export function formatPhoneNumber(input: string): string {
  let clean = input.replace(/\D/g, '');
  if (clean.startsWith('62')) clean = '0' + clean.slice(2);
  if (!clean.startsWith('0')) return input;

  const p1 = clean.slice(1, 4);
  const p2 = clean.slice(4, 8);
  const p3 = clean.slice(8);
  return `+62 ${p1}-${p2}-${p3}`.replace(/-+$/, '');
}

export function generateAccessCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getKKNPeriod(): { period: string; year: string; label: string } {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  if (month >= 1 && month <= 7) {
    return { period: '2', year: String(year), label: `KKN ITERA ${year} - PERIODE 2` };
  } else {
    const targetYear = month >= 8 ? year + 1 : year;
    return { period: '1', year: String(targetYear), label: `KKN ITERA ${targetYear} - PERIODE 1` };
  }
}

// ============================================================================
// MAIN ORDER FORM COMPONENT
// ============================================================================

export function OrderFormComponent({
  initialProducts = [],
  initialInstitutions = [],
  initialAccessCode,
  initialKknPeriod,
  onSubmit,
  actionData,
  isLoading = false,
  navigate,
}: {
  initialProducts: CatalogProduct[];
  initialInstitutions: InstitutionOption[];
  initialAccessCode?: string;
  initialKknPeriod?: { period: string; year: string; label: string };
  onSubmit: (data: OrderFormData) => void;
  actionData?: any;
  isLoading?: boolean;
  navigate?: (path: string) => void;
}) {
  // State
  const [isKKN, setIsKKN] = useState<boolean>(false);
  const [autoPeriod] = useState(() => initialKknPeriod || getKKNPeriod());

  // Instansi & Pemesan State
  const [instansiMode, setInstansiMode] = useState<'new' | 'existing' | 'perorangan'>('new');
  const [instansi, setInstansi] = useState<string>('');
  const [instansiId, setInstansiId] = useState<string>('');
  const [instansiSearch, setInstansiSearch] = useState<string>('');
  const [pemesanName, setPemesanName] = useState<string>('');
  const [pemesanPhone, setPemesanPhone] = useState<string>('');

  // KKN State
  const [kknType, setKknType] = useState<'PPM' | 'Tematik'>('PPM');
  const [kknGroupNo, setKknGroupNo] = useState<string>('');
  const [kknVillage, setKknVillage] = useState<string>('');

  // Items State
  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([
    {
      productId: '',
      productName: '',
      quantity: '',
      variant_id: null,
      variant_name: null,
      variant_price: 0,
      price_rule_id: null,
      price_rule_min_qty: null,
      price_rule_value: 0,
      variant_final_price: 0,
      product_variants: [],
      product_price_rules: [],
    },
  ]);

  // Financials & Deadline
  const [deadline, setDeadline] = useState<string>('');
  const [pay, setPay] = useState<'Tidak Ada' | 'DP' | 'Lunas'>('Tidak Ada');
  const [dpAmountStr, setDpAmountStr] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>(() => initialAccessCode || generateAccessCode(6));
  const [isSponsor, setIsSponsor] = useState<boolean>(false);
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [discountValStr, setDiscountValStr] = useState<string>('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [pendingData, setPendingData] = useState<OrderFormData | null>(null);

  // Track & Handle Action Responses for Toast & Form Reset
  const lastActionDataRef = React.useRef<any>(null);

  useEffect(() => {
    if (!actionData || actionData === lastActionDataRef.current) return;
    lastActionDataRef.current = actionData;

    const isSuccess = actionData?.success === true || actionData?.data?.success === true;
    if (isSuccess) {
      const msg =
        actionData?.data?.message ||
        actionData?.message ||
        actionData?.meta?.message ||
        (actionData?.data?.order_number
          ? `Pesanan ${actionData.data.order_number} berhasil disimpan!`
          : 'Pesanan berhasil disimpan!');
      toast.success(msg);
      handleResetForm();
    } else if (actionData?.error || actionData?.success === false) {
      const rawErr = actionData?.error;
      const msg =
        typeof rawErr === 'string'
          ? rawErr
          : rawErr?.message || actionData?.message || 'Gagal menyimpan pesanan';
      toast.error(msg);
      setShowConfirm(false);
    }
  }, [actionData]);

  // Financial Calculations
  const calculateFinancials = useCallback(() => {
    let subTotal = 0;
    let totalQty = 0;
    const validItems: OrderFormItem[] = [];

    orderItems.forEach((item) => {
      const qtyNum = Number(item.quantity) || 0;
      if (item.productId && qtyNum > 0) {
        totalQty += qtyNum;
        subTotal += Number(item.variant_final_price || 0);
        validItems.push(item);
      }
    });

    let discountAmount = 0;
    if (!isKKN) {
      const val = parseCurrency(discountValStr);
      if (discountType === 'percent') {
        discountAmount = subTotal * (val / 100);
      } else {
        discountAmount = val;
      }
    }
    discountAmount = Math.min(discountAmount, subTotal);
    const grandTotal = Math.max(0, subTotal - discountAmount);

    return { subTotal, totalQty, validItems, discountAmount, grandTotal };
  }, [orderItems, isKKN, discountValStr, discountType]);

  const financials = calculateFinancials();

  // Item Handlers
  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      {
        productId: '',
        productName: '',
        quantity: '',
        variant_id: null,
        variant_name: null,
        variant_price: 0,
        price_rule_id: null,
        price_rule_min_qty: null,
        price_rule_value: 0,
        variant_final_price: 0,
        product_variants: [],
        product_price_rules: [],
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems((prev) => {
      const list = [...prev];
      list.splice(index, 1);
      return list;
    });
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const prod = initialProducts.find((p) => String(p.id) === String(productId));
    setOrderItems((prev) => {
      const list = [...prev];
      if (!prod) {
        list[index] = {
          ...list[index],
          productId: '',
          productName: '',
          variant_id: null,
          variant_name: null,
          variant_price: 0,
          price_rule_id: null,
          price_rule_min_qty: null,
          price_rule_value: 0,
          variant_final_price: 0,
          product_variants: [],
          product_price_rules: [],
        };
      } else {
        const variants = prod.product_variants || [];
        const priceRules = prod.product_price_rules || [];
        const defaultVar = variants.find((v) => Boolean(v.is_default)) || (variants.length === 1 ? variants[0] : null);

        const qty = Number(list[index].quantity) || 1;
        const sortedRules = [...priceRules].sort((a, b) => Number(b.min_qty) - Number(a.min_qty));
        const matchedRule = sortedRules.find((r) => qty >= Number(r.min_qty)) || sortedRules[sortedRules.length - 1];

        const basePrice = Number(matchedRule?.price || prod.price || prod.total_price || 0);
        const addonPrice = Number(defaultVar?.base_price || 0);
        const lineTotal = qty * basePrice + qty * addonPrice;

        list[index] = {
          ...list[index],
          productId: String(prod.id),
          productName: prod.name,
          quantity: qty,
          variant_id: defaultVar ? defaultVar.id : null,
          variant_name: defaultVar ? defaultVar.variant_name : null,
          variant_price: addonPrice,
          price_rule_id: matchedRule ? matchedRule.id : null,
          price_rule_min_qty: matchedRule ? matchedRule.min_qty : null,
          price_rule_value: basePrice,
          variant_final_price: lineTotal,
          product_variants: variants,
          product_price_rules: priceRules,
        };
      }
      return list;
    });
  };

  const handleSelectVariant = (index: number, variantId: string) => {
    setOrderItems((prev) => {
      const list = [...prev];
      const item = list[index];
      const selected = (item.product_variants || []).find((v) => String(v.id) === String(variantId));

      const qty = Number(item.quantity) || 1;
      const sortedRules = [...(item.product_price_rules || [])].sort((a, b) => Number(b.min_qty) - Number(a.min_qty));
      const matchedRule = sortedRules.find((r) => qty >= Number(r.min_qty)) || sortedRules[sortedRules.length - 1];

      const baseProd = initialProducts.find((p) => String(p.id) === String(item.productId));
      const basePrice = Number(matchedRule?.price || item.price_rule_value || baseProd?.price || 0);
      const addonPrice = Number(selected?.base_price || 0);
      const lineTotal = qty * basePrice + qty * addonPrice;

      list[index] = {
        ...item,
        variant_id: selected ? selected.id : null,
        variant_name: selected ? selected.variant_name : null,
        variant_price: addonPrice,
        price_rule_id: matchedRule ? matchedRule.id : item.price_rule_id,
        price_rule_min_qty: matchedRule ? matchedRule.min_qty : item.price_rule_min_qty,
        price_rule_value: basePrice,
        variant_final_price: lineTotal,
      };
      return list;
    });
  };

  const handleQtyChange = (index: number, qtyVal: string) => {
    const qty = Number(qtyVal) || 0;
    setOrderItems((prev) => {
      const list = [...prev];
      const item = list[index];

      const sortedRules = [...(item.product_price_rules || [])].sort((a, b) => Number(b.min_qty) - Number(a.min_qty));
      const matchedRule = sortedRules.find((r) => qty >= Number(r.min_qty)) || sortedRules[sortedRules.length - 1];

      const baseProd = initialProducts.find((p) => String(p.id) === String(item.productId));
      const basePrice = Number(matchedRule?.price || baseProd?.price || baseProd?.total_price || 0);
      const addonPrice = Number(item.variant_price || 0);
      const lineTotal = qty * basePrice + qty * addonPrice;

      list[index] = {
        ...item,
        quantity: qtyVal,
        price_rule_id: matchedRule ? matchedRule.id : null,
        price_rule_min_qty: matchedRule ? matchedRule.min_qty : null,
        price_rule_value: basePrice,
        variant_final_price: lineTotal,
      };
      return list;
    });
  };

  const handleDpPercent = (percent: number) => {
    const { grandTotal } = calculateFinancials();
    if (grandTotal > 0) {
      setDpAmountStr(formatCurrency(Math.round(grandTotal * (percent / 100))));
    }
  };

  const handleResetForm = () => {
    setIsKKN(false);
    setInstansiMode('new');
    setInstansi('');
    setInstansiId('');
    setInstansiSearch('');
    setPemesanName('');
    setPemesanPhone('');
    setKknType('PPM');
    setKknGroupNo('');
    setKknVillage('');
    setOrderItems([
      {
        productId: '',
        productName: '',
        quantity: '',
        variant_id: null,
        variant_name: null,
        variant_price: 0,
        price_rule_id: null,
        price_rule_min_qty: null,
        price_rule_value: 0,
        variant_final_price: 0,
        product_variants: [],
        product_price_rules: [],
      },
    ]);
    setDeadline('');
    setPay('Tidak Ada');
    setDpAmountStr('');
    setAccessCode(generateAccessCode(6));
    setIsSponsor(false);
    setDiscountType('nominal');
    setDiscountValStr('');
    setErrors({});
    setShowConfirm(false);
    setPendingData(null);
  };

  const copyLink = (code: string) => {
    const link = `kinau.id/public/drive-link/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link drive disalin: ' + link);
  };

  // Pre-submission validation & open confirmation modal
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const { totalQty, validItems, grandTotal, subTotal, discountAmount } = calculateFinancials();

    if (!isKKN) {
      if (instansiMode !== 'perorangan' && !instansi.trim()) {
        newErrors.instansi = 'Nama instansi wajib diisi';
      }
    } else {
      if (kknType === 'PPM') {
        const gNum = Number(kknGroupNo);
        if (!kknGroupNo || gNum < 1 || gNum > 400) {
          newErrors.kknGroup = 'Nomor kelompok wajib 1 - 400';
        }
      }
      if (kknType === 'Tematik' && !kknVillage.trim()) {
        newErrors.kknVillage = 'Nama desa KKN wajib diisi';
      }
    }

    if (!pemesanName.trim()) newErrors.pemesanName = 'Nama pemesan wajib diisi';
    if (!pemesanPhone.trim()) newErrors.pemesanPhone = 'No. WhatsApp wajib diisi';

    if (validItems.length === 0) newErrors.items = 'Pilih minimal satu produk dan isi kuantitasnya';
    if (totalQty <= 0) newErrors.items = 'Jumlah total barang harus lebih dari 0';

    const hasZeroPriceItem = orderItems.some((item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.variant_final_price) || 0;
      return q > 0 && p <= 0 && Boolean(item.productId);
    });
    if (hasZeroPriceItem) {
      newErrors.items = 'Ada item dengan harga Rp 0. Periksa varian atau aturan harga produk.';
    }

    if (!deadline) newErrors.deadline = 'Batas waktu (deadline) wajib dipilih';

    let finalDp = 0;
    if (pay === 'DP') {
      finalDp = parseCurrency(dpAmountStr);
      if (finalDp <= 0 || finalDp > grandTotal) {
        newErrors.dp = 'Nominal DP tidak valid (harus lebih dari 0 dan tidak melebihi total tagihan)';
      }
    } else if (pay === 'Lunas') {
      finalDp = grandTotal;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstKey = Object.keys(newErrors)[0];
      toast.error(newErrors[firstKey]);
      return;
    }

    let finalInstansi = instansi;
    if (isKKN) {
      finalInstansi = kknType === 'PPM' ? `Kelompok ${kknGroupNo}` : kknVillage;
    } else if (instansiMode === 'perorangan') {
      finalInstansi = pemesanName;
    }

    const orderData: OrderFormData = {
      instansiMode,
      instansi_id: instansiId || null,
      instansi: finalInstansi,
      pemesanName,
      pemesanPhone: formatPhoneNumber(pemesanPhone),
      isKKN,
      kknDetails: isKKN
        ? {
            periode: autoPeriod.period,
            tahun: autoPeriod.year,
            tipe: kknType,
            nilai: kknType === 'PPM' ? String(kknGroupNo) : kknVillage,
            jumlahKelompok: 1,
          }
        : undefined,
      items: validItems,
      isSponsor,
      discount: parseCurrency(discountValStr) > 0 ? { type: discountType, value: parseCurrency(discountValStr) } : undefined,
      deadline,
      statusPembayaran: pay,
      dpAmount: finalDp,
      accessCode,
      domain: `kinau.id/public/drive-link/${accessCode}`,
      subTotal,
      discountAmount,
      totalAmount: grandTotal,
    };

    setPendingData(orderData);
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    if (pendingData) {
      onSubmit(pendingData);
      setShowConfirm(false);
    }
  };

  // Filtered institutions for search dropdown
  const filteredInstitutions = initialInstitutions.filter((i) => {
    if (!instansiSearch) return true;
    const q = instansiSearch.toLowerCase();
    return i.name.toLowerCase().includes(q) || (i.abbr && i.abbr.toLowerCase().includes(q));
  });

  return createElement(
    'div',
    { className: 'w-full space-y-6' },
    createElement(
      'div',
      { className: 'bg-white border border-slate-200 rounded-2xl p-6 shadow-sm' },
      // Header row
      createElement(
        'div',
        { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5' },
        createElement(
          'div',
          null,
          createElement(
            'div',
            { className: 'flex items-center gap-2 mb-1' },
            createElement(
              'span',
              { className: 'p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400' },
              Icon('PlusCircle', { className: 'w-5 h-5' })
            ),
            createElement('h1', { className: 'text-xl font-bold text-slate-900 tracking-tight' }, 'Form Input Pesanan Baru')
          ),
          createElement(
            'p',
            { className: 'text-sm text-slate-500' },
            'Entri data pesanan apparel, kalkulasi otomatis harga grosir & varian, serta generate folder drive klien.'
          )
        ),
        // Mode Switcher
        createElement(
          'div',
          { className: 'inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200' },
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                setIsKKN(false);
                setErrors({});
              },
              className: `px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                !isKKN ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`,
            },
            Icon('Building2', { className: 'w-4 h-4' }),
            'Pesanan Umum'
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                setIsKKN(true);
                setErrors({});
              },
              className: `px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                isKKN ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`,
            },
            Icon('GraduationCap', { className: 'w-4 h-4' }),
            'Khusus KKN / Kampus'
          )
        )
      ),

      // Form Element
      createElement(
        'form',
        { onSubmit: handlePreSubmit, className: 'space-y-6 pt-5' },

        // KKN Mode Block
        isKKN
          ? createElement(
              'div',
              { className: 'bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 animate-in fade-in duration-300' },
              createElement(
                'div',
                { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3' },
                createElement(
                  'div',
                  { className: 'flex items-center gap-2' },
                  createElement('span', { className: 'w-2 h-2 rounded-full bg-blue-500 animate-pulse' }),
                  createElement('h2', { className: 'text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide' }, 'Konfigurasi Pesanan KKN')
                ),
                createElement(
                  'div',
                  { className: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-500/20' },
                  Icon('Calendar', { className: 'w-3.5 h-3.5' }),
                  createElement('span', null, `Periode ${autoPeriod.period} / ${autoPeriod.year}`)
                )
              ),
              createElement(
                'div',
                null,
                createElement('label', { className: 'block text-xs font-semibold text-slate-600 mb-2' }, 'Jenis Penugasan KKN'),
                createElement(
                  'div',
                  { className: 'inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-200' },
                  KKN_TYPE_OPTIONS.map((opt) =>
                    createElement(
                      'button',
                      {
                        key: opt.val,
                        type: 'button',
                        onClick: () => setKknType(opt.val),
                        className: `px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          kknType === opt.val
                            ? 'bg-[var(--primary)] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`,
                      },
                      opt.label
                    )
                  )
                )
              ),
              createElement(
                'div',
                { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                kknType === 'PPM'
                  ? createElement(
                      'div',
                      null,
                      createElement('label', { className: 'block text-xs font-semibold text-slate-900 mb-1' }, 'Nomor Kelompok (1 - 400) *'),
                      createElement('input', {
                        type: 'number',
                        min: 1,
                        max: 400,
                        value: kknGroupNo,
                        onChange: (e: any) => setKknGroupNo(e.target.value),
                        placeholder: 'Contoh: 14',
                        className: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
                      }),
                      errors.kknGroup ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.kknGroup) : null
                    )
                  : createElement(
                      'div',
                      null,
                      createElement('label', { className: 'block text-xs font-semibold text-slate-900 mb-1' }, 'Nama Desa / Lokasi KKN *'),
                      createElement('input', {
                        type: 'text',
                        value: kknVillage,
                        onChange: (e: any) => setKknVillage(e.target.value),
                        placeholder: 'Contoh: Desa Karang Rejo',
                        className: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
                      }),
                      errors.kknVillage ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.kknVillage) : null
                    )
              )
            )
          : null,

        // Umum / Instansi Block
        !isKKN
          ? createElement(
              'div',
              { className: 'bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4' },
              createElement(
                'div',
                { className: 'flex items-center justify-between' },
                createElement('label', { className: 'block text-xs font-bold text-slate-900 uppercase tracking-wide' }, 'Tipe Instansi / Klien'),
                createElement(
                  'div',
                  { className: 'inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-200' },
                  INSTANSI_MODE_OPTIONS.map((opt) =>
                    createElement(
                      'button',
                      {
                        key: opt.val,
                        type: 'button',
                        onClick: () => {
                          setInstansiMode(opt.val);
                          setInstansi('');
                          setInstansiId('');
                          setInstansiSearch('');
                        },
                        className: `px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          instansiMode === opt.val
                            ? 'bg-[var(--primary)] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`,
                      },
                      opt.label
                    )
                  )
                )
              ),

              instansiMode === 'new'
                ? createElement(
                    'div',
                    null,
                    createElement('label', { className: 'block text-xs font-semibold text-slate-900 mb-1' }, 'Nama Instansi Baru *'),
                    createElement('input', {
                      type: 'text',
                      value: instansi,
                      onChange: (e: any) => setInstansi(e.target.value),
                      placeholder: 'misal: BEM Fakultas Teknik Universitas Indonesia',
                      className: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
                    }),
                    errors.instansi ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.instansi) : null
                  )
                : null,

              instansiMode === 'existing'
                ? createElement(
                    'div',
                    { className: 'space-y-2' },
                    createElement('label', { className: 'block text-xs font-semibold text-slate-900 mb-1' }, 'Pilih Dari Master Instansi *'),
                    createElement(
                      'div',
                      { className: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
                      createElement('input', {
                        type: 'text',
                        value: instansiSearch,
                        onChange: (e: any) => setInstansiSearch(e.target.value),
                        placeholder: 'Cari nama institusi / kampus...',
                        className: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
                      }),
                      createElement(
                        'select',
                        {
                          value: instansiId,
                          onChange: (e: any) => {
                            const sId = e.target.value;
                            setInstansiId(sId);
                            const sel = initialInstitutions.find((i) => String(i.id) === String(sId));
                            setInstansi(sel ? `${sel.abbr ? sel.abbr + ' - ' : ''}${sel.name}` : '');
                          },
                          className: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
                        },
                        createElement('option', { value: '' }, `-- Pilih Instansi Terdaftar (${filteredInstitutions.length}) --`),
                        filteredInstitutions.map((i) =>
                          createElement(
                            'option',
                            { key: i.id, value: i.id },
                            `${i.abbr ? i.abbr + ' — ' : ''}${i.name} ${i.city ? `(${i.city})` : ''}`
                          )
                        )
                      )
                    ),
                    errors.instansi ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.instansi) : null
                  )
                : null,

              instansiMode === 'perorangan'
                ? createElement(
                    'div',
                    { className: 'p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2' },
                    Icon('Info', { className: 'w-4 h-4 flex-shrink-0' }),
                    createElement('span', null, 'Pesanan perorangan akan menggunakan nama pemesan sebagai label identitas order.')
                  )
                : null
            )
          : null,

        // Pemesan Contact Details
        createElement(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
          createElement(
            'div',
            null,
            createElement('label', { className: 'block text-xs font-semibold text-slate-900 mb-1' }, 'Nama Lengkap Pemesan (PIC) *'),
            createElement(
              'div',
              { className: 'relative' },
              createElement('input', {
                type: 'text',
                value: pemesanName,
                onChange: (e: any) => setPemesanName(e.target.value),
                placeholder: 'misal: Bima Satria Ramadhan',
                className: 'w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
              }),
              createElement(
                'span',
                { className: 'absolute left-3 top-3 text-slate-400' },
                Icon('User', { className: 'w-4 h-4' })
              )
            ),
            errors.pemesanName ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.pemesanName) : null
          ),
          createElement(
            'div',
            null,
            createElement('label', { className: 'block text-xs font-semibold text-slate-900 mb-1' }, 'No. WhatsApp Pemesan *'),
            createElement(
              'div',
              { className: 'relative flex gap-2' },
              createElement(
                'div',
                { className: 'relative flex-1' },
                createElement('input', {
                  type: 'text',
                  value: pemesanPhone,
                  onChange: (e: any) => setPemesanPhone(e.target.value),
                  placeholder: 'misal: 081234567890',
                  className: 'w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono',
                }),
                createElement(
                  'span',
                  { className: 'absolute left-3 top-3 text-slate-400' },
                  Icon('Phone', { className: 'w-4 h-4' })
                )
              ),
              pemesanPhone
                ? createElement(
                    'a',
                    {
                      href: getWhatsAppLink(pemesanPhone, 'Halo, konfirmasi pesanan apparel di Kinau ID.'),
                      target: '_blank',
                      rel: 'noreferrer',
                      className: 'px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center transition-all text-xs font-medium',
                      title: 'Buka Chat WhatsApp',
                    },
                    Icon('MessageCircle', { className: 'w-4 h-4' })
                  )
                : null
            ),
            errors.pemesanPhone ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.pemesanPhone) : null
          )
        ),

        // Dynamic Products Section
        createElement(
          'div',
          { className: 'space-y-3 border-t border-slate-200 pt-5' },
          createElement(
            'div',
            { className: 'flex items-center justify-between' },
            createElement(
              'div',
              { className: 'flex items-center gap-2' },
              createElement('h2', { className: 'text-sm font-bold text-slate-900' }, 'Daftar Produk yang Dipesan'),
              createElement(
                'span',
                { className: 'px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600' },
                `${orderItems.length} Item`
              )
            )
          ),

          createElement(
            'div',
            { className: 'space-y-3' },
            orderItems.map((item, idx) => {
              const variants = item.product_variants || [];
              return createElement(
                'div',
                {
                  key: idx,
                  className: 'p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-all hover:border-slate-300 shadow-2xs',
                },
                createElement(
                  'div',
                  { className: 'flex items-center gap-2 flex-1' },
                  createElement(
                    'span',
                    { className: 'w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600' },
                    idx + 1
                  ),
                  createElement(
                    'select',
                    {
                      value: item.productId,
                      onChange: (e: any) => handleSelectProduct(idx, e.target.value),
                      className: 'flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
                    },
                    createElement('option', { value: '' }, `-- Pilih Produk (${initialProducts.length}) --`),
                    initialProducts.map((p) =>
                      createElement(
                        'option',
                        { key: p.id, value: p.id },
                        `${p.name} (${formatCurrency(p.price || p.total_price || 0)})`
                      )
                    )
                  )
                ),

                createElement(
                  'div',
                  { className: 'w-full md:w-56' },
                  createElement(
                    'select',
                    {
                      disabled: !item.productId || variants.length === 0,
                      value: item.variant_id ? String(item.variant_id) : '',
                      onChange: (e: any) => handleSelectVariant(idx, e.target.value),
                      className: 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50',
                    },
                    createElement('option', { value: '' }, variants.length === 0 ? 'Varian Standar' : 'Pilih Varian'),
                    variants.map((v) =>
                      createElement(
                        'option',
                        { key: v.id, value: v.id },
                        `${v.variant_name} ${Number(v.base_price) > 0 ? `(+${formatCurrency(v.base_price)})` : ''}`
                      )
                    )
                  )
                ),

                createElement(
                  'div',
                  { className: 'flex items-center gap-2' },
                  createElement(
                    'div',
                    { className: 'w-24' },
                    createElement('input', {
                      type: 'number',
                      min: 1,
                      disabled: !item.productId,
                      value: item.quantity,
                      onChange: (e: any) => handleQtyChange(idx, e.target.value),
                      placeholder: 'Qty',
                      className: 'w-full px-3 py-2.5 text-center rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold disabled:opacity-50',
                    })
                  ),

                  createElement(
                    'div',
                    { className: 'w-32 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 text-center truncate' },
                    Number(item.variant_final_price) > 0 ? formatCurrency(item.variant_final_price || 0) : 'Rp 0'
                  ),

                  orderItems.length > 1
                    ? createElement(
                        'button',
                        {
                          type: 'button',
                          onClick: () => handleRemoveItem(idx),
                          className: 'p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all',
                          title: 'Hapus Baris Produk',
                        },
                        Icon('Trash2', { className: 'w-4 h-4' })
                      )
                    : null
                )
              );
            })
          ),

          errors.items ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.items) : null,

          createElement(
            'button',
            {
              type: 'button',
              onClick: handleAddItem,
              className: 'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 border border-[var(--primary)]/20 transition-all mt-1',
            },
            Icon('Plus', { className: 'w-4 h-4' }),
            'Tambah Produk Lain'
          )
        ),

        // Sponsor & Discount Section
        !isKKN
          ? createElement(
              'div',
              { className: 'p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4' },
              createElement(
                'div',
                { className: 'flex items-center justify-between' },
                createElement(
                  'label',
                  { className: 'flex items-center gap-3 cursor-pointer select-none' },
                  createElement('input', {
                    type: 'checkbox',
                    checked: isSponsor,
                    onChange: (e: any) => setIsSponsor(e.target.checked),
                    className: 'w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300',
                  }),
                  createElement(
                    'div',
                    { className: 'flex items-center gap-1.5 text-xs font-bold text-slate-900' },
                    Icon('Handshake', { className: 'w-4 h-4 text-purple-500' }),
                    createElement('span', null, 'Sponsorship / Kemitraan Khusus')
                  )
                ),
                isSponsor
                  ? createElement(
                      'span',
                      { className: 'px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20' },
                      'Sponsor Active'
                    )
                  : null
              ),

              createElement(
                'div',
                { className: 'flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-slate-200' },
                createElement('label', { className: 'text-xs font-semibold text-slate-600 w-28' }, 'Potongan Diskon:'),
                createElement(
                  'div',
                  { className: 'flex gap-2 flex-1' },
                  createElement(
                    'select',
                    {
                      value: discountType,
                      onChange: (e: any) => setDiscountType(e.target.value as any),
                      className: 'px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:outline-none',
                    },
                    DISCOUNT_TYPE_OPTIONS.map((opt) =>
                      createElement('option', { key: opt.value, value: opt.value }, opt.label)
                    )
                  ),
                  createElement('input', {
                    type: 'text',
                    value: discountValStr,
                    onChange: (e: any) => {
                      if (discountType === 'nominal') {
                        setDiscountValStr(formatCurrency(parseCurrency(e.target.value)));
                      } else {
                        setDiscountValStr(e.target.value);
                      }
                    },
                    placeholder: discountType === 'percent' ? 'misal: 10%' : 'misal: Rp 50.000',
                    className: 'flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
                  })
                )
              )
            )
          : null,

        // Deadline & Payment
        createElement(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
          createElement(
            'div',
            null,
            createElement('label', { className: 'block text-xs font-semibold text-slate-900 mb-1' }, 'Batas Waktu Selesai (Deadline) *'),
            createElement('input', {
              type: 'date',
              value: deadline,
              onChange: (e: any) => setDeadline(e.target.value),
              className: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
            }),
            errors.deadline ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.deadline) : null
          ),

          createElement(
            'div',
            null,
            createElement('label', { className: 'block text-xs font-semibold text-slate-900 mb-1' }, 'Status Pembayaran Masuk'),
            createElement(
              'select',
              {
                value: pay,
                onChange: (e: any) => setPay(e.target.value as any),
                className: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
              },
              PAYMENT_STATUS_OPTIONS.map((opt) =>
                createElement('option', { key: opt.val, value: opt.val }, opt.label)
              )
            ),

            pay === 'DP'
              ? createElement(
                  'div',
                  { className: 'mt-2.5 flex items-center gap-2 animate-in fade-in' },
                  createElement('input', {
                    type: 'text',
                    value: dpAmountStr,
                    onChange: (e: any) => setDpAmountStr(formatCurrency(parseCurrency(e.target.value))),
                    placeholder: 'Nominal DP (Rp)',
                    className: 'flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono font-semibold',
                  }),
                  createElement(
                    'button',
                    {
                      type: 'button',
                      onClick: () => handleDpPercent(50),
                      className: 'px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20',
                    },
                    '50%'
                  ),
                  createElement(
                    'button',
                    {
                      type: 'button',
                      onClick: () => handleDpPercent(70),
                      className: 'px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20',
                    },
                    '70%'
                  )
                )
              : null,
            errors.dp ? createElement('p', { className: 'text-red-500 text-xs mt-1' }, errors.dp) : null
          )
        ),

        // Total Billing Summary Panel
        createElement(
          'div',
          { className: 'p-6 bg-slate-900 text-slate-100 rounded-2xl shadow-xl space-y-3' },
          createElement(
            'div',
            { className: 'flex justify-between items-center text-xs opacity-80' },
            createElement('span', null, `Subtotal (${financials.totalQty} pcs pesanan)`),
            createElement('span', { className: 'font-mono' }, formatCurrency(financials.subTotal))
          ),

          financials.discountAmount > 0
            ? createElement(
                'div',
                { className: 'flex justify-between items-center text-xs text-emerald-400' },
                createElement('span', null, 'Potongan Diskon'),
                createElement('span', { className: 'font-mono' }, `- ${formatCurrency(financials.discountAmount)}`)
              )
            : null,

          isSponsor
            ? createElement(
                'div',
                { className: 'flex justify-between items-center text-xs text-purple-400 font-bold' },
                createElement('span', null, 'Skema Kemitraan'),
                createElement('span', null, 'SPONSORSHIP')
              )
            : null,

          createElement(
            'div',
            { className: 'flex justify-between items-center pt-3 border-t border-slate-800' },
            createElement(
              'div',
              null,
              createElement('span', { className: 'text-xs uppercase tracking-wider text-slate-400 font-semibold block' }, 'Total Tagihan Pesanan'),
              createElement('span', { className: 'text-2xl font-black text-white font-mono tracking-tight' }, formatCurrency(financials.grandTotal))
            ),
            createElement(
              'div',
              { className: 'text-right' },
              createElement('span', { className: 'text-xs text-slate-400 block mb-1' }, 'Drive Access Code'),
              createElement(
                'div',
                { className: 'inline-flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700' },
                createElement('span', { className: 'font-mono text-xs text-cyan-400 font-bold', suppressHydrationWarning: true }, accessCode),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => copyLink(accessCode),
                    className: 'text-slate-400 hover:text-white',
                    title: 'Salin Link Drive',
                  },
                  Icon('Copy', { className: 'w-3.5 h-3.5' })
                )
              )
            )
          )
        ),

        // Form Actions
        createElement(
          'div',
          { className: 'flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-200' },
          createElement(
            'button',
            {
              type: 'button',
              onClick: handleResetForm,
              className: 'w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all',
            },
            Icon('Eraser', { className: 'w-4 h-4' }),
            'Reset Formulir'
          ),
          createElement(
            'button',
            {
              type: 'submit',
              disabled: isLoading,
              className: 'w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 transition-all disabled:opacity-50',
            },
            Icon(isLoading ? 'Loader2' : 'Save', { className: `w-4 h-4 ${isLoading ? 'animate-spin' : ''}` }),
            isLoading ? 'Menyimpan Pesanan...' : 'Simpan & Konfirmasi Pesanan'
          )
        )
      )
    ),

    // Confirmation Modal
    showConfirm && pendingData
      ? createElement(
          'div',
          { className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in' },
          createElement(
            'div',
            { className: 'bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden' },
            createElement(
              'div',
              { className: 'p-6 space-y-4' },
              createElement(
                'div',
                { className: 'flex items-center gap-3 text-amber-500' },
                createElement(
                  'div',
                  { className: 'p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20' },
                  Icon('AlertTriangle', { className: 'w-6 h-6' })
                ),
                createElement(
                  'div',
                  null,
                  createElement('h3', { className: 'text-base font-bold text-slate-900' }, 'Konfirmasi Pembuatan Pesanan'),
                  createElement('p', { className: 'text-xs text-slate-500' }, 'Pastikan data rincian pesanan telah diverifikasi.')
                )
              ),

              createElement(
                'div',
                { className: 'bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5' },
                createElement(
                  'div',
                  { className: 'flex justify-between border-b border-slate-200 pb-2' },
                  createElement('span', { className: 'text-slate-500' }, 'Institusi / Identitas:'),
                  createElement('span', { className: 'font-bold text-slate-900 text-right' }, pendingData.instansi)
                ),
                createElement(
                  'div',
                  { className: 'flex justify-between border-b border-slate-200 pb-2' },
                  createElement('span', { className: 'text-slate-500' }, 'Pemesan / WA:'),
                  createElement('span', { className: 'font-semibold text-slate-900 text-right' }, `${pendingData.pemesanName} (${pendingData.pemesanPhone})`)
                ),
                createElement(
                  'div',
                  { className: 'border-b border-slate-200 pb-2 space-y-1' },
                  createElement('span', { className: 'text-slate-500 font-semibold block mb-1' }, 'Rincian Item:'),
                  pendingData.items.map((it, idx) =>
                    createElement(
                      'div',
                      { key: idx, className: 'flex justify-between text-slate-600' },
                      createElement('span', null, `• ${it.productName || 'Custom'} ${it.variant_name ? `(${it.variant_name})` : ''} x${it.quantity}`),
                      createElement('span', { className: 'font-mono font-semibold text-slate-900' }, formatCurrency(it.variant_final_price || 0))
                    )
                  )
                ),
                createElement(
                  'div',
                  { className: 'flex justify-between items-center pt-1 text-sm font-bold text-slate-900' },
                  createElement('span', null, 'Total Akhir Tagihan:'),
                  createElement('span', { className: 'font-mono text-base text-[var(--primary)]' }, formatCurrency(pendingData.totalAmount))
                ),
                createElement(
                  'div',
                  { className: 'pt-2 border-t border-slate-200 flex items-center justify-between text-slate-500' },
                  createElement('span', null, 'Link Akses Drive Klien:'),
                  createElement('span', { className: 'font-mono text-cyan-600 font-bold', suppressHydrationWarning: true }, pendingData.accessCode)
                )
              ),

              createElement(
                'div',
                { className: 'flex items-center justify-end gap-3 pt-2' },
                Button({
                  label: 'Batal',
                  variant: 'ghost',
                  size: 'sm',
                  disabled: isLoading,
                  onClick: () => setShowConfirm(false),
                }),
                Button({
                  label: isLoading ? 'Menyimpan...' : 'Ya, Simpan Pesanan',
                  icon: isLoading ? 'Loader2' : 'Check',
                  variant: 'primary',
                  size: 'sm',
                  disabled: isLoading,
                  onClick: handleConfirmSubmit,
                })
              )
            )
          )
        )
      : null
  );
}

// DSL Wrapper for single-file feature builder
export function OrderFormWidget(ctx: {
  data: OrderFormInitialData;
  actionData?: any;
  send: any;
  navigate?: any;
  isLoading?: boolean;
}) {
  const { data, actionData, send, navigate } = ctx;
  const isSubmitting = send?.state === 'submitting' || send?.state === 'loading';
  const effectiveActionData = send?.data ?? actionData;

  const handleSubmitOrder = (orderData: OrderFormData) => {
    send.submit(
      {
        intent: 'create-order',
        data: JSON.stringify(orderData),
      },
      { method: 'post' }
    );
  };

  return createElement(OrderFormComponent, {
    initialProducts: data?.products || [],
    initialInstitutions: data?.institutions || [],
    initialAccessCode: data?.accessCode,
    initialKknPeriod: data?.kknPeriod,
    onSubmit: handleSubmitOrder,
    actionData: effectiveActionData,
    isLoading: isSubmitting,
    navigate,
  });
}
