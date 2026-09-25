import React from 'react';
import type { Agent, Division } from '~/schemas/office.schema';
import { DIVISION_CONFIG } from './types';

export interface VirtualOfficeIdentityBadgesProps {
  currentDivisionAgents: Agent[];
  selectedDivision: Division | 'all';
  activeAgent: Agent | null;
  hoveredAgent: Agent | null;
  isChatModalOpen: boolean;
  agentCardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  divisionWatermarkRef: React.RefObject<HTMLDivElement>;
  hoverPopoverRef: React.RefObject<HTMLDivElement>;
  onFocusAgent: (agent: Agent) => void;
  onHoverAgent: (agent: Agent | null) => void;
}

export function VirtualOfficeIdentityBadges({
  currentDivisionAgents,
  selectedDivision,
  activeAgent,
  hoveredAgent,
  isChatModalOpen,
  agentCardRefs,
  divisionWatermarkRef,
  hoverPopoverRef,
  onFocusAgent,
  onHoverAgent,
}: VirtualOfficeIdentityBadgesProps): React.ReactElement {
  return (
    <>
      {/* 3D Background Division Watermark */}
      {selectedDivision !== 'all' && (
        <div
          ref={divisionWatermarkRef}
          className="absolute pointer-events-none z-0 select-none -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ display: 'none' }}
        >
          <span className="text-3xl sm:text-5xl font-black text-slate-800/80 tracking-widest uppercase drop-shadow-xs">
            {selectedDivision === 'development'
              ? 'DELIVERY'
              : DIVISION_CONFIG[selectedDivision]?.shortName || selectedDivision}
          </span>
        </div>
      )}

      {/* Compact 3D Floating Identity Badges */}
      {currentDivisionAgents.map((ag) => {
        const isHovered = hoveredAgent?.id === ag.id;
        const isChatActive = isChatModalOpen && activeAgent?.id === ag.id;
        return (
          <div
            key={ag.id}
            ref={(el) => {
              agentCardRefs.current[ag.id] = el;
            }}
            onClick={() => onFocusAgent(ag)}
            onMouseEnter={() => onHoverAgent(ag)}
            onMouseLeave={() => onHoverAgent(null)}
            style={{ display: 'none' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none transition-all duration-150 z-10 ${
              isChatActive
                ? 'bg-white/95 opacity-100 scale-105 shadow-md border-blue-500 ring-2 ring-blue-500/40'
                : isHovered
                  ? 'bg-white/95 opacity-100 scale-105 shadow-md border-blue-400 ring-2 ring-blue-400/20'
                  : 'bg-white/70 opacity-70 hover:opacity-100 hover:scale-105 shadow-xs border-slate-200/90 hover:bg-white/95'
            } backdrop-blur-md rounded-xl border px-3 py-1 sm:px-3.5 sm:py-1.5 text-center min-w-[85px] max-w-[130px]`}
          >
            {isChatActive && (
              <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </div>
            )}
            <h4
              className={`text-xs font-bold tracking-tight leading-tight truncate ${
                isChatActive ? 'text-blue-950 font-black' : 'text-slate-800'
              }`}
            >
              {ag.name}
            </h4>
            <p
              className={`text-[9px] font-medium leading-tight mt-0.5 truncate ${
                isChatActive ? 'text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              {ag.role}
            </p>
          </div>
        );
      })}

      {/* Compact Hover Popover Pill attached next to hovered agent */}
      {hoveredAgent && (
        <div
          ref={hoverPopoverRef}
          style={{ display: 'none' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/90 text-slate-700 text-[10px] font-medium shadow-md flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
        >
          <span>
            {hoveredAgent.name} · {hoveredAgent.role} · klik untuk chat
          </span>
        </div>
      )}
    </>
  );
}
