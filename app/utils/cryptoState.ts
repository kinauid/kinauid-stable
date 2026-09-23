/**
 * Encrypted URL State Management Utility
 * Provides URL-Safe encryption, decryption, and automatic sanitization for state synchronization (?q=...).
 * Protects against Prototype Pollution, XSS, and Malicious State Injection.
 */

const DEFAULT_SECRET = 'rayeen-core-state-key-2026';
const DEFAULT_SALT = 0x5a;

/**
 * Sanitizes state objects, arrays, and primitive values to prevent XSS and Prototype Pollution.
 */
export function sanitizeState<T = any>(input: any): T {
  if (input === null || input === undefined) {
    return input;
  }

  // 1. Sanitize Strings (Strip dangerous scripts, HTML tags, javascript: protocols, event handlers)
  if (typeof input === 'string') {
    let clean = input
      .replace(/\0/g, '') // remove null bytes
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip <script>
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // strip <iframe>
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // strip <object>
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // strip <embed>
      .replace(/javascript:/gi, '') // strip javascript: pseudo-protocol
      .replace(/data:text\/html/gi, '') // strip data html URI
      .replace(/vbscript:/gi, '') // strip vbscript:
      .replace(/\bon\w+\s*=/gi, ''); // strip event handlers (onclick=, onload=, onerror=)

    return clean as unknown as T;
  }

  // 2. Sanitize Arrays recursively
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeState(item)) as unknown as T;
  }

  // 3. Sanitize Objects (Protect against Prototype Pollution & sanitize keys/values)
  if (typeof input === 'object') {
    const cleanObj: Record<string, any> = Object.create(null);

    for (const [key, val] of Object.entries(input)) {
      // Reject dangerous prototype pollution keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      const cleanKey = sanitizeState<string>(key);
      cleanObj[cleanKey] = sanitizeState(val);
    }

    return cleanObj as T;
  }

  // 4. Return primitives (numbers, booleans, symbols) as-is
  return input;
}

/**
 * Converts Uint8Array / ArrayBuffer to URL-safe Base64 string (- and _ without padding =)
 */
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Converts URL-safe Base64 string to Uint8Array
 */
export function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * ULTRA-COMPACT SYNCHRONOUS ENCRYPTION (Fast XOR + Dynamic Salt + Base64URL)
 * Designed for query params (?q=...) with zero async overhead and minimal byte size.
 */
export function encryptCompactState<T extends Record<string, any>>(
  state: T,
  saltKey: number = DEFAULT_SALT
): string {
  if (!state || Object.keys(state).length === 0) return '';
  try {
    const sanitized = sanitizeState<T>(state);
    const json = JSON.stringify(sanitized);
    const randomSalt = Math.floor(Math.random() * 254) + 1;
    const key = (saltKey ^ randomSalt) & 0xff;

    const bytes = new Uint8Array(json.length + 1);
    bytes[0] = randomSalt;

    for (let i = 0; i < json.length; i++) {
      bytes[i + 1] = json.charCodeAt(i) ^ ((key + (i % 31)) & 0xff);
    }

    return bufferToBase64Url(bytes);
  } catch {
    return '';
  }
}

/**
 * ULTRA-COMPACT SYNCHRONOUS DECRYPTION WITH AUTOMATIC SANITIZATION
 */
export function decryptCompactState<T = Record<string, any>>(
  cipherText: string | null | undefined,
  fallback: T | null = null,
  saltKey: number = DEFAULT_SALT
): T | null {
  if (!cipherText || cipherText.trim() === '') return fallback;
  try {
    const bytes = base64UrlToBuffer(cipherText.trim());
    if (bytes.length < 2) return fallback;

    const randomSalt = bytes[0];
    const key = (saltKey ^ randomSalt) & 0xff;

    const chars: string[] = [];
    for (let i = 1; i < bytes.length; i++) {
      const charCode = bytes[i] ^ ((key + ((i - 1) % 31)) & 0xff);
      chars.push(String.fromCharCode(charCode));
    }

    const json = chars.join('');
    const parsed = JSON.parse(json);
    return sanitizeState<T>(parsed);
  } catch {
    return fallback;
  }
}

/**
 * Derive 256-bit AES-GCM CryptoKey using SHA-256
 */
async function getAesCryptoKey(secret: string = DEFAULT_SECRET): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(secret));
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * AES-GCM ASYNCHRONOUS ENCRYPTION (Web Crypto Standard)
 */
export async function encryptAesState<T extends Record<string, any>>(
  state: T,
  secret: string = DEFAULT_SECRET
): Promise<string> {
  if (!state || Object.keys(state).length === 0) return '';
  const sanitized = sanitizeState<T>(state);
  const jsonStr = JSON.stringify(sanitized);
  const enc = new TextEncoder();
  const data = enc.encode(jsonStr);

  const key = await getAesCryptoKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const cipherBytes = new Uint8Array(cipherBuffer);

  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return bufferToBase64Url(combined);
}

/**
 * AES-GCM ASYNCHRONOUS DECRYPTION (Web Crypto Standard) WITH AUTOMATIC SANITIZATION
 */
export async function decryptAesState<T = Record<string, any>>(
  cipherText: string | null | undefined,
  secret: string = DEFAULT_SECRET,
  fallback: T | null = null
): Promise<T | null> {
  if (!cipherText || cipherText.trim() === '') return fallback;
  try {
    const combined = base64UrlToBuffer(cipherText.trim());
    if (combined.length < 13) return fallback;

    const iv = combined.slice(0, 12);
    const cipherBytes = combined.slice(12);

    const key = await getAesCryptoKey(secret);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);

    const dec = new TextDecoder();
    const parsed = JSON.parse(dec.decode(decryptedBuffer));
    return sanitizeState<T>(parsed);
  } catch {
    return fallback;
  }
}

/**
 * Unified Helper: Synchronous URL State Extraction (Used in Loaders, Actions, and Components)
 */
export function extractUrlState<T extends Record<string, any>>(
  source: Request | URL | string,
  fallback: T,
  paramKey: string = 'q'
): T {
  let search = '';
  if (typeof source === 'string') {
    const qIndex = source.indexOf('?');
    search = qIndex !== -1 ? source.slice(qIndex) : source;
  } else if (source instanceof Request) {
    const url = new URL(source.url);
    search = url.search;
  } else if (source instanceof URL) {
    search = source.search;
  }

  const params = new URLSearchParams(search);
  const cipher = params.get(paramKey);
  if (!cipher) {
    // If no cipher is present, check if raw params exist for graceful backward-compatibility
    const rawResult: Record<string, any> = { ...fallback };
    let hasRawParam = false;
    for (const key of Object.keys(fallback)) {
      const val = params.get(key);
      if (val !== null) {
        hasRawParam = true;
        if (typeof fallback[key] === 'number') {
          rawResult[key] = Number(val) || fallback[key];
        } else if (typeof fallback[key] === 'boolean') {
          rawResult[key] = val === 'true';
        } else {
          rawResult[key] = val;
        }
      }
    }
    return (hasRawParam ? rawResult : fallback) as T;
  }

  const decrypted = decryptCompactState<T>(cipher, fallback);
  return decrypted ? { ...fallback, ...decrypted } : fallback;
}

/**
 * Helper: Build URL with encrypted state query
 */
export function buildEncryptedUrl<T extends Record<string, any>>(
  path: string,
  state: T,
  paramKey: string = 'q'
): string {
  const cipher = encryptCompactState(state);
  if (!cipher) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${paramKey}=${encodeURIComponent(cipher)}`;
}
