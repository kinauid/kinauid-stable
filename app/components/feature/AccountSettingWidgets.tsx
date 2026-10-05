import React, { useState } from 'react';
import {
  Building2,
  CreditCard,
  MessageSquare,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { WorkspaceSettingData, BankAccountItem } from '~/schemas/account-setting.schema';

interface AccountSettingWidgetProps {
  data: WorkspaceSettingData;
  onSaveGeneral: (payload: any) => void;
  onSaveBank: (payload: any) => void;
  onSaveWhatsApp: (payload: any) => void;
  isSubmitting?: boolean;
}

export const AccountSettingWidget: React.FC<AccountSettingWidgetProps> = ({
  data,
  onSaveGeneral,
  onSaveBank,
  onSaveWhatsApp,
  isSubmitting,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'banking' | 'whatsapp'>('general');

  // General Form
  const [companyName, setCompanyName] = useState(data?.company_name || '');
  const [tagline, setTagline] = useState(data?.tagline || '');
  const [address, setAddress] = useState(data?.address || '');
  const [phone, setPhone] = useState(data?.phone || '');
  const [email, setEmail] = useState(data?.email || '');
  const [website, setWebsite] = useState(data?.website || '');

  // Banking
  const [banks, setBanks] = useState<BankAccountItem[]>(data?.bank_accounts || []);
  const [newBankName, setNewBankName] = useState('BCA');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccHolder, setNewAccHolder] = useState('');

  // WhatsApp
  const [waKey, setWaKey] = useState(data?.wa_gateway_key || '');
  const [waSender, setWaSender] = useState(data?.wa_sender_number || '');
  const [notifyDp, setNotifyDp] = useState(data?.auto_notify_dp ?? true);
  const [notifyDelivery, setNotifyDelivery] = useState(data?.auto_notify_delivery ?? true);

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGeneral({
      intent: 'update-general',
      company_name: companyName,
      tagline,
      address,
      phone,
      email,
      website,
    });
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccNumber || !newAccHolder) return;
    const newBank: BankAccountItem = {
      id: Date.now().toString(),
      bank_name: newBankName,
      account_number: newAccNumber,
      account_holder: newAccHolder,
      is_active: true,
    };
    setBanks([...banks, newBank]);
    onSaveBank({
      intent: 'save-bank',
      ...newBank,
    });
    setNewAccNumber('');
    setNewAccHolder('');
  };

  const handleRemoveBank = (id: string) => {
    setBanks(banks.filter((b) => b.id !== id));
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWhatsApp({
      intent: 'update-wa-gateway',
      wa_gateway_key: waKey,
      wa_sender_number: waSender,
      auto_notify_dp: notifyDp,
      auto_notify_delivery: notifyDelivery,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Identitas & Kop Surat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('banking')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'banking'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Rekening Pembayaran ({banks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'whatsapp'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp Gateway & Bot
        </button>
      </div>

      {/* Tab 1: General Workspace Profile */}
      {activeTab === 'general' && (
        <form onSubmit={handleGeneralSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--primary)]" />
              Identitas Workshop & Informasi Nota
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Data ini otomatis dicantumkan pada seluruh kop surat, nota kwitansi, SPK produksi, dan surat jalan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nama Perusahaan / Workshop</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nomor WhatsApp Resmi</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Email Resmi</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Alamat Lengkap Workshop</label>
              <textarea
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Simpan Identitas
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Bank Accounts */}
      {activeTab === 'banking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                Daftar Rekening Bank Resmi
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Rekening ini akan ditampilkan pada form pembayaran pelanggan dan nota kwitansi otomatis.
              </p>

              <div className="space-y-3">
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {bank.bank_name}
                      </div>
                      <div>
                        <p className="font-mono font-bold text-sm text-[var(--text)]">{bank.account_number}</p>
                        <p className="text-xs text-[var(--text-muted)]">a.n. {bank.account_holder}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBank(bank.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={handleAddBank} className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--primary)]" />
                Tambah Rekening Baru
              </h4>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nama Bank</label>
                <select
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] font-semibold focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                >
                  <option value="BCA">Bank BCA</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank BRI</option>
                  <option value="BNI">Bank BNI</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                  <option value="Jago">Bank Jago</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  required
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  placeholder="Contoh: 8161234567"
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] font-mono focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  required
                  value={newAccHolder}
                  onChange={(e) => setNewAccHolder(e.target.value)}
                  placeholder="Contoh: KINAU STUDIO NUSANTARA"
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Simpan Rekening
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: WhatsApp Gateway */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleWhatsAppSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Integrasi WhatsApp Gateway & Bot Notifikasi
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Kirim notifikasi otomatis saat DP diterima, mockup di-ACC, atau paket pesanan diserahkan ke ekspedisi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">API Secret Key WhatsApp</label>
              <input
                type="password"
                value={waKey}
                onChange={(e) => setWaKey(e.target.value)}
                placeholder="kinau_wa_key_..."
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] font-mono focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nomor Pengirim (Sender Number)</label>
              <input
                type="text"
                value={waSender}
                onChange={(e) => setWaSender(e.target.value)}
                placeholder="6281234567890"
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] font-mono focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyDp}
                onChange={(e) => setNotifyDp(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-[var(--text)] font-medium">
                Kirim pesan WhatsApp otomatis ketika status pembayaran berubah ke <strong className="text-emerald-600">DP 50%</strong> atau <strong className="text-emerald-600">Lunas</strong>.
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyDelivery}
                onChange={(e) => setNotifyDelivery(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-[var(--text)] font-medium">
                Kirim nomor resi ekspedisi dan foto paket ke nomor PIC saat status order menjadi <strong className="text-blue-600">Terkirim</strong>.
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Simpan Konfigurasi WhatsApp
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
