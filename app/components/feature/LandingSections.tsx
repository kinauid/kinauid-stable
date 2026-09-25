import React, { useState, useEffect } from 'react';
import { Icon, getResourceUrl } from '~/builder';
import { ADMIN_WA, getWhatsAppLink } from '~/constants/brand';

// ─── Navbar ──────────────────────────────────────────────────────────────────
export function LandingNavbar(props?: { user?: any } | any) {
  const user = props && typeof props === 'object' && 'user' in props ? props.user : (props || null);
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 md:px-6">
      <nav className="w-full max-w-7xl transition-all duration-300 rounded-[var(--radius-card)] border bg-white/95 backdrop-blur-md shadow-sm border-[var(--border)] py-3.5">
        <div className="px-6 md:px-8 flex justify-between items-center">
          <img
            src="/kinau-logo.png"
            className="h-8 md:h-9 w-auto cursor-pointer"
            alt="Kinau"
            onClick={() => {
              window.location.href = '/';
            }}
          />
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/articles';
              }}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-xs font-bold bg-transparent hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer"
            >
              Artikel &amp; Edukasi
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/katalog';
              }}
              className="px-4 py-2 rounded-full border border-[#002660] text-[#002660] text-xs font-bold bg-transparent hover:bg-[#002660]/5 transition-all flex items-center gap-2 cursor-pointer"
            >
              Lihat Katalog
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  const userData = typeof user === 'string' ? JSON.parse(user) : user;
                  window.location.href =
                    userData?.user_role === 'customer' || userData?.role === 'customer'
                      ? '/customer/orders'
                      : '/app/dashboard';
                }}
                className="px-5 py-2 rounded-full bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {Icon('LayoutDashboard', { size: 14 })}
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/login';
                }}
                className="px-5 py-2 rounded-full bg-[#002660] text-white text-xs font-bold hover:bg-[#002660]/90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {Icon('LogIn', { size: 14, className: 'rotate-180' })}
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export function LandingHero() {
  return (
    <section className="relative pt-40 pb-20 md:pt-56 md:pb-32 overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-full pointer-events-none z-0">
        <img src="/Home-Atas.png" className="w-full h-auto object-cover" alt="" />
      </div>
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <h1 className="text-4xl md:text-7xl font-extrabold text-[#002660] tracking-tight mb-6 leading-[1.1] font-sans">
          Cetak ID Card & Lanyard <br />
          <span className="text-[#103557]">Berkualitas Tinggi</span>
        </h1>
        <p className="text-[#002660]/80 text-base md:text-xl md:px-20 mb-10 leading-relaxed font-normal">
          Solusi percetakan profesional untuk kebutuhan event, kantor, dan komunitas Anda. Cepat,
          presisi, dan harga bersahabat.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <a
            href={getWhatsAppLink(ADMIN_WA, 'Halo Kinau.id, saya mau konsultasi pemesanan...')}
            target="_blank"
            rel="noreferrer"
            className="px-8 py-3.5 rounded-full bg-[#103557] text-white font-bold hover:bg-[#2874E2] transition-all flex items-center gap-2.5 text-sm shadow-md shadow-[#103557]/25 no-underline"
          >
            <span>Pesan Sekarang</span>
            {Icon('ArrowRight', { size: 16 })}
          </a>
          <a
            href="/katalog"
            className="px-7 py-3.5 rounded-full border border-[var(--border)] text-[#002660] font-bold hover:bg-[#E9E3C5]/30 hover:border-[#103557] transition-all text-sm shadow-xs no-underline"
          >
            Lihat Katalog
          </a>
          <a
            href="#portfolio"
            className="px-7 py-3.5 rounded-full border border-[var(--border)] text-[#002660] font-bold hover:bg-[#E9E3C5]/30 hover:border-[#103557] transition-all text-sm shadow-xs no-underline"
          >
            Produksi Terbaru
          </a>
          <a
            href="#artikel"
            className="px-7 py-3.5 rounded-full border border-[var(--border)] text-[#002660] font-bold hover:bg-[#E9E3C5]/30 hover:border-[#103557] transition-all text-sm shadow-xs no-underline"
          >
            Artikel &amp; Edukasi
          </a>
          <a
            href="#kontak"
            className="px-7 py-3.5 rounded-full border border-[var(--border)] text-[#002660] font-bold hover:bg-[#E9E3C5]/30 hover:border-[#103557] transition-all text-sm shadow-xs no-underline"
          >
            Kontak
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function LandingStats(stats?: {
  countFinished?: number;
  countItems?: number;
  uniqueClients?: number;
  countSponsors?: number;
}) {
  const items = [
    {
      label: 'Pesanan Selesai',
      val: (stats?.countFinished ?? 578).toLocaleString('id-ID'),
      icon: 'CheckCircle',
      color: 'text-[#103557]',
      isHighlight: false,
    },
    {
      label: 'Produk Dibuat (Pcs)',
      val: (stats?.countItems ?? 5120).toLocaleString('id-ID'),
      icon: 'Layers',
      color: 'text-[#2874E2]',
      isHighlight: false,
    },
    {
      label: 'Instansi / Event',
      val: (stats?.uniqueClients ?? 346).toLocaleString('id-ID'),
      icon: 'Building2',
      color: 'text-[#CCB029]',
      isHighlight: true,
    },
    {
      label: 'Sponsor & Partner',
      val: (stats?.countSponsors ?? 259).toLocaleString('id-ID'),
      icon: 'Handshake',
      color: 'text-[#002660]',
      isHighlight: false,
    },
  ];

  return (
    <section className="py-12 border-y border-[var(--border)] bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-[var(--radius-card)] bg-[#FDFCF9] border border-[var(--border)] shadow-[0_4px_20px_rgba(0,38,96,0.04)]">
          {items.map((it, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl transition group text-center ${
                it.isHighlight ? 'bg-[#CCB029]/10 border border-[#CCB029]/30' : 'hover:bg-white'
              }`}
            >
              <div
                className={`flex items-center justify-center ${it.color} mb-2 group-hover:scale-105 transition`}
              >
                {Icon(it.icon, { size: 28 })}
              </div>
              <div
                className={`text-3xl font-black mb-1 ${
                  it.isHighlight ? 'text-[#CCB029]' : 'text-[#002660]'
                }`}
              >
                {it.val}
              </div>
              <div className="text-xs text-[#4A5D78] font-bold uppercase tracking-wider">
                {it.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Instagram Web Style Gallery Modal ───────────────────────────────────────
export interface GalleryModalData {
  title: string;
  subtitle?: string;
  picName?: string;
  category?: string;
  qty?: string | number;
  review?: string;
  rating?: number;
  images: string[];
  productName?: string;
  whatsappText?: string;
}

export function InstagramGalleryModal({
  isOpen,
  data,
  onClose,
}: {
  isOpen: boolean;
  data: GalleryModalData | null;
  onClose: () => void;
}): React.ReactElement | null {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    setCurrentIdx(0);
  }, [data]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!data?.images?.length) return;
      if (e.key === 'ArrowRight') {
        setCurrentIdx((prev) => (prev < data.images.length - 1 ? prev + 1 : 0));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIdx((prev) => (prev > 0 ? prev - 1 : data.images.length - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, data, onClose]);

  if (!isOpen || !data) return null;

  const images = data.images.length > 0 ? data.images : ['/placeholder-order.png'];
  const activeImage = getResourceUrl(images[currentIdx] || images[0]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
        title="Tutup (Esc)"
      >
        {Icon('X', { className: 'w-5 h-5' })}
      </button>

      {/* Main Instagram-like Dialog Card */}
      <div className="relative z-[105] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row w-full max-w-4xl max-h-[92vh] border border-white/20 animate-in zoom-in-95 duration-200">
        {/* Left: Image Carousel */}
        <div className="w-full md:w-[58%] bg-slate-950 relative flex items-center justify-center min-h-[300px] md:min-h-[480px] select-none overflow-hidden">
          {/* Main Photo */}
          <img
            src={activeImage}
            alt={data.title}
            className="w-full h-full max-h-[55vh] md:max-h-[85vh] object-contain transition-all duration-300"
          />

          {/* Navigation Chevron Left */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Foto Sebelumnya"
            >
              {Icon('ChevronLeft', { className: 'w-5 h-5' })}
            </button>
          )}

          {/* Navigation Chevron Right */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Foto Selanjutnya (Geser Kanan)"
            >
              {Icon('ChevronRight', { className: 'w-5 h-5' })}
            </button>
          )}

          {/* Photo Counter Badge */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full select-none">
              {currentIdx + 1} / {images.length}
            </div>
          )}

          {/* Bottom Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    i === currentIdx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Description */}
        <div className="w-full md:w-[42%] flex flex-col justify-between p-6 bg-white overflow-y-auto max-h-[45vh] md:max-h-[85vh]">
          <div className="space-y-4">
            {/* Header / Institution */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#103557] to-[#002660] text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {data.title.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight line-clamp-1">
                    {data.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {data.picName || 'Pelanggan Terverifikasi'} · {data.category || 'Workshop Production'}
                  </p>
                </div>
              </div>
            </div>

            {/* Qty & Verified Pill */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                {data.qty ? `${data.qty} Pcs Selesai` : 'Tersedia Custom Order'}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                {Icon('CheckCircle', { className: 'w-3.5 h-3.5 text-emerald-600' })}
                <span>QC Teruji</span>
              </span>
            </div>

            {/* Testimonial Review Box */}
            {data.review && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Ulasan Kepuasan</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: data.rating || 5 }).map((_, i) => (
                      <span key={i}>{Icon('Star', { size: 12, className: 'fill-current' })}</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{data.review}"</p>
              </div>
            )}

            {/* Product Specifications */}
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Spesifikasi Produksi
              </h4>
              <ul className="space-y-1.5 text-slate-600 pl-4 list-disc text-[11px]">
                <li>Bahan Premium Standar Industri & Sablon/Sublim Tajam</li>
                <li>Jahitan Rapi Presisi dengan Quality Control Berlapis</li>
                <li>Garansi Cetak & Pengiriman Aman Tepat Waktu</li>
              </ul>
            </div>

            {/* Thumbnails strip if multiple images */}
            {images.length > 1 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Foto Dokumentasi ({images.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentIdx(i)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        i === currentIdx
                          ? 'border-blue-600 ring-2 ring-blue-600/30'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={getResourceUrl(img)}
                        alt={`Thumb ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA WhatsApp Button */}
          <div className="pt-4 border-t border-slate-100">
            <a
              href={getWhatsAppLink(
                ADMIN_WA,
                data.whatsappText || `Halo Kinau.id, saya tertarik dengan pesanan ${data.title}...`
              )}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all no-underline cursor-pointer active:scale-95"
            >
              {Icon('MessageCircle', { className: 'w-4 h-4' })}
              <span>Pesan Serupa via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Products Component ──────────────────────────────────────────────────────
export function LandingProducts(products?: any[]) {
  const [selectedProduct, setSelectedProduct] = useState<GalleryModalData | null>(null);
  const productList = products ?? [];

  return (
    <>
      <section id="produk" className="py-20 bg-[#FDFCF9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#103557] font-bold text-xs tracking-widest uppercase">
              Koleksi Kami
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#002660] mt-1.5 mb-3 tracking-tight">
              Pilihan Eksklusif
            </h2>
            <div className="h-1.5 w-20 bg-[#103557] mx-auto rounded-full" />
          </div>

          <div className="w-full overflow-x-auto pb-8">
            <div className="flex gap-6 px-2">
              {productList.length === 0 ? (
                <div className="w-full text-center text-[#4A5D78] py-16 bg-white rounded-3xl border border-[var(--border)] border-dashed">
                  Belum ada produk ditampilkan.
                </div>
              ) : (
                productList.map((product) => {
                  const imageUrl = product.image ? getResourceUrl(product.image) : null;
                  const images =
                    Array.isArray(product.images) && product.images.length > 0
                      ? product.images
                      : product.image
                      ? [product.image]
                      : [];

                  return (
                    <div
                      key={product.id || product.name}
                      className="w-[290px] md:w-[340px] shrink-0 group cursor-pointer"
                      onClick={() =>
                        setSelectedProduct({
                          title: product.name || 'Produk Custom',
                          category: product.category || 'Custom Product',
                          images,
                          productName: product.name,
                          whatsappText: `Halo Kinau.id, saya mau pesan produk ${product.name}...`,
                        })
                      }
                    >
                      <div className="w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-white relative shadow-md border-4 border-white group-hover:shadow-xl transition-all duration-300">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name || ''}
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                            {Icon('Package', { size: 48, className: 'text-[#103557]/40' })}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {product.category || 'Custom Product'}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-[#002660]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 flex items-center justify-between text-white font-bold text-xs">
                            <span>Lihat Detail (Galeri)</span>
                            {Icon('ZoomIn', { size: 18 })}
                          </div>
                        </div>

                        {product.total_sold_items > 0 && (
                          <div className="absolute top-4 left-4 bg-[#103557] text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                            {Icon('ShoppingBag', { size: 11 })}
                            <span>{product.total_sold_items.toLocaleString('id-ID')} TERJUAL</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 text-center px-2">
                        <h3 className="font-black text-[#002660] text-lg mb-2 uppercase tracking-tight line-clamp-1">
                          {product.name || ''}
                        </h3>
                        <div className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#103557] text-white text-xs font-black hover:bg-[#2874E2] shadow-sm transition-all no-underline">
                          LIHAT & PESAN
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Instagram-style Modal for Products */}
      <InstagramGalleryModal
        isOpen={Boolean(selectedProduct)}
        data={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}

// ─── Portfolio Component ─────────────────────────────────────────────────────
export function LandingPortfolio(portfolioItems?: any[]) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<GalleryModalData | null>(null);
  const items = portfolioItems ?? [];

  return (
    <>
      <section id="portfolio" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#103557] font-bold text-xs tracking-widest uppercase">
              Dokumentasi & Portofolio
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#002660] mt-1.5 mb-3 tracking-tight">
              Produksi Terbaru Workshop
            </h2>
            <div className="h-1.5 w-20 bg-[#103557] mx-auto rounded-full" />
          </div>

          <div className="w-full overflow-x-auto pb-6">
            <div className="flex gap-6 px-2">
              {items.map((item, idx) => {
                const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : [];
                const imageUrl = images.length > 0 ? getResourceUrl(images[0]) : null;

                return (
                  <div
                    key={item.id || idx}
                    onClick={() =>
                      setSelectedPortfolio({
                        title: item.institution_name || 'Portofolio Produksi',
                        picName: item.pic_name,
                        category: item.category || 'Jersey & Lanyard',
                        qty: item.qty || '100+',
                        review: item.review,
                        rating: item.rating || 5,
                        images,
                        whatsappText: `Halo Kinau.id, saya tertarik dengan hasil produksi untuk ${item.institution_name}...`,
                      })
                    }
                    className="bg-white rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden shadow-xs hover:shadow-lg transition flex-shrink-0 w-[310px] md:w-[360px] cursor-pointer group"
                  >
                    {imageUrl ? (
                      <div className="w-full aspect-[16/10] bg-slate-100 overflow-hidden relative">
                        <img
                          src={imageUrl}
                          alt={item.institution_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        {images.length > 1 && (
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            {Icon('Layers', { size: 10 })}
                            <span>{images.length} Foto</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full aspect-[16/10] bg-gradient-to-br from-[#002660]/5 to-[#103557]/10 p-6 flex flex-col justify-between border-b border-[var(--border)]">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-white text-[#103557] shadow-xs">
                            PRODUKSI WORKSHOP
                          </span>
                          {Icon('Award', { size: 18, className: 'text-[#CCB029]' })}
                        </div>
                        <div>
                          <span className="text-xs font-black text-[#002660] uppercase tracking-wider block">
                            {item.institution_name}
                          </span>
                          <span className="text-[11px] text-[#4A5D78]">
                            {item.qty || '100+'} Pcs Selesai Dikerjakan
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="px-6 py-5">
                      <h3 className="font-black text-[#002660] text-lg mb-1.5 line-clamp-1 uppercase tracking-tight group-hover:text-blue-700 transition-colors">
                        {item.institution_name}
                      </h3>
                      <div className="flex items-center gap-2 text-[#103557] font-bold text-xs uppercase tracking-wider mb-3">
                        {Icon('ShoppingBag', { size: 13 })}
                        <span>{item.qty || '100+'} Pcs</span>
                      </div>

                      {item.review && (
                        <div className="bg-[#FDFCF9] p-4 rounded-2xl text-xs text-left border border-[var(--border)]">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-[#002660]">
                              {item.pic_name || 'Pelanggan'}
                            </span>
                            <div className="flex gap-0.5 text-[#CCB029]">
                              {Array.from({ length: item.rating || 5 }).map((_, i) => (
                                <span key={i}>{Icon('Star', { size: 11, className: 'fill-current' })}</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[#4A5D78] italic leading-relaxed">"{item.review}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Instagram-style Modal for Portfolio */}
      <InstagramGalleryModal
        isOpen={Boolean(selectedPortfolio)}
        data={selectedPortfolio}
        onClose={() => setSelectedPortfolio(null)}
      />
    </>
  );
}

// ─── Articles & Knowledge Hub Section ──────────────────────────────────────────
export function LandingArticles(articles?: any[]) {
  const list = articles && articles.length > 0 ? articles : [];

  return (
    <section id="artikel" className="py-20 bg-[#FDFCF9] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[#103557] font-bold text-xs tracking-widest uppercase">
              Wawasan &amp; Edukasi
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#002660] mt-1.5 mb-2 tracking-tight">
              Panduan Percetakan &amp; Konveksi
            </h2>
            <p className="text-xs md:text-sm text-[#4A5D78] max-w-xl">
              Pelajari tips memilih bahan kain, teknik sablon DTF vs sublimasi, dan standarisasi file desain sebelum melakukan pemesanan.
            </p>
          </div>
          <a
            href="/articles"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold transition-all shadow-xs shrink-0 no-underline"
          >
            <span>Buka Knowledge Hub</span>
            {Icon('ArrowRight', { size: 14 })}
          </a>
        </div>

        {list.length === 0 ? (
          <div className="w-full text-center text-[#4A5D78] py-16 bg-white rounded-3xl border border-[var(--border)] border-dashed">
            Belum ada artikel yang dipublikasikan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {list.slice(0, 4).map((art: any) => (
              <a
                key={art.id || art.slug}
                href={`/articles?slug=${art.slug || art.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md hover:border-[#103557]/40 transition-all flex flex-col justify-between group no-underline text-slate-800"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#103557] border border-blue-100">
                      {art.category || 'Panduan'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {art.readTime || '4 Menit'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#103557] transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {art.subtitle || art.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] font-bold text-[#103557]">
                  <span>Baca Selengkapnya</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function LandingFooter() {
  return (
    <footer id="kontak" className="pt-16 pb-0 relative overflow-hidden bg-[#FDFCF9] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-8 relative z-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <img src="/kinau-logo.png" className="h-9 w-auto" alt="Kinau" />
            <p className="text-xs text-[#4A5D78] leading-relaxed">
              Pusat percetakan ID card, tali lanyard custom, medali, apparel sublimasi & souvenir
              kampus/event terpercaya.
            </p>
            <h3 className="text-sm font-bold text-[#002660]">PT Kinau Digital Kreatif</h3>
            <p className="text-xs text-[#4A5D78]">Surabaya, Jawa Timur, Indonesia</p>
          </div>
          {/* Col 2: Kontak */}
          <div className="space-y-3">
            <h3 className="text-[#002660] font-bold mb-4 uppercase tracking-wider text-xs">
              Kontak Kami
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#4A5D78]">
              {Icon('Phone', { size: 14, className: 'text-[#103557]' })}
              <span>+62 852-1933-7474</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#4A5D78]">
              {Icon('Mail', { size: 14, className: 'text-[#103557]' })}
              <span>official@kinau.id</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#4A5D78]">
              {Icon('MapPin', { size: 14, className: 'text-[#103557]' })}
              <span>Workshop Central Kinau</span>
            </div>
          </div>
          {/* Col 3: Menu Cepat */}
          <div className="space-y-2">
            <h3 className="text-[#002660] font-bold mb-4 uppercase tracking-wider text-xs">
              Menu Cepat
            </h3>
            <a
              href="#produk"
              className="block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline"
            >
              Daftar Produk
            </a>
            <a
              href="#portfolio"
              className="block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline"
            >
              Portofolio
            </a>
            <a
              href="/customer/configure"
              className="block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline"
            >
              Studio Jersey
            </a>
            <a
              href="/articles"
              className="block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline"
            >
              Artikel &amp; Panduan
            </a>
            <a
              href="/terms/glossary"
              className="block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline"
            >
              Glosarium Istilah
            </a>
            <a
              href="/customer/orders"
              className="block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline"
            >
              Status Pesanan
            </a>
          </div>
          {/* Col 4: Sosial Media */}
          <div className="space-y-2">
            <h3 className="text-[#002660] font-bold mb-4 uppercase tracking-wider text-xs">
              Sosial Media
            </h3>
            <a
              href="https://instagram.com/kinau.id"
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-[#4A5D78] hover:text-[#1961CC] transition-colors no-underline"
            >
              @kinau.id
            </a>
          </div>
        </div>
      </div>
      {/* Bottom accent wave image with copyright overlay */}
      <div className="relative w-full overflow-hidden leading-[0]">
        <img src="/Home-Bawah.png" className="w-full h-auto object-cover" alt="" />
        <div className="absolute bottom-0 left-0 right-0 py-6 text-center">
          <p className="text-[10px] md:text-sm text-white/70 uppercase tracking-[0.2em] font-medium drop-shadow-sm">
            © {new Date().getFullYear()} PT KINAU DIGITAL KREATIF. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Floating Call Button (#2874E2) ──────────────────────────────────────────
export function FloatingWhatsAppButton() {
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <a
        href={getWhatsAppLink(ADMIN_WA, 'Halo Kinau ID, saya ingin konsultasi order...')}
        target="_blank"
        rel="noreferrer"
        className="w-14 h-14 bg-[#2874E2] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#2874E2]/30 hover:bg-[#103557] hover:scale-105 transition-all cursor-pointer"
      >
        {Icon('Phone', { className: 'w-6 h-6 fill-current' })}
      </a>
    </div>
  );
}
