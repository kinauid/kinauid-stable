import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, DataTableCard, modals, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type ProductState, PRODUCT_TABS } from '~/schemas/product.schema';
import { ProductService, handleProductAction } from '~/services/product.service';
import { getProductActiveFilterBadges, createProductTableColumns, createCategoryTableColumns, renderProductMobileCard, ProductExpandedRow } from '~/components/feature/ProductListWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff', 'manager'], permissions: ['product:read'] };
export const meta = createMeta({ title: 'Daftar Produk — Kinau ID', description: 'Kelola jenis barang, aturan harga grosir, variasi item, dan kategori.' });

export const loader = withMiddleware([withTelemetry('loader:app.product-list'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return ProductService.getProducts(extractUrlState<ProductState>(request, { tab: 'products', search: '', category: 'all', show_in_dashboard: 'all', page: 1 }));
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleProductAction(args);

export default createPage<InferLoader<typeof loader>, any, ProductState>(
  ({ data, urlState, updateUrlState, send, isLoading, isNavigating }) => Div(
    { className: 'w-full space-y-4' },
    urlState.tab === 'categories'
      ? DataTableCard<any>({
          title: 'Kategori Produk & Folder Drive', subtitle: 'Atur kategori produk dan struktur folder Google Drive default untuk alur produksi.',
          totalItems: data?.totalCategories ?? 0, isLoading: isLoading || isNavigating,
          stats: [
            { label: 'Total Kategori', value: `${data?.totalCategories ?? 0} Kategori`, icon: 'FolderCog', color: 'cyan', description: 'Master kategori aktif', trend: 'Master' },
            { label: 'Total Produk Terkait', value: `${data?.totalProducts ?? 0} Item`, icon: 'Tag', color: 'blue', description: 'Produk dalam katalog', trend: 'Katalog' },
            { label: 'Tampil di Dashboard', value: `${data?.activeInDashboardCount ?? 0} Aktif`, icon: 'Eye', color: 'green', description: 'Siap diorder customer', trend: 'Live' },
          ],
          tabs: PRODUCT_TABS, activeTab: urlState.tab, onTabChange: (tab) => updateUrlState({ tab: tab as any }),
          searchValue: urlState.search, onSearchChange: (search) => updateUrlState({ search }),
          mainActions: [{ action: 'add', label: 'Kategori Baru', onClick: () => modals.open('CREATE_CATEGORY_MODAL', { onSubmit: (v: any) => send.submit({ intent: 'create_category', ...v }, { method: 'post' }) }) }],
          columns: createCategoryTableColumns(send), data: data?.categories ?? [],
        })
      : DataTableCard<any>({
          title: 'Daftar Produk', subtitle: 'Atur jenis barang, aturan harga grosir berjenjang, variasi item, dan visibilitas di landing page.',
          totalItems: data?.products?.length ?? 0, isLoading: isLoading || isNavigating,
          stats: [
            { label: 'Total Produk Katalog', value: `${data?.totalProducts ?? 0} Produk`, icon: 'Tag', color: 'cyan', description: `${data?.totalCategories ?? 0} kategori aktif`, trend: `${data?.totalProducts ?? 0} item` },
            { label: 'Tampil di Dashboard', value: `${data?.activeInDashboardCount ?? 0} Produk`, icon: 'Eye', color: 'green', description: 'Tampil di form pemesanan', trend: 'Aktif' },
            { label: 'Kategori Produk', value: `${data?.totalCategories ?? 0} Master`, icon: 'FolderCog', color: 'amber', description: 'Folder drive terintegrasi', trend: 'Drive Auto' },
          ],
          banner: { title: 'Aturan Harga Grosir & Variasi Otomatis', description: 'Klik baris produk atau panah expand untuk melihat detail aturan harga grosir dan variasi.', icon: 'Tag' },
          tabs: PRODUCT_TABS, activeTab: urlState.tab || 'products', onTabChange: (tab) => updateUrlState({ tab: tab as any }),
          searchValue: urlState.search, onSearchChange: (search) => updateUrlState({ search }),
          mainActions: [{ action: 'add', label: 'Tambah Produk', onClick: () => modals.open('CREATE_PRODUCT_MODAL', { categories: data?.categories ?? [], onSubmit: (v: any) => send.submit({ intent: 'create_product', ...v }, { method: 'post' }) }) }],
          activeFilterCount: getProductActiveFilterBadges(urlState, data?.categories ?? [], updateUrlState).length,
          activeFilters: getProductActiveFilterBadges(urlState, data?.categories ?? [], updateUrlState),
          onFilterClick: () => modals.open('PRODUCT_FILTER_MODAL', { filters: urlState, categories: data?.categories ?? [], onApply: (f: any) => updateUrlState(f), onReset: () => updateUrlState({ category: 'all', show_in_dashboard: 'all' }) }),
          onResetFilters: () => updateUrlState({ search: '', category: 'all', show_in_dashboard: 'all' }),
          expandableRows: true, expandOnRowClicked: true, renderExpandedRow: (product) => ProductExpandedRow(product),
          columns: createProductTableColumns(send, data?.categories ?? []), data: data?.products ?? [],
          renderMobileCard: (product, idx) => renderProductMobileCard(product, idx, send, data?.categories ?? []),
        })
  ),
  { defaultState: { tab: 'products', search: '', category: 'all', show_in_dashboard: 'all', page: 1 } }
);
