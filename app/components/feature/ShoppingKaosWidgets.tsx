import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Building2,
  PackageCheck,
  Calculator,
  Save,
  Sparkles,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  type ShoppingKaosOrder,
  type SupplierKaos,
  type ProcurementStockLog,
} from '~/schemas/shopping-kaos.schema';

export interface ShoppingKaosWidgetProps {
  orders: ShoppingKaosOrder[];
  suppliers: SupplierKaos[];
  sablonSuppliers: SupplierKaos[];
  stockLogs: ProcurementStockLog[];
  onSubmitProcurement: (payload: any) => void;
  isSubmitting?: boolean;
}

export function ShoppingKaosWidget({
  orders = [],
  suppliers = [],
  sablonSuppliers = [],
  stockLogs = [],
  onSubmitProcurement,
  isSubmitting = false,
}: ShoppingKaosWidgetProps): React.ReactElement {
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>(orders[0]?.order_number || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(Number(suppliers[0]?.id || 1));
  const [selectedSablonId, setSelectedSablonId] = useState<number>(Number(sablonSuppliers[0]?.id || 101));

  // Additional cost inputs
  const [kaosDiscount, setKaosDiscount] = useState<number>(0);
  const [kaosShipping, setKaosShipping] = useState<number>(0);
  const [kaosAdmin, setKaosAdmin] = useState<number>(0);

  const [sablonMeter, setSablonMeter] = useState<number>(2);
  const [sablonDiscount, setSablonDiscount] = useState<number>(0);
  const [sablonShipping, setSablonShipping] = useState<number>(0);
  const [sablonAdmin, setSablonAdmin] = useState<number>(0);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_number === selectedOrderNumber) || orders[0],
    [orders, selectedOrderNumber]
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => Number(s.id) === selectedSupplierId) || suppliers[0],
    [suppliers, selectedSupplierId]
  );

  const selectedSablon = useMemo(
    () => sablonSuppliers.find((s) => Number(s.id) === selectedSablonId) || sablonSuppliers[0],
    [sablonSuppliers, selectedSablonId]
  );

  // Price matrix calculation helper
  const getUnitPrice = (size: string, sleeve: string, vendor: SupplierKaos | undefined) => {
    if (!vendor) return 35000;
    const s = (size || 'L').toUpperCase();
    let base = vendor.price_s_xl || 35000;

    if (['2XL', 'XXL'].includes(s)) base = vendor.price_2xl || 40000;
    else if (['3XL', 'XXXL'].includes(s)) base = vendor.price_3xl || 45000;
    else if (['4XL', 'XXXXL'].includes(s)) base = vendor.price_4xl || 50000;
    else if (['5XL', 'XXXXXL'].includes(s)) base = vendor.price_5xl || 55000;

    if ((sleeve || '').toLowerCase().includes('panjang')) {
      base += vendor.price_long_sleeve || 7000;
    }
    return base;
  };

  // Group items by color
  const colorGroupedItems = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    const items = selectedOrder?.order_items || [];

    items.forEach((item) => {
      const color = item.color || 'Hitam';
      const unitCost = getUnitPrice(item.size || 'L', item.sleeve || 'Pendek', selectedSupplier);
      const totalCost = unitCost * (item.qty || 1);

      if (!grouped[color]) grouped[color] = [];
      grouped[color].push({
        ...item,
        unitCost,
        totalCost,
      });
    });

    return grouped;
  }, [selectedOrder, selectedSupplier]);

  // Aggregate Kaos Totals
  const totalKaosQty = useMemo(() => {
    let count = 0;
    Object.values(colorGroupedItems).forEach((items) => {
      items.forEach((it) => (count += it.qty));
    });
    return count;
  }, [colorGroupedItems]);

  const rawKaosCost = useMemo(() => {
    let total = 0;
    Object.values(colorGroupedItems).forEach((items) => {
      items.forEach((it) => (total += it.totalCost));
    });
    return total;
  }, [colorGroupedItems]);

  const finalKaosCost = Math.max(0, rawKaosCost - kaosDiscount + kaosShipping + kaosAdmin);

  // Aggregate Sablon Totals
  const rawSablonCost = (sablonMeter || 0) * (selectedSablon?.price_s_xl || 45000);
  const finalSablonCost = Math.max(0, rawSablonCost - sablonDiscount + sablonShipping + sablonAdmin);

  // Profitability Analytics
  const orderRevenue = Number(selectedOrder?.total_amount || 0);
  const totalProductionCost = finalKaosCost + finalSablonCost;
  const netProfit = orderRevenue - totalProductionCost;
  const profitMarginPercent = orderRevenue > 0 ? ((netProfit / orderRevenue) * 100).toFixed(1) : '0';

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleSaveProcurement = () => {
    if (!selectedOrder) {
      toast.error('Pilih pesanan terlebih dahulu!');
      return;
    }

    Swal.fire({
      title: 'Simpan Kalkulasi Belanja?',
      text: `Mencatat pengadaan untuk ${selectedOrder.order_number} dengan total modal ${formatRupiah(totalProductionCost)} dan estimasi laba bersih ${formatRupiah(netProfit)}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
    }).then((result) => {
      if (result.isConfirmed) {
        onSubmitProcurement({
          intent: 'create-procurement',
          order_trx_code: selectedOrder.order_number,
          supplier_id: selectedSupplierId,
          total_item_qty: totalKaosQty,
          total_item_price: rawKaosCost,
          discount_value: kaosDiscount,
          shipping_cost: kaosShipping,
          admin_cost: kaosAdmin,
          sablon_supplier_id: selectedSablonId,
          sablon_kebutuhan_per_meter: sablonMeter,
          sablon_cost: rawSablonCost,
          sablon_discount_value: sablonDiscount,
          sablon_shipping_cost: sablonShipping,
          sablon_admin_cost: sablonAdmin,
          final_amount: totalProductionCost,
          laba_bersih: netProfit,
          description: `Kalkulasi belanja Kaos ${selectedOrder.institution_name} (${totalKaosQty} pcs)`,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Selector Bar */}
      <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Calculator size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">Kalkulator Pengadaan Kaos & Sablon</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Hitung modal kain polos berdasarkan ukuran dan estimasi laba pesanan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Pilih Pesanan:</span>
            <select
              value={selectedOrderNumber}
              onChange={(e) => setSelectedOrderNumber(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.order_number}>
                  {o.order_number} - {o.institution_name} ({formatRupiah(o.total_amount)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Supplier Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" /> Vendor Supplier Kaos Polos
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (S-XL: {formatRupiah(s.price_s_xl)}, +Pjg: {formatRupiah(s.price_long_sleeve)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-600" /> Vendor Sablon / DTF Eksternal
            </label>
            <select
              value={selectedSablonId}
              onChange={(e) => setSelectedSablonId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
            >
              {sablonSuppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({formatRupiah(s.price_s_xl)} / meter)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Breakdown Matrix + Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Kaos Matrix & Sablon Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Breakdown Table by Color & Size */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Breakdown Variasi Ukuran & Warna Kaos
                </h3>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Total: {totalKaosQty} pcs
              </span>
            </div>

            <div className="p-4 space-y-4">
              {Object.keys(colorGroupedItems).length === 0 ? (
                <p className="text-center py-8 text-xs text-[var(--muted-foreground)]">
                  Tidak ada item kaos pada pesanan yang dipilih.
                </p>
              ) : (
                Object.entries(colorGroupedItems).map(([color, items]) => (
                  <div key={color} className="border border-[var(--border)] rounded-xl overflow-hidden">
                    <div className="bg-[var(--surface-subtle)] px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--foreground)]">Warna: {color}</span>
                      <span className="text-[11px] font-bold text-[var(--muted-foreground)]">
                        {items.reduce((acc, it) => acc + it.qty, 0)} pcs
                      </span>
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                      {items.map((it, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-[var(--surface-subtle)]/40 transition">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)]">
                              {it.size}
                            </span>
                            <span className="text-[var(--muted-foreground)]">({it.sleeve || 'Pendek'})</span>
                            <span className="text-[var(--muted-foreground)] font-semibold">x {it.qty} pcs</span>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-[var(--foreground)]">{formatRupiah(it.totalCost)}</div>
                            <div className="text-[10px] text-[var(--muted-foreground)]">@{formatRupiah(it.unitCost)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Additional Costs Form for Kaos */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Diskon Supplier (Rp)</label>
                <input
                  type="number"
                  value={kaosDiscount || ''}
                  onChange={(e) => setKaosDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Ongkir Bahan (Rp)</label>
                <input
                  type="number"
                  value={kaosShipping || ''}
                  onChange={(e) => setKaosShipping(Number(e.target.value))}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Biaya Admin / Transfer (Rp)</label>
                <input
                  type="number"
                  value={kaosAdmin || ''}
                  onChange={(e) => setKaosAdmin(Number(e.target.value))}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sablon / DTF Cost Section */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Kebutuhan Sablon / DTF
                </h3>
              </div>
              <span className="text-xs font-extrabold text-purple-600">
                Subtotal: {formatRupiah(finalSablonCost)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Kebutuhan (Meter)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sablonMeter || ''}
                  onChange={(e) => setSablonMeter(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Diskon Sablon (Rp)</label>
                <input
                  type="number"
                  value={sablonDiscount || ''}
                  onChange={(e) => setSablonDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Ongkir Sablon (Rp)</label>
                <input
                  type="number"
                  value={sablonShipping || ''}
                  onChange={(e) => setSablonShipping(Number(e.target.value))}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Admin Sablon (Rp)</label>
                <input
                  type="number"
                  value={sablonAdmin || ''}
                  onChange={(e) => setSablonAdmin(Number(e.target.value))}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profit & Margin Summary Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-subtle)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-md p-5 space-y-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                Ringkasan Finansial Pesanan
              </span>
              <h3 className="text-lg font-black text-[var(--foreground)] mt-2">{selectedOrder?.institution_name}</h3>
              <p className="text-xs text-[var(--muted-foreground)]">{selectedOrder?.order_number}</p>
            </div>

            <div className="space-y-3 text-xs border-y border-[var(--border)] py-4">
              <div className="flex justify-between items-center">
                <span className="text-[var(--muted-foreground)]">Omset Pesanan:</span>
                <span className="font-extrabold text-[var(--foreground)]">{formatRupiah(orderRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                <span>Modal Kaos Polos:</span>
                <span className="font-bold">- {formatRupiah(finalKaosCost)}</span>
              </div>
              <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                <span>Modal Sablon / DTF:</span>
                <span className="font-bold">- {formatRupiah(finalSablonCost)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-[var(--border)]">
                <span className="font-bold text-[var(--foreground)]">Total Pengeluaran Modal:</span>
                <span className="font-black text-[var(--foreground)]">{formatRupiah(totalProductionCost)}</span>
              </div>
            </div>

            {/* Net Profit & Margin Card */}
            <div className={`p-4 rounded-2xl border ${netProfit >= 0 ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                  Estimasi Laba Bersih
                </span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {profitMarginPercent}% Margin
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {formatRupiah(netProfit)}
              </div>
            </div>

            <button
              onClick={handleSaveProcurement}
              disabled={isSubmitting || totalKaosQty === 0}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-40"
            >
              <Save size={16} /> Simpan Pengadaan & Catat Laba
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Procurement History Log */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Riwayat Pengadaan Bahan Baku Terakhir
            </h3>
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">Total Tercatat: {stockLogs.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--foreground)]">
            <thead className="bg-[var(--surface-subtle)] text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="py-3 px-4">No. Order / Trx</th>
                <th className="py-3 px-4">Jumlah Pcs</th>
                <th className="py-3 px-4">Total Belanja Modal</th>
                <th className="py-3 px-4">Laba Bersih</th>
                <th className="py-3 px-4">Status Pengadaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {stockLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                    Belum ada riwayat pencatatan pengadaan.
                  </td>
                </tr>
              ) : (
                stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-subtle)]/40 transition">
                    <td className="py-3 px-4 font-bold">{log.order_trx_code}</td>
                    <td className="py-3 px-4">{log.total_item_qty} pcs</td>
                    <td className="py-3 px-4 font-semibold text-red-600 dark:text-red-400">
                      {formatRupiah(log.final_amount)}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(log.laba_bersih)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 size={11} className="mr-1" /> Terkalkulasi
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
