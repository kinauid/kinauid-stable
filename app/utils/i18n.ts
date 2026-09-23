/**
 * i18n — Dual Language (ID & EN) Lightweight Enterprise Engine
 * Fully type-safe key resolution, parameter interpolation, and cookie/request helpers.
 */

export type SupportedLanguage = 'id' | 'en';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'id';

export const DICTIONARY = {
  id: {
    common: {
      save: 'Simpan',
      saving: 'Menyimpan...',
      cancel: 'Batal',
      delete: 'Hapus',
      deleting: 'Menghapus...',
      edit: 'Edit',
      create: 'Tambah Baru',
      search: 'Cari data...',
      filter: 'Filter',
      actions: 'Aksi',
      back: 'Kembali',
      close: 'Tutup',
      loading: 'Memuat...',
      confirm: 'Konfirmasi',
      yes: 'Ya',
      no: 'Tidak',
      refresh: 'Segarkan',
      print: 'Cetak Dokumen',
      export: 'Ekspor Data',
      download: 'Unduh',
      status: 'Status',
      active: 'Aktif',
      inactive: 'Nonaktif',
      suspended: 'Ditangguhkan',
      pending: 'Menunggu',
      success: 'Berhasil',
      error: 'Terjadi Kesalahan',
      all: 'Semua',
      details: 'Detail',
      select: 'Pilih opsi...',
    },
    nav: {
      home: 'Beranda',
      dashboard: 'Dashboard',
      users: 'Pengguna',
      settings: 'Pengaturan',
      terms: 'Glosarium & Strategi',
      reports: 'Laporan',
      analytics: 'Analitik',
    },
    table: {
      empty: 'Belum ada data tersedia',
      showing: 'Menampilkan {from} - {to} dari {total} data',
      prev: 'Sebelumnya',
      next: 'Selanjutnya',
      rowsPerPage: 'Baris per halaman',
    },
    theme: {
      dark: 'Mode Gelap',
      light: 'Mode Terang',
      toggle: 'Ganti Tema',
    },
    lang: {
      id: 'Bahasa Indonesia',
      en: 'English',
      switch: 'Ganti Bahasa',
    },
    network: {
      online: 'Terhubung ke Internet',
      offline: 'Koneksi Terputus (Offline)',
      offlineWarning:
        'Anda sedang offline. Data yang disimpan akan disinkronkan saat koneksi kembali.',
    },
    dashboard: {
      title: 'Manajemen Pengguna & Hak Akses',
      subtitle:
        'Kelola pengguna dengan arsitektur Single-File .ts Feature, Encrypted State, dan Chart SSR Safeguards.',
      totalUsers: 'Total Pengguna',
      activeUsers: 'Pengguna Aktif',
      pendingUsers: 'Menunggu Verifikasi',
      newUser: 'Tambah Pengguna Baru',
      userChartTitle: 'Aktivitas Pertumbuhan Pengguna',
    },
  },
  en: {
    common: {
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      deleting: 'Deleting...',
      edit: 'Edit',
      create: 'Add New',
      search: 'Search records...',
      filter: 'Filter',
      actions: 'Actions',
      back: 'Back',
      close: 'Close',
      loading: 'Loading...',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      refresh: 'Refresh',
      print: 'Print Document',
      export: 'Export Data',
      download: 'Download',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      pending: 'Pending',
      success: 'Success',
      error: 'An error occurred',
      all: 'All',
      details: 'Details',
      select: 'Select an option...',
    },
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      users: 'Users',
      settings: 'Settings',
      terms: 'Glossary & Strategy',
      reports: 'Reports',
      analytics: 'Analytics',
    },
    table: {
      empty: 'No records available',
      showing: 'Showing {from} - {to} of {total} records',
      prev: 'Previous',
      next: 'Next',
      rowsPerPage: 'Rows per page',
    },
    theme: {
      dark: 'Dark Mode',
      light: 'Light Mode',
      toggle: 'Toggle Theme',
    },
    lang: {
      id: 'Bahasa Indonesia',
      en: 'English',
      switch: 'Switch Language',
    },
    network: {
      online: 'Online',
      offline: 'Connection Lost (Offline)',
      offlineWarning:
        'You are currently offline. Changes will be synced once connection is restored.',
    },
    dashboard: {
      title: 'User & Access Management',
      subtitle:
        'Manage enterprise users with Single-File .ts Feature, Encrypted State, and SSR Chart Safeguards.',
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      pendingUsers: 'Pending Verification',
      newUser: 'Add New User',
      userChartTitle: 'User Growth Analytics',
    },
  },
} as const;

export type I18nDictionary = typeof DICTIONARY.id;

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type I18nKey = NestedKeyOf<I18nDictionary>;

/**
 * Gets a translated string with parameter interpolation.
 * Example: t('table.showing', { from: 1, to: 10, total: 100 })
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  lang: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  const dict = DICTIONARY[lang] || DICTIONARY[DEFAULT_LANGUAGE];
  const keys = key.split('.');

  let current: any = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to Indonesian if missing in English or vice versa
      const fallbackDict = DICTIONARY[DEFAULT_LANGUAGE];
      let fallbackVal: any = fallbackDict;
      for (const fk of keys) {
        if (fallbackVal && typeof fallbackVal === 'object' && fk in fallbackVal) {
          fallbackVal = fallbackVal[fk];
        } else {
          fallbackVal = key;
          break;
        }
      }
      current = fallbackVal;
      break;
    }
  }

  let result = typeof current === 'string' ? current : key;

  if (params && typeof params === 'object') {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    }
  }

  return result;
}

/**
 * Reads language preference from Request Cookie or Accept-Language header.
 */
export function getLanguageFromRequest(request: Request): SupportedLanguage {
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)lang=(id|en)(?:;|$)/);
    if (match && (match[1] === 'id' || match[1] === 'en')) {
      return match[1];
    }
  }

  // Check Accept-Language
  const acceptLang = request.headers.get('Accept-Language');
  if (acceptLang && acceptLang.startsWith('en')) {
    return 'en';
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Generates Set-Cookie header string for language.
 */
export function setLanguageCookieHeader(lang: SupportedLanguage): string {
  return `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * Format currency / numbers based on locale
 */
export function formatNumber(num: number, lang: SupportedLanguage = DEFAULT_LANGUAGE): string {
  const locale = lang === 'id' ? 'id-ID' : 'en-US';
  return new Intl.NumberFormat(locale).format(num);
}
