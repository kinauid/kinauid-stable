import { z } from 'zod';

export const AgentStatusSchema = z.enum(['working', 'meeting', 'away', 'break', 'offline']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const DivisionSchema = z.enum([
  'sales',
  'marketing',
  'operations',
  'communication',
  'development',
  'finance',
  'general_hr',
]);
export type Division = z.infer<typeof DivisionSchema>;

export const AGENT_STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; color: string; ringColor: string; bgClass: string; textClass: string; hexColor: number }
> = {
  working: {
    label: 'Sedang Bekerja',
    color: '#10b981',
    ringColor: '#34d399',
    bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
    textClass: 'text-emerald-600',
    hexColor: 0x10b981,
  },
  meeting: {
    label: 'Dalam Rapat',
    color: '#0284c7',
    ringColor: '#38bdf8',
    bgClass: 'bg-sky-500/10 border-sky-500/30 text-sky-700',
    textClass: 'text-sky-700',
    hexColor: 0x0284c7,
  },
  away: {
    label: 'Tidak di Meja',
    color: '#64748b',
    ringColor: '#94a3b8',
    bgClass: 'bg-slate-500/10 border-slate-500/30 text-slate-600',
    textClass: 'text-slate-600',
    hexColor: 0x64748b,
  },
  break: {
    label: 'Istirahat / Kopi',
    color: '#f59e0b',
    ringColor: '#fbbf24',
    bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
    textClass: 'text-amber-600',
    hexColor: 0xf59e0b,
  },
  offline: {
    label: 'Offline',
    color: '#ef4444',
    ringColor: '#f87171',
    bgClass: 'bg-red-500/10 border-red-500/30 text-red-600',
    textClass: 'text-red-600',
    hexColor: 0xef4444,
  },
};

export const DIVISION_CONFIG: Record<
  Division,
  { name: string; shortName: string; icon: string; color: string; shirtHex: number; cameraTarget: [number, number, number] }
> = {
  sales: {
    name: 'Sales & Business Development',
    shortName: 'SALES',
    icon: 'Briefcase',
    color: '#0284c7',
    shirtHex: 0x0369a1,
    cameraTarget: [-9.5, 0.8, -8.0],
  },
  marketing: {
    name: 'Brand & Growth Marketing',
    shortName: 'MARKETING',
    icon: 'TrendingUp',
    color: '#db2777',
    shirtHex: 0xbe185d,
    cameraTarget: [-9.5, 0.8, -0.5],
  },
  operations: {
    name: 'Operations & Supply Chain',
    shortName: 'OPERATIONS',
    icon: 'Layers',
    color: '#d97706',
    shirtHex: 0xb45309,
    cameraTarget: [-9.5, 0.8, 7.5],
  },
  communication: {
    name: 'Corporate Communication & PR',
    shortName: 'COMMUNICATION',
    icon: 'Radio',
    color: '#059669',
    shirtHex: 0x047857,
    cameraTarget: [4.5, 0.8, -8.5],
  },
  development: {
    name: 'Software Engineering & IT',
    shortName: 'DEVELOPMENT',
    icon: 'Code',
    color: '#2563eb',
    shirtHex: 0x1d4ed8,
    cameraTarget: [6.5, 0.8, -1.0],
  },
  finance: {
    name: 'Finance & Accounting',
    shortName: 'FINANCE',
    icon: 'DollarSign',
    color: '#0f766e',
    shirtHex: 0x0f766e,
    cameraTarget: [4.5, 0.8, 6.5],
  },
  general_hr: {
    name: 'General Affairs & People HR',
    shortName: 'GENERAL / HR',
    icon: 'Users',
    color: '#ea580c',
    shirtHex: 0xc2410c,
    cameraTarget: [12.0, 0.8, -4.5],
  },
};

export type AgentCapability =
  | 'READ_REPORTS'
  | 'ACTIVE_MUTATION_INSERT'
  | 'BUDGET_ANALYSIS'
  | 'AUTO_BALANCE_VALIDATION'
  | 'DEBT_REMINDER';

export interface DatabaseTableOption {
  tableName: string;
  label: string;
  description: string;
  category: 'accounting' | 'crm' | 'inventory' | 'system';
  defaultSelected: boolean;
}

