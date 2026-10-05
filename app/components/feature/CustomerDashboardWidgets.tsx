import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Package,
  ArrowRight,
  Star,
  CheckCircle2,
  PhoneCall,
  Layers,
  FileCheck,
  Send,
  X,
  Palette,
} from 'lucide-react';
import type { CustomerDashboardData, CustomerProductItem } from '~/schemas/customer-dashboard.schema';

interface CustomerDashboardWidgetProps {
  data: CustomerDashboardData;
  onInquiry: (payload: { product_id: string; product_name: string; estimated_qty: number; notes?: string }) => void;
  onNavigate: (path: string) => void;
  isSubmitting?: boolean;
}

export const CustomerDashboardWidget: React.FC<CustomerDashboardWidgetProps> = ({
  data,
  onInquiry,
  onNavigate,
  isSubmitting,
}) => {
  const [inquiryModalProduct, setInquiryModalProduct] = useState<CustomerProductItem | null>(null);
  const [inquiryQty, setInquiryQty] = useState(50);
  const [inquiryNotes, setInquiryNotes] = useState('');

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryModalProduct) return;
    onInquiry({
      product_id: String(inquiryModalProduct.id),
      product_name: inquiryModalProduct.name,
      estimated_qty: Number(inquiryQty),
      notes: inquiryNotes,
    });
    setInquiryModalProduct(null);
    setInquiryNotes('');
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-800 text-white p-6 md:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Portal Mitra & Pelanggan Kinau Studio
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Selamat Datang, {data?.user?.fullname || 'Mitra Kinau'}!
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Solusi terpadu pembuatan ID Card, Tali Lanyard, Sablon Kaos DTF, dan Selempang Wisuda berkualitas tinggi langsung dari workshop.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onNavigate('/customer/orders')}
              className="flex items-center gap-2 bg-white text-blue-900 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-sm"
            >
              <Package className="w-4 h-4 text-blue-600" />
              Lacak Pesanan Saya
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/design/customizer')}
              className="flex items-center gap-2 bg-blue-600/60 hover:bg-blue-600 border border-white/30 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition backdrop-blur-xs"
            >
              <Palette className="w-4 h-4 text-cyan-300" />
              Customizer 3D
            </button>
          </div>
        </div>

        {/* Decorative background blurbs */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('/customer/orders')}
          className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm hover:border-[var(--primary)] transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] font-medium">Pesanan Aktif</p>
              <p className="text-lg font-bold text-[var(--text)]">{data?.activeOrderCount || 0} Antrean</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
        </div>

        <div
          onClick={() => onNavigate('/customer/configure')}
          className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm hover:border-[var(--primary)] transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] font-medium">Persetujuan Desain</p>
              <p className="text-lg font-bold text-[var(--text)]">ACC Mockup</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
        </div>

        <div
          onClick={() => onNavigate('/customer/support')}
          className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm hover:border-[var(--primary)] transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] font-medium">Bantuan & FAQ</p>
              <p className="text-lg font-bold text-[var(--text)]">Pusat CS 24/7</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
      </div>

      {/* Featured Products Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--text)]">Katalog Produk Unggulan</h3>
            <p className="text-xs text-[var(--text-muted)]">Pilihan paket merchandise custom dengan harga pabrik langsung.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/katalog')}
            className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            Lihat Semua Katalog <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data?.products?.map((product) => (
            <div
              key={product.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="h-44 bg-[var(--background)] relative overflow-hidden flex items-center justify-center p-4">
                  <img
                    src={product.image || 'https://data.kinau.web.id/sample-kaos.png'}
                    alt={product.name}
                    className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://data.kinau.web.id/sample-kaos.png';
                    }}
                  />
                  {product.is_featured && (
                    <span className="absolute top-3 left-3 bg-[var(--primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Best Seller
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-sm text-[var(--text)] line-clamp-1">{product.name}</h4>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">{product.description}</p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-[var(--border)]/40 mt-2 space-y-3">
                <div className="flex items-baseline justify-between pt-3">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Mulai dari</span>
                    <p className="text-sm font-extrabold text-[var(--primary)]">
                      Rp {Number(product.price).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="text-[10px] bg-[var(--background)] px-2 py-0.5 rounded-md font-medium text-[var(--text-muted)]">
                    Min. {product.min_order} pcs
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInquiryModalProduct(product);
                    setInquiryQty(product.min_order || 20);
                  }}
                  className="w-full py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Konsultasi / Pesan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production Portfolio Gallery */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">Hasil Produksi Terbaru (Portfolio Selesai)</h3>
          <p className="text-xs text-[var(--text-muted)]">Bukti kualitas pesanan nyata yang telah dikirim ke pelanggan dan institusi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {data?.productionItems?.map((item) => (
            <div
              key={item.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md">
                  {item.order_number}
                </span>
                <div className="flex items-center text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[var(--text)]">{item.product_name}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.customer_name} • {item.institution_name}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {item.total_qty} pcs Terkirim
                </span>
                <span>{item.completed_at?.split('T')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inquiry Dialog Modal */}
      {inquiryModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/60">
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[var(--primary)]" />
                Konsultasi & Penawaran Produk
              </h3>
              <button
                type="button"
                onClick={() => setInquiryModalProduct(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInquirySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Produk</label>
                <input
                  type="text"
                  disabled
                  value={inquiryModalProduct.name}
                  className="w-full text-xs bg-[var(--background)]/70 border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Estimasi Kuantitas (pcs)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={inquiryQty}
                  onChange={(e) => setInquiryQty(Number(e.target.value))}
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Catatan Tambahan / Desain</label>
                <textarea
                  rows={3}
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  placeholder="Sebutkan deadline acara, warna kain, atau kebutuhan khusus lainnya..."
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setInquiryModalProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Permintaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
