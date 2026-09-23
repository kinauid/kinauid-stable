export interface CoreTermItem {
  id: string;
  slug: string;
  name: string;
  category: 'Execution' | 'Focus & Psychology' | 'System Architecture' | 'Prioritization';
  description: string;
  keyPrinciples: string[];
  badgeColor: string;
  iconName: string;
}

export const ITQANIC_TERMS: CoreTermItem[] = [
  {
    id: 'term-1',
    slug: 'hard-wip-enforcement',
    name: 'Hard WIP Enforcement (1-Project Limit)',
    category: 'Execution',
    description:
      'Aturan ketat membatasi pengerjaan aktif hanya 1 proyek utama pada satu waktu. Mencegah fragmentasi energi kognitif dan memaksa penuntasan (shipping) sebelum memulai repo baru.',
    keyPrinciples: [
      "Maksimal 1 status 'Active WIP' di sistem",
      "Proyek baru otomatis berstatus 'Idea Vault' (terkunci)",
      "Transisi hanya bisa terjadi jika WIP aktif berstatus 'Shipped' atau 'Parked' dengan alasan tertulis",
    ],
    badgeColor: 'emerald',
    iconName: 'ShieldAlert',
  },
  {
    id: 'term-2',
    slug: 'anti-shiny-object-vault',
    name: 'Anti-Shiny Object Vault (Zero Distraction Capture)',
    category: 'Focus & Psychology',
    description:
      'Mekanisme penangkapan cepat ide baru tanpa menghentikan flow pekerjaan saat ini. Menghilangkan dorongan dopamin palsu dari membuat proyek baru di tengah pengerjaan.',
    keyPrinciples: [
      'Modal shortcut kilat (Ctrl + K)',
      'Simpan ide mentah tanpa konfigurasi repo',
      'Penilaian berkala melalui scoring batch, bukan saat impuls muncul',
    ],
    badgeColor: 'cyan',
    iconName: 'Sparkles',
  },
  {
    id: 'term-3',
    slug: 'visual-architecture-memory-map',
    name: 'Visual Architecture Memory Map',
    category: 'System Architecture',
    description:
      'Representasi visual kanvas interaktif (node & edge) untuk relasi modul, arsitektur, dan third-party services agar saat kembali ke project lama tidak perlu membaca ulang seluruh codebase.',
    keyPrinciples: [
      'Visualisasi sekilas (At-a-glance understanding)',
      'Dependency mapping antar micro-services',
      'Data contract & interface clarity',
    ],
    badgeColor: 'blue',
    iconName: 'Network',
  },
  {
    id: 'term-4',
    slug: 'ice-priority-scoring',
    name: 'ICE Priority Scoring Matrix',
    category: 'Prioritization',
    description:
      'Matriks pembobotan matematis berbasis Impact (dampak), Confidence (tingkat keyakinan), dan Ease (kemudahan eksekusi) untuk menyeleksi backlog ide secara objektif.',
    keyPrinciples: [
      'Score = (Impact + Confidence + Ease) / 3',
      'Menghilangkan bias emosional subjektif',
      'Sorting dinamis pada antrean backlog ide',
    ],
    badgeColor: 'amber',
    iconName: 'Gauge',
  },
  {
    id: 'term-5',
    slug: 'reusable-pattern-synergy',
    name: 'Cross-Project Reusable Pattern Synergy',
    category: 'System Architecture',
    description:
      'Strategi standarisasi pola arsitektur, utils, dan komponen UI lintas proyek sehingga efisiensi eksekusi meningkat drastis tanpa menulis ulang fondasi dari nol.',
    keyPrinciples: [
      'Centralized DSL Engine & Proxy Factory',
      'Unified ErrorCatch and Telemetry Logging',
      'Encrypted URL-as-State Pattern',
    ],
    badgeColor: 'violet',
    iconName: 'Layers',
  },
];