export const DATABASE_TABLE_PRESETS: DatabaseTableOption[] = [
  {
    tableName: 'accounts',
    label: 'Chart of Accounts (COA)',
    description: 'Daftar kode akun, nama rekening, klasifikasi aset/beban, dan saldo berjalan.',
    category: 'accounting',
    defaultSelected: true,
  },
  {
    tableName: 'account_ledger_mutations',
    label: 'Buku Besar & Mutasi (Ledger)',
    description: 'Riwayat mutasi transaksi debit/kredit per pos rekening akuntansi.',
    category: 'accounting',
    defaultSelected: true,
  },
  {
    tableName: 'account_ledger_journals',
    label: 'Jurnal Umum Transaksi (Double-Entry)',
    description: 'Header entri jurnal transaksi berpasangan berstatus balance.',
    category: 'accounting',
    defaultSelected: true,
  },
  {
    tableName: 'v_balance_sheet',
    label: 'Neraca Saldo & Posisi Keuangan (View)',
    description: 'Ringkasan posisi aset kas/bank, piutang, kewajiban/hutang, dan ekuitas.',
    category: 'accounting',
    defaultSelected: true,
  },
  {
    tableName: 'v_cash_flow',
    label: 'Laporan Arus Kas (Cash Flow View)',
    description: 'Rekapitulasi arus kas masuk operasional dan arus kas keluar riil.',
    category: 'accounting',
    defaultSelected: false,
  },
  {
    tableName: 'v_income_statement',
    label: 'Laporan Laba Rugi (Income Statement)',
    description: 'Ringkasan omset penjualan merchandise vs seluruh pos beban usaha.',
    category: 'accounting',
    defaultSelected: false,
  },
  {
    tableName: 'orders',
    label: 'Pesanan Pelanggan & Invoice (Orders)',
    description: 'Data invoice pemesanan, nilai total pesanan, deadline, dan status produksi.',
    category: 'crm',
    defaultSelected: true,
  },
  {
    tableName: 'customers',
    label: 'Master Pelanggan & Kontak PIC (CRM)',
    description: 'Database kontak pelanggan, nomor WhatsApp, email, dan instansi pemesan.',
    category: 'crm',
    defaultSelected: false,
  },
  {
    tableName: 'institutions',
    label: 'Master Instansi & Mitra Kampus (CRM)',
    description: 'Daftar universitas, korporat, dan asosiasi kemitraan pemesan merchandise.',
    category: 'crm',
    defaultSelected: false,
  },
  {
    tableName: 'commodities',
    label: 'Stok Bahan Baku & Logistik (Commodities)',
    description: 'Inventori kain kaos, tinta sublim, tali lanyard, dan aksesoris konveksi.',
    category: 'inventory',
    defaultSelected: false,
  },
  {
    tableName: 'products',
    label: 'Katalog Produk & Merchandise (Products)',
    description: 'Daftar produk merchandise, variasi bahan, dan formula harga konveksi.',
    category: 'inventory',
    defaultSelected: false,
  },
  {
    tableName: 'ai_agents',
    label: 'Multi-Agent Virtual Office (AI Agents)',
    description: 'Profil agent AI aktif, konfigurasi skill, model LLM, dan izin akses tabel.',
    category: 'system',
    defaultSelected: false,
  },
];

