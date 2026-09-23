/**
 * Safe Relative Path Redirect Sanitizer
 * Implements #safe-redirect-open-url-guard architectural standard.
 */

const ALLOWED_REDIRECT_DOMAINS = [
  'rayeen.web.id',
  'itqanic.rayeen.web.id',
  'gateway.rayeen.web.id',
  'nurafin.rayeen.web.id',
  'siakad.unisma.ac.id',
  'localhost',
];

export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback: string = '/dashboard'
): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();

  // Validasi: Harus diawali tepat 1 '/' dan BUKAN '//' atau '/\' (mencegah protocol-relative open-redirect):
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }

  // Jika URL berupa absolute, cek hostname terhadap domain whitelist resmi:
  try {
    const parsed = new URL(trimmed);
    if (
      ALLOWED_REDIRECT_DOMAINS.some(
        (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      )
    ) {
      return trimmed;
    }
  } catch {
    // Malformed URL -> fallback
  }

  return fallback;
}
