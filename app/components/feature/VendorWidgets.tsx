import React from 'react';
import {
  Scissors,
  Ruler,
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Building2,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  type VendorCategory,
  type VendorSubkonOrder,
  type VendorData,
} from '~/schemas/vendor.schema';

export interface VendorWidgetProps {
  data: VendorData;
  onCategoryChange: (cat: VendorCategory) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isSubmitting?: boolean;
}

export function VendorWidget({
  data,
  onCategoryChange,
  onUpdateStatus,
  isSubmitting = false,
}: VendorWidgetProps): React.ReactElement {
  const { orders = [], activeCount = 0, doneCount = 0, category = 'selempang' } = data || {};

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs & Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)] shadow-sm w-fit">
          <button
            onClick={() => onCategoryChange('selempang')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              category === 'selempang'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Scissors size={15} /> SELEMPANG & BORDIR
          </button>
          <button
            onClick={() => onCategoryChange('seragam')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              category === 'seragam'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Ruler size={15} /> SERAGAM & JAHIT
          </button>
          <button
            onClick={() => onCategoryChange('bordir')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              category === 'bordir'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Sparkles size={15} /> EMBLEM & BADGE
          </button>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-3 bg-[var(--surface)] px-5 py-2.5 rounded-2xl border border-[var(--border)] shadow-sm">
          <div className="text-center">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Antrean Aktif</div>
            <div className="text-base font-black text-[var(--foreground)]">{activeCount}</div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="text-center">
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Selesai</div>
            <div className="text-base font-black text-[var(--foreground)]">{doneCount}</div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-base font-black text-[var(--foreground)] uppercase">
              Monitoring Subkon {category.toUpperCase()}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Pantau pengerjaan pihak ketiga dan status serah terima produk.
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            Total {orders.length} pesanan terdaftar
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-[var(--surface-subtle)] rounded-2xl border-2 border-dashed border-[var(--border)]">
            <Package size={40} className="text-[var(--muted-foreground)] opacity-40 mb-3" />
            <h4 className="font-bold text-sm text-[var(--foreground)]">Belum ada pesanan subkon</h4>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Pesanan dengan item {category} akan muncul di sini secara otomatis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const isDone = order.status === 'done' || order.status === 'completed';
              return (
                <div
                  key={order.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isDone
                      ? 'bg-[var(--surface-subtle)]/60 border-[var(--border)] opacity-80'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-emerald-500 shadow-sm'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {order.order_number}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDone
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {isDone ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {isDone ? 'Selesai Subkon' : 'Pengerjaan'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[var(--foreground)] truncate" title={order.institution_name}>
                        {order.institution_name}
                      </h4>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                        {order.items_summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)] space-y-1 text-xs text-[var(--muted-foreground)]">
                      <div className="flex items-center justify-between">
                        <span>Total Kuantiti:</span>
                        <span className="font-extrabold text-[var(--foreground)]">{order.total_qty} pcs</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Nilai Pesanan:</span>
                        <span className="font-bold text-[var(--foreground)]">{formatRupiah(order.total_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Calendar size={11} /> Tanggal:</span>
                        <span>{formatDate(order.created_on)}</span>
                      </div>
                      {order.pic_phone && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1"><Phone size={11} /> Kontak:</span>
                          <span className="font-medium text-emerald-600">{order.pic_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isDone ? (
                    <button
                      onClick={() => {
                        Swal.fire({
                          title: 'Tandai Selesai Subkon?',
                          text: `Pengerjaan vendor untuk pesanan ${order.order_number} akan ditandai selesai.`,
                          icon: 'question',
                          showCancelButton: true,
                          confirmButtonText: 'Ya, Tandai Selesai',
                          cancelButtonText: 'Batal',
                          confirmButtonColor: '#10b981',
                        }).then((result) => {
                          if (result.isConfirmed) {
                            onUpdateStatus(order.id, 'done');
                          }
                        });
                      }}
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20"
                    >
                      <Check size={14} /> Tandai Selesai Subkon
                    </button>
                  ) : (
                    <div className="text-center py-2 text-xs font-bold text-gray-400 dark:text-gray-500 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border)]">
                      ✓ Pengerjaan Selesai
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