export const SKILL_TEMPLATES: Record<string, { name: string; prompt: string; defaultTables: string[] }> = {
  BOOKKEEPER: {
    name: 'Pencatat Transaksi & Jurnal Ganda',
    prompt:
      'Kamu adalah Expert di bidang Pencatatan Keuangan, Manajemen Transaksi, dan Pembukuan Ganda (Debit/Kredit) sesuai standar akuntansi agar baku. Analisis instruksi atau teks struk dan susun draft jurnal yang balance.',
    defaultTables: ['accounting_coa', 'accounting_ledger_mutations', 'accounting_ledger_journals'],
  },
  BUDGET_MASTER: {
    name: 'Manajer Perencanaan Anggaran',
    prompt:
      'Kamu adalah Manajer Anggaran & Perencanaan Keuangan. Tugasmu mengaudit realisasi belanja bulanan vs plafon anggaran di tabel accounting_budgets, memberikan alert over-budget, dan simulasi penambahan alokasi pos.',
    defaultTables: ['accounting_coa', 'accounting_budgets', 'accounting_ledger_mutations'],
  },
  CFO_AUDITOR: {
    name: 'Auditor & Analis Laporan Keuangan',
    prompt:
      'Kamu adalah CFO & Auditor Keuangan. Tugasmu menyusun ringkasan Laba Rugi, Neraca Saldo, Arus Kas secara cepat via chat, mendeteksi selisih buku besar, serta memberikan rekomendasi kesehatan finansial bisnis.',
    defaultTables: ['accounting_coa', 'accounting_ledger_journals', 'accounting_ledger_mutations', 'accounting_budgets'],
  },
  DEBT_COLLECTOR: {
    name: 'Pengawas Hutang & Piutang',
    prompt:
      'Kamu adalah Spesialis Manajemen Hutang & Piutang (AR/AP). Tugasmu memantau umur piutang, mencatat pembayaran termin cicilan, dan memberikan jadwal jatuh tempo tagihan vendor.',
    defaultTables: ['accounting_coa', 'accounting_debts', 'accounting_receivables'],
  },
  CUSTOM: {
    name: 'Kustom Mandiri (Custom Agent)',
    prompt: 'Kamu adalah Asisten Virtual Office spesialis bisnis dan operasional...',
    defaultTables: ['accounting_coa'],
  },
};

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  role: z.string(),
  division: DivisionSchema,
  status: AgentStatusSchema,
  description: z.string().optional(),
  avatarColor: z.string().default('#38bdf8'),
  shirtColor: z.string().default('#0284c7'),
  currentTask: z.string().default('Menangani tugas operasional'),
  currentProject: z.string().default('Kinau Enterprise Platform'),
  deskId: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]), // [x, y, z]
  rotationY: z.number().default(0), // in radians
  focusScore: z.number().min(0).max(100).default(92),
  focusTime: z.string().default('3j 45m'),
  lastActive: z.string().default('Aktif sekarang'),
  initialMessage: z.string().optional(),
  // Multi-Agent SKILL & API & Context Settings
  skillPrompt: z.string().optional(),
  apiConfig: z
    .object({
      baseUrl: z.string().default('https://kinauid-backend.vercel.app/api/v1'),
      provider: z.enum(['gemini', 'openrouter', 'nvidia', 'cloudflare']).default('gemini'),
      model: z.string().default('gemini-2.5-flash'),
      temperature: z.number().default(0.1),
    })
    .optional(),
  contextConfig: z
    .object({
      selectAll: z.boolean().default(false),
      tables: z.array(z.string()).default(['accounting_coa', 'accounting_ledger_mutations']),
    })
    .optional(),
  capabilities: z.array(z.string()).default(['READ_REPORTS', 'ACTIVE_MUTATION_INSERT']),
});

export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentSchema = z.object({
  name: z.string().min(2, 'Nama agent minimal 2 karakter'),
  role: z.string().min(2, 'Jabatan agent minimal 2 karakter'),
  description: z.string().optional(),
  division: DivisionSchema.default('finance'),
  status: AgentStatusSchema.default('working'),
  avatarColor: z.string().default('#0284c7'),
  shirtColor: z.string().default('#103557'),
  currentTask: z.string().default('Menangani tugas operasional'),
  currentProject: z.string().default('Kinau Enterprise Platform'),
  skillPrompt: z.string().optional(),
  apiBaseUrl: z.string().url('URL endpoint API tidak valid').default('https://kinauid-backend.vercel.app/api/v1'),
  provider: z.enum(['gemini', 'openrouter', 'nvidia', 'cloudflare']).default('gemini'),
  model: z.string().default('gemini-2.5-flash'),
  temperature: z.coerce.number().min(0).max(2).default(0.1),
  selectAllTables: z.boolean().default(false),
  tables: z.array(z.string()).default(['accounting_coa', 'accounting_ledger_mutations']),
  capabilities: z.array(z.string()).default(['READ_REPORTS', 'ACTIVE_MUTATION_INSERT']),
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

export const UpdateAgentProfileSchema = z.object({
  agentId: z.string().min(1, 'Agent ID wajib diisi'),
  name: z.string().min(2, 'Nama agent minimal 2 karakter'),
  role: z.string().min(2, 'Jabatan agent minimal 2 karakter'),
  description: z.string().optional(),
  division: DivisionSchema.default('finance'),
  status: AgentStatusSchema.default('working'),
  avatarColor: z.string().default('#0284c7'),
  shirtColor: z.string().default('#103557'),
  currentTask: z.string().optional(),
  currentProject: z.string().optional(),
  skillPrompt: z.string().optional(),
  apiBaseUrl: z.string().url('URL endpoint API tidak valid').default('https://kinauid-backend.vercel.app/api/v1'),
  provider: z.enum(['gemini', 'openrouter', 'nvidia', 'cloudflare']).default('gemini'),
  model: z.string().default('gemini-2.5-flash'),
  temperature: z.coerce.number().min(0).max(2).default(0.1),
  selectAllTables: z.boolean().default(false),
  tables: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default(['READ_REPORTS', 'ACTIVE_MUTATION_INSERT']),
});

export type UpdateAgentProfileInput = z.infer<typeof UpdateAgentProfileSchema>;

export const DeleteAgentSchema = z.object({
  agentId: z.string().min(1, 'Agent ID wajib diisi'),
});

export const UpdateAgentConfigSchema = z.object({
  agentId: z.string(),
  skillPrompt: z.string().min(5, 'Skill prompt minimal 5 karakter'),
  apiBaseUrl: z.string().url('URL endpoint API tidak valid'),
  provider: z.enum(['gemini', 'openrouter', 'nvidia', 'cloudflare']).default('gemini'),
  model: z.string().default('gemini-2.5-flash'),
  temperature: z.coerce.number().min(0).max(2).default(0.1),
  selectAllTables: z.boolean().default(false),
  tables: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default(['READ_REPORTS', 'ACTIVE_MUTATION_INSERT']),
});

export const ChatAgentAiSchema = z.object({
  agentId: z.string(),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
  history: z.array(z.object({ sender: z.enum(['user', 'agent']), text: z.string() })).optional(),
});

export const ConfirmMutationSchema = z.object({
  agentId: z.string(),
  transactionPayload: z.record(z.string(), z.any()),
});

export const OfficeZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: DivisionSchema,
  capacity: z.number(),
  color: z.string(),
  description: z.string(),
  centerPos: z.tuple([z.number(), z.number(), z.number()]),
});

