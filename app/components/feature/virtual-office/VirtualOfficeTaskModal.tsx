import React from 'react';
import type { Agent } from '~/schemas/office.schema';
import { Icon } from '~/builder';

export interface VirtualOfficeTaskModalProps {
  isOpen: boolean;
  activeAgent: Agent | null;
  taskInput: string;
  projectInput: string;
  onClose: () => void;
  onTaskInputChange: (val: string) => void;
  onProjectInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function VirtualOfficeTaskModal({
  isOpen,
  activeAgent,
  taskInput,
  projectInput,
  onClose,
  onTaskInputChange,
  onProjectInputChange,
  onSubmit,
}: VirtualOfficeTaskModalProps): React.ReactElement | null {
  if (!isOpen || !activeAgent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Tugaskan Tugas ke {activeAgent.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {Icon('X', { className: 'w-5 h-5' })}
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Tugas
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Audit laporan neraca keuangan Q4..."
              value={taskInput}
              onChange={(e) => onTaskInputChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Proyek (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Corporate Audit 2026"
              value={projectInput}
              onChange={(e) => onProjectInputChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md cursor-pointer"
            >
              Simpan & Tugaskan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
