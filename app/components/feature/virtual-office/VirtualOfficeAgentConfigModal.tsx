import React, { useState, useEffect } from 'react';
import type { Agent, Division, AgentStatus } from '~/schemas/office.schema';
import {
  DATABASE_TABLE_PRESETS,
  SKILL_TEMPLATES,
  DIVISION_CONFIG,
  AGENT_STATUS_CONFIG,
} from '~/schemas/office.schema';
import { Icon } from '~/builder';

export interface AgentFormData {
  agentId?: string;
  name: string;
  role: string;
  description: string;
  division: Division;
  status: AgentStatus;
  avatarColor: string;
  shirtColor: string;
  skillPrompt: string;
  apiBaseUrl: string;
  provider: 'gemini' | 'openrouter' | 'nvidia' | 'cloudflare';
  model: string;
  temperature: number;
  selectAllTables: boolean;
  tables: string[];
  capabilities: string[];
}

export interface VirtualOfficeAgentConfigModalProps {
  isOpen?: boolean;
  open?: boolean;
  agent: Agent | null;
  isCreateMode?: boolean;
  onClose: () => void;
  onSaveConfig: (data: AgentFormData) => void;
  onDeleteAgent?: (agentId: string) => void;
}

const COLOR_PRESETS = [
  { label: 'Kinau Navy (Utama)', avatar: '#103557', shirt: '#164e78' },
  { label: 'Ocean Blue', avatar: '#0284c7', shirt: '#0369a1' },
  { label: 'Sky Blue', avatar: '#38bdf8', shirt: '#0284c7' },
  { label: 'Emerald / Green', avatar: '#10b981', shirt: '#059669' },
  { label: 'Rose / Pink', avatar: '#f472b6', shirt: '#db2777' },
  { label: 'Amber / Orange', avatar: '#f59e0b', shirt: '#d97706' },
  { label: 'Dark Slate', avatar: '#64748b', shirt: '#334155' },
];

