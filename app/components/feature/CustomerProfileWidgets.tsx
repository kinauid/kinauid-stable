import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Save,
  LogOut,
  Package,
  Calendar,
} from 'lucide-react';
import type { CustomerProfileData } from '~/schemas/customer-profile.schema';

interface CustomerProfileWidgetProps {
  data: CustomerProfileData;
  onSaveProfile: (payload: any) => void;
  onLogout: () => void;
  isSubmitting?: boolean;
}

export const CustomerProfileWidget: React.FC<CustomerProfileWidgetProps> = ({
  data,
  onSaveProfile,
  onLogout,
  isSubmitting,
}) => {
  const [fullname, setFullname] = useState(data?.fullname || '');
  const [phone, setPhone] = useState(data?.phone || '');
  const [institution, setInstitution] = useState(data?.institution || '');
  const [address, setAddress] = useState(data?.address || '');
  const [city, setCity] = useState(data?.city || '');
  const [postalCode, setPostalCode] = useState(data?.postal_code || '');

  const [notifyEmail, setNotifyEmail] = useState(data?.notify_email ?? true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(data?.notify_whatsapp ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      intent: 'update-profile',
      fullname,
      phone,
      institution,
      address,
      city,
      postal_code: postalCode,
    });
  };

  const initials = (fullname || 'Kinau')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Sidebar: Profile Summary Card */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
            {initials}
          </div>

          <div>
            <h3 className="text-base font-bold text-[var(--text)]">{fullname || 'Pelanggan'}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{data?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[11px] font-bold rounded-full">
              Akun Terverifikasi
            </span>
          </div>

          <div className="pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-left">
            <div className="p-3 bg-[var(--background)] rounded-xl">
              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <Package className="w-3 h-3" /> Total Pesanan
              </p>
              <p className="text-sm font-bold text-[var(--text)] mt-0.5">{data?.total_orders || 0} Order</p>
            </div>
            <div className="p-3 bg-[var(--background)] rounded-xl">
              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Bergabung Sejak
              </p>
              <p className="text-sm font-bold text-[var(--text)] mt-0.5">{data?.joined_date || '2026'}</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
            >
              <LogOut className="w-4 h-4" />
              Keluar Akun
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Edit Profile & Address Form */}
      <div className="lg:col-span-8 space-y-6">
        <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--primary)]" />
              Informasi Pribadi & Kontak
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Data ini digunakan untuk pencetakan nota, sertifikat mockup, dan kontak kurir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                required
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Nomor WhatsApp Aktif</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Email (Akun Login)</label>
              <input
                type="email"
                disabled
                value={data?.email || ''}
                className="w-full text-xs bg-[var(--background)]/60 border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Institusi / Organisasi</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Contoh: UNISMA / BEM Fakultas"
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-[var(--primary)]" />
              Alamat Pengiriman Utama
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Lokasi tujuan pengiriman pesanan paket ekspedisi (J&T, JNE, Cargo Baraka).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Alamat Lengkap</label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, gedung, patokan..."
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kota Malang"
                    className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Kode Pos</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="65144"
                    className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-[var(--primary)]" />
              Preferensi Notifikasi
            </h3>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-xs text-[var(--text)] font-medium">
                  Terima update status produksi & resi via WhatsApp
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-xs text-[var(--text)] font-medium">
                  Terima nota kwitansi lunas & invoice via Email
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
