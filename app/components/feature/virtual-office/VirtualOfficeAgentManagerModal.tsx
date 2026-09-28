import React, { useState } from 'react';
import type { Agent, Division } from '~/schemas/office.schema';
import { DIVISION_CONFIG, AGENT_STATUS_CONFIG } from '~/schemas/office.schema';
import { Icon } from '~/builder';

export interface VirtualOfficeAgentManagerModalProps {
  isOpen?: boolean;
  open?: boolean;
  agents: Agent[];
  onClose: () => void;
  onAddNewAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
  onFocusAgent: (agent: Agent) => void;
  onChatAgent: (agent: Agent) => void;
}

export function VirtualOfficeAgentManagerModal({
  isOpen,
  open,
  agents,
  onClose,
  onAddNewAgent,
  onEditAgent,
  onDeleteAgent,
  onFocusAgent,
  onChatAgent,
}: VirtualOfficeAgentManagerModalProps): React.ReactElement | null {
  const isModalOpen = Boolean(isOpen ?? open);
  if (!isModalOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<Division | 'all'>('all');

  const filteredAgents = agents.filter((agent) => {
    const matchesDiv = selectedDivisionFilter === 'all' || agent.division === selectedDivisionFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      agent.name.toLowerCase().includes(q) ||
      agent.role.toLowerCase().includes(q) ||
      (agent.description && agent.description.toLowerCase().includes(q)) ||
      agent.currentTask.toLowerCase().includes(q);
    return matchesDiv && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              {Icon('Users', { className: 'w-5 h-5 text-sky-400' })}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Manajemen Daftar AI Agents</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {agents.length} Agent Terdaftar
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ubah jumlah agent, atur nama, jabatan, deskripsi, skill, dan context database secara dinamis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewAgent();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {Icon('Plus', { className: 'w-4 h-4' })}
              <span>Tambah Agent Baru</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
            >
              {Icon('X', { className: 'w-5 h-5' })}
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, jabatan, atau deskripsi..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 placeholder:text-slate-400"
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
              {Icon('Search', { className: 'w-3.5 h-3.5' })}
            </div>
          </div>

          {/* Division Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedDivisionFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                selectedDivisionFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua ({agents.length})
            </button>
            {Object.entries(DIVISION_CONFIG).map(([key, conf]) => {
              const count = agents.filter((a) => a.division === key).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDivisionFilter(key as Division)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    selectedDivisionFilter === key
                      ? 'bg-blue-50 text-blue-700 border-blue-400 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {conf.shortName} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Agents Grid List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAgents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                {Icon('Users', { className: 'w-6 h-6' })}
              </div>
              <p className="text-sm font-semibold text-slate-600">Tidak ada agent yang cocok dengan pencarian.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDivisionFilter('all');
                }}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredAgents.map((agent) => {
                const statusConf = AGENT_STATUS_CONFIG[agent.status];
                const divConf = DIVISION_CONFIG[agent.division];
                const tableCount = agent.contextConfig?.selectAll
                  ? 'ALL Tables'
                  : `${agent.contextConfig?.tables?.length || 2} Tables`;

                return (
                  <div
                    key={agent.id}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top bar per card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0"
                            style={{ backgroundColor: agent.shirtColor || agent.avatarColor || '#0284c7' }}
                          >
                            {agent.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{agent.name}</span>
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: statusConf.color }}
                                title={statusConf.label}
                              />
                            </h4>
                            <p className="text-xs font-semibold text-blue-700 truncate">{agent.role}</p>
                          </div>
                        </div>

                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                          {divConf?.shortName || agent.division}
                        </span>
                      </div>

                      {/* Description / Current Task */}
                      <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                        {agent.description || agent.currentTask || 'Menangani tugas operasional divisi.'}
                      </p>

                      {/* Context & LLM Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200/60">
                          🗄️ {tableCount}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md border border-sky-200/60">
                          🧠 {agent.apiConfig?.provider || 'gemini'} ({agent.apiConfig?.model || '2.5-flash'})
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          🎯 {statusConf.label}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onFocusAgent(agent);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Fokuskan Kamera 3D ke Meja Agent"
                        >
                          {Icon('Eye', { className: 'w-3.5 h-3.5' })}
                          <span>Lihat di 3D</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onChatAgent(agent);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {Icon('MessageSquare', { className: 'w-3.5 h-3.5' })}
                          <span>Chat</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditAgent(agent);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {Icon('Settings', { className: 'w-3.5 h-3.5' })}
                          <span>Edit Profil & Skill</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAgent(agent.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Agent"
                        >
                          {Icon('Trash2', { className: 'w-3.5 h-3.5' })}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
