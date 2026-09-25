import { createPage, createMeta, cacheHeaders, CACHE_PRESETS, successResponse, type MetaAccessConfig } from '~/builder';
import { KatalogViewWidget } from '~/components/feature';

export const metaAccess: MetaAccessConfig = { roles: ['*'] };
export const meta = createMeta({
  title: 'Katalog Produk & Warna Kain — Kinau ID Workshop',
  description: 'Katalog digital flipbook resmi dan panduan warna kain seragam, jersey sublimasi, dan apparel Kinau ID.',
});
export const headers = cacheHeaders(CACHE_PRESETS.semiStatic);

export const loader = async () => successResponse({ status: 'ok' });
(loader as any).metaAccess = metaAccess;

export default createPage(() => KatalogViewWidget());
