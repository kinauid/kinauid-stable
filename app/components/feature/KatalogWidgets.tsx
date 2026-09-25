import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router';
import { Icon } from '~/builder';
import { BRAND_NAME, ADMIN_WA, getWhatsAppLink } from '~/constants/brand';

const KATALOG_PAGES = Array.from({ length: 16 }, (_, i) => `/katalog/${i}.png`);

export interface FabricColorItem {
  id: string | number;
  name: string;
  code: string;
  hex: string;
  category: string;
  image_url?: string;
  is_popular?: boolean;
}

const DEFAULT_FABRIC_COLORS: FabricColorItem[] = [
  { id: 1, name: 'Navy Blue (Biru Dongker)', code: 'NV-01', hex: '#002660', category: 'Kain Seragam', is_popular: true },
  { id: 2, name: 'Deep Black (Hitam Pekat)', code: 'BK-01', hex: '#111827', category: 'Kain Kaos & Jersey', is_popular: true },
  { id: 3, name: 'Pure White (Putih Netral)', code: 'WH-01', hex: '#FFFFFF', category: 'Sublimasi Base', is_popular: true },
  { id: 4, name: 'Maroon Red (Merah Marun)', code: 'MR-01', hex: '#800000', category: 'Kain Seragam', is_popular: true },
  { id: 5, name: 'Army Green (Hijau Army)', code: 'AG-01', hex: '#4B5320', category: 'Kain Kaos & PDH', is_popular: false },
  { id: 6, name: 'Royal Blue (Biru Benhur)', code: 'RB-01', hex: '#2563EB', category: 'Jersey Olahraga', is_popular: true },
  { id: 7, name: 'Charcoal Grey (Abu Tua)', code: 'CG-01', hex: '#374151', category: 'Kain Kaos Combed', is_popular: false },
  { id: 8, name: 'Mustard Yellow (Kuning Kunyit)', code: 'MY-01', hex: '#D97706', category: 'Kain Event', is_popular: false },
  { id: 9, name: 'Sage Green (Hijau Sage)', code: 'SG-01', hex: '#9CA3AF', category: 'Kain Kaos Pastel', is_popular: true },
  { id: 10, name: 'Terracotta / Brick (Bata)', code: 'TC-01', hex: '#C2410C', category: 'Kain PDH & Kemeja', is_popular: false },
  { id: 11, name: 'Sky Blue (Biru Muda)', code: 'SB-01', hex: '#38BDF8', category: 'Jersey & Kaos', is_popular: false },
  { id: 12, name: 'Emerald Green (Hijau Botol)', code: 'EG-01', hex: '#047857', category: 'Kain Seragam', is_popular: false },
];

