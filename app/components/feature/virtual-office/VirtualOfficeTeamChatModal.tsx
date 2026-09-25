import React from 'react';
import type { Agent } from '~/schemas/office.schema';
import { Icon } from '~/builder';
import { DIVISION_CONFIG } from './types';

export interface VirtualOfficeTeamChatModalProps {
  isOpen: boolean;
  agents: Agent[];
  onClose: () => void;
  onSelectAgent: (agent: Agent) => void;
}

export function VirtualOfficeTeamChatModal({
  isOpen,
  agents,
  onClose,
  onSelectAgent,
}: VirtualOfficeTeamChatModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Broadcast Chat Tim</h3>
            <p className="text-xs text-slate-500">Kirim pesan cepat ke seluruh agent virtual.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {Icon('X', { className: 'w-5 h-5' })}
          </button>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto">
          {agents.slice(0, 6).map((ag) => (
            <div
              key={ag.id}
              onClick={() => {
                onSelectAgent(ag);
                onClose();
              }}
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: ag.avatarColor }}
                >
                  {ag.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{ag.name}</h4>
                  <p className="text-[10px] text-slate-500">{ag.role}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {DIVISION_CONFIG[ag.division]?.shortName || ag.division}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
