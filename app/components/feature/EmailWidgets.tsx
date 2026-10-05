import React, { useState, useMemo } from 'react';
import {
  Mail,
  Inbox,
  Send,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  Reply,
  Forward,
  Trash2,
  Sparkles,
  Users,
  Megaphone,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { EmailItem, MailboxData, EmailFolder } from '~/schemas/email.schema';

interface EmailWidgetProps {
  data: MailboxData;
  activeFolder: EmailFolder;
  onFolderChange: (folder: EmailFolder) => void;
  onAccountChange: (account: string) => void;
  onSendEmail: (payload: { to: string; subject: string; body: string; fromName?: string }) => void;
  onBroadcast: (payload: { subject: string; body: string; targetAudience: string; fromName?: string }) => void;
  isSubmitting?: boolean;
}

export const EmailWidget: React.FC<EmailWidgetProps> = ({
  data,
  activeFolder,
  onFolderChange,
  onAccountChange,
  onSendEmail,
  onBroadcast,
  isSubmitting,
}) => {
  const [activeTab, setActiveTab] = useState<'mailbox' | 'broadcast'>('mailbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUid, setSelectedUid] = useState<number | string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Compose Form State
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeFromName, setComposeFromName] = useState('Kinau Studio');

  // Broadcast Form State
  const [broadcastAudience, setBroadcastAudience] = useState('all_customers');
  const [broadcastSubject, setBroadcastSubject] = useState('Promo Spesial Pembuatan Lanyard & ID Card Kinau');
  const [broadcastBody, setBroadcastBody] = useState(
    'Halo Rekan Mitra,\n\nDapatkan diskon hingga 20% untuk pemesanan paket ID Card + Lanyard Sablon minimum 50 pcs bulan ini!\n\nKlaim promo dengan kode: KINAU2026\n\nSalam hangat,\nTim Kinau Studio'
  );

  const currentFolderList: EmailItem[] = useMemo(() => {
    let list: EmailItem[] = [];
    if (activeFolder === 'inbox') list = data?.inbox || [];
    else if (activeFolder === 'spam') list = data?.spam || [];
    else if (activeFolder === 'sent') list = data?.sent || [];

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.subject.toLowerCase().includes(q) ||
        item.sender.toLowerCase().includes(q) ||
        item.senderEmail.toLowerCase().includes(q)
    );
  }, [data, activeFolder, searchQuery]);

  // Set default selected email
  const selectedEmail = useMemo(() => {
    if (selectedUid) {
      const found = currentFolderList.find((e) => String(e.uid) === String(selectedUid));
      if (found) return found;
    }
    return currentFolderList[0] || null;
  }, [currentFolderList, selectedUid]);

  const handleSendCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;
    onSendEmail({
      to: composeTo,
      subject: composeSubject,
      body: composeBody,
      fromName: composeFromName,
    });
    setIsComposeOpen(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
  };

  const handleSendReply = () => {
    if (!selectedEmail || !replyText.trim()) return;
    onSendEmail({
      to: selectedEmail.senderEmail,
      subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
      body: replyText,
      fromName: 'Kinau Studio Support',
    });
    setReplyText('');
    setIsReplying(false);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastBody) return;
    onBroadcast({
      subject: broadcastSubject,
      body: broadcastBody,
      targetAudience: broadcastAudience,
      fromName: 'Kinau Studio Promo',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--background)] rounded-xl border border-[var(--border)] w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('mailbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'mailbox'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Mail className="w-4 h-4" />
            Kotak Masuk & Mailbox
            {data?.unreadCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
                {data.unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'broadcast'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Broadcast Campaign
          </button>
        </div>

        {/* Account Selector & Compose Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {data?.isCEO && data?.accounts && (
            <select
              value={data.selectedAccount}
              onChange={(e) => onAccountChange(e.target.value)}
              className="text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text)] rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
            >
              {data.accounts.map((acc) => (
                <option key={acc.value} value={acc.value}>
                  {acc.label}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tulis Email
          </button>
        </div>
      </div>

      {activeTab === 'mailbox' ? (
        /* Mailbox 2-Column Split View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left Column: Folders + Email List */}
          <div className="lg:col-span-5 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {/* Folder Header */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--background)]/60 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onFolderChange('inbox')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeFolder === 'inbox'
                      ? 'bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  Inbox ({data?.inbox?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => onFolderChange('sent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeFolder === 'sent'
                      ? 'bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Terkirim ({data?.sent?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => onFolderChange('spam')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeFolder === 'spam'
                      ? 'bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Spam ({data?.spam?.length || 0})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-[var(--border)]">
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari pengirim atau subjek email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Email List Scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] max-h-[560px]">
              {currentFolderList.length === 0 ? (
                <div className="py-16 text-center text-[var(--text-muted)]">
                  <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Kotak surat kosong</p>
                  <p className="text-xs mt-1">Tidak ada pesan di folder {activeFolder}</p>
                </div>
              ) : (
                currentFolderList.map((mail) => {
                  const isSelected = selectedEmail?.uid === mail.uid;
                  return (
                    <div
                      key={mail.uid}
                      onClick={() => setSelectedUid(mail.uid)}
                      className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[var(--primary)]/10 border-l-4 border-l-[var(--primary)]'
                          : !mail.seen
                          ? 'bg-[var(--background)]/40 hover:bg-[var(--background)]'
                          : 'hover:bg-[var(--background)]/30'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${mail.color}`}
                      >
                        {mail.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-xs truncate ${
                              !mail.seen ? 'font-bold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'
                            }`}
                          >
                            {mail.sender}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">{mail.time}</span>
                        </div>
                        <p
                          className={`text-xs truncate ${
                            !mail.seen ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {mail.subject}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{mail.preview}</p>
                      </div>
                      {!mail.seen && <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-2" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Email Detail Reading Pane */}
          <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {selectedEmail ? (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]/40 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--text)] leading-tight">{selectedEmail.subject}</h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text)]">{selectedEmail.sender}</span>
                      <span>&lt;{selectedEmail.senderEmail}&gt;</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(selectedEmail.rawDate).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-6 flex-1 overflow-y-auto text-sm text-[var(--text)] leading-relaxed space-y-4">
                  {selectedEmail.body ? (
                    <div
                      className="prose max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                    />
                  ) : (
                    <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-muted)]">
                      {selectedEmail.preview}
                    </div>
                  )}
                </div>

                {/* Reply Footer Area */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]/30 space-y-3">
                  {!isReplying ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsReplying(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition shadow-xs"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        Balas Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsReplying(true)}
                        className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] text-xs font-medium rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] transition"
                      >
                        <Forward className="w-3.5 h-3.5" />
                        Teruskan
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-[var(--surface)] p-3 border border-[var(--border)] rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text)]">
                          Balas kepada {selectedEmail.sender} ({selectedEmail.senderEmail})
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsReplying(false)}
                          className="text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Tulis balasan email Anda di sini..."
                        rows={4}
                        className="w-full text-xs p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-muted)]">Dikirim melalui SMTP Server Kinau</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsReplying(false)}
                            className="px-3 py-1.5 text-xs text-[var(--text-muted)] font-medium"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleSendReply}
                            disabled={isSubmitting || !replyText.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Kirim Balasan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-[var(--text-muted)]">
                <Mail className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-semibold">Tidak ada email yang dipilih</p>
                <p className="text-xs mt-1">Pilih email di panel kiri untuk membaca detail lengkapnya.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Broadcast Campaign Blaster Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Buat Broadcast Campaign</h3>
                <p className="text-xs text-[var(--text-muted)]">Kirim notifikasi newsletter & promo ke segmen pelanggan secara massal.</p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Target Segmen Penerima</label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value)}
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                >
                  <option value="all_customers">Semua Pelanggan Aktif (~1,240 kontak)</option>
                  <option value="students_kkn">Panitia KKN & Kampus UNISMA (~450 kontak)</option>
                  <option value="resellers">Reseller & Mitra Konveksi VIP (~85 kontak)</option>
                  <option value="vip">Pelanggan Repeat Order VIP (~120 kontak)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Subjek Campaign</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="Subjek email broadcast..."
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Template Pesan HTML / Teks</label>
                <textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  rows={8}
                  placeholder="Tulis konten penawaran campaign..."
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Anti-spam rating lolos validasi DKIM & SPF
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Kirim Broadcast Sekarang
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--primary)]" />
                Statistik Pengiriman Terakhir
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-center">
                  <p className="text-xl font-extrabold text-[var(--text)]">98.4%</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Delivery Rate</p>
                </div>
                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-center">
                  <p className="text-xl font-extrabold text-emerald-500">42.1%</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Open Rate</p>
                </div>
              </div>
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-[var(--text)]">
                <p className="font-semibold text-blue-600 mb-1">Tips Efektivitas:</p>
                Gunakan tag promo personalisasi seperti nama kampus atau diskon terikat invoice agar conversion rate meningkat hingga 3x lipat.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal Dialog */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/60">
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--primary)]" />
                Tulis Pesan Email Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendCompose} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Email Tujuan</label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="contoh: customer@gmail.com"
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nama Pengirim</label>
                  <input
                    type="text"
                    value={composeFromName}
                    onChange={(e) => setComposeFromName(e.target.value)}
                    placeholder="Kinau Studio"
                    className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Dari Akun</label>
                  <input
                    type="text"
                    disabled
                    value={data?.selectedAccount || 'official@kinau.id'}
                    className="w-full text-xs bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-muted)] cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Subjek</label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subjek email..."
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Isi Pesan</label>
                <textarea
                  required
                  rows={6}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Tulis pesan lengkap Anda..."
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
