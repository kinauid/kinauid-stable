import React from 'react';
import type { Agent } from '~/schemas/office.schema';
import { Icon } from '~/builder';

export interface VirtualOfficeChatMessage {
  sender: 'user' | 'agent';
  text: string;
  time: string;
  replyType?: 'CONVERSATION' | 'FAST_REPORT' | 'ACTION_DRAFT';
  actionPayload?: any;
}

export interface VirtualOfficeChatModalProps {
  isOpen: boolean;
  activeAgent: Agent | null;
  chatHistories: Record<string, VirtualOfficeChatMessage[]>;
  chatMessage: string;
  callStatusMsg: string | null;
  onClose: () => void;
  onStartCall: () => void;
  onClearCallStatus: () => void;
  onChatMessageChange: (msg: string) => void;
  onSendChat: (e: React.FormEvent) => void;
  onOpenConfig?: () => void;
  onConfirmMutation?: (payload: any) => void;
}

export function VirtualOfficeChatModal({
  isOpen,
  activeAgent,
  chatHistories,
  chatMessage,
  callStatusMsg,
  onClose,
  onStartCall,
  onClearCallStatus,
  onChatMessageChange,
  onSendChat,
  onOpenConfig,
  onConfirmMutation,
}: VirtualOfficeChatModalProps): React.ReactElement | null {
  if (!isOpen || !activeAgent) return null;

  const activeMessages = chatHistories[activeAgent.id] || [
    {
      sender: 'agent',
      text:
        activeAgent.initialMessage ||
        `Halo! Saya ${activeAgent.name} (${activeAgent.role}). Saya siap membantu pencatatan transaksi & analisis keuangan dengan acuan tabel [${(activeAgent.contextConfig?.tables || ['accounting_coa']).join(', ')}].`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  const acquiredTables = activeAgent.contextConfig?.selectAll
    ? ['Semua Tabel (Full DB)']
    : activeAgent.contextConfig?.tables || ['accounting_coa', 'accounting_ledger_mutations'];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 sm:absolute sm:inset-auto sm:bottom-4 sm:right-4 sm:z-30 w-full sm:w-[410px] max-w-full sm:max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md rounded-t-[28px] sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200/90 overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 duration-200 max-h-[85dvh] sm:max-h-[560px]">
        {/* Mobile Drag Handle */}
        <div
          className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 shrink-0 cursor-pointer"
          onClick={onClose}
        />

        {/* Call Toast if in call */}
        {callStatusMsg && (
          <div className="bg-amber-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>{callStatusMsg}</span>
            </div>
            <button
              type="button"
              onClick={onClearCallStatus}
              className="text-white/80 hover:text-white"
            >
              {Icon('X', { className: 'w-3.5 h-3.5' })}
            </button>
          </div>
        )}

        {/* Header: Avatar, Name, Role, Setting, Call, Close */}
        <div className="p-4 pb-2.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black tracking-wider shrink-0 border border-slate-200/80 shadow-xs"
              style={{
                backgroundColor: `${activeAgent.avatarColor}18`,
                color: activeAgent.avatarColor,
              }}
            >
              {activeAgent.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 truncate leading-tight">
                {activeAgent.name}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5">
                {activeAgent.role}
              </p>
            </div>
          </div>

          {/* Actions: Setting, Call, X */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-700 px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Setting SKILL, API & Table Context"
              >
                {Icon('Settings', { className: 'w-3.5 h-3.5 text-slate-600' })}
                <span className="hidden sm:inline text-[10px]">Setting</span>
              </button>
            )}

            <button
              type="button"
              onClick={onStartCall}
              className="bg-amber-50/90 hover:bg-amber-100 border border-amber-200/90 text-amber-900 px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
              title={`Hubungi ${activeAgent.name}`}
            >
              {Icon('Phone', { className: 'w-3.5 h-3.5 text-amber-700' })}
              <span className="text-[10px]">Call</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
              title="Tutup Obrolan"
            >
              {Icon('X', { className: 'w-4 h-4' })}
            </button>
          </div>
        </div>

        {/* Context Bar: Acquired Database Tables */}
        <div className="px-3.5 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px]">
          <span className="font-bold text-slate-500 uppercase shrink-0 text-[9px]">Context:</span>
          {acquiredTables.map((tbl, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 font-mono text-[9px] text-slate-700 shrink-0"
            >
              {tbl}
            </span>
          ))}
        </div>

        {/* Message Body */}
        <div className="p-3.5 space-y-3 max-h-[260px] sm:max-h-[260px] min-h-[140px] overflow-y-auto bg-slate-50/40">
          {activeMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`text-xs leading-relaxed max-w-[94%] p-3.5 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-xs shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-800 rounded-2xl rounded-tl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Interactive Action Draft Card (Double Entry Posting) */}
                {msg.replyType === 'ACTION_DRAFT' && msg.actionPayload && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-extrabold border-b border-slate-200/80 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Draft Transaksi Jurnal
                      </span>
                      <span className="text-emerald-600 font-mono text-[10px]">D/K Balanced ✓</span>
                    </div>

                    <div className="space-y-1 font-mono text-[10px] bg-white p-2 rounded-lg border border-slate-200/80">
                      {msg.actionPayload.entries.map((e: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-0.5">
                          <span>
                            {e.direction === 'DEBIT' ? '[D]' : '    [K]'} {e.accountCode} - {e.accountName}
                          </span>
                          <span className="font-bold">Rp {Number(e.amount).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1.5 flex items-center justify-between border-t border-slate-200/80 text-[10px]">
                      <span className="text-slate-500 font-mono">Tabel: accounting_ledger_mutations</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onConfirmMutation) onConfirmMutation(msg.actionPayload);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        Posting ke Buku Besar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-slate-100 space-y-2">
          <form
            onSubmit={onSendChat}
            className="bg-white border border-slate-200/90 rounded-2xl p-2.5 space-y-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => onChatMessageChange(e.target.value)}
              placeholder={`Beri instruksi pencatatan atau minta laporan ke ${activeAgent.name}...`}
              className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none px-1"
            />

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Ubah SKILL & Context"
                >
                  {Icon('Sliders', { className: 'w-3 h-3 text-slate-500' })}
                  <span>Skill & Context</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="w-7 h-7 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Kirim instruksi ke AI"
              >
                {Icon('Send', { className: 'w-3.5 h-3.5' })}
              </button>
            </div>
          </form>

          <p className="text-[10px] text-slate-400 text-center font-medium pt-0.5">
            Terhubung ke <span className="font-mono">{activeAgent.apiConfig?.baseUrl || 'kinauid-backend.vercel.app'}</span>
          </p>
        </div>
      </div>
    </>
  );
}
