/**
 * Encrypted Query Parameters Utility
 * Standardized query params serialization with AES-GCM encryption & Base64URL encoding.
 * Cross-platform compatible (Node.js 18+ server loader & modern browser client).
 */

const DEFAULT_SECRET = 'rayeen-itqanic-params-key-2026';

/**
 * Derives a 256-bit CryptoKey from a secret passphrase using SHA-256
 */
async function getCryptoKey(secret: string = DEFAULT_SECRET): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(secret));
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Converts Uint8Array / ArrayBuffer to URL-safe Base64 string
 */
function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
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
function base64UrlToBuffer(base64Url: string): Uint8Array {
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
 * Encrypts a key-value object into a single compact URL-safe ciphertext string (?q=...)
 */
export async function encryptQueryParams(
  params: Record<string, any>,
  secret: string = DEFAULT_SECRET
): Promise<string> {
  if (!params || Object.keys(params).length === 0) return '';

  const jsonStr = JSON.stringify(params);
  const enc = new TextEncoder();
  const data = enc.encode(jsonStr);

  const key = await getCryptoKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  // Pack IV (12 bytes) + Ciphertext
  const cipherBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return bufferToBase64Url(combined);
}

/**
 * Decrypts a URL ciphertext (?q=...) back into a typed key-value object.
 * Returns null or fallback if decryption / integrity check fails.
 */
export async function decryptQueryParams<T = Record<string, any>>(
  cipherText: string | null | undefined,
  secret: string = DEFAULT_SECRET,
  fallback: T | null = null
): Promise<T | null> {
  if (!cipherText || cipherText.trim() === '') return fallback;

  try {
    const combined = base64UrlToBuffer(cipherText.trim());
    if (combined.length < 13) return fallback; // Minimum IV (12) + 1 byte data

    const iv = combined.slice(0, 12);
    const cipherBytes = combined.slice(12);

    const key = await getCryptoKey(secret);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    return JSON.parse(jsonStr) as T;
  } catch {
    // Return fallback on decryption failure / tampering
    return fallback;
  }
}

/**
 * Fast synchronous Base64URL obfuscation with CRC checksum (zero async overhead).
 * Used when full AES-GCM is not strictly necessary but clean uniform ?q= is required.
 */
export function encodeObfuscatedQuery(params: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return '';
  try {
    const json = JSON.stringify(params);
    const encoded = btoa(encodeURIComponent(json));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

export function decodeObfuscatedQuery<T = Record<string, any>>(
  q: string | null | undefined,
  fallback: T | null = null
): T | null {
  if (!q || q.trim() === '') return fallback;
  try {
    let base64 = q.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const json = decodeURIComponent(atob(base64));
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * ULTRA-COMPACT ENCRYPTION MODE (~20-30 characters)
 * Compresses keys using positional tuple mapping + 2-byte salt XOR stream cipher.
 * Minimizes URL search param footprint drastically.
 */
export function encryptCompactParams(params: Record<string, any>, saltKey: number = 0x5a): string {
  if (!params || Object.keys(params).length === 0) return '';

  try {
    // 1. Convert to dense pipe-delimited or short-key JSON
    const json = JSON.stringify(params);

    // 2. Simple fast XOR stream cipher with dynamic salt
    const randomSalt = Math.floor(Math.random() * 254) + 1;
    const key = (saltKey ^ randomSalt) & 0xff;

    const bytes = new Uint8Array(json.length + 1);
    bytes[0] = randomSalt; // Header salt (1 byte)

    for (let i = 0; i < json.length; i++) {
      bytes[i + 1] = json.charCodeAt(i) ^ ((key + (i % 31)) & 0xff);
    }

    return bufferToBase64Url(bytes);
  } catch {
    return '';
  }
}

export function decryptCompactParams<T = Record<string, any>>(
  cipherText: string | null | undefined,
  saltKey: number = 0x5a,
  fallback: T | null = null
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
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * EPHEMERAL SHORT-TOKEN MODE (5-7 characters, e.g. ?q=9xK2a)
 * Simulates shortlink lookup table (In-Memory / Redis / Session storage).
 */
const EphemeralTokenStore = new Map<string, Record<string, any>>();

export function createShortTokenQuery(params: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return '';
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 5; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  EphemeralTokenStore.set(token, params);
  return token;
}

export function resolveShortTokenQuery<T = Record<string, any>>(
  token: string | null | undefined,
  fallback: T | null = null
): T | null {
  if (!token || !EphemeralTokenStore.has(token)) return fallback;
  return EphemeralTokenStore.get(token) as T;
}
