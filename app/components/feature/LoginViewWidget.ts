import { createElement, useState, Fragment } from 'react';
import { Form, NavLink, useFetcher } from 'react-router';
import { UI } from '~/builder';
import { BRAND_NAME, ADMIN_WA, getWhatsAppLink } from '~/constants/brand';
import { APP_VERSION } from '~/constants/version';
import { toast } from 'sonner';


// Google Icon SVG (official brand colors)
const GoogleIcon = () =>
  createElement(
    'svg',
    { className: 'w-4 h-4 shrink-0', viewBox: '0 0 24 24' },
    createElement('path', { fill: '#4285F4', d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' }),
    createElement('path', { fill: '#34A853', d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' }),
    createElement('path', { fill: '#FBBC05', d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z' }),
    createElement('path', { fill: '#EA4335', d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z' })
  );

interface LoginViewWidgetProps {
  actionData?: { error?: string | { message?: string; code?: string }; success?: boolean; needsRegistration?: boolean; token?: string; user?: any };
  isSubmitting?: boolean;
}

export function LoginViewWidget({ actionData, isSubmitting }: LoginViewWidgetProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const fetcher = useFetcher<any>();

  const errorMessage = actionData?.error
    ? typeof actionData.error === 'string'
      ? actionData.error
      : actionData.error.message || actionData.error.code || 'Gagal masuk. Silakan periksa kredensial Anda.'
    : null;

  const fetcherError = fetcher.data?.error;

  // Registration step — shown after Google login if phone is missing
  const showRegistration = actionData?.needsRegistration || fetcher.data?.needsRegistration;
  const registrationUser = actionData?.user || fetcher.data?.user;
  const registrationToken = actionData?.token || fetcher.data?.token;

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Lazy-load Firebase to avoid SSR issues
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('~/lib/firebase.client');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user.email) {
        fetcher.submit(
          { intent: 'google', email: user.email, fullname: user.displayName || '', uid: user.uid },
          { method: 'post', action: '/login' }
        );
      }
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        toast.error('Gagal masuk dengan Google. Silakan coba lagi.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Registration Step ──
  if (showRegistration) {
    return createElement(
      'div',
      { className: 'min-h-screen w-full bg-gradient-to-br from-[#F8FAFC] via-[#EEF4FB] to-[#E2E8F0] flex items-center justify-center p-6 font-sans select-none' },
      createElement(
        'div',
        { className: 'bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-6' },
        createElement(
          'div',
          { className: 'space-y-1' },
          createElement(
            NavLink,
            { to: '/', className: 'inline-block no-underline hover:opacity-85 transition-opacity cursor-pointer mb-4', title: 'Kembali ke Beranda' },
            createElement('img', { src: '/kinau-logo.png', alt: BRAND_NAME, className: 'h-8 w-auto object-contain' })
          ),
          createElement('h2', { className: 'text-xl font-bold text-slate-900' }, 'Lengkapi Profil'),
          createElement('p', { className: 'text-xs text-slate-500' }, 'Tambahkan nomor HP untuk menghubungkan notifikasi pesanan.')
        ),
        (fetcherError) && createElement(
          'div',
          { className: 'p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2' },
          UI.Icon('AlertCircle', { size: 15, className: 'shrink-0' }), fetcherError
        ),
        createElement(
          fetcher.Form,
          { method: 'post', action: '/login', className: 'space-y-4' },
          createElement('input', { type: 'hidden', name: 'intent', value: 'complete_registration' }),
          createElement('input', { type: 'hidden', name: 'token', value: registrationToken || '' }),
          createElement('input', { type: 'hidden', name: 'user_id', value: registrationUser?.id || '' }),
          createElement('div', { className: 'space-y-1.5' },
            createElement('label', { className: 'text-xs font-bold text-slate-700 block' }, 'Nama Lengkap'),
            createElement('input', {
              type: 'text', name: 'fullname', required: true,
              defaultValue: registrationUser?.displayName || registrationUser?.fullname || '',
              placeholder: 'Nama lengkap',
              className: 'w-full px-3.5 py-2.5 text-xs text-slate-900 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:border-[#103557] focus:ring-1 focus:ring-[#103557]/20 outline-hidden',
            })
          ),
          createElement('div', { className: 'space-y-1.5' },
            createElement('label', { className: 'text-xs font-bold text-slate-700 block' }, 'No. WhatsApp / HP *'),
            createElement('input', {
              type: 'tel', name: 'phone', required: true, inputMode: 'numeric',
              placeholder: '08xxxxxxxxxx',
              className: 'w-full px-3.5 py-2.5 text-xs text-slate-900 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:border-[#103557] focus:ring-1 focus:ring-[#103557]/20 outline-hidden font-mono',
            }),
            createElement('p', { className: 'text-[10px] text-slate-400' }, 'Digunakan untuk notifikasi WhatsApp dan koordinasi pesanan.')
          ),
          createElement('button', {
            type: 'submit', disabled: fetcher.state === 'submitting',
            className: 'w-full py-3 bg-[#102A45] hover:bg-[#163a5f] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer',
          }, fetcher.state === 'submitting' ? 'Menyimpan...' : 'Simpan & Mulai →')
        )
      )
    );
  }

  return createElement(
    'div',
    {
      className:
        'min-h-screen w-full bg-gradient-to-br from-[#F8FAFC] via-[#EEF4FB] to-[#E2E8F0] flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans select-none',
    },
    // Top Bar (Branding — links to landing page)
    createElement(
      'header',
      { className: 'w-full max-w-5xl mx-auto flex items-center justify-between py-2' },
      createElement(
        NavLink,
        {
          to: '/',
          className: 'flex items-center gap-2.5 no-underline hover:opacity-85 transition-opacity cursor-pointer group',
          title: 'Kembali ke Beranda',
        },
        createElement('img', {
          src: '/kinau-logo.png',
          alt: BRAND_NAME,
          className: 'h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-105',
        }),
        createElement(
          'div',
          { className: 'leading-tight' },
          createElement('div', { className: 'font-bold text-xs text-slate-900 group-hover:text-[#103557]' }, BRAND_NAME),
          createElement('div', { className: 'text-[10px] font-mono text-slate-500 uppercase tracking-wider' }, 'PORTAL PRODUKSI')
        )
      ),
      createElement(
        NavLink,
        {
          to: '/',
          className: 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white/90 hover:bg-white text-slate-700 hover:text-[#103557] text-xs font-bold shadow-2xs transition-all hover:scale-102 cursor-pointer no-underline',
        },
        UI.Icon('ArrowLeft', { size: 14, className: 'text-[#103557]' }),
        createElement('span', null, 'Kembali ke Beranda')
      )
    ),

    // Center Main Split Card
    createElement(
      'main',
      { className: 'w-full max-w-5xl mx-auto my-auto py-4' },
      createElement(
        'div',
        {
          className:
            'bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 p-2 sm:p-3 gap-2 sm:gap-3',
        },
        // Left Column: Brand & Feature Highlights
        createElement(
          'div',
          {
            className:
              'bg-[#EEF4FB] rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 border border-blue-100/60',
          },
          // Top Left: Logo & Brand Identity (links to landing page)
          createElement(
            'div',
            { className: 'flex items-center justify-between gap-2' },
            createElement(
              NavLink,
              {
                to: '/',
                className:
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-blue-200 text-[#103557] shadow-2xs no-underline transition-all hover:scale-102 cursor-pointer',
                title: 'Kembali ke Beranda',
              },
              createElement('img', {
                src: '/head-icon-kinau.png',
                alt: BRAND_NAME,
                className: 'w-5 h-5 object-contain',
              }),
              createElement(
                'div',
                { className: 'leading-none' },
                createElement('span', { className: 'font-bold text-xs block' }, 'Kinau ID'),
                createElement('span', { className: 'text-[9px] text-slate-500 font-normal block' }, 'Percetakan & Konveksi')
              )
            )
          ),

          // Middle Left: Main Title & Feature Badges
          createElement(
            'div',
            { className: 'space-y-4 my-auto py-4' },
            createElement(
              'h1',
              { className: 'text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight' },
              'Sistem Manajemen Pesanan & Workshop Produksi'
            ),
            createElement(
              'p',
              { className: 'text-xs sm:text-sm text-slate-600 leading-relaxed' },
              'Platform terpadu monitoring alur produksi jersey sublim, ID card, lanyard, dan sablon konveksi secara real-time.'
            ),
            createElement(
              'div',
              { className: 'flex flex-wrap gap-2 pt-2' },
              createElement(
                'div',
                {
                  className:
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-blue-200 text-slate-800 text-xs font-semibold shadow-2xs',
                },
                UI.Icon('ShieldCheck', { size: 14, className: 'text-[#103557]' }),
                createElement('span', null, 'RBAC Terproteksi')
              ),
              createElement(
                'div',
                {
                  className:
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-blue-200 text-slate-800 text-xs font-semibold shadow-2xs',
                },
                UI.Icon('HardDrive', { size: 14, className: 'text-[#103557]' }),
                createElement('span', null, 'Sync Drive Otomatis')
              ),
              createElement(
                'div',
                {
                  className:
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-blue-200 text-slate-800 text-xs font-semibold shadow-2xs',
                },
                UI.Icon('Printer', { size: 14, className: 'text-[#103557]' }),
                createElement('span', null, 'Antrean Presisi')
              )
            )
          ),

          // Bottom Left: Access Notice
          createElement(
            'div',
            { className: 'flex items-center gap-2 text-xs text-[#103557]/80 pt-2 border-t border-blue-200/50' },
            UI.Icon('Shield', { size: 14, className: 'text-[#103557] shrink-0' }),
            createElement('span', null, 'Akses khusus staf terdaftar & partner produksi Kinau ID.')
          )
        ),

        // Right Column: Staff Login Form
        createElement(
          'div',
          { className: 'bg-white rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-5' },
          // Top Right: Section Label
          createElement(
            'div',
            { className: 'flex items-center justify-between' },
            createElement(
              'div',
              { className: 'flex items-center gap-1.5 text-[11px] font-bold text-[#103557] tracking-wider uppercase' },
              createElement('span', { className: 'w-2 h-2 rounded-full bg-[#103557]' }),
              createElement('span', null, 'Portal Akses Staf')
            ),
            createElement(
              'span',
              { className: 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold border border-slate-200' },
              APP_VERSION
            )
          ),


          // Header
          createElement(
            'div',
            { className: 'space-y-1' },
            createElement('h2', { className: 'text-2xl font-bold text-slate-900 tracking-tight' }, 'Selamat Datang Kembali 👋'),
            createElement('p', { className: 'text-xs text-slate-500' }, 'Masuk dengan akun terdaftar untuk mengakses dashboard operasional.')
          ),

          // Error Message Alert
          (errorMessage || fetcherError)
            ? createElement(
                'div',
                {
                  className:
                    'p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2',
                },
                UI.Icon('AlertCircle', { size: 16, className: 'text-rose-600 shrink-0' }),
                createElement('span', null, errorMessage || fetcherError)
              )
            : null,

          // Form
          createElement(
            Form,
            { method: 'post', className: 'space-y-4' },
            // Email Input
            createElement(
              'div',
              { className: 'space-y-1.5' },
              createElement('label', { className: 'text-xs font-bold text-slate-700 block' }, 'Email / ID Petugas'),
              createElement(
                'div',
                {
                  className:
                    'relative flex items-center bg-[#F8FAFC] border border-slate-200 rounded-xl focus-within:border-[#103557] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#103557]/10 transition-all',
                },
                createElement('span', { className: 'pl-3.5 pr-1 text-slate-400 font-bold text-sm select-none' }, '@'),
                createElement('input', {
                  type: 'email',
                  name: 'email',
                  required: true,
                  autoComplete: 'email',
                  value: email,
                  onChange: (e: any) => setEmail(e.target.value),
                  placeholder: 'nama@email.com',
                  className: 'w-full py-2.5 pr-3.5 text-xs text-slate-900 bg-transparent outline-hidden font-medium',
                })
              )
            ),

            // Password Input
            createElement(
              'div',
              { className: 'space-y-1.5' },
              createElement(
                'div',
                { className: 'flex items-center justify-between' },
                createElement('label', { className: 'text-xs font-bold text-slate-700' }, 'Kata Sandi'),
                createElement(
                  'a',
                  {
                    href: getWhatsAppLink(ADMIN_WA, 'Halo Helpdesk Kinau ID, saya butuh bantuan reset password akun staf...'),
                    target: '_blank',
                    rel: 'noreferrer',
                    className: 'text-xs font-semibold text-[#103557] hover:underline cursor-pointer',
                  },
                  'Lupa kata sandi?'
                )
              ),
              createElement(
                'div',
                {
                  className:
                    'relative flex items-center bg-[#F8FAFC] border border-slate-200 rounded-xl focus-within:border-[#103557] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#103557]/10 transition-all',
                },
                createElement(
                  'span',
                  { className: 'pl-3.5 pr-2 text-slate-400' },
                  UI.Icon('Lock', { size: 15 })
                ),
                createElement('input', {
                  type: showPassword ? 'text' : 'password',
                  name: 'password',
                  required: true,
                  autoComplete: 'current-password',
                  value: password,
                  onChange: (e: any) => setPassword(e.target.value),
                  placeholder: '••••••••••••',
                  className: 'w-full py-2.5 pr-10 text-xs text-slate-900 bg-transparent outline-hidden font-medium',
                }),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => setShowPassword(!showPassword),
                    className: 'absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer',
                  },
                  UI.Icon(showPassword ? 'EyeOff' : 'Eye', { size: 16 })
                )
              )
            ),

            // Remember Me
            createElement(
              'label',
              { className: 'flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium select-none' },
              createElement('input', {
                type: 'checkbox',
                name: 'rememberMe',
                checked: rememberMe,
                onChange: (e: any) => setRememberMe(e.target.checked),
                className: 'rounded border-slate-300 text-[#103557] focus:ring-[#103557] w-4 h-4 cursor-pointer',
              }),
              createElement('span', null, 'Ingat saya di perangkat ini (30 hari)')
            ),

            // Submit Button
            createElement(
              'button',
              {
                type: 'submit',
                disabled: isSubmitting,
                className:
                  'w-full py-3 px-4 bg-[#102A45] hover:bg-[#163e60] disabled:opacity-70 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer',
              },
              isSubmitting
                ? createElement('span', null, 'Memverifikasi Kredensial...')
                : createElement(
                    Fragment,
                    null,
                    createElement('span', null, 'Masuk ke Dashboard'),
                    UI.Icon('ArrowRight', { size: 15 })
                  )
            )
          ),

          // Divider
          createElement(
            'div',
            { className: 'relative flex items-center justify-center my-2' },
            createElement('div', { className: 'w-full border-t border-slate-200' }),
            createElement('span', { className: 'bg-white px-3 text-[11px] text-slate-400 absolute' }, 'atau masuk dengan Single Sign-On')
          ),

          // Google SSO Button — real Firebase implementation
          createElement(
            'button',
            {
              type: 'button',
              onClick: handleGoogleLogin,
              disabled: googleLoading || isSubmitting,
              className:
                'w-full py-2.5 px-4 bg-white hover:bg-slate-50 disabled:opacity-60 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer',
            },
            googleLoading
              ? createElement(Fragment, null,
                  createElement('div', { className: 'w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin' }),
                  'Memverifikasi akun Google...'
                )
              : createElement(Fragment, null,
                  createElement(GoogleIcon, null),
                  createElement('span', null, 'Masuk dengan Akun Google Instansi (@kinau.id)')
                )
          ),

          // Support Card
          createElement(
            'div',
            {
              className:
                'bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 flex items-start gap-3 text-left',
            },
            createElement(
              'div',
              { className: 'p-1.5 rounded-lg bg-blue-100 text-[#103557] shrink-0' },
              UI.Icon('Headphones', { size: 16 })
            ),
            createElement(
              'div',
              { className: 'space-y-0.5 min-w-0' },
              createElement('div', { className: 'text-xs font-bold text-slate-900' }, 'Butuh bantuan otentikasi?'),
              createElement(
                'a',
                {
                  href: getWhatsAppLink(ADMIN_WA, 'Halo Helpdesk Kinau ID, saya mengalami kendala saat login ke portal staf...'),
                  target: '_blank',
                  rel: 'noreferrer',
                  className: 'text-[11px] text-[#103557] hover:underline font-semibold cursor-pointer',
                },
                'Hubungi Helpdesk via WhatsApp →'
              )
            )
          )
        )
      )
    ),

    // Bottom Screen Footer
    createElement(
      'footer',
      {
        className:
          'w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 py-2 border-t border-slate-200/60 gap-1',
      },
      createElement('div', null, '© 2026 Kinau ID · Percetakan & Konveksi'),
      createElement(
        'div',
        { className: 'flex items-center gap-3' },
        createElement('span', null, 'Security Protocol TLS 1.3')
      )
    )
  );
}
