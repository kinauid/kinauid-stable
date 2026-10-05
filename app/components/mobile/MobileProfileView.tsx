import React, { createElement, useState } from 'react';
import { Icon } from '~/builder';
import { type UserProfile } from '~/schemas/profile.schema';
import { ADMIN_WA, getWhatsAppLink, BRAND_NAME } from '~/constants/brand';
import { toast } from 'sonner';

export interface MobileProfileViewProps {
  profile: UserProfile;
  send?: any;
  navigate?: any;
}

export function MobileProfileView({ profile, send, navigate }: MobileProfileViewProps) {
  // Modal states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Form states
  const [name, setName] = useState(profile?.name || 'Admin Kinau');
  const [phone, setPhone] = useState(profile?.phone || '+62 852-1933-7474');
  const [institution, setInstitution] = useState(profile?.institution_name || 'PT Kinau Digital Kreatif');
  const [bio, setBio] = useState(profile?.bio || 'Operasional Percetakan Digital Kinau ID');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [currentLanguage, setCurrentLanguage] = useState<'id' | 'en'>(profile?.language || 'id');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(profile?.theme || 'light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (send?.submit) {
      send.submit(
        {
          intent: 'update-profile',
          name,
          phone,
          institution_name: institution,
          bio,
        },
        { method: 'post' }
      );
    }
    setEditProfileOpen(false);
    toast.success('Profil berhasil diperbarui!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter');
      return;
    }
    if (send?.submit) {
      send.submit(
        {
          intent: 'change-password',
          currentPassword,
          newPassword,
          confirmPassword,
        },
        { method: 'post' }
      );
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordOpen(false);
    toast.success('Kata sandi berhasil diubah!');
  };

  const toggleLanguage = () => {
    const nextLang = currentLanguage === 'id' ? 'en' : 'id';
    setCurrentLanguage(nextLang);
    if (send?.submit) {
      send.submit(
        {
          intent: 'update-preferences',
          language: nextLang,
          theme: currentTheme,
          notifications_enabled: String(notificationsEnabled),
        },
        { method: 'post' }
      );
    }
    toast.info(`Bahasa diubah ke: ${nextLang === 'id' ? 'Bahasa Indonesia' : 'English'}`);
  };

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';
    setCurrentTheme(nextTheme);
    if (send?.submit) {
      send.submit(
        {
          intent: 'update-preferences',
          language: currentLanguage,
          theme: nextTheme,
          notifications_enabled: String(notificationsEnabled),
        },
        { method: 'post' }
      );
    }
    toast.info(`Tema diubah ke: ${nextTheme.toUpperCase()}`);
  };

  const toggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    if (send?.submit) {
      send.submit(
        {
          intent: 'update-preferences',
          language: currentLanguage,
          theme: currentTheme,
          notifications_enabled: String(nextVal),
        },
        { method: 'post' }
      );
    }
    toast.info(`Notifikasi ${nextVal ? 'diaktifkan' : 'dinonaktifkan'}`);
  };

  const handleLogout = () => {
    if (send?.submit) {
      send.submit({ intent: 'logout' }, { method: 'post' });
    } else if (typeof window !== 'undefined') {
      window.location.href = '/_auth/logout';
    }
  };

  const initial = (profile?.name || 'A').charAt(0).toUpperCase();

  return (
    <div className="max-w-md mx-auto space-y-4 text-slate-900 font-sans select-none pb-8">
      {/* ── 1. Profile User Card (Matches Reference Top Card) ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#103557] to-[#1e5a8f] text-white font-black text-xl flex items-center justify-center shadow-xs overflow-hidden border-2 border-white">
            {profile?.avatar && !profile.avatar.includes('default') ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h2 className="text-base font-bold text-slate-900 truncate leading-tight">
              {profile?.name || 'Admin Kinau'}
            </h2>
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="text-[11px] font-bold text-[#103557] hover:text-[#0c2842] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200/70 cursor-pointer"
            >
              {Icon('Edit3', { className: 'w-3 h-3' })}
              <span>Edit</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
            {profile?.email || 'admin@kinau.id'}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#103557] border border-blue-200 uppercase tracking-wider">
              {profile?.role === 'admin' ? 'Administrator' : 'Staff Produksi'}
            </span>
            {profile?.institution_name && (
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                • {profile.institution_name}
              </span>
            )}
          </div>
        </div>
      </div>

        {/* ── 3. Group: Account (Akun) ── */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Account
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
            {/* Manage Profile */}
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {Icon('User', { className: 'w-4 h-4' })}
                </div>
                <span className="text-xs font-semibold text-slate-800">Manage Profile</span>
              </div>
              {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
            </button>

            {/* Password & Security */}
            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {Icon('Lock', { className: 'w-4 h-4' })}
                </div>
                <span className="text-xs font-semibold text-slate-800">Password & Security</span>
              </div>
              {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
            </button>

            {/* Notifications */}
            <div className="p-3.5 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {Icon('Bell', { className: 'w-4 h-4' })}
                </div>
                <span className="text-xs font-semibold text-slate-800">Notifications</span>
              </div>
              <button
                type="button"
                onClick={toggleNotifications}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  notificationsEnabled ? 'bg-[#103557]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Language */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {Icon('Globe', { className: 'w-4 h-4' })}
                </div>
                <span className="text-xs font-semibold text-slate-800">Language</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>{currentLanguage === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
                {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
              </div>
            </button>
          </div>
        </div>

        {/* ── 4. Group: Preferences (Preferensi) ── */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Preferences
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
            {/* About Us */}
            <button
              type="button"
              onClick={() => setAboutModalOpen(true)}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {Icon('BookOpen', { className: 'w-4 h-4' })}
                </div>
                <span className="text-xs font-semibold text-slate-800">About Us</span>
              </div>
              {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
            </button>

            {/* Theme */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {Icon(currentTheme === 'light' ? 'Sun' : currentTheme === 'dark' ? 'Moon' : 'Laptop', {
                    className: 'w-4 h-4',
                  })}
                </div>
                <span className="text-xs font-semibold text-slate-800">Theme</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="capitalize">{currentTheme}</span>
                {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
              </div>
            </button>

            {/* Appointments / Antrean Cetak */}
            <button
              type="button"
              onClick={() => (navigate ? navigate('/app/print-area') : (window.location.href = '/app/print-area'))}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {Icon('Calendar', { className: 'w-4 h-4' })}
                </div>
                <span className="text-xs font-semibold text-slate-800">Appointments / Antrean</span>
              </div>
              {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
            </button>
          </div>
        </div>

        {/* ── 5. Group: Support (Bantuan) ── */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Support
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
            {/* Help Center */}
            <button
              type="button"
              onClick={() => (navigate ? navigate('/terms/glossary') : (window.location.href = '/terms/glossary'))}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {Icon('HelpCircle', { className: 'w-4 h-4' })}
                </div>
                <span className="text-xs font-semibold text-slate-800">Help Center & FAQ</span>
              </div>
              {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
            </button>

            {/* Contact Us */}
            <a
              href={getWhatsAppLink(ADMIN_WA, `Halo CS Kinau ID, saya butuh bantuan perihal akun profil...`)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition no-underline text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  {Icon('Phone', { className: 'w-4 h-4' })}
                </div>
                <span className="text-xs font-semibold text-slate-800">Contact Us (WhatsApp)</span>
              </div>
              {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
            </a>
          </div>
        </div>

        {/* ── 6. Group: Logout (Keluar) ── */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="w-full p-3.5 bg-white hover:bg-rose-50/70 rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-center gap-2 text-rose-600 text-xs font-bold transition cursor-pointer"
          >
            {Icon('LogOut', { className: 'w-4 h-4' })}
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>

        {/* Footer Brand Info */}
        <div className="text-center pt-2 space-y-1 text-slate-400 text-[10px]">
          <p className="font-bold text-slate-500 uppercase tracking-wider">{BRAND_NAME} • v2.0.0</p>
          <p>Sistem Operasional Percetakan & Merchandise Custom</p>
        </div>

      {/* ── Modal: Edit Profile ── */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Kelola Profil</h3>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {Icon('X', { className: 'w-4 h-4' })}
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#103557]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#103557]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Instansi / Unit Kerja</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#103557]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan / Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#103557] resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#103557] hover:bg-[#0c2842] text-white rounded-xl font-bold cursor-pointer"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Change Password ── */}
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Ubah Kata Sandi</h3>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {Icon('X', { className: 'w-4 h-4' })}
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#103557]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#103557]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#103557]"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#103557] hover:bg-[#0c2842] text-white rounded-xl font-bold cursor-pointer"
                >
                  Ubah Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: About Us ── */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Tentang Kinau ID</h3>
              <button
                type="button"
                onClick={() => setAboutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {Icon('X', { className: 'w-4 h-4' })}
              </button>
            </div>
            <div className="text-center py-2">
              <img src="/kinau-logo.png" alt="Kinau ID" className="h-9 w-auto mx-auto object-contain mb-2" />
              <p className="font-bold text-slate-900">PT Kinau Digital Kreatif</p>
              <p className="text-[11px] text-slate-500 font-mono">NIB: 0204260115049</p>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Kinau ID adalah pusat spesialis percetakan digital, lanyard, ID card instansi, jersey sublim, dan konveksi apparel custom berkualitas tinggi di Bandar Lampung.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
              <p>📍 <strong>Workshop:</strong> Jalan Terusan Jl. Murai 1 No.7, Korpri Raya, Sukarame, Bandar Lampung</p>
              <p>📞 <strong>WhatsApp:</strong> +62 852-1933-7474</p>
              <p>🌐 <strong>Website:</strong> www.kinau.id</p>
            </div>
            <button
              type="button"
              onClick={() => setAboutModalOpen(false)}
              className="w-full py-2.5 bg-[#103557] text-white rounded-xl font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Logout ── */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full space-y-3.5 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              {Icon('LogOut', { className: 'w-6 h-6' })}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Keluar dari Akun?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Anda perlu login kembali untuk mengakses panel operasional Kinau ID.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
