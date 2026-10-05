import React, { useState } from 'react';
import {
  Layers,
  ImageIcon,
  Move,
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Sparkles,
  CheckCircle2,
  X,
  Palette,
  Type,
  Maximize2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  type DesignDashboardData,
  type DesignTemplateItem,
  type DesignCategory,
  type StyleMode,
  type DesignRuleItem,
} from '~/schemas/design-template.schema';

export interface DesignTemplateWidgetProps {
  data: DesignDashboardData;
  onCategoryChange: (category: DesignCategory) => void;
  onSaveTemplate: (payload: any) => void;
  onDeleteTemplate: (id: string) => void;
  isSubmitting?: boolean;
}

export function DesignTemplateWidget({
  data,
  onCategoryChange,
  onSaveTemplate,
  onDeleteTemplate,
  isSubmitting = false,
}: DesignTemplateWidgetProps): React.ReactElement {
  const { templates = [], selempangAssets = [], activeCategory = 'idcard' } = data || {};

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [baseImage, setBaseImage] = useState('');
  const [styleMode, setStyleMode] = useState<StyleMode>('dynamic');
  const [rules, setRules] = useState<DesignRuleItem[]>([
    { id: 'r1', type: 'photo', label: 'Foto Peserta', x: 20, y: 35, width: 60, height: 80 },
    { id: 'r2', type: 'text', label: 'Nama Lengkap', x: 10, y: 125, width: 80, height: 20, fontColor: '#1e1b4b' },
  ]);

  const [previewTemplate, setPreviewTemplate] = useState<DesignTemplateItem | null>(null);

  const filteredTemplates = templates.filter((t) => t.category === activeCategory);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTemplateName(`Master Template ${activeCategory.toUpperCase()} Baru`);
    setBaseImage('https://data.kinau.web.id/sample-idcard-template.png');
    setStyleMode('dynamic');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (t: DesignTemplateItem) => {
    setEditingId(t.id);
    setTemplateName(t.name);
    setBaseImage(t.base_image);
    setStyleMode(t.style_mode);
    setRules(t.rules || []);
    setIsEditorOpen(true);
  };

  const handleAddRule = (type: 'text' | 'photo') => {
    setRules((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        type,
        label: type === 'photo' ? 'Foto Tambahan' : 'Teks Field Baru',
        x: 10,
        y: 10,
        width: type === 'photo' ? 50 : 80,
        height: type === 'photo' ? 60 : 20,
        fontColor: '#000000',
      },
    ]);
  };

  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName || !baseImage) return;

    onSaveTemplate({
      intent: 'save-template',
      id: editingId,
      name: templateName,
      category: activeCategory,
      base_image: baseImage,
      style_mode: styleMode,
      rules: JSON.stringify(rules),
    });

    setIsEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Switcher */}
        <div className="flex bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)] shadow-sm w-fit">
          <button
            onClick={() => onCategoryChange('idcard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'idcard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <ImageIcon size={15} /> ID CARD
          </button>
          <button
            onClick={() => onCategoryChange('lanyard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'lanyard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Move size={15} /> LANYARD
          </button>
          <button
            onClick={() => onCategoryChange('selempang')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'selempang'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Scissors size={15} /> SELEMPANG GELAR
          </button>
        </div>

        {activeCategory !== 'selempang' && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gray-900 dark:bg-indigo-600 hover:bg-black transition flex items-center gap-2 shadow-sm"
          >
            <Plus size={15} /> Buat Template Baru
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeCategory === 'selempang' ? (
        // Selempang Asset Manager
        <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm p-6 space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h3 className="text-base font-bold text-[var(--foreground)]">Bank Aset Selempang Gelar Wisuda</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Katalog font bordir resmi, pilihan bahan kain bludru/satin, dan bank logo universitas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selempangAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {asset.type.toUpperCase()}
                  </span>
                  {asset.color && (
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: asset.color }}
                      title={asset.color}
                    />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[var(--foreground)]">{asset.name}</h4>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    Standar pengerjaan workshop Kinau
                  </p>
                </div>

                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Siap Digunakan
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Template Cards Grid for ID Card & Lanyard
        <div className="space-y-6">
          {filteredTemplates.length === 0 ? (
            <div
              onClick={handleOpenCreate}
              className="bg-[var(--surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--border)] p-12 text-center group hover:border-indigo-400 transition cursor-pointer shadow-sm"
            >
              <div className="w-16 h-16 bg-[var(--surface-subtle)] group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 transition text-[var(--muted-foreground)] group-hover:text-indigo-600">
                <Plus size={32} />
              </div>
              <h4 className="text-base font-bold text-[var(--foreground)]">Tambah Template {activeCategory.toUpperCase()} Baru</h4>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Klik untuk mengunggah frame dan mengatur tata letak area cetak.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col justify-between group hover:border-indigo-400 transition"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          t.style_mode === 'dynamic'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {t.style_mode}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)] font-semibold">
                        {t.rules?.length || 0} Aturan Field
                      </span>
                    </div>

                    <div className="relative h-44 rounded-xl bg-gray-900 border border-[var(--border)] flex items-center justify-center overflow-hidden p-4">
                      <div className="text-center space-y-2">
                        <Sparkles className="mx-auto text-indigo-400 animate-pulse" size={28} />
                        <div className="text-xs font-bold text-white uppercase tracking-wider">{t.name}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[var(--foreground)] truncate">{t.name}</h4>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Kategori: {t.category.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewTemplate(t)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface)] border border-[var(--border)] transition flex items-center gap-1"
                    >
                      <Eye size={13} /> Preview
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                        title="Edit Template"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: 'Hapus Template?',
                            text: `Template "${t.name}" akan dinonaktifkan.`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Ya, Hapus',
                            cancelButtonText: 'Batal',
                            confirmButtonColor: '#ef4444',
                          }).then((result) => {
                            if (result.isConfirmed) onDeleteTemplate(t.id);
                          });
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Hapus Template"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Editor Template Desain */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-subtle)] sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Palette className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  {editingId ? 'Edit Template Desain' : 'Buat Template Desain Baru'}
                </h3>
              </div>
              <button onClick={() => setIsEditorOpen(false)} className="p-1 text-[var(--muted-foreground)] hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--foreground)]">Nama Template</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Style Mode</label>
                  <select
                    value={styleMode}
                    onChange={(e) => setStyleMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  >
                    <option value="dynamic">Dynamic (Editable Text/Photo)</option>
                    <option value="static">Static (Fix Frame)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Kategori</label>
                  <input
                    type="text"
                    value={activeCategory.toUpperCase()}
                    disabled
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-gray-100 dark:bg-gray-800 text-[var(--muted-foreground)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--foreground)]">URL Base Frame Image</label>
                <input
                  type="text"
                  value={baseImage}
                  onChange={(e) => setBaseImage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  required
                />
              </div>

              {/* Bounding Box Field Rules */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--foreground)]">Aturan Field & Bounding Box</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddRule('photo')}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    >
                      + Box Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRule('text')}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    >
                      + Box Teks
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {rules.map((r, idx) => (
                    <div key={r.id} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                          {r.type}
                        </span>
                        <input
                          type="text"
                          value={r.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRules((prev) => prev.map((item, i) => (i === idx ? { ...item, label: val } : item)));
                          }}
                          className="px-2 py-1 text-xs rounded border border-[var(--border)] bg-[var(--surface)] outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(r.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <CheckCircle2 size={14} /> Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Desain */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-subtle)]">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-1 text-[var(--muted-foreground)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-full h-64 rounded-2xl bg-gray-900 border border-[var(--border)] flex items-center justify-center text-white">
                <Sparkles size={36} className="text-indigo-400" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Template ini memuat {previewTemplate.rules?.length || 0} konfigurasi field bounding box aktif.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