export type OfficeZone = z.infer<typeof OfficeZoneSchema>;

export const UpdateAgentStatusSchema = z.object({
  agentId: z.string(),
  status: AgentStatusSchema,
});

export const AssignTaskSchema = z.object({
  agentId: z.string(),
  task: z.string().min(3, 'Tugas minimal 3 karakter'),
  project: z.string().optional(),
});

export const SendMessageSchema = z.object({
  agentId: z.string(),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
});

// Zones configuration matching reference layout
export const INITIAL_OFFICE_ZONES: OfficeZone[] = [
  { id: 'zone-sales', name: 'Sales & Business Development', code: 'sales', capacity: 6, color: '#0284c7', description: 'Divisi Penjualan & Kemitraan Klien', centerPos: [-9.5, 0, -8.0] },
  { id: 'zone-mkt', name: 'Brand & Growth Marketing', code: 'marketing', capacity: 6, color: '#db2777', description: 'Divisi Pemasaran, Iklan & Kreatif', centerPos: [-9.5, 0, -0.5] },
  { id: 'zone-ops', name: 'Operations & Supply Chain', code: 'operations', capacity: 6, color: '#d97706', description: 'Divisi Logistik, Gudang & Produksi', centerPos: [-9.5, 0, 7.5] },
  { id: 'zone-comm', name: 'Corporate Communication & PR', code: 'communication', capacity: 6, color: '#059669', description: 'Divisi Humas & Media Komunikasi', centerPos: [4.5, 0, -8.5] },
  { id: 'zone-dev', name: 'Software Engineering & IT', code: 'development', capacity: 8, color: '#2563eb', description: 'Divisi Rekayasa Perangkat Lunak & Cloud', centerPos: [4.5, 0, -1.0] },
  { id: 'zone-fin', name: 'Finance & Accounting', code: 'finance', capacity: 6, color: '#0f766e', description: 'Divisi Keuangan, Pajak & Pembukuan', centerPos: [4.5, 0, 6.5] },
  { id: 'zone-hr', name: 'General Affairs & People HR', code: 'general_hr', capacity: 4, color: '#ea580c', description: 'Divisi SDM, Rekrutmen & Fasilitas', centerPos: [12.0, 0, -4.5] },
];

