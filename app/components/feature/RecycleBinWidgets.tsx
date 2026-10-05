import React from 'react';
import {
  Trash2,
  Recycle,
  Search,
  Handshake,
  Calendar,
  User,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { type DeletedOrderItem, type RecycleBinData } from '~/schemas/recycle-bin.schema';

export interface RecycleBinWidgetProps {
  data: RecycleBinData;
  search: string;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onRestore: (id: string, orderNumber: string) => void;
  onPurge: (id: string, orderNumber: string) => void;
  isSubmitting?: boolean;
}

export function RecycleBinWidget({
  data,
  search,
  onSearchChange,
  onPageChange,
  onRestore,
  onPurge,
  isSubmitting = false,
}: RecycleBinWidgetProps): React.ReactElement {
  const { items = [], total_items = 0, page = 0, size = 10 } = data || {};
  const totalPages = Math.ceil(total_items / size) || 1;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getCreatorName = (createdBy: any) => {
    if (!createdBy) return 'Sistem';
    if (typeof createdBy === 'string') {
      try {
        const parsed = JSON.parse(createdBy);
        return parsed?.fullname || parsed?.username || createdBy;
      } catch {
        return createdBy;
      }
    }
    return createdBy?.fullname || createdBy?.username || 'Admin';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <Trash2 size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Total Pesanan Dihapus
            </p>
            <h3 className="text-2xl font-black text-[var(--foreground)] mt-0.5">{total_items}</h3>
          </div>
        </div>

        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Recycle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Pemulihan Instan
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Data dapat dikembalikan ke antrean utama tanpa kehilangan histori folder.
            </p>
          </div>
        </div>

        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Perlindungan Soft-Delete
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Proteksi data pesanan dari penghapusan tidak sengaja oleh operator.
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm overflow-hidden">
        {/* Table Search & Header Bar */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Daftar Item di Tempat Sampah</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Pilih pesanan yang ingin dipulihkan atau dibersihkan permanen.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={15} />
            <input
              type="text"
              placeholder="Cari no. order / instansi..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            />
          </div>
        </div>

        {/* Table Content */}
        {items.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--muted-foreground)]">
              <Recycle size={28} className="opacity-50" />
            </div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">Tempat Sampah Kosong</h4>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              Tidak ada data pesanan yang berstatus terhapus. Semua pesanan Anda aman di sistem.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--foreground)]">
              <thead className="bg-[var(--surface-subtle)] text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="py-3.5 px-4">No. Order & Tanggal</th>
                  <th className="py-3.5 px-4">Instansi / Pemesan</th>
                  <th className="py-3.5 px-4">Waktu Dihapus</th>
                  <th className="py-3.5 px-4">Dibuat Oleh</th>
                  <th className="py-3.5 px-4 text-right">Aksi Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-subtle)]/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[var(--foreground)] text-xs">
                          {+(order.is_archive ?? 0) === 1 ? 'Arsip' : order.order_number}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                          <Calendar size={11} /> {formatDate(order.created_on)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <div className="font-bold text-[var(--foreground)] flex items-center gap-1.5 flex-wrap">
                          <span>{order.institution_name}</span>
                          {+(order.is_sponsor ?? 0) === 1 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <Handshake size={10} className="mr-0.5" /> PARTNER
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                          PIC: {order.pic_name || '-'} {order.pic_phone ? `(${order.pic_phone})` : ''}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                        <Trash2 size={11} /> {formatDate(order.deleted_on)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                        <User size={12} />
                        <span>{getCreatorName(order.created_by)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Kembalikan Pesanan?',
                              text: `Yakin ingin mengembalikan pesanan ${order.order_number} ke daftar pesanan aktif?`,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonText: 'Ya, Kembalikan',
                              cancelButtonText: 'Batal',
                              confirmButtonColor: '#2563eb',
                            }).then((result) => {
                              if (result.isConfirmed) {
                                onRestore(order.id, order.order_number);
                              }
                            });
                          }}
                          disabled={isSubmitting}
                          className="h-8 px-3 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition flex items-center gap-1.5 shadow-sm"
                          title="Restore Pesanan"
                        >
                          <RotateCcw size={13} />
                          <span>Pulihkan</span>
                        </button>

                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Hapus Permanen?',
                              text: `PERINGATAN: Pesanan ${order.order_number} akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan!`,
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonText: 'Hapus Permanen',
                              cancelButtonText: 'Batal',
                              confirmButtonColor: '#ef4444',
                            }).then((result) => {
                              if (result.isConfirmed) {
                                onPurge(order.id, order.order_number);
                              }
                            });
                          }}
                          disabled={isSubmitting}
                          className="h-8 w-8 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 transition flex items-center justify-center"
                          title="Hapus Permanen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer & Pagination */}
        {total_items > 0 && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
            <div>
              Menampilkan <span className="font-bold text-[var(--foreground)]">{items.length}</span> dari{' '}
              <span className="font-bold text-[var(--foreground)]">{total_items}</span> data terhapus
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 0 || isSubmitting}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-subtle)] disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold px-2">
                Halaman {page + 1} dari {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1 || isSubmitting}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-subtle)] disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
