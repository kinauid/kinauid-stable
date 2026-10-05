import React, { useState } from 'react';
import {
  Ticket,
  Percent,
  Sparkles,
  Plus,
  Search,
  Copy,
  Trash2,
  CheckCircle2,
  Calendar,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  type DiscountData,
  type DiscountCodeItem,
  type DiscountType,
} from '~/schemas/discount.schema';

export interface DiscountWidgetProps {
  data: DiscountData;
  search: string;
  onSearchChange: (search: string) => void;
  onCreateDiscount: (payload: any) => void;
  onToggleActive: (id: string, active: number) => void;
  onDeleteDiscount: (id: string) => void;
  isSubmitting?: boolean;
}

export function DiscountWidget({
  data,
  search,
  onSearchChange,
  onCreateDiscount,
  onToggleActive,
  onDeleteDiscount,
  isSubmitting = false,
}: DiscountWidgetProps): React.ReactElement {
  const { items = [], totalActive = 0, totalCodes = 0 } = data || {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscount, setMaxDiscount] = useState<number>(100000);
  const [minOrder, setMinOrder] = useState<number>(500000);
  const [userLimit, setUserLimit] = useState<number>(100);
  const [validUntil, setValidUntil] = useState<string>('2026-12-31');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'KINAU-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleCopyCode = (promoCode: string) => {
    navigator.clipboard.writeText(promoCode);
    toast.success(`Kode promo ${promoCode} disalin ke clipboard!`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    onCreateDiscount({
      intent: 'create-discount',
      code: code.toUpperCase().trim(),
      name,
      description,
      discount_type: discountType,
      discount_value: discountValue,
      max_discount_amount: maxDiscount,
      min_order_amount: minOrder,
      user_limit: userLimit,
      valid_until: validUntil,
      active: 1,
    });

    setIsModalOpen(false);
    setCode('');
    setName('');
    setDescription('');
  };

  const filteredItems = items.filter((d) => {
    const q = (search || '').toLowerCase();
    return d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Voucher Promo Aktif
            </p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {totalActive} <span className="text-xs font-normal text-[var(--muted-foreground)]">Kupon</span>
            </h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Ticket size={24} />
          </div>
        </div>

        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Total Penggunaan
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {items.reduce((acc, it) => acc + (it.used_count || 0), 0)} <span className="text-xs font-normal text-[var(--muted-foreground)]">Kali Klaim</span>
            </h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Percent size={24} />
          </div>
        </div>

        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Total Kupon Terdaftar
            </p>
            <h3 className="text-2xl font-black text-[var(--foreground)] mt-1">
              {totalCodes} <span className="text-xs font-normal text-[var(--muted-foreground)]">Kode</span>
            </h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Sparkles size={24} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Daftar Kode Promo & Diskon Checkout</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Kelola voucher potongan harga bagi pemesan dan mitra kampus.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={14} />
              <input
                type="text"
                placeholder="Cari kode promo..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <button
              onClick={() => {
                generateRandomCode();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm shadow-blue-600/20 whitespace-nowrap"
            >
              <Plus size={14} /> Buat Kupon Baru
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--foreground)]">
            <thead className="bg-[var(--surface-subtle)] text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="py-3.5 px-4">Kode Voucher</th>
                <th className="py-3.5 px-4">Nama Promo</th>
                <th className="py-3.5 px-4">Nilai Diskon</th>
                <th className="py-3.5 px-4">Min. Belanja</th>
                <th className="py-3.5 px-4">Penggunaan</th>
                <th className="py-3.5 px-4">Masa Berlaku</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[var(--muted-foreground)]">
                    Belum ada kode promo terdaftar.
                  </td>
                </tr>
              ) : (
                filteredItems.map((d) => {
                  const isActive = d.active === 1;
                  return (
                    <tr key={d.id} className="hover:bg-[var(--surface-subtle)]/50 transition">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleCopyCode(d.code)}
                          className="font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 hover:scale-105 transition"
                          title="Klik untuk menyalin kode"
                        >
                          <span>{d.code}</span>
                          <Copy size={11} className="opacity-60" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--foreground)]">{d.name}</div>
                        {d.description && (
                          <div className="text-[10px] text-[var(--muted-foreground)] line-clamp-1">{d.description}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        {d.discount_type === 'percent' ? `${d.discount_value}%` : formatRupiah(d.discount_value)}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[var(--muted-foreground)]">
                        {d.min_order_amount ? formatRupiah(d.min_order_amount) : 'Tanpa Min.'}
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        {d.used_count || 0} / {d.user_limit || '∞'}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-[var(--muted-foreground)]">
                        {d.valid_until ? (
                          <span className="flex items-center gap-1"><Calendar size={11} /> {d.valid_until}</span>
                        ) : 'Permanen'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleActive(d.id, isActive ? 0 : 1)}
                          disabled={isSubmitting}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {isActive ? 'AKTIF' : 'NONAKTIF'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Hapus Kupon Promo?',
                              text: `Kode promo ${d.code} akan dinonaktifkan.`,
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonText: 'Ya, Hapus',
                              cancelButtonText: 'Batal',
                              confirmButtonColor: '#ef4444',
                            }).then((result) => {
                              if (result.isConfirmed) {
                                onDeleteDiscount(d.id);
                              }
                            });
                          }}
                          disabled={isSubmitting}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Hapus Kupon"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Kupon Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-subtle)]">
              <div className="flex items-center gap-2">
                <Ticket className="text-blue-600" size={18} />
                <h3 className="text-sm font-bold text-[var(--foreground)]">Buat Kupon Diskon Baru</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-[var(--muted-foreground)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Kode Promo</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: KKN2026"
                    className="w-full px-3 py-2 text-xs font-black uppercase rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="w-full py-2 px-2 text-[11px] font-bold rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition flex items-center justify-center gap-1"
                  >
                    <Zap size={12} className="text-amber-500" /> Acak
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--foreground)]">Nama Promo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Diskon KKN Spesial Kampus"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Tipe Potongan</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Nilai Diskon</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Min. Belanja (Rp)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Maks. Potongan (Rp)</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Kuota Penggunaan</label>
                  <input
                    type="number"
                    value={userLimit}
                    onChange={(e) => setUserLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Berlaku Sampai</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <CheckCircle2 size={14} /> Terbitkan Kupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
