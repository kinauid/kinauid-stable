import React, { useState, useMemo } from 'react';
import {
  Package,
  Calendar,
  DollarSign,
  User,
  Phone,
  Building,
  Save,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  FileCheck,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import type { OrderDetailData, OrderItemSpec } from '~/schemas/order-edit.schema';

interface OrderEditWidgetProps {
  order: OrderDetailData;
  onSave: (payload: any) => void;
  onNavigate: (path: string) => void;
  isSubmitting?: boolean;
}

export const OrderEditWidget: React.FC<OrderEditWidgetProps> = ({
  order,
  onSave,
  onNavigate,
  isSubmitting,
}) => {
  const [orderNumber, setOrderNumber] = useState(order?.order_number || '');
  const [institutionName, setInstitutionName] = useState(order?.institution_name || '');
  const [picName, setPicName] = useState(order?.pic_name || '');
  const [picPhone, setPicPhone] = useState(order?.pic_phone || '');
  const [deadline, setDeadline] = useState(order?.deadline || '');
  const [status, setStatus] = useState(order?.status || 'pending');
  const [paymentStatus, setPaymentStatus] = useState(order?.payment_status || 'unpaid');
  const [dpAmount, setDpAmount] = useState(order?.dp_amount || 0);
  const [notes, setNotes] = useState(order?.notes || '');

  // KKN metadata
  const [isKkn, setIsKkn] = useState(order?.is_kkn ?? false);
  const [kknType, setKknType] = useState(order?.kkn_type || 'Tematik');
  const [kknPeriod, setKknPeriod] = useState(order?.kkn_period || 1);
  const [kknYear, setKknYear] = useState(order?.kkn_year || 2026);
  const [kknDetail, setKknDetail] = useState(order?.kkn_detail || '');

  // Line items
  const [items, setItems] = useState<OrderItemSpec[]>(order?.items || []);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.subtotal) || (Number(item.qty) * Number(item.unit_price))), 0);
  }, [items]);

  const sisaTagihan = Math.max(0, totalAmount - dpAmount);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product_id: Date.now().toString(),
        product_name: 'Item Baru',
        variant: 'Standar',
        qty: 1,
        unit_price: 15000,
        subtotal: 15000,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof OrderItemSpec, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };
    if (field === 'qty' || field === 'unit_price') {
      const q = field === 'qty' ? Number(value) : Number(current.qty);
      const p = field === 'unit_price' ? Number(value) : Number(current.unit_price);
      current.subtotal = q * p;
    }
    updated[index] = current;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      intent: 'update-order',
      id: String(order.id),
      order_number: orderNumber,
      institution_name: institutionName,
      pic_name: picName,
      pic_phone: picPhone,
      deadline,
      status,
      payment_status: paymentStatus,
      dp_amount: dpAmount,
      total_amount: totalAmount,
      is_kkn: isKkn,
      kkn_type: kknType,
      kkn_period: kknPeriod,
      kkn_year: kknYear,
      kkn_detail: kknDetail,
      notes,
      items: JSON.stringify(items),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner Action Bar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[var(--primary)] bg-blue-500/10 px-2.5 py-1 rounded-lg">
              {orderNumber || 'ORD-EDIT'}
            </span>
            <span className="text-xs text-[var(--text-muted)]">ID: #{order.id}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Edit spesifikasi order, tahapan produksi, kuantitas item, dan pembayaran.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onNavigate(`/app/orders/${order.id}/download`)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[var(--border)] text-xs font-bold rounded-xl text-[var(--text)] hover:bg-[var(--background)] transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Nota & SPK
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-[var(--primary)] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: General & Customer Information */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer & PIC Details */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Building className="w-4 h-4 text-[var(--primary)]" />
              Identitas Pelanggan & Pemesan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nama Institusi / Organisasi</label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nomor Order</label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] font-mono focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nama Penanggung Jawab (PIC)</label>
                <input
                  type="text"
                  required
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nomor WhatsApp PIC</label>
                <input
                  type="text"
                  required
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--primary)]" />
                Rincian Item & Spesifikasi Produk
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Item
              </button>
            </div>

            <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] text-[var(--text-muted)] border-b border-[var(--border)]">
                  <tr>
                    <th className="py-2.5 px-3">Nama Produk</th>
                    <th className="py-2.5 px-3">Varian / Spek</th>
                    <th className="py-2.5 px-3 w-20">Qty</th>
                    <th className="py-2.5 px-3 w-32">Harga Satuan</th>
                    <th className="py-2.5 px-3 w-32">Subtotal</th>
                    <th className="py-2.5 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--background)]/30">
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) => handleUpdateItem(idx, 'product_name', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-[var(--border)] p-1 text-xs focus:ring-0 focus:outline-none text-[var(--text)] font-medium"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.variant || ''}
                          onChange={(e) => handleUpdateItem(idx, 'variant', e.target.value)}
                          placeholder="Warna / Ukuran"
                          className="w-full bg-transparent border-0 border-b border-[var(--border)] p-1 text-xs focus:ring-0 focus:outline-none text-[var(--text-muted)]"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(idx, 'qty', Number(e.target.value))}
                          className="w-full bg-transparent border-0 border-b border-[var(--border)] p-1 text-xs focus:ring-0 focus:outline-none text-[var(--text)] text-center font-bold"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleUpdateItem(idx, 'unit_price', Number(e.target.value))}
                          className="w-full bg-transparent border-0 border-b border-[var(--border)] p-1 text-xs focus:ring-0 focus:outline-none text-[var(--text)] font-mono"
                        />
                      </td>
                      <td className="p-2.5 font-bold font-mono text-[var(--text)]">
                        Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Catatan Khusus Produksi</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan finishing sablon, packing plastik satuan, atau instruksi ekspedisi..."
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* KKN Program Section */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                Metadata Program KKN Kampus
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={isKkn}
                  onChange={(e) => setIsKkn(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--primary)]"
                />
                Pesanan KKN / Kampus
              </label>
            </div>

            {isKkn && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--border)]/50">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Jenis KKN</label>
                  <input
                    type="text"
                    value={kknType}
                    onChange={(e) => setKknType(e.target.value)}
                    placeholder="Tematik / Mandiri"
                    className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Periode & Tahun</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={kknPeriod}
                      onChange={(e) => setKknPeriod(Number(e.target.value))}
                      className="w-20 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                    />
                    <input
                      type="number"
                      value={kknYear}
                      onChange={(e) => setKknYear(Number(e.target.value))}
                      className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Lokasi / Kelompok</label>
                  <input
                    type="text"
                    value={kknDetail}
                    onChange={(e) => setKknDetail(e.target.value)}
                    placeholder="Kelompok 14 Malang"
                    className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status Pipeline & Financials */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Produksi & Deadline */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--primary)]" />
              Status & Target Deadline
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Tahapan Produksi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text)] font-semibold focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              >
                <option value="pending">⏳ Antrean / Pending</option>
                <option value="design_review">🎨 Review & ACC Desain</option>
                <option value="production">⚙️ Proses Produksi (Workshop)</option>
                <option value="ready_to_ship">📦 Siap Kirim (QC Selesai)</option>
                <option value="delivered">🚚 Sedang Dikirim</option>
                <option value="completed">✅ Selesai & Diterima</option>
                <option value="cancelled">❌ Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Target Selesai / Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Payment Status & Financial Breakdown */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Keuangan & Pembayaran
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Status Pembayaran</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] font-bold focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              >
                <option value="unpaid">Belum Bayar (Unpaid)</option>
                <option value="dp">DP / Uang Muka 50%</option>
                <option value="paid">Lunas (Paid)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Jumlah DP Diterima (Rp)</label>
              <input
                type="number"
                min={0}
                value={dpAmount}
                onChange={(e) => setDpAmount(Number(e.target.value))}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] font-mono font-bold focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-[var(--border)] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span>Total Nilai Order:</span>
                <span className="font-bold font-mono text-[var(--text)]">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span>DP Diterima:</span>
                <span className="font-bold font-mono text-emerald-600">Rp {dpAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] font-bold">
                <span className="text-[var(--text)]">Sisa Tagihan:</span>
                <span className="font-mono text-red-500 text-sm">Rp {sisaTagihan.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
