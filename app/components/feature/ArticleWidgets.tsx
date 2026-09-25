import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { Icon } from '~/builder';
import { BRAND_NAME, ADMIN_WA, getWhatsAppLink } from '~/constants/brand';
import { toast } from 'sonner';
import type { ArticleItem, RecentArticleSummary } from '~/services/article.service';

interface ArticleViewWidgetProps {
  activeArticle?: ArticleItem;
  recentArticles?: RecentArticleSummary[];
  allArticles?: ArticleItem[];
  user?: any;
}

export function ArticleViewWidget({
  activeArticle: initialArticle,
  recentArticles = [],
  allArticles = [],
  user,
}: ArticleViewWidgetProps) {
  const [currentArticle, setCurrentArticle] = useState<ArticleItem | undefined>(
    initialArticle || allArticles[0]
  );
  const [copied, setCopied] = useState(false);

  const article = currentArticle || initialArticle || allArticles[0];

  const handleShare = (platform: 'fb' | 'x' | 'linkedin' | 'wa' | 'copy') => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://kinau.id/articles';
    const text = `${article?.title || 'Panduan Edukasi Kinau ID'} - Kinau ID Hub`;

    switch (platform) {
      case 'fb':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'wa':
        window.open(getWhatsAppLink(ADMIN_WA, `Halo, saya ingin mendiskusikan artikel: ${article?.title}\n${url}`), '_blank');
        break;
      case 'copy':
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(url);
          setCopied(true);
          toast.success('Tautan artikel berhasil disalin ke clipboard!');
          setTimeout(() => setCopied(false), 2500);
        }
        break;
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-3">
          <p className="text-slate-600 text-sm">Artikel tidak ditemukan.</p>
          <NavLink to="/" className="text-xs font-bold text-[#103557] underline">
            Kembali ke Beranda
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-sans text-slate-800 antialiased selection:bg-[#103557]/20">
      {/* ── Top Header / Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left Brand Identity */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2.5 no-underline hover:opacity-90 transition-opacity">
              <img src="/kinau-logo.png" alt={BRAND_NAME} className="h-7 w-auto object-contain" />
              <div className="hidden sm:block leading-tight">
                <span className="font-bold text-xs text-slate-900 block">{BRAND_NAME}</span>
                <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">
                  Knowledge Hub & Edukasi
                </span>
              </div>
            </NavLink>
          </div>

          {/* Right Navigation Links */}
          <div className="flex items-center gap-3 sm:gap-6">
            <NavLink
              to="/articles"
              className="text-xs font-semibold text-[#103557] hover:text-[#103557] transition-colors"
            >
              Semua Artikel
            </NavLink>
            <NavLink
              to="/customer/configure"
              className="hidden md:inline-block text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Katalog Jersey
            </NavLink>
            <NavLink
              to="/terms/glossary"
              className="hidden md:inline-block text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Glosarium Istilah
            </NavLink>
            <NavLink
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 hover:text-[#103557] text-xs font-bold transition-all shadow-2xs no-underline"
            >
              {Icon('ArrowLeft', { size: 13 })}
              <span>Kembali</span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* ── Article Content Area ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb Bar */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-6">
          <NavLink to="/" className="hover:text-slate-900 no-underline">Beranda</NavLink>
          <span>/</span>
          <NavLink to="/articles" className="hover:text-slate-900 no-underline">Artikel & Panduan</NavLink>
          <span>/</span>
          <span className="text-[#103557] font-semibold truncate max-w-xs">{article.category}</span>
        </div>

        {/* ── Article Title & Meta Header (Exact match to reference layout) ── */}
        <section className="space-y-4 mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black text-slate-950 tracking-tight leading-[1.2] max-w-4xl">
            {article.title}
          </h1>

          {/* Meta Information Bar */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-slate-500 font-medium">
            {/* Author */}
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <span className="w-5 h-5 rounded-full bg-[#103557] text-white flex items-center justify-center text-[10px] font-bold">
                {article.author.name.charAt(0)}
              </span>
              <span>{article.author.name}</span>
            </div>

            <span className="text-slate-300 font-normal">|</span>

            {/* Date */}
            <div className="flex items-center gap-1.5">
              {Icon('Calendar', { size: 14, className: 'text-slate-400' })}
              <span>{article.date}</span>
            </div>

            <span className="text-slate-300 font-normal">|</span>

            {/* Format / Read Time Badge */}
            <div className="flex items-center gap-1.5 text-[#103557] font-bold">
              {Icon('FileText', { size: 14, className: 'text-[#103557]' })}
              <span>{article.formatBadge}</span>
              <span className="text-slate-400 font-normal">({article.readTime})</span>
            </div>
          </div>

          {/* Synopsis / Excerpt Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-4xl font-normal pt-1">
            {article.subtitle}
          </p>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleShare('fb')}
              title="Bagikan ke Facebook"
              className="w-8 h-8 rounded-lg bg-black text-white hover:bg-[#1877F2] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {Icon('Facebook', { size: 14 })}
            </button>
            <button
              type="button"
              onClick={() => handleShare('x')}
              title="Bagikan ke X (Twitter)"
              className="w-8 h-8 rounded-lg bg-black text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {Icon('Twitter', { size: 14 })}
            </button>
            <button
              type="button"
              onClick={() => handleShare('linkedin')}
              title="Bagikan ke LinkedIn"
              className="w-8 h-8 rounded-lg bg-black text-white hover:bg-[#0A66C2] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {Icon('Linkedin', { size: 14 })}
            </button>
            <button
              type="button"
              onClick={() => handleShare('wa')}
              title="Bagikan ke WhatsApp"
              className="w-8 h-8 rounded-lg bg-black text-white hover:bg-[#25D366] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {Icon('Phone', { size: 14 })}
            </button>
            <button
              type="button"
              onClick={() => handleShare('copy')}
              title="Salin Tautan Artikel"
              className="px-3 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {Icon(copied ? 'Check' : 'Share2', { size: 13, className: copied ? 'text-emerald-600' : 'text-slate-500' })}
              <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
            </button>
          </div>
        </section>

        {/* ── 2-Column Content Grid: Main Body (8 Cols) & Sidebar (4 Cols) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ── Left Column: Article Body (8 Cols) ── */}
          <div className="lg:col-span-8 space-y-8">
            {/* Technical Diagram Infographic Banner for Convection & Sublimation */}
            <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-[#103557] to-[#0A2540] text-white">
                {/* Visual Label Sticker */}
                <div className="inline-flex items-center gap-2 bg-[#38BDF8] text-slate-950 px-4 py-1.5 rounded-lg font-black text-xs tracking-wider uppercase shadow-md mb-6">
                  {Icon('Sparkles', { size: 14 })}
                  <span>STANDAR ALUR PRODUKSI &amp; SUBLIMASI PRESISI</span>
                </div>

                {/* Production Stages Flow Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-2 pb-4">
                  {/* Step 1: Fabric Selection */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8]">
                        FASE 01: RAJUTAN
                      </span>
                      {Icon('Layers', { size: 16, className: 'text-[#38BDF8]' })}
                    </div>
                    <h4 className="text-sm font-bold text-white">Serat Micro-Mesh Dryfit</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sistem kapiler aktif menyerap keringat. Pilihan gramasi 130–170 GSM untuk sirkulasi udara optimal.
                    </p>
                  </div>

                  {/* Step 2: Sublimation Print */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300">
                        FASE 02: SUBLIM 210°C
                      </span>
                      {Icon('Printer', { size: 16, className: 'text-emerald-300' })}
                    </div>
                    <h4 className="text-sm font-bold text-white">Penetrasi Tinta Gas</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Tinta UltraChrome HD meresap ke dalam serat poliester. Warna terkunci permanen anti-pudar 99.2%.
                    </p>
                  </div>

                  {/* Step 3: Precision Stitching */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        FASE 03: FINISHING
                      </span>
                      {Icon('Scissors', { size: 16, className: 'text-amber-300' })}
                    </div>
                    <h4 className="text-sm font-bold text-white">Jahit Rantai &amp; Laser Cut</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Jahitan overdeck 3-jarum dan potongan laser komputer untuk simetri pola presisi dan daya tahan tinggi.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300/80 text-center font-mono border-t border-white/10 pt-3 mt-2 flex items-center justify-center gap-2">
                  {Icon('CheckCircle', { size: 13, className: 'text-emerald-400' })}
                  <span>Standar Manufaktur Percetakan &amp; Konveksi Modern Kinau ID</span>
                </div>
              </div>
            </div>

            {/* ── Dynamic Content Sections ── */}
            <div className="space-y-8 text-slate-800">
              {article.contentSections.map((sec, idx) => (
                <article key={idx} className="space-y-4">
                  {sec.heading && (
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight border-b border-slate-200/70 pb-2">
                      {sec.heading}
                    </h2>
                  )}

                  {sec.paragraphs.map((para, pIdx) => (
                    <p key={pIdx} className="text-sm sm:text-base text-slate-700 leading-relaxed">
                      {para}
                    </p>
                  ))}

                  {/* Callout Box */}
                  {sec.callout && (
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 ${
                        sec.callout.type === 'tip'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : sec.callout.type === 'warning'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                          : 'bg-blue-50/70 border-blue-200 text-blue-950'
                      }`}
                    >
                      <div className="p-1.5 rounded-xl bg-white shadow-2xs shrink-0 mt-0.5">
                        {Icon(
                          sec.callout.type === 'tip'
                            ? 'Sparkles'
                            : sec.callout.type === 'warning'
                            ? 'AlertTriangle'
                            : 'Info',
                          { size: 16 }
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-xs uppercase tracking-wider">
                          {sec.callout.title}
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                          {sec.callout.text}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Material Comparison Table */}
                  {sec.table && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs my-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#103557] text-white">
                            {sec.table.headers.map((h, hIdx) => (
                              <th key={hIdx} className="px-4 py-3 font-bold tracking-wider uppercase text-[10px]">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sec.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`px-4 py-3 text-slate-700 ${cIdx === 0 ? 'font-bold text-slate-900' : ''}`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* ── Download PDF Spec Sheet Banner ── */}
            <div className="bg-[#103557] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#38BDF8] bg-white/10 px-2.5 py-1 rounded-full">
                  DOKUMEN SPESIFIKASI WORKSHOP
                </span>
                <h3 className="text-lg sm:text-xl font-bold">
                  Unduh Panduan Standar Pola &amp; Ukuran Kinau ID
                </h3>
                <p className="text-xs text-slate-300 max-w-lg">
                  Lengkap dengan diagram size chart (S–5XL), standar toleransi potong, serta panduan resolusi layout mockup.
                </p>
              </div>
              <a
                href={getWhatsAppLink(ADMIN_WA, `Halo, saya ingin meminta file PDF panduan spesifikasi dan size chart untuk artikel: ${article.title}`)}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-[#38BDF8] hover:bg-[#0284C7] text-slate-950 hover:text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2 cursor-pointer no-underline"
              >
                {Icon('Download', { size: 15 })}
                <span>Unduh PDF Panduan</span>
              </a>
            </div>

            {/* ── Tag Pills & Author Box Footer ── */}
            <div className="pt-6 border-t border-slate-200/80 space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-2">Topik Terkait:</span>
                {article.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Author Box */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-start gap-4 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-[#103557] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                  {article.author.name.charAt(0)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900">{article.author.name}</div>
                  <div className="text-xs text-slate-500">{article.author.role}</div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Tim teknis dan riset tekstil Kinau ID berfokus pada inovasi material jersey, standarisasi warna cetak digital sublimasi, serta efisiensi manufaktur konveksi modern.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Sidebar (4 Cols) (Exact match to reference layout) ── */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Recent Articles Card (Clean Card matching Screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
              <h3 className="text-lg font-bold text-slate-950 tracking-tight">
                Recent Articles
              </h3>

              <div className="space-y-4">
                {recentArticles.map((rec) => {
                  const isActive = rec.slug === article.slug || rec.id === article.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        const target = allArticles.find((a) => a.id === rec.id || a.slug === rec.slug);
                        if (target) {
                          setCurrentArticle(target);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={`group cursor-pointer transition-all p-2 -mx-2 rounded-xl ${
                        isActive
                          ? 'bg-slate-50 border-l-3 border-[#103557]'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <h4
                        className={`text-xs font-semibold leading-snug transition-colors line-clamp-2 ${
                          isActive
                            ? 'text-[#103557] font-bold'
                            : 'text-slate-800 group-hover:text-[#103557]'
                        }`}
                      >
                        {rec.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5 font-medium">
                        <span>{rec.category}</span>
                        <span>•</span>
                        <span>{rec.readTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consultation Callout Card */}
            <div className="bg-gradient-to-br from-[#F8FAFC] to-[#EEF4FB] rounded-2xl border border-blue-200/80 p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-[#103557] font-bold text-xs">
                {Icon('Headphones', { size: 16 })}
                <span>Konsultasi Teknis &amp; Order</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bingung memilih bahan yang cocok untuk event atau jersey komunitas Anda? Diskusikan langsung dengan konsultan produksi kami.
              </p>
              <a
                href={getWhatsAppLink(ADMIN_WA, 'Halo Kinau ID, saya ingin konsultasi pemilihan bahan jersey dan pemesanan konveksi...')}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer no-underline"
              >
                {Icon('Phone', { size: 14 })}
                <span>Hubungi Tim Teknis via WA</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/kinau-logo.png" alt={BRAND_NAME} className="h-5 w-auto object-contain" />
            <span>&copy; 2026 Kinau ID Production Ecosystem. Hak Cipta Dilindungi.</span>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/" className="hover:text-slate-900 no-underline">Beranda</NavLink>
            <NavLink to="/customer/configure" className="hover:text-slate-900 no-underline">Katalog</NavLink>
            <NavLink to="/login" className="hover:text-slate-900 no-underline">Portal Staf</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