// Initial default AI agents (can be added, edited, or deleted dynamically)
export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-fin-1',
    name: 'Maya Kusuma, S.Ak.',
    role: 'Finance & Accounting Lead (CFO)',
    description: 'Menyusun ringkasan Laba Rugi, Neraca Saldo, Arus Kas secara cepat via chat, mendeteksi selisih buku besar, dan analisis kesehatan finansial.',
    division: 'finance',
    status: 'working',
    avatarColor: '#0284c7',
    shirtColor: '#103557',
    currentTask: 'Audit laporan laba rugi & rekonsiliasi kas',
    currentProject: 'NuraFin Clean Core v2',
    deskId: 'desk-fin-1',
    position: [2.5, 0, 5.0],
    rotationY: 0,
    focusScore: 96,
    focusTime: '4j 50m',
    lastActive: 'Aktif sekarang',
    skillPrompt: SKILL_TEMPLATES.CFO_AUDITOR.prompt,
    apiConfig: {
      baseUrl: 'https://kinauid-backend.vercel.app/api/v1',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      temperature: 0.1,
    },
    contextConfig: {
      selectAll: false,
      tables: ['accounting_coa', 'accounting_ledger_journals', 'accounting_ledger_mutations', 'accounting_budgets'],
    },
    capabilities: ['READ_REPORTS', 'BUDGET_ANALYSIS', 'AUTO_BALANCE_VALIDATION'],
  },
  {
    id: 'agent-fin-2',
    name: 'Teguh Wibowo',
    role: 'Pencatat Transaksi & Jurnal (Bookkeeper)',
    description: 'Menganalisis instruksi mutasi transaksi belanja harian dan menyusun draft jurnal debit/kredit yang balance untuk diposting ke buku besar.',
    division: 'finance',
    status: 'working',
    avatarColor: '#0ea5e9',
    shirtColor: '#0369a1',
    currentTask: 'Pencatatan mutasi transaksi belanja & double entry',
    currentProject: 'Daily Mutation Intake',
    deskId: 'desk-fin-2',
    position: [6.5, 0, 5.0],
    rotationY: 0,
    focusScore: 91,
    focusTime: '3j 25m',
    lastActive: 'Aktif sekarang',
    skillPrompt: SKILL_TEMPLATES.BOOKKEEPER.prompt,
    apiConfig: {
      baseUrl: 'https://kinauid-backend.vercel.app/api/v1',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      temperature: 0.1,
    },
    contextConfig: {
      selectAll: false,
      tables: ['accounting_coa', 'accounting_ledger_mutations', 'accounting_ledger_journals'],
    },
    capabilities: ['READ_REPORTS', 'ACTIVE_MUTATION_INSERT', 'AUTO_BALANCE_VALIDATION'],
  },
  {
    id: 'agent-fin-3',
    name: 'Lestari Handayani',
    role: 'Manajer Perencanaan Anggaran',
    description: 'Mengaudit realisasi belanja bulanan vs pagu plafon anggaran operasional, mendeteksi over-budget, dan simulasi penambahan alokasi pos.',
    division: 'finance',
    status: 'working',
    avatarColor: '#0f766e',
    shirtColor: '#115e59',
    currentTask: 'Monitoring pagu anggaran operasional & gaji',
    currentProject: 'Automated Budget Pipeline',
    deskId: 'desk-fin-3',
    position: [2.5, 0, 8.0],
    rotationY: Math.PI,
    focusScore: 94,
    focusTime: '4j 00m',
    lastActive: 'Aktif sekarang',
    skillPrompt: SKILL_TEMPLATES.BUDGET_MASTER.prompt,
    apiConfig: {
      baseUrl: 'https://kinauid-backend.vercel.app/api/v1',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      temperature: 0.1,
    },
    contextConfig: {
      selectAll: false,
      tables: ['accounting_coa', 'accounting_budgets', 'accounting_ledger_mutations'],
    },
    capabilities: ['READ_REPORTS', 'BUDGET_ANALYSIS'],
  },
  {
    id: 'agent-fin-4',
    name: 'Hendra Gunawan',
    role: 'Pengawas Hutang & Piutang (AR/AP)',
    description: 'Memantau umur piutang invoice pelanggan, jadwal jatuh tempo tagihan vendor, dan pencatatan pembayaran termin cicilan.',
    division: 'finance',
    status: 'break',
    avatarColor: '#38bdf8',
    shirtColor: '#103557',
    currentTask: 'Monitoring piutang B2B & hutang vendor',
    currentProject: 'Debt & Receivables Flow',
    deskId: 'desk-fin-4',
    position: [6.5, 0, 8.0],
    rotationY: Math.PI,
    focusScore: 85,
    focusTime: '2j 10m',
    lastActive: 'Sedang break',
    skillPrompt: SKILL_TEMPLATES.DEBT_COLLECTOR.prompt,
    apiConfig: {
      baseUrl: 'https://kinauid-backend.vercel.app/api/v1',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      temperature: 0.1,
    },
    contextConfig: {
      selectAll: false,
      tables: ['accounting_coa', 'accounting_debts', 'accounting_receivables'],
    },
    capabilities: ['READ_REPORTS', 'DEBT_REMINDER'],
  },
];
