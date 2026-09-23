export const ASSETS_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ASSETS_BASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_ASSETS_BASE_URL) ||
  'https://kobnlzpvkctkqejixuxy.supabase.co/storage/v1/object/public/bucket-kinau/resource';

/**
 * Resolves any resource/image URL or bare filename to a full CDN/assets URL.
 * Automatically normalizes legacy absolute URLs (data.kinau.id, data.kinau.web.id),
 * relative paths, or bare filenames (e.g. acc9db0fd06bd1700fe7.png).
 */
export function getResourceUrl(urlOrPath?: string | null): string {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';

  const trimmed = urlOrPath.trim();
  if (
    !trimmed ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === '-' ||
    trimmed === 'none' ||
    trimmed === 'false' ||
    trimmed === '0'
  ) {
    return '';
  }

  // Data URLs or Blob URLs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Legacy data.kinau domains or local /resource/ paths
  if (
    trimmed.includes('data.kinau.id') ||
    trimmed.includes('data.kinau.web.id') ||
    trimmed.includes('/resource/') ||
    trimmed.includes('api/resource/')
  ) {
    const filename = trimmed.split('/').pop()?.split('?')[0]?.replace(/^proof_/, '');
    if (filename) {
      return `${ASSETS_BASE_URL.replace(/\/+$/, '')}/${filename}`;
    }
  }

  // Supabase CDN URL: strip proof_ if still present in legacy strings
  if (trimmed.includes('supabase.co') && trimmed.includes('/resource/proof_')) {
    return trimmed.replace('/resource/proof_', '/resource/');
  }

  // Other external URLs (e.g. Google avatar, cloudinary, unsplash)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Clean bare filename: e.g. "acc9db0fd06bd1700fe7.png" or "proof_07efcc3c1beca8bf89ae.jpeg"
  const cleanFilename = trimmed
    .replace(/^\/+/, '')
    .replace(/^resource\//, '')
    .replace(/^proof_/, '');

  return `${ASSETS_BASE_URL.replace(/\/+$/, '')}/${cleanFilename}`;
}

/**
 * Checks if a value represents a valid uploaded resource or proof URL.
 */
export function isValidResourceUrl(url?: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t || t === '-' || t === 'null' || t === 'undefined' || t === 'none' || t === 'false' || t === '0') {
    return false;
  }

  return (
    t.startsWith('/resource/') ||
    t.includes('/resource/') ||
    t.includes('data.kinau.web.id') ||
    t.includes('data.kinau.id') ||
    t.includes('supabase.co') ||
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('data:') ||
    t.startsWith('blob:') ||
    /\.(jpe?g|png|webp|gif|svg|pdf|avif)$/i.test(t) ||
    /^[a-f0-9_\-]{8,}/i.test(t) ||
    t.length >= 6
  );
}

export default getResourceUrl;
