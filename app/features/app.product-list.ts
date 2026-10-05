import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type ProductState } from '~/schemas/product.schema';
import { ProductService, handleProductAction } from '~/services/product.service';
import { renderProductListFeature } from '~/components/feature/ProductListWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff', 'manager'], permissions: ['product:read'] };
export const meta = createMeta({ title: 'Daftar Produk — Kinau ID', description: 'Kelola jenis barang, aturan harga grosir, variasi item, dan kategori.' });

export const loader = withMiddleware([withTelemetry('loader:app.product-list'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return ProductService.getProducts(extractUrlState<ProductState>(request, { tab: 'products', search: '', category: 'all', show_in_dashboard: 'all', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleProductAction(args);

export default createPage<InferLoader<typeof loader>, any, ProductState>(
  ({ data, urlState, updateUrlState, send, isLoading, isNavigating }) =>
    renderProductListFeature({ data, urlState, updateUrlState, send, isLoading, isNavigating }),
  { defaultState: { tab: 'products', search: '', category: 'all', show_in_dashboard: 'all', page: 1 } }
);
