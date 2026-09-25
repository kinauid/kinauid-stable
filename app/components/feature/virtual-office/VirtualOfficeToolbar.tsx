import React from 'react';
import type { Agent, Division } from '~/schemas/office.schema';
import { Icon } from '~/builder';
import { DIVISION_CONFIG } from './types';

export interface VirtualOfficeToolbarProps {
  agents: Agent[];
  selectedDivision: Division | 'all';
  activeAgent: Agent | null;
  zoomLevel: number;
  isAutoRotate: boolean;
  isFullscreen: boolean;
  onSelectDivision: (div: Division | 'all') => void;
  onToggleAutoRotate: () => void;
  onToggleFullscreen: () => void;
  onAdjustZoom: (delta: number) => void;
  onOpenTeamChat: () => void;
  onFocusAgent: (agent: Agent) => void;
}

export function VirtualOfficeToolbar({
  agents,
  selectedDivision,
  activeAgent,
  zoomLevel,
  isAutoRotate,
  isFullscreen,
  onSelectDivision,
  onToggleAutoRotate,
  onToggleFullscreen,
  onAdjustZoom,
  onOpenTeamChat,
  onFocusAgent,
}: VirtualOfficeToolbarProps): React.ReactElement {
  const divisionCardList: { key: Division; label: string; icon: string }[] = [
    { key: 'operations', label: 'Operations', icon: 'Building' },
    { key: 'marketing', label: 'Marketing', icon: 'BarChart2' },
    { key: 'finance', label: 'Finance', icon: 'Database' },
    { key: 'sales', label: 'Sales', icon: 'Users' },
    { key: 'development', label: 'Delivery', icon: 'ListTodo' },
    { key: 'communication', label: 'Communication', icon: 'MessageSquare' },
  ];

  const getDivisionAgentCount = (div: Division) => agents.filter((a) => a.division === div).length;
  const getDivisionWorkingCount = (div: Division) =>
    agents.filter((a) => a.division === div && a.status === 'working').length;

  const getDivisionTitle = (div: Division | 'all') => {
    switch (div) {
      case 'development':
        return { title: 'Delivery studio', subtitle: 'Perencanaan proyek, QA, dan laporan.' };
      case 'sales':
        return { title: 'Sales studio', subtitle: 'Penjualan B2B, closing kemitraan, dan proposal klien.' };
      case 'marketing':
        return { title: 'Marketing studio', subtitle: 'Brand campaign, aset kreatif 3D, dan analitik pertumbuhan.' };
      case 'operations':
        return { title: 'Operations center', subtitle: 'Logistik gudang, lini produksi, dan quality assurance.' };
      case 'finance':
        return { title: 'Finance hub', subtitle: 'Manajemen cashflow, perpajakan, dan rekonsiliasi kasir.' };
      case 'communication':
        return { title: 'Communication hub', subtitle: 'Customer support, humas korporat, dan media partner.' };
      case 'general_hr':
        return { title: 'People & HR floor', subtitle: 'Fasilitas kantor, rekrutmen talenta, dan manajemen SDM.' };
      case 'all':
      default:
        return {
          title: 'Explore your office',
          subtitle: 'Mulai dari departemen, lalu temui agent yang kamu butuhkan.',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Meet your team</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100/70 text-blue-700 border border-blue-200">
              Interactive 3D Office
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Jelajahi studio kerja, komunikasi langsung dengan agent, dan atur strategi bisnis Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenTeamChat}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          {Icon('MessageSquare', { className: 'w-4 h-4 text-sky-400' })}
          <span>Chat dengan tim</span>
        </button>
      </div>

      {/* 6 Division Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {divisionCardList.map((card) => {
          const isSelected = selectedDivision === card.key;
          const count = getDivisionAgentCount(card.key);
          const workingCount = getDivisionWorkingCount(card.key);

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onSelectDivision(card.key)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {Icon(card.icon, { className: 'w-4 h-4' })}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{card.label}</h4>
                <p className="text-[10px] text-slate-500 truncate font-medium">
                  {count || 6} agent · {workingCount} bekerja
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Header controls above 3D viewport */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-base font-bold text-slate-900">{getDivisionTitle(selectedDivision).title}</h2>
          <p className="text-xs text-slate-500">{getDivisionTitle(selectedDivision).subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectDivision('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              selectedDivision === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua divisi
          </button>

          {/* Zoom Percentage Controls (- 100% +) */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-2 py-1 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => onAdjustZoom(-0.15)}
              className="w-5 h-5 flex items-center justify-center hover:bg-slate-200 rounded-full text-slate-600 cursor-pointer"
              title="Zoom out"
            >
              -
            </button>
            <span className="w-12 text-center text-[11px] font-bold select-none">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => onAdjustZoom(0.15)}
              className="w-5 h-5 flex items-center justify-center hover:bg-slate-200 rounded-full text-slate-600 cursor-pointer"
              title="Zoom in"
            >
              +
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            type="button"
            onClick={onToggleAutoRotate}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isAutoRotate
                ? 'bg-blue-50 text-blue-600 border-blue-200 ring-2 ring-blue-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Auto Rotate Island"
          >
            {Icon('RotateCw', { className: 'w-4 h-4' })}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-full bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {Icon(isFullscreen ? 'Minimize' : 'Maximize', { className: 'w-4 h-4' })}
          </button>

          {/* Agent Jump-To Selector */}
          <select
            value={activeAgent?.id || ''}
            onChange={(e) => {
              const target = agents.find((a) => a.id === e.target.value);
              if (target) onFocusAgent(target);
            }}
            aria-label="Pilih Agent"
            className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="" disabled>
              Pilih Agent...
            </option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name} ({DIVISION_CONFIG[ag.division]?.shortName || ag.division})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
