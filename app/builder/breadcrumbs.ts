import type { BreadcrumbItem } from './types';

/**
 * Transforms dot-notation string to Human-Readable Label
 * e.g. "dashboard" -> "Dashboard", "admin-users" -> "Admin Users", "$id" -> "Details"
 */
export function formatSegmentLabel(segment: string): string {
  if (segment === '_index' || segment === '') return 'Overview';
  if (segment === '$') return 'Details';
  if (segment.startsWith('$')) {
    const paramName = segment.slice(1);
    return `${paramName.charAt(0).toUpperCase()}${paramName.slice(1)} Details`;
  }

  return segment
    .split(/[-_]/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

/**
 * Generates hierarchical breadcrumbs from dot-notation feature key
 * e.g. "dashboard.admin.manage" -> [
 *   { label: "Dashboard", href: "/dashboard" },
 *   { label: "Admin", href: "/dashboard/admin" },
 *   { label: "Manage", href: "/dashboard/admin/manage", active: true }
 * ]
 */
export function generateBreadcrumbs(featureKey: string): BreadcrumbItem[] {
  if (!featureKey || featureKey === '_index') {
    return [{ label: 'Home', href: '/', active: true }];
  }

  const rawSegments = featureKey.split('.');
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  let currentPath = '';
  rawSegments.forEach((seg, idx) => {
    if (seg === '_index') return;

    const isParam = seg.startsWith('$');
    const pathSegment = isParam ? `:${seg.slice(1)}` : seg;
    currentPath += `/${pathSegment}`;

    const isLast = idx === rawSegments.length - 1;
    breadcrumbs.push({
      label: formatSegmentLabel(seg),
      href: isParam ? '' : currentPath,
      active: isLast,
    });
  });

  return breadcrumbs;
}

/**
 * Map a single dot-notation segment to a React Router path segment.
 * - `$`      → `*`        (bare dollar = splat/catch-all wildcard)
 * - `$param` → `:param`   (named dynamic segment)
 * - other    → unchanged
 */
function mapSegment(p: string): string {
  if (p === '$') return '*';
  if (p.startsWith('$')) return `:${p.slice(1)}`;
  return p;
}

/**
 * Converts dot-notation feature key to React Router URL pattern.
 *
 * Special conventions:
 *  - `$param`  → `:param`  (dynamic segment)
 *  - `$`       → `*`       (splat / catch-all wildcard)
 *  - `_index`  → index route for parent path
 *
 * Examples:
 *  - `app.order-list`   → `app/order-list`
 *  - `app.$`            → `app/*`          (catch-all for /app/*)
 *  - `$`                → `*`              (root catch-all)
 *  - `customer.$id`     → `customer/:id`
 */
export function dotNotationToRoutePath(featureKey: string): {
  isIndex: boolean;
  routePath: string;
} {
  if (featureKey === '_index') {
    return { isIndex: true, routePath: '' };
  }

  const parts = featureKey.split('.');
  const lastPart = parts[parts.length - 1];

  if (lastPart === '_index') {
    const parentParts = parts.slice(0, -1).map(mapSegment);
    return { isIndex: false, routePath: parentParts.join('/') };
  }

  const routePath = parts.map(mapSegment).join('/');

  return { isIndex: false, routePath };
}