export function VirtualOfficeAgentConfigModal({
  isOpen,
  open,
  agent,
  isCreateMode = false,
  onClose,
  onSaveConfig,
  onDeleteAgent,
}: VirtualOfficeAgentConfigModalProps): React.ReactElement | null {
  const isModalOpen = Boolean(isOpen ?? open);
  if (!isModalOpen) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'skill' | 'api' | 'context'>('profile');

  // Form states
  const [name, setName] = useState(agent?.name || '');
  const [role, setRole] = useState(agent?.role || '');
  const [description, setDescription] = useState(agent?.description || agent?.currentTask || '');
  const [division, setDivision] = useState<Division>(agent?.division || 'finance');
  const [status, setStatus] = useState<AgentStatus>(agent?.status || 'working');
  const [avatarColor, setAvatarColor] = useState(agent?.avatarColor || '#103557');
  const [shirtColor, setShirtColor] = useState(agent?.shirtColor || '#164e78');

  const [skillPrompt, setSkillPrompt] = useState(
    agent?.skillPrompt || SKILL_TEMPLATES.BOOKKEEPER.prompt
  );
  const [apiBaseUrl, setApiBaseUrl] = useState(
    agent?.apiConfig?.baseUrl || 'https://kinauid-backend.vercel.app/api/v1'
  );
  const [provider, setProvider] = useState<'gemini' | 'openrouter' | 'nvidia' | 'cloudflare'>(
    (agent?.apiConfig?.provider as any) || 'gemini'
  );
  const [model, setModel] = useState(agent?.apiConfig?.model || 'gemini-2.5-flash');
  const [temperature, setTemperature] = useState(agent?.apiConfig?.temperature ?? 0.1);
  const [selectAll, setSelectAll] = useState(agent?.contextConfig?.selectAll ?? false);
  const [selectedTables, setSelectedTables] = useState<string[]>(
    agent?.contextConfig?.tables || ['accounting_coa', 'accounting_ledger_mutations']
  );
  const [capabilities, setCapabilities] = useState<string[]>(
    agent?.capabilities || ['READ_REPORTS', 'ACTIVE_MUTATION_INSERT']
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (agent && !isCreateMode) {
      setName(agent.name);
      setRole(agent.role);
      setDescription(agent.description || agent.currentTask || '');
      setDivision(agent.division);
      setStatus(agent.status);
      setAvatarColor(agent.avatarColor || '#103557');
      setShirtColor(agent.shirtColor || '#164e78');
      setSkillPrompt(agent.skillPrompt || SKILL_TEMPLATES.BOOKKEEPER.prompt);
      setApiBaseUrl(agent.apiConfig?.baseUrl || 'https://kinauid-backend.vercel.app/api/v1');
      setProvider((agent.apiConfig?.provider as any) || 'gemini');
      setModel(agent.apiConfig?.model || 'gemini-2.5-flash');
      setTemperature(agent.apiConfig?.temperature ?? 0.1);
      setSelectAll(agent.contextConfig?.selectAll ?? false);
      setSelectedTables(
        agent.contextConfig?.tables || ['accounting_coa', 'accounting_ledger_mutations']
      );
      setCapabilities(agent.capabilities || ['READ_REPORTS', 'ACTIVE_MUTATION_INSERT']);
    } else if (isCreateMode) {
      setName('');
      setRole('');
      setDescription('');
      setDivision('finance');
      setStatus('working');
      setAvatarColor('#103557');
      setShirtColor('#164e78');
      setSkillPrompt(SKILL_TEMPLATES.BOOKKEEPER.prompt);
      setApiBaseUrl('https://kinauid-backend.vercel.app/api/v1');
      setProvider('gemini');
      setModel('gemini-2.5-flash');
      setTemperature(0.1);
      setSelectAll(false);
      setSelectedTables(['accounting_coa', 'accounting_ledger_mutations']);
      setCapabilities(['READ_REPORTS', 'ACTIVE_MUTATION_INSERT']);
    }
  }, [agent, isCreateMode, isModalOpen]);

  const handleApplyTemplate = (key: string) => {
    const template = SKILL_TEMPLATES[key];
    if (template) {
      setSkillPrompt(template.prompt);
      if (!selectAll) {
        setSelectedTables(template.defaultTables);
      }
    }
  };

  const handleToggleTable = (tbl: string) => {
    setSelectedTables((prev) =>
      prev.includes(tbl) ? prev.filter((t) => t !== tbl) : [...prev, tbl]
    );
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedTables(DATABASE_TABLE_PRESETS.map((t) => t.tableName));
    } else {
      setSelectedTables(['accounting_coa', 'accounting_ledger_mutations']);
    }
  };

  const handleToggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama agent tidak boleh kosong');
      setActiveTab('profile');
      return;
    }
    if (!role.trim()) {
      alert('Jabatan agent tidak boleh kosong');
      setActiveTab('profile');
      return;
    }

    onSaveConfig({
      agentId: isCreateMode ? undefined : agent?.id,
      name,
      role,
      description,
      division,
      status,
      avatarColor,
      shirtColor,
      skillPrompt,
      apiBaseUrl,
      provider,
      model,
      temperature,
      selectAllTables: selectAll,
      tables: selectedTables,
      capabilities,
    });
    onClose();
  };

  const handleDelete = () => {
    if (agent && onDeleteAgent) {
      onDeleteAgent(agent.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs"
              style={{ backgroundColor: isCreateMode ? '#103557' : agent?.shirtColor || agent?.avatarColor || '#0284c7' }}
            >
              {isCreateMode ? '➕' : agent?.name.slice(0, 2).toUpperCase() || 'AG'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{isCreateMode ? 'Tambah Agent Baru ke Kantor' : `Kelola Agent: ${agent?.name}`}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 border border-blue-200">
                  {isCreateMode ? 'New Agent' : agent?.division || 'finance'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isCreateMode
                  ? 'Konfigurasikan nama, jabatan, deskripsi, skill SOP, API LLM, dan cakupan tabel database.'
                  : `Ubah profil, jabatan, deskripsi, skill, dan akuisisi context tabel untuk ${agent?.name}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreateMode && onDeleteAgent && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Hapus Agent dari Kantor"
              >
                {Icon('Trash2', { className: 'w-4 h-4' })}
                <span className="hidden sm:inline">Hapus</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
            >
              {Icon('X', { className: 'w-5 h-5' })}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2 pt-2">
          {[
            { id: 'profile', label: '1. Profil & Jabatan', icon: 'User' },
            { id: 'skill', label: '2. Skill & AI Prompt', icon: 'BookOpen' },
            { id: 'api', label: '3. API & Provider', icon: 'Cpu' },
            { id: 'context', label: `4. Context Tables (${selectAll ? 'ALL' : selectedTables.length})`, icon: 'Database' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {Icon(tab.icon, { className: 'w-3.5 h-3.5' })}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROFIL & JABATAN */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Agent <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Maya Kusuma, S.Ak."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Posisi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Contoh: Finance & Accounting Lead (CFO)"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Tanggung Jawab & Tugas Pokok
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Bertanggung jawab atas rekonsiliasi kasir harian, verifikasi jurnal penyesuaian, dan pelaporan neraca saldo bulanan."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 font-normal transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Divisi / Departemen</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value as Division)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-semibold"
                  >
                    {Object.entries(DIVISION_CONFIG).map(([key, conf]) => (
                      <option key={key} value={key}>
                        {conf.name} ({conf.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Aktivitas Awal</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AgentStatus)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-semibold"
                  >
                    {Object.entries(AGENT_STATUS_CONFIG).map(([key, conf]) => (
                      <option key={key} value={key}>
                        {conf.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color Theme Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tema Warna Seragam & Avatar 3D
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatarColor(preset.avatar);
                        setShirtColor(preset.shirt);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${
                        shirtColor === preset.shirt
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: preset.shirt }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKILL & AI PROMPT */}
          {activeTab === 'skill' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Preset Siklus Akuntansi & Peran
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(SKILL_TEMPLATES).map(([key, tpl]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyTemplate(key)}
                      className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-blue-400 hover:bg-blue-50/30 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                        <span>{tpl.name}</span>
                        <span className="text-[10px] text-blue-600 font-mono">Terapkan</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tpl.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  System Skill Prompt (Aturan Baku & SOP Operasional Agent)
                </label>
                <textarea
                  rows={5}
                  value={skillPrompt}
                  onChange={(e) => setSkillPrompt(e.target.value)}
                  placeholder="Tuliskan instruksi persona, aturan debit/kredit, batas otorisasi, dsb..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 font-mono leading-relaxed transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Fitur & Kemampuan Agent (Capabilities)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'READ_REPORTS', label: 'Report Fast by Chat', desc: 'Membaca rekap neraca, kas, laba-rugi kilat' },
                    { id: 'ACTIVE_MUTATION_INSERT', label: 'Pencatatan Aktif (Double-Entry)', desc: 'Menghasilkan draft mutasi debit/kredit' },
                    { id: 'BUDGET_ANALYSIS', label: 'Analisis Plafon Anggaran', desc: 'Audit over-budget vs tabel accounting_budgets' },
                    { id: 'AUTO_BALANCE_VALIDATION', label: 'Validasi Keseimbangan Buku Besar', desc: 'Memastikan total D = K sebelum posting' },
                    { id: 'DEBT_REMINDER', label: 'Pengawas Tempo Hutang & Piutang', desc: 'Alert jatuh tempo tagihan vendor & klien' },
                  ].map((cap) => {
                    const isChecked = capabilities.includes(cap.id);
                    return (
                      <label
                        key={cap.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-400/30'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCapability(cap.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{cap.label}</p>
                          <p className="text-[10px] text-slate-500">{cap.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: API ENDPOINT & PROVIDER */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target API Base URL</label>
                <input
                  type="url"
                  required
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="https://kinauid-backend.vercel.app/api/v1"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 font-mono font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Endpoint backend Hono untuk eksekusi AI, CRUD tabel database, dan webhook audit log.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">LLM Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-semibold"
                  >
                    <option value="gemini">Google Gemini (Default)</option>
                    <option value="openrouter">OpenRouter AI Gateway</option>
                    <option value="nvidia">NVIDIA NIM Cloud</option>
                    <option value="cloudflare">Cloudflare Workers AI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model Name</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="gemini-2.5-flash"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Temperature (Tingkat Presisi / Kreativitas)</label>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>0.0 (Presisi Tinggi / Akuntansi Baku)</span>
                  <span>0.5 (Seimbang)</span>
                  <span>1.0 (Kreatif / Bebas)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTEXT TABLES ACQUISITION */}
          {activeTab === 'context' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Master Toggle: Select All Tables</h4>
                  <p className="text-[11px] text-blue-700 font-medium">
                    Berikan hak akses akuisisi ke seluruh skema database (Akuntansi, CRM, Inventory, dsb.)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAllChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Daftar Whitelist Tabel Konteks Database:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DATABASE_TABLE_PRESETS.map((table) => {
                    const isChecked = selectAll || selectedTables.includes(table.tableName);
                    return (
                      <label
                        key={table.tableName}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400/20 shadow-2xs'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={selectAll}
                          checked={isChecked}
                          onChange={() => handleToggleTable(table.tableName)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-60"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{table.label}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {table.tableName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">{table.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {isCreateMode
                  ? 'Agent baru akan ditempatkan di 3D office floor secara otomatis.'
                  : 'Perubahan akan disimpan permanen ke database backend.'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {Icon('Check', { className: 'w-4 h-4' })}
                <span>{isCreateMode ? 'Buat Agent Baru' : 'Simpan Profil & Konfigurasi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-rose-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              {Icon('AlertTriangle', { className: 'w-5 h-5' })}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Hapus Agent {agent?.name}?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini akan menghapus agent beserta meja kerjanya dari lantai Virtual Office 3D dan database backend.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer"
              >
                Ya, Hapus Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
