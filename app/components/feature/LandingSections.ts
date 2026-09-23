import { createElement } from 'react';
import { Div, Row, Col, H1, H2, H3, P, Span, Icon, ui, getResourceUrl } from '~/builder';
import { ADMIN_WA, getWhatsAppLink } from '~/constants/brand';

// ─── Navbar ──────────────────────────────────────────────────────────────────
export function LandingNavbar(user?: any) {
  return ui('div')
    .class('fixed top-4 left-0 right-0 z-50 flex justify-center px-4 md:px-6')
    .childrenOf(
      ui('nav')
        .class('w-full max-w-7xl transition-all duration-300 rounded-[var(--radius-card)] border bg-white/95 backdrop-blur-md shadow-sm border-[var(--border)] py-3.5')
        .childrenOf(
          Div(
            { className: 'px-6 md:px-8 flex justify-between items-center' },
            createElement('img', {
              src: '/kinau-logo.png',
              className: 'h-8 md:h-9 w-auto cursor-pointer',
              alt: 'Kinau',
              onClick: () => { window.location.href = '/'; },
            }),
            Row(
              { className: 'items-center gap-3.5' },
              ui('button')
                .attr('type', 'button')
                .on('click', () => { window.location.href = '#produk'; })
                .class('px-4 py-2 rounded-full border border-[#002660] text-[#002660] text-xs font-bold bg-transparent hover:bg-[#002660]/5 transition-all flex items-center gap-2 cursor-pointer')
                .childrenOf('Lihat Katalog'),
              user
                ? ui('button')
                    .attr('type', 'button')
                    .on('click', () => {
                      const userData = typeof user === 'string' ? JSON.parse(user) : user;
                      window.location.href = userData?.user_role === 'customer' || userData?.role === 'customer'
                        ? '/customer/orders'
                        : '/app/dashboard';
                    })
                    .class('px-5 py-2 rounded-full bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm')
                    .childrenOf(Icon('LayoutDashboard', { size: 14 }), 'Dashboard')
                : ui('button')
                    .attr('type', 'button')
                    .on('click', () => { window.location.href = '/login'; })
                    .class('px-5 py-2 rounded-full bg-[#002660] text-white text-xs font-bold hover:bg-[#002660]/90 transition-all flex items-center gap-2 cursor-pointer shadow-sm')
                    .childrenOf(Icon('LogIn', { size: 14, className: 'rotate-180' }), 'Masuk')
            )
          )
        )
    ).build();
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export function LandingHero() {
  return ui('section')
    .class('relative pt-40 pb-20 md:pt-56 md:pb-32 overflow-hidden bg-white')
    .childrenOf(
      // Top Decorative Wave (Home-Atas.png)
      Div(
        { className: 'absolute top-0 left-0 w-full pointer-events-none z-0' },
        createElement('img', { src: '/Home-Atas.png', className: 'w-full h-auto object-cover', alt: '' })
      ),
      Div(
        { className: 'max-w-5xl mx-auto px-6 text-center relative z-10' },
        H1(
          { className: 'text-4xl md:text-7xl font-extrabold text-[#002660] tracking-tight mb-6 leading-[1.1] font-sans' },
          'Cetak ID Card & Lanyard ',
          createElement('br'),
          createElement('span', { className: 'text-[#103557]' }, 'Berkualitas Tinggi')
        ),
        P(
          { className: 'text-[#002660]/80 text-base md:text-xl md:px-20 mb-10 leading-relaxed font-normal' },
          'Solusi percetakan profesional untuk kebutuhan event, kantor, dan komunitas Anda. Cepat, presisi, dan harga bersahabat.'
        ),
        Div(
          { className: 'flex flex-wrap items-center justify-center gap-4 mt-8' },
          ui('a')
            .attr('href', getWhatsAppLink(ADMIN_WA, 'Halo Kinau.id, saya mau konsultasi pemesanan...'))
            .attr('target', '_blank')
            .attr('rel', 'noreferrer')
            .class('px-8 py-3.5 rounded-full bg-[#103557] text-white font-bold hover:bg-[#2874E2] transition-all flex items-center gap-2.5 text-sm shadow-md shadow-[#103557]/25 no-underline')
            .childrenOf('Pesan Sekarang', Icon('ArrowRight', { size: 16 })),
          ui('a')
            .attr('href', '#produk')
            .class('px-7 py-3.5 rounded-full border border-[var(--border)] text-[#002660] font-bold hover:bg-[#E9E3C5]/30 hover:border-[#103557] transition-all text-sm shadow-xs no-underline')
            .childrenOf('Daftar Produk'),
          ui('a')
            .attr('href', '#portfolio')
            .class('px-7 py-3.5 rounded-full border border-[var(--border)] text-[#002660] font-bold hover:bg-[#E9E3C5]/30 hover:border-[#103557] transition-all text-sm shadow-xs no-underline')
            .childrenOf('Produksi Terbaru'),
          ui('a')
            .attr('href', '#kontak')
            .class('px-7 py-3.5 rounded-full border border-[var(--border)] text-[#002660] font-bold hover:bg-[#E9E3C5]/30 hover:border-[#103557] transition-all text-sm shadow-xs no-underline')
            .childrenOf('Kontak')
        )
      )
    ).build();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function LandingStats(stats?: { countFinished?: number; countItems?: number; uniqueClients?: number; countSponsors?: number }) {
  const items = [
    { label: 'Pesanan Selesai', val: (stats?.countFinished ?? 578).toLocaleString('id-ID'), icon: 'CheckCircle', color: 'text-[#103557]', isHighlight: false },
    { label: 'Produk Dibuat (Pcs)', val: (stats?.countItems ?? 5120).toLocaleString('id-ID'), icon: 'Layers', color: 'text-[#2874E2]', isHighlight: false },
    { label: 'Instansi / Event', val: (stats?.uniqueClients ?? 346).toLocaleString('id-ID'), icon: 'Building2', color: 'text-[#CCB029]', isHighlight: true },
    { label: 'Sponsor & Partner', val: (stats?.countSponsors ?? 259).toLocaleString('id-ID'), icon: 'Handshake', color: 'text-[#002660]', isHighlight: false },
  ];

  return ui('section')
    .class('py-12 border-y border-[var(--border)] bg-white')
    .childrenOf(
      Div(
        { className: 'max-w-7xl mx-auto px-4' },
        Div(
          { className: 'grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-[var(--radius-card)] bg-[#FDFCF9] border border-[var(--border)] shadow-[0_4px_20px_rgba(0,38,96,0.04)]' },
          ...items.map((it) =>
            Div(
              { className: `p-4 rounded-xl transition group text-center ${it.isHighlight ? 'bg-[#CCB029]/10 border border-[#CCB029]/30' : 'hover:bg-white'}` },
              Div(
                { className: `flex items-center justify-center ${it.color} mb-2 group-hover:scale-105 transition` },
                Icon(it.icon, { size: 28 })
              ),
              Div({ className: `text-3xl font-black mb-1 ${it.isHighlight ? 'text-[#CCB029]' : 'text-[#002660]'}` }, it.val),
              Div({ className: 'text-xs text-[#4A5D78] font-bold uppercase tracking-wider' }, it.label)
            )
          )
        )
      )
    ).build();
}

// ─── Products (horizontal scroll) ────────────────────────────────────────────
export function LandingProducts(products?: any[]) {
  const productList = products ?? [];

  const header = Div(
    { className: 'text-center mb-14' },
    Span({ className: 'text-[#103557] font-bold text-xs tracking-widest uppercase' }, 'Koleksi Kami'),
    H2({ className: 'text-3xl md:text-5xl font-black text-[#002660] mt-1.5 mb-3 tracking-tight' }, 'Pilihan Eksklusif'),
    Div({ className: 'h-1.5 w-20 bg-[#103557] mx-auto rounded-full' })
  );

  const emptyState = productList.length === 0
    ? Div(
        { className: 'w-full text-center text-[#4A5D78] py-16 bg-white rounded-3xl border border-[var(--border)] border-dashed' },
        Span({}, 'Belum ada produk ditampilkan.')
      )
    : null;

  const productCards = productList.map((product) => {
    const imageUrl = product.image ? getResourceUrl(product.image) : null;

    return Div(
      { className: 'w-[290px] md:w-[340px] flex-shrink-0 group', key: product.id || product.name },
      Div(
        { className: 'w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-white relative cursor-pointer shadow-md border-4 border-white group-hover:shadow-xl transition-all duration-300' },
        imageUrl
          ? createElement('img', {
              src: imageUrl,
              alt: product.name || '',
              className: 'w-full h-full object-cover transition duration-500 group-hover:scale-105',
            })
          : Div(
              { className: 'w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400' },
              Icon('Package', { size: 48, className: 'text-[#103557]/40' }),
              Span({ className: 'text-[10px] font-bold uppercase tracking-wider text-slate-500' }, product.category || 'Custom Product')
            ),
        Div(
          { className: 'absolute inset-0 bg-gradient-to-t from-[#002660]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 pointer-events-none' },
          Div(
            { className: 'bg-white/20 backdrop-blur-md rounded-xl p-3 flex items-center justify-between text-white font-bold text-xs' },
            Span({}, 'Lihat Detail'),
            Icon('ZoomIn', { size: 18 })
          )
        ),
        (product.total_sold_items > 0)
          ? Div(
              { className: 'absolute top-4 left-4 bg-[#103557] text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5' },
              Icon('ShoppingBag', { size: 11 }),
              Span({}, `${product.total_sold_items.toLocaleString('id-ID')} TERJUAL`)
            )
          : null
      ),
      Div(
        { className: 'mt-5 text-center px-2' },
        H3({ className: 'font-black text-[#002660] text-lg mb-2 uppercase tracking-tight line-clamp-1' }, product.name || ''),
        ui('a')
          .attr('href', getWhatsAppLink(ADMIN_WA, `Halo Kinau.id, saya mau pesan ${product.name}...`))
          .attr('target', '_blank')
          .attr('rel', 'noreferrer')
          .class('inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#103557] text-white text-xs font-black hover:bg-[#2874E2] shadow-sm transition-all no-underline cursor-pointer')
          .childrenOf('PESAN SEKARANG')
      )
    );
  });

  return ui('section')
    .attr('id', 'produk')
    .class('py-20 bg-[#FDFCF9]')
    .childrenOf(
      Div(
        { className: 'max-w-7xl mx-auto px-6' },
        header,
        Div(
          { className: 'w-full overflow-x-auto pb-8' },
          Div({ className: 'flex gap-6 px-2' }, emptyState, ...productCards)
        )
      )
    ).build();
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
export function LandingPortfolio(portfolioItems?: any[]) {
  const items = portfolioItems ?? [];

  const cards = items.map((item, idx) => {
    const imageUrl = Array.isArray(item.images) && item.images.length > 0 ? getResourceUrl(item.images[0]) : null;

    return Div(
      { className: 'bg-white rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden shadow-xs hover:shadow-md transition flex-shrink-0 w-[310px] md:w-[360px]', key: item.id || idx },
      imageUrl
        ? Div(
            { className: 'w-full aspect-[16/10] bg-slate-100 overflow-hidden relative' },
            createElement('img', {
              src: imageUrl,
              alt: item.institution_name,
              className: 'w-full h-full object-cover hover:scale-105 transition duration-500',
            })
          )
        : Div(
            { className: 'w-full aspect-[16/10] bg-gradient-to-br from-[#002660]/5 to-[#103557]/10 p-6 flex flex-col justify-between border-b border-[var(--border)]' },
            Row(
              { className: 'justify-between items-center' },
              Span({ className: 'text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-white text-[#103557] shadow-xs' }, 'PRODUKSI WORKSHOP'),
              Icon('Award', { size: 18, className: 'text-[#CCB029]' })
            ),
            Div(
              null,
              Span({ className: 'text-xs font-black text-[#002660] uppercase tracking-wider block' }, item.institution_name),
              Span({ className: 'text-[11px] text-[#4A5D78]' }, `${item.qty || '100+'} Pcs Selesai Dikerjakan`)
            )
          ),
      Div(
        { className: 'px-6 py-5' },
        H3({ className: 'font-black text-[#002660] text-lg mb-1.5 line-clamp-1 uppercase tracking-tight' }, item.institution_name),
        Row(
          { className: 'items-center gap-2 text-[#103557] font-bold text-xs uppercase tracking-wider mb-3' },
          Icon('ShoppingBag', { size: 13 }),
          Span({}, `${item.qty || '100+'} Pcs`)
        ),
        item.review
          ? Div(
              { className: 'bg-[#FDFCF9] p-4 rounded-2xl text-xs text-left border border-[var(--border)]' },
              Row(
                { className: 'justify-between items-center mb-1.5' },
                Span({ className: 'font-bold text-[#002660]' }, item.pic_name || 'Pelanggan'),
                Row(
                  { className: 'gap-0.5 text-[#CCB029]' },
                  ...Array.from({ length: item.rating || 5 }).map(() => Icon('Star', { size: 11, className: 'fill-current' }))
                )
              ),
              P({ className: 'text-[#4A5D78] italic leading-relaxed' }, `"${item.review}"`)
            )
          : null
      )
    );
  });

  return ui('section')
    .attr('id', 'portfolio')
    .class('py-20 bg-white')
    .childrenOf(
      Div(
        { className: 'max-w-7xl mx-auto px-6' },
        Div(
          { className: 'text-center mb-14' },
          Span({ className: 'text-[#103557] font-bold text-xs tracking-widest uppercase' }, 'Dokumentasi & Portofolio'),
          H2({ className: 'text-3xl md:text-5xl font-black text-[#002660] mt-1.5 mb-3 tracking-tight' }, 'Produksi Terbaru Workshop'),
          Div({ className: 'h-1.5 w-20 bg-[#103557] mx-auto rounded-full' })
        ),
        Div(
          { className: 'w-full overflow-x-auto pb-6' },
          Div({ className: 'flex gap-6 px-2' }, ...cards)
        )
      )
    ).build();
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function LandingFooter() {
  return ui('footer')
    .attr('id', 'kontak')
    .class('pt-16 pb-0 relative overflow-hidden bg-[#FDFCF9] border-t border-[var(--border)]')
    .childrenOf(
      Div(
        { className: 'max-w-7xl mx-auto px-8 relative z-10 pb-16' },
        Div(
          { className: 'grid grid-cols-1 md:grid-cols-4 gap-12' },
          // Col 1: Brand Info
          Div(
            { className: 'space-y-4 md:col-span-1' },
            createElement('img', { src: '/kinau-logo.png', className: 'h-9 w-auto', alt: 'Kinau' }),
            P({ className: 'text-xs text-[#4A5D78] leading-relaxed' }, 'Pusat percetakan ID card, tali lanyard custom, medali, apparel sublimasi & souvenir kampus/event terpercaya.'),
            H3({ className: 'text-sm font-bold text-[#002660]' }, 'PT Kinau Digital Kreatif'),
            P({ className: 'text-xs text-[#4A5D78]' }, 'Surabaya, Jawa Timur, Indonesia')
          ),
          // Col 2: Kontak
          Div(
            { className: 'space-y-3' },
            H3({ className: 'text-[#002660] font-bold mb-4 uppercase tracking-wider text-xs' }, 'Kontak Kami'),
            Div({ className: 'flex items-center gap-2 text-xs text-[#4A5D78]' }, Icon('Phone', { size: 14, className: 'text-[#103557]' }), Span({}, '+62 852-1933-7474')),
            Div({ className: 'flex items-center gap-2 text-xs text-[#4A5D78]' }, Icon('Mail', { size: 14, className: 'text-[#103557]' }), Span({}, 'official@kinau.id')),
            Div({ className: 'flex items-center gap-2 text-xs text-[#4A5D78]' }, Icon('MapPin', { size: 14, className: 'text-[#103557]' }), Span({}, 'Workshop Central Kinau'))
          ),
          // Col 3: Menu Cepat
          Div(
            { className: 'space-y-2' },
            H3({ className: 'text-[#002660] font-bold mb-4 uppercase tracking-wider text-xs' }, 'Menu Cepat'),
            ui('a').attr('href', '#produk').class('block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline').childrenOf('Daftar Produk'),
            ui('a').attr('href', '#portfolio').class('block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline').childrenOf('Portofolio'),
            ui('a').attr('href', '/customer/configure').class('block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline').childrenOf('Studio Jersey'),
            ui('a').attr('href', '/customer/orders').class('block text-xs text-[#4A5D78] hover:text-[#103557] transition-colors no-underline').childrenOf('Status Pesanan')
          ),
          // Col 4: Sosial Media
          Div(
            { className: 'space-y-2' },
            H3({ className: 'text-[#002660] font-bold mb-4 uppercase tracking-wider text-xs' }, 'Sosial Media'),
            ui('a').attr('href', 'https://instagram.com/kinau.id').attr('target', '_blank').attr('rel', 'noreferrer').class('block text-xs text-[#4A5D78] hover:text-[#1961CC] transition-colors no-underline').childrenOf('@kinau.id')
          )
        )
      ),
      // Bottom accent wave image with copyright overlay
      Div(
        { className: 'relative w-full overflow-hidden leading-[0]' },
        createElement('img', { src: '/Home-Bawah.png', className: 'w-full h-auto object-cover', alt: '' }),
        Div(
          { className: 'absolute bottom-0 left-0 right-0 py-6 text-center' },
          P(
            { className: 'text-[10px] md:text-sm text-white/70 uppercase tracking-[0.2em] font-medium drop-shadow-sm' },
            `© ${new Date().getFullYear()} PT KINAU DIGITAL KREATIF. Hak cipta dilindungi.`
          )
        )
      )
    ).build();
}

// ─── Floating Call Button (#2874E2) ──────────────────────────────────────────
export function FloatingWhatsAppButton() {
  return ui('div')
    .class('fixed bottom-6 right-6 z-[60]')
    .childrenOf(
      ui('a')
        .attr('href', getWhatsAppLink(ADMIN_WA, 'Halo Kinau ID, saya ingin konsultasi order...'))
        .attr('target', '_blank')
        .attr('rel', 'noreferrer')
        .class('w-14 h-14 bg-[#2874E2] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#2874E2]/30 hover:bg-[#103557] hover:scale-105 transition-all')
        .childrenOf(Icon('Phone', { className: 'w-6 h-6 fill-current' }))
    ).build();
}
