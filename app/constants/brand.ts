export const BRAND_NAME = 'Kinau ID';
export const BRAND_TAGLINE = 'Percetakan ID Card, Lanyard & Apparel Hub';
export const BRAND_DESCRIPTION =
  'Solusi percetakan profesional & konveksi custom untuk ID card, lanyard, jersey sublimasi, kaos, kemeja, dan merchandise event kampus, sekolah, serta korporat.';
export const BRAND_AUTHOR = 'Kinau ID Workshop';
export const BRAND_DOMAIN = 'kinau.id';
export const ADMIN_WA = '6285219337474';
export const APP_COOKIE_NAME = '__session_kinauid';

export function getWhatsAppLink(phone: string = ADMIN_WA, message: string = 'Halo Kinau.id, saya ingin konsultasi pemesanan...') {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

export const WORKSHOP_ADDRESS = 'Jalan Terusan Jl. Murai 1 No.7 , Kel. Korpri Raya, Kec. Sukarame, Kota Bandar Lampung, Lampung.';

export function getGoogleMapsLink(query: string = 'Kinau ID Percetakan Bandar Lampung'): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Palet Warna Resmi Brand Kinau ID (Revisi UI/UX Modern & Lembut)
 */
export const BRAND_COLORS = {
  primaryBlue: {
    dominant: '#103557', // KINAU Deep Navy Blue (from /login "Kreativitas Tanpa Batas Bersama Kinau")
    lighter: '#164e78',  // Lighter Navy / Hover Action (#164E78)
    subtle: 'rgba(16, 53, 87, 0.08)',
    border: 'rgba(16, 53, 87, 0.2)',
  },
  darkAccent: {
    indigo: '#002660',   // Dark Accent / Indigo (Headlines, Body Text, Dark Sidebar)
    subtle: 'rgba(0, 38, 96, 0.08)',
  },
  goldAccent: {
    gold: '#CCB029',     // Gold Accent (Exclusive Highlights, Metrics, Status)
    subtle: 'rgba(204, 176, 41, 0.12)',
    border: 'rgba(204, 176, 41, 0.3)',
  },
  lightAccent: {
    taupe: '#E9E3C5',    // Light Accent / Taupe (Soft Panels, Borders, Subtle Cards)
    taupeLight: '#F7F5ED',
    border: '#E2DCBE',
  },
  base: {
    white: '#FFFFFF',    // White Base (Clean Background)
  },
} as const;

export const ARCHITECTURE_PILLARS = [
  {
    id: 'zero-jsx',
    title: 'Zero-JSX Functional DSL',
    short: 'Pure .ts DSL',
    description:
      'File route presentasi murni menggunakan .ts tanpa tag JSX. Memanfaatkan Proxy UI factory & fluent method chaining untuk kode yang sangat ringkas, terstruktur, dan type-safe (<50 LOC).',
    icon: 'Code2',
    color: 'cyan',
  },
  {
    id: 'ddd-3layer',
    title: '3-Layer Domain-Driven Design (DDD)',
    short: 'Schema -> Service -> Route',
    description:
      'Pemisahan ketat: Schema (Zod & types), Service (business logic, caching & action dispatcher), dan Feature Route (declarative orchestration).',
    icon: 'Split',
    color: 'emerald',
  },
  {
    id: 'dot-routes',
    title: 'Dot-Notation Flat Routes & Auto-Breadcrumb',
    short: 'Dynamic Scanner',
    description:
      'Penamaan file berbasis titik (contoh: app.order-list.ts, customer.orders.ts) otomatis dipindai dan dipetakan ke hierarki rute URL.',
    icon: 'FolderTree',
    color: 'blue',
  },
  {
    id: 'encrypted-state',
    title: 'Encrypted URL-as-State (?q=...)',
    short: 'Tamper-Proof State',
    description:
      'Sinkronisasi filter, pagination, tab, dan query parameters ke state terenkripsi tanpa reload halaman.',
    icon: 'Lock',
    color: 'violet',
  },
  {
    id: 'passive-shell',
    title: 'Passive Root Shell & Modal Registry',
    short: 'Passive Shell',
    description:
      'Root layout minimalis dengan GlobalModalRenderer, Toast feedback, dan progress bar navigasi otomatis.',
    icon: 'Cpu',
    color: 'amber',
  },
];
