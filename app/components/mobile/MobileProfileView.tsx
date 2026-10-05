import React, { createElement, useState, useEffect } from 'react';
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

  // Form states initialized with live profile data
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [institution, setInstitution] = useState(profile?.institution_name || '');
  const [bio, setBio] = useState(profile?.bio || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [currentLanguage, setCurrentLanguage] = useState<'id' | 'en'>(profile?.language || 'id');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(profile?.theme || 'light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true);

  // Apply theme to DOM and persist to localStorage + Cookies
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    let isDark = theme === 'dark';
    if (theme === 'system') {
      isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    if (typeof document !== 'undefined') {
      document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  // Sync state on profile change or initial mount
  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.institution_name) setInstitution(profile.institution_name);
      if (profile.bio) setBio(profile.bio);
      if (profile.theme) {
        setCurrentTheme(profile.theme);
        applyTheme(profile.theme);
      }
      if (profile.language) setCurrentLanguage(profile.language);
      if (profile.notifications_enabled !== undefined) {
        setNotificationsEnabled(profile.notifications_enabled);
      }
    }
  }, [profile]);

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
    applyTheme(nextTheme);

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
    toast.success(`Tema diubah ke: ${nextTheme === 'dark' ? 'Dark Mode 🌙' : nextTheme === 'light' ? 'Light Mode ☀️' : 'Sistem 💻'}`);
  };

  const toggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);

    if (nextVal) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            try {
              new Notification('Kinau ID Push', {
                body: 'Notifikasi workshop berhasil diaktifkan! Anda akan menerima update status pesanan dan cetak secara realtime.',
                icon: '/head-icon-kinau.png',
              });
            } catch {}
            toast.success('Izin notifikasi browser diaktifkan!');
          } else if (permission === 'denied') {
            toast.error('Izin notifikasi diblokir browser. Harap izinkan notifikasi pada setelan browser Anda.');
          }
        } catch (err) {
          console.error('Notification error:', err);
        }
      } else {
        toast.info('Browser ini tidak mendukung Web Notifications API.');
      }
    } else {
      toast.info('Notifikasi dinonaktifkan.');
    }

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
  };

  const triggerTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Kinau ID Workshop', {
          body: 'Tes Push Notifikasi: Sistem notifikasi aktif dan terhubung ke antrean produksi.',
          icon: '/head-icon-kinau.png',
        });
        toast.success('Pesan tes notifikasi telah dikirim ke browser!');
      } else {
        Notification.requestPermission().then((p) => {
          if (p === 'granted') {
            new Notification('Kinau ID Workshop', {
              body: 'Tes Push Notifikasi: Sistem notifikasi aktif dan terhubung ke antrean produksi.',
              icon: '/head-icon-kinau.png',
            });
            toast.success('Pesan tes notifikasi telah dikirim ke browser!');
          } else {
            toast.error('Harap izinkan notifikasi browser terlebih dahulu.');
          }
        });
      }
    } else {
      toast.info('Web Notification API tidak tersedia di lingkungan ini.');
    }
  };

  const handleLogout = () => {
    if (send?.submit) {
      send.submit({ intent: 'logout' }, { method: 'post' });
    } else if (typeof window !== 'undefined') {
      window.location.href = '/_auth/logout';
    }
  };

  const displayName = profile?.name || 'Pengguna Kinau';
  const displayEmail = profile?.email || '—';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-md mx-auto space-y-4 text-slate-900 dark:text-slate-100 font-sans select-none pb-8">
      {/* ── 1. Profile User Card ── */}
      <div className="bg-white dark:bg-[#103557] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center gap-3.5 transition-colors">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-xs overflow-hidden border-2 border-white dark:border-slate-700">
            {profile?.avatar && !profile.avatar.includes('default') && !profile.avatar.includes('kinau-logo-icon') ? (
              <img src={profile.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              Icon('User', { size: 28, className: 'text-slate-500 dark:text-slate-400' })
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
              {displayName}
            </h2>
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="text-[11px] font-bold text-[#103557] dark:text-sky-300 hover:text-[#0c2842] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-sky-950/60 border border-blue-200/70 dark:border-sky-800/80 cursor-pointer"
            >
              {Icon('Edit3', { className: 'w-3 h-3' })}
              <span>Edit</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
            {displayEmail}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-[#103557] dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              {profile?.role === 'admin' ? 'Administrator' : 'Staff Produksi'}
            </span>
            {profile?.institution_name && (
              <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate max-w-[130px]">
                • {profile.institution_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Group: Account ── */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
          Account
        </h3>
        <div className="bg-white dark:bg-[#103557] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 transition-colors">
          {/* Manage Profile */}
          <button
            type="button"
            onClick={() => setEditProfileOpen(true)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {Icon('User', { className: 'w-4 h-4' })}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Manage Profile</span>
            </div>
            {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
          </button>

          {/* Password & Security */}
          <button
            type="button"
            onClick={() => setChangePasswordOpen(true)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {Icon('Lock', { className: 'w-4 h-4' })}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Password & Security</span>
            </div>
            {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
          </button>

          {/* Notifications */}
          <div className="p-3.5 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {Icon('Bell', { className: 'w-4 h-4' })}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Push Notifications</span>
                <span className="text-[10px] text-slate-400 font-medium">Browser & Ntfy alert</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notificationsEnabled && (
                <button
                  type="button"
                  onClick={triggerTestNotification}
                  className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-[#103557] dark:text-sky-300 text-[10px] font-bold border border-blue-200/80 dark:border-sky-800/80 cursor-pointer"
                >
                  Test Push
                </button>
              )}
              <button
                type="button"
                onClick={toggleNotifications}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  notificationsEnabled ? 'bg-[#103557] dark:bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Language */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {Icon('Globe', { className: 'w-4 h-4' })}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Language</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{currentLanguage === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
              {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
            </div>
          </button>
        </div>
      </div>

      {/* ── 3. Group: Preferences ── */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
          Preferences
        </h3>
        <div className="bg-white dark:bg-[#103557] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 transition-colors">
          {/* About Us */}
          <button
            type="button"
            onClick={() => setAboutModalOpen(true)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {Icon('BookOpen', { className: 'w-4 h-4' })}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">About Us</span>
            </div>
            {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
          </button>

          {/* Theme */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {Icon(currentTheme === 'light' ? 'Sun' : currentTheme === 'dark' ? 'Moon' : 'Laptop', {
                  className: 'w-4 h-4 text-amber-500 dark:text-sky-400',
                })}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Theme</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="capitalize">{currentTheme === 'dark' ? 'Dark Mode 🌙' : currentTheme === 'light' ? 'Light Mode ☀️' : 'System 💻'}</span>
              {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
            </div>
          </button>

          {/* Appointments / Antrean Cetak */}
          <button
            type="button"
            onClick={() => (navigate ? navigate('/app/print-area') : (window.location.href = '/app/print-area'))}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {Icon('Calendar', { className: 'w-4 h-4' })}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Appointments / Antrean</span>
            </div>
            {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
          </button>
        </div>
      </div>

      {/* ── 4. Group: Support ── */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
          Support
        </h3>
        <div className="bg-white dark:bg-[#103557] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 transition-colors">
          {/* Help Center */}
          <button
            type="button"
            onClick={() => (navigate ? navigate('/terms/glossary') : (window.location.href = '/terms/glossary'))}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {Icon('HelpCircle', { className: 'w-4 h-4' })}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Help Center & FAQ</span>
            </div>
            {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
          </button>

          {/* Contact Us */}
          <a
            href={getWhatsAppLink(ADMIN_WA, `Halo CS Kinau ID, saya butuh bantuan perihal akun profil...`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition no-underline text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                {Icon('Phone', { className: 'w-4 h-4' })}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Contact Us (WhatsApp)</span>
            </div>
            {Icon('ChevronRight', { className: 'w-4 h-4 text-slate-400' })}
          </a>
        </div>
      </div>

      {/* ── 5. Group: Logout ── */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          className="w-full p-3.5 bg-white dark:bg-[#103557] hover:bg-rose-50/70 dark:hover:bg-rose-950/40 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-xs flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer"
        >
          {Icon('LogOut', { className: 'w-4 h-4' })}
          <span>Keluar Akun (Logout)</span>
        </button>
      </div>

      {/* Footer Brand Info */}
      <div className="text-center pt-2 space-y-1 text-slate-400 dark:text-slate-500 text-[10px]">
        <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{BRAND_NAME} • v2.0.0</p>
        <p>Sistem Operasional Percetakan & Merchandise Custom</p>
      </div>

      {/* ── Modal: Edit Profile ── */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#103557] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kelola Profil</h3>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {Icon('X', { className: 'w-4 h-4' })}
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#103557] dark:focus:border-sky-400"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#103557] dark:focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Instansi / Unit Kerja</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#103557] dark:focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan / Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#103557] dark:focus:border-sky-400 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#103557] hover:bg-[#0c2842] dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl font-bold cursor-pointer"
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
          <div className="bg-white dark:bg-[#103557] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ubah Kata Sandi</h3>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {Icon('X', { className: 'w-4 h-4' })}
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#103557] dark:focus:border-sky-400"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#103557] dark:focus:border-sky-400"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Konfirmasi Kata Sandi</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#103557] dark:focus:border-sky-400"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#103557] hover:bg-[#0c2842] dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl font-bold cursor-pointer"
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
          <div className="bg-white dark:bg-[#103557] rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-xl text-xs border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tentang Kinau ID</h3>
              <button
                type="button"
                onClick={() => setAboutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {Icon('X', { className: 'w-4 h-4' })}
              </button>
            </div>
            <div className="text-center py-2">
              <img src="/logo-kinau.png" alt="Kinau ID" className="h-9 w-auto mx-auto object-contain mb-2" />
              <p className="font-bold text-slate-900 dark:text-white">PT Kinau Digital Kreatif</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">NIB: 0204260115049</p>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Kinau ID adalah pusat spesialis percetakan digital, lanyard, ID card instansi, jersey sublim, dan konveksi apparel custom berkualitas tinggi di Bandar Lampung.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <p>📍 <strong>Workshop:</strong> Jalan Terusan Jl. Murai 1 No.7, Korpri Raya, Sukarame, Bandar Lampung</p>
              <p>📞 <strong>WhatsApp:</strong> +62 852-1933-7474</p>
              <p>🌐 <strong>Website:</strong> www.kinau.id</p>
            </div>
            <button
              type="button"
              onClick={() => setAboutModalOpen(false)}
              className="w-full py-2.5 bg-[#103557] dark:bg-sky-600 text-white rounded-xl font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Logout ── */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#103557] rounded-2xl p-5 max-w-xs w-full space-y-3.5 shadow-xl text-center border border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              {Icon('LogOut', { className: 'w-6 h-6' })}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Keluar dari Akun?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Anda perlu login kembali untuk mengakses panel operasional Kinau ID.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
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
