import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Building2,
  Info,
  X,
  FileCheck,
  Send,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { type PublicDesignData } from '~/schemas/public-design.schema';

export interface PublicDesignWidgetProps {
  data: PublicDesignData;
  onApprove: (orderNumber: string, notes?: string) => void;
  onRevision: (orderNumber: string, notes: string) => void;
  isSubmitting?: boolean;
}

export function PublicDesignWidget({
  data,
  onApprove,
  onRevision,
  isSubmitting = false,
}: PublicDesignWidgetProps): React.ReactElement {
  const { domain, orderData, templates = [], activeTemplate } = data || {};

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(activeTemplate || templates[0]);

  const isApproved = orderData?.design_status === 'approved';
  const isRevision = orderData?.design_status === 'revision_requested';

  const handleApproveClick = () => {
    if (!orderData) return;
    Swal.fire({
      title: 'Setujui Desain untuk Dicetak?',
      text: 'Dengan menyetujui, file desain akan segera diteruskan ke operator mesin cetak workshop.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Desain Sudah Sesuai (ACC)',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
    }).then((result) => {
      if (result.isConfirmed) {
        onApprove(orderData.order_number, 'Disetujui oleh Klien via Portal');
      }
    });
  };

  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData || !revisionNotes.trim()) return;
    onRevision(orderData.order_number, revisionNotes);
    setIsRevisionModalOpen(false);
    setRevisionNotes('');
  };

  if (!orderData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Pesanan Desain Tidak Ditemukan</h2>
        <p className="text-xs text-[var(--muted-foreground)] max-w-sm">
          Tautan persetujuan desain untuk &quot;{domain}&quot; tidak valid atau telah kedaluwarsa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[var(--radius-card)] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md">
                Official Design Portal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10">
                {orderData.order_number}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{orderData.institution_name}</h1>
            <p className="text-xs text-blue-100 max-w-xl">
              Periksa mockup dan tata letak desain merchandise Anda. Silakan setujui untuk proses cetak atau ajukan catatan revisi.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Status Approval</div>
              <div className="text-sm font-black mt-0.5">
                {isApproved ? '✓ Desain Disetujui' : isRevision ? 'Revisi Diajukan' : 'Menunggu Review Anda'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Preview & Approval Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Mockup Canvas Preview (8 Cols) */}
        <div className="lg:col-span-8 bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2">
              <FileCheck className="text-blue-600" size={18} />
              <h3 className="text-sm font-bold text-[var(--foreground)]">Preview Mockup Desain</h3>
            </div>

            {/* Template category selector */}
            <div className="flex gap-1 bg-[var(--surface-subtle)] p-1 rounded-xl">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition uppercase ${
                    selectedTemplate?.id === tpl.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tpl.category}
                </button>
              ))}
            </div>
          </div>

          {/* Image Canvas Container */}
          <div className="relative min-h-[420px] rounded-2xl bg-gray-900 border border-[var(--border)] flex items-center justify-center p-6 overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            
            <div className="relative z-10 max-w-md w-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                <Sparkles size={48} className="text-indigo-400 mx-auto animate-pulse" />
                <h4 className="text-sm font-black text-white mt-3 uppercase tracking-wide">
                  {selectedTemplate?.name || 'Mockup Desain Official'}
                </h4>
                <p className="text-[11px] text-gray-300 mt-1">
                  Format cetak resolusi tinggi 300 DPI siap produksi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-2">
            <span className="flex items-center gap-1.5"><Info size={13} /> Desain telah disesuaikan dengan standar cetak Kinau.</span>
            <span>Ketajaman: 300 DPI (CMYK)</span>
          </div>
        </div>

        {/* Right Column: Approval & Feedback Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm p-6 space-y-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                Konfirmasi Klien
              </span>
              <h3 className="text-base font-bold text-[var(--foreground)] mt-2">Keputusan Desain</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Pastikan seluruh ejaan nama, logo instansi, dan penempatan warna sudah sesuai.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleApproveClick}
                disabled={isSubmitting || isApproved}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 active:scale-[0.98]'
                }`}
              >
                <CheckCircle2 size={16} /> {isApproved ? 'Desain Telah Di-ACC' : 'Setujui Desain (ACC Cetak)'}
              </button>

              <button
                onClick={() => setIsRevisionModalOpen(true)}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-[var(--foreground)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] border border-[var(--border)] transition flex items-center justify-center gap-2"
              >
                <Edit3 size={15} /> Ajukan Revisi Desain
              </button>
            </div>

            <div className="pt-4 border-t border-[var(--border)] space-y-3">
              <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                <MessageCircle size={15} className="text-emerald-500" /> Butuh Diskusi Desainer?
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Hubungi Customer Support kami via WhatsApp untuk konsultasi warna khusus atau revisi mendesak.
              </p>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Kinau%20saya%20ingin%20konsultasi%20desain"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                Chat WhatsApp Admin <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form Revisi */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-subtle)]">
              <div className="flex items-center gap-2">
                <Edit3 className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-[var(--foreground)]">Ajukan Revisi Desain</h3>
              </div>
              <button onClick={() => setIsRevisionModalOpen(false)} className="p-1 text-[var(--muted-foreground)] hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRevisionSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--foreground)]">Rincian Bagian yang Perlu Direvisi</label>
                <textarea
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Contoh: Tolong ubah logo di dada sebelah kiri menjadi logo resmi kampus, dan warna dasar agak digelapkan..."
                  className="w-full p-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Send size={13} /> Kirim Catatan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
