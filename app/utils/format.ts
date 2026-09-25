/**
 * Shared Formatting Utilities for Currency, Numbers, and Phone
 */

export function formatCurrency(n: number | string): string {
  const num = typeof n === 'string' ? Number(n) : n;
  return 'Rp ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.max(0, num || 0));
}

export function parseCurrency(str: string | number): number {
  if (!str) return 0;
  return Number(String(str).replace(/[^0-9]/g, '')) || 0;
}

export function formatNumberInput(val: string | number): string {
  if (!val && val !== 0) return '';
  const num = typeof val === 'string' ? Number(val.replace(/[^0-9]/g, '')) : val;
  if (isNaN(num) || num === 0) return '';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
}

export function formatPhoneNumber(input: string): string {
  let clean = input.replace(/\D/g, '');
  if (clean.startsWith('62')) clean = '0' + clean.slice(2);
  if (!clean.startsWith('0')) return input;

  const p1 = clean.slice(1, 4);
  const p2 = clean.slice(4, 8);
  const p3 = clean.slice(8);
  return `+62 ${p1}-${p2}-${p3}`.replace(/-+$/, '');
}

export function formatFullDate(date: string | Date | number | undefined | null): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(date);
  }
}