export function KatalogViewWidget() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'colors'>('catalog');
  const [selectedPage, setSelectedPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const goToPage = useCallback((index: number) => {
    if (index >= 0 && index < KATALOG_PAGES.length) {
      setSelectedPage(index);
    }
  }, []);

  const goNext = useCallback(() => goToPage(selectedPage + 1), [selectedPage, goToPage]);
  const goPrev = useCallback(() => goToPage(selectedPage - 1), [selectedPage, goToPage]);

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'catalog') return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext, activeTab]);

  const filteredColors = DEFAULT_FABRIC_COLORS.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const categories = ['all', ...Array.from(new Set(DEFAULT_FABRIC_COLORS.map((c) => c.category)))];

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-slate-900 font-sans selection:bg-[#103557]/20 antialiased">
      {/* ── Top Header / Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 no-underline hover:opacity-90 transition-opacity">
            <img src="/kinau-logo.png" alt={BRAND_NAME} className="h-7 w-auto object-contain" />
            <div className="hidden sm:block leading-tight">
              <span className="font-bold text-xs text-slate-900 block">{BRAND_NAME}</span>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">
                Katalog Produk &amp; Warna Kain
              </span>
            </div>
          </NavLink>

          <div className="flex items-center gap-3">
            <a
              href="/catalog.pdf"
              download
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition no-underline"
            >
              {Icon('Download', { size: 13 })}
              <span>Unduh PDF</span>
            </a>
            <NavLink
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 hover:text-[#103557] text-xs font-bold transition shadow-2xs no-underline"
            >
              {Icon('ArrowLeft', { size: 13 })}
              <span>Kembali</span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#103557] bg-blue-50 border border-blue-200/60 px-3.5 py-1 rounded-full">
            KATALOG RESMI WORKSHOP KINAU
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#002660] tracking-tight">
            Katalog Produk &amp; Warna Kain
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Temukan koleksi seragam, jersey full print, kaos combed premium, dan pilihan warna kain berstandar industri konveksi modern.
          </p>
        </div>

        {/* Tab Switcher (Matching reference rayns-verse/client) */}
        <div className="flex justify-center">
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-white text-[#103557] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {Icon('BookOpen', { size: 15 })}
              <span>Katalog Flipbook Digital</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('colors')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'colors'
                  ? 'bg-white text-[#103557] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {Icon('Palette', { size: 15 })}
              <span>Koleksi Warna Kain</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: Digital Flipbook Viewer (Matching reference) ── */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Main Image Stage */}
              <div className="relative bg-slate-950 min-h-[60vh] md:min-h-[72vh] flex items-center justify-center p-4 sm:p-8">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={selectedPage === 0}
                  aria-label="Halaman sebelumnya"
                  className="absolute left-3 md:left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer"
                >
                  {Icon('ChevronLeft', { size: 24 })}
                </button>

                {/* Active Page Image */}
                <div className="max-w-4xl max-h-[68vh] flex items-center justify-center">
                  <img
                    src={KATALOG_PAGES[selectedPage]}
                    alt={`Halaman Katalog ${selectedPage + 1}`}
                    className="max-w-full max-h-[66vh] object-contain rounded-xl shadow-2xl select-none"
                    draggable={false}
                  />
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={selectedPage === KATALOG_PAGES.length - 1}
                  aria-label="Halaman selanjutnya"
                  className="absolute right-3 md:right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer"
                >
                  {Icon('ChevronRight', { size: 24 })}
                </button>

                {/* Page Counter Badge */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white font-mono font-bold shadow-md">
                  Halaman {selectedPage + 1} / {KATALOG_PAGES.length}
                </div>
              </div>

              {/* Thumbnail Strip (Bottom carousel preview) */}
              <div className="bg-slate-900 border-t border-slate-800 p-4 overflow-x-auto">
                <div className="flex gap-3 justify-center min-w-max">
                  {KATALOG_PAGES.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToPage(idx)}
                      className={`relative shrink-0 w-16 h-22 md:w-20 md:h-28 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPage === idx
                          ? 'border-[#38BDF8] shadow-lg shadow-sky-500/30 scale-105 opacity-100 ring-2 ring-[#38BDF8]/40'
                          : 'border-slate-700 hover:border-slate-500 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={src}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] py-0.5 text-center text-white font-bold font-mono">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions & Keyboard Guide */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 px-2">
              <p className="flex items-center gap-1.5">
                {Icon('Info', { size: 14, className: 'text-[#103557]' })}
                <span>Gunakan tombol panah <strong>← / →</strong> pada keyboard untuk navigasi halaman.</span>
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={getWhatsAppLink(ADMIN_WA, `Halo Kinau ID, saya sedang melihat katalog halaman ${selectedPage + 1} dan ingin konsultasi pemesanan...`)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 no-underline cursor-pointer"
                >
                  {Icon('Phone', { size: 13 })}
                  <span>Pesan Halaman Ini via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Fabric Color Swatches (Matching reference) ── */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#103557] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Cari nama atau kode warna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#103557] focus:bg-white transition-all font-medium"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {Icon('Search', { size: 14 })}
                </div>
              </div>
            </div>

            {/* Fabric Swatch Grid */}
            {filteredColors.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border border-dashed border-slate-300 bg-white">
                <p className="text-slate-500 text-sm">Warna tidak ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredColors.map((color) => (
                  <div
                    key={color.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs hover:shadow-md hover:border-[#103557]/40 transition-all group flex flex-col justify-between space-y-3"
                  >
                    <div
                      className="w-full aspect-square rounded-xl shadow-inner relative flex items-end p-2.5 overflow-hidden"
                      style={{ backgroundColor: color.hex }}
                    >
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                        {color.code}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#103557] transition-colors">
                        {color.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 block truncate font-medium">
                        {color.category}
                      </span>
                    </div>

                    <a
                      href={getWhatsAppLink(ADMIN_WA, `Halo Kinau ID, saya tertarik dengan warna kain ${color.name} (${color.code}) untuk produksi...`)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 text-center text-[10px] font-bold text-[#103557] bg-blue-50 hover:bg-[#103557] hover:text-white rounded-lg transition-colors no-underline cursor-pointer"
                    >
                      Pilih Warna Ini →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/kinau-logo.png" alt={BRAND_NAME} className="h-5 w-auto object-contain" />
            <span>&copy; 2026 PT KINAU DIGITAL KREATIF. Hak cipta dilindungi.</span>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/" className="hover:text-slate-900 no-underline">Beranda</NavLink>
            <NavLink to="/articles" className="hover:text-slate-900 no-underline">Artikel &amp; Panduan</NavLink>
            <NavLink to="/customer/configure" className="hover:text-slate-900 no-underline">Studio 3D</NavLink>
            <NavLink to="/login" className="hover:text-slate-900 no-underline">Portal Staf</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
