import React from 'react';
import type { Agent, Division } from '~/schemas/office.schema';
import { Icon } from '~/builder';
import { AGENT_STATUS_CONFIG } from './types';

export interface VirtualOfficeTeamGridProps {
  currentDivisionAgents: Agent[];
  selectedDivision: Division | 'all';
  activeAgent: Agent | null;
  onFocusAgent: (agent: Agent) => void;
}

export function VirtualOfficeTeamGrid({
  currentDivisionAgents,
  selectedDivision,
  activeAgent,
  onFocusAgent,
}: VirtualOfficeTeamGridProps): React.ReactElement {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight capitalize">
          {selectedDivision === 'all'
            ? 'All Office Teams'
            : `Your ${selectedDivision === 'development' ? 'delivery' : selectedDivision} team`}
        </h2>
        <span className="text-xs text-slate-500 font-semibold">
          {currentDivisionAgents.length} specialized agents
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {currentDivisionAgents.map((ag) => {
          const isSelected = activeAgent?.id === ag.id;
          return (
            <div
              key={ag.id}
              onClick={() => onFocusAgent(ag)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black tracking-wider shrink-0 border border-slate-200/80 shadow-xs"
                    style={{
                      backgroundColor: `${ag.avatarColor}18`,
                      color: ag.avatarColor,
                    }}
                  >
                    {ag.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{ag.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate font-medium">{ag.role}</p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    AGENT_STATUS_CONFIG[ag.status].bgClass
                  }`}
                >
                  {AGENT_STATUS_CONFIG[ag.status].label}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                <span className="truncate font-medium">Tugas: {ag.currentTask}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusAgent(ag);
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {Icon('MessageSquare', { className: 'w-3 h-3' })}
                  <span>Chat</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
