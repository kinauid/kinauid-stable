import type { ActionFunctionArgs } from 'react-router';
import {
  type ProductItem,
  type ProductCategoryItem,
  type ProductState,
  type ProductInitialData,
  CreateProductSchema,
  CreateProductCategorySchema,
} from '~/schemas/product.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_KINAU_BACKEND_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_KINAU_BACKEND_URL) ||
  'https://kinauid-backend.vercel.app';

const INTERNAL_API_SECRET =
  (typeof process !== 'undefined' && process.env?.INTERNAL_API_SECRET) ||
  'REPLACE_WITH_STRONG_KEY';

// ============================================================================
// Fallback Data (Offline & Development Mode)
// ============================================================================

const FALLBACK_CATEGORIES: ProductCategoryItem[] = [
  {
    id: 1,
    name: 'ID Card & Lanyard',
    description: 'Aksesoris identitas kampus, seminar, dan event.',
    default_drive_folders: JSON.stringify([
      { name: '01. ID Card Depan', is_card_front: true, is_card_back: false, is_lanyard: false, is_sablon_depan: false, is_sablon_belakang: false },
      { name: '02. ID Card Belakang', is_card_front: false, is_card_back: true, is_lanyard: false, is_sablon_depan: false, is_sablon_belakang: false },
      { name: '03. File Lanyard Sublim', is_card_front: false, is_card_back: false, is_lanyard: true, is_sablon_depan: false, is_sablon_belakang: false },
    ]),
  },
  {
    id: 2,
    name: 'Jersey Sublimasi',
    description: 'Jersey olahraga full print printing sublim.',
    default_drive_folders: JSON.stringify([
      { name: '01. Mockup Jersey', is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: true, is_sablon_belakang: false },
      { name: '02. Pola Depan Belakang', is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: true, is_sablon_belakang: true },
      { name: '03. Pola Lengan & Kerah', is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: false, is_sablon_belakang: false },
    ]),
  },
  {
    id: 3,
    name: 'Kaos & Sablon DTF',
    description: 'Kaos katun combed dengan sablon DTF/Plastisol.',
    default_drive_folders: JSON.stringify([
      { name: '01. Mockup Kaos', is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: true, is_sablon_belakang: false },
      { name: '02. File Sablon High-Res', is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: true, is_sablon_belakang: true },
    ]),
  },
  {
    id: 4,
    name: 'Paket KKN & Wisuda',
    description: 'Paket lengkap perlengkapan mahasiswa KKN & wisudawan.',
    default_drive_folders: JSON.stringify([
      { name: '01. ID Card KKN', is_card_front: true, is_card_back: true, is_lanyard: false, is_sablon_depan: false, is_sablon_belakang: false },
      { name: '02. Lanyard KKN', is_card_front: false, is_card_back: false, is_lanyard: true, is_sablon_depan: false, is_sablon_belakang: false },
      { name: '03. Kaos / Polo KKN', is_card_front: false, is_card_back: false, is_lanyard: false, is_sablon_depan: true, is_sablon_belakang: true },
    ]),
  },
];

const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    id: 1,
    code: 'PRD-LANYARD',
    name: 'Lanyard Sublim 2.0 cm (Kait Standar)',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
    type: 'single',
    category_id: 1,
    category_name: 'ID Card & Lanyard',
    description: 'Lanyard cetak sublim full colour 2 sisi dengan stopper dan kait oval.',
    price: 12500,
    total_price: 12500,
    show_in_dashboard: 1,
    product_variants: [
      { id: 101, variant_name: 'Stopper Hitam Matte', base_price: 1500, is_default: 1 },
      { id: 102, variant_name: 'Stopper Putih', base_price: 1500, is_default: 0 },
      { id: 103, variant_name: 'Kait Putar Oval Tebal', base_price: 2500, is_default: 0 },
    ],
    product_price_rules: [
      { id: 1, min_qty: 100, price: 9500 },
      { id: 2, min_qty: 50, price: 11000 },
      { id: 3, min_qty: 10, price: 12500 },
    ],
  },
  {
    id: 2,
    code: 'PRD-IDCARD',
    name: 'ID Card PVC Glossy Anti Gores',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80',
    type: 'single',
    category_id: 1,
    category_name: 'ID Card & Lanyard',
    description: 'Kartu PVC tebal 0.76mm standar ATM dengan laminasi glossy tahan air.',
    price: 6500,
    total_price: 6500,
    show_in_dashboard: 1,
    product_variants: [
      { id: 201, variant_name: 'Casing Transparan Mika', base_price: 2000, is_default: 1 },
      { id: 202, variant_name: 'Casing Kulit Sintetis', base_price: 6000, is_default: 0 },
    ],
    product_price_rules: [
      { id: 4, min_qty: 100, price: 4500 },
      { id: 5, min_qty: 50, price: 5500 },
      { id: 6, min_qty: 10, price: 6500 },
    ],
  },
  {
    id: 3,
    code: 'PRD-JERSEY-MILANO',
    name: 'Jersey Dryfit Milano Full Sublim',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80',
    type: 'single',
    category_id: 2,
    category_name: 'Jersey Sublimasi',
    description: 'Bahan Milano premium adem bertekstur zigzag dengan warna tajam anti luntur.',
    price: 125000,
    total_price: 125000,
    show_in_dashboard: 1,
    product_variants: [
      { id: 301, variant_name: 'Lengan Pendek Standar', base_price: 0, is_default: 1 },
      { id: 302, variant_name: 'Lengan Panjang (+ Manset)', base_price: 15000, is_default: 0 },
      { id: 303, variant_name: 'Kerah Wangki / Polo', base_price: 10000, is_default: 0 },
    ],
    product_price_rules: [
      { id: 7, min_qty: 50, price: 110000 },
      { id: 8, min_qty: 24, price: 118000 },
      { id: 9, min_qty: 12, price: 125000 },
    ],
  },
  {
    id: 4,
    code: 'PRD-PAKET-KKN',
    name: 'Paket KKN Champion (Kaos + ID Card + Lanyard)',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80',
    type: 'package',
    category_id: 4,
    category_name: 'Paket KKN & Wisuda',
    description: 'Bundling komplit seragam KKN mahasiswa termasuk kaos sablon DTF dan name tag.',
    price: 135000,
    total_price: 135000,
    show_in_dashboard: 1,
    product_variants: [
      { id: 401, variant_name: 'Paket Reguler Basic', base_price: 0, is_default: 1 },
      { id: 402, variant_name: 'Paket Pro (+ Topi Rimba)', base_price: 25000, is_default: 0 },
    ],
    product_price_rules: [
      { id: 10, min_qty: 50, price: 120000 },
      { id: 11, min_qty: 25, price: 128000 },
      { id: 12, min_qty: 10, price: 135000 },
    ],
  },
];

// ============================================================================
// Service Implementation
// ============================================================================

export const ProductService = {
  /**
   * Get initial product catalog and categories with caching & defensive fallback
   */
  async getProducts(state: ProductState = {}): Promise<ProductInitialData> {
    const cacheKey = `products_list_${JSON.stringify(state)}`;

    return cacheData(
      cacheKey,
      30,
      async () => {
        let products: ProductItem[] = [...FALLBACK_PRODUCTS];
        let categories: ProductCategoryItem[] = [...FALLBACK_CATEGORIES];

        // Parallel fetch categories and products with resilient timeout
        const [catSettled, prodSettled] = await Promise.allSettled([
          fetch(`${BACKEND_URL}/select`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${INTERNAL_API_SECRET}`,
            },
            signal: AbortSignal.timeout(6000),
            body: JSON.stringify({
              table: 'product_categories',
              where: { deleted_on: 'null' },
              size: 100,
              orderBy: ['name', 'ASC'],
            }),
          }),
          fetch(`${BACKEND_URL}/select`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${INTERNAL_API_SECRET}`,
            },
            signal: AbortSignal.timeout(6000),
            body: JSON.stringify({
              table: 'products',
              where: { deleted_on: 'null' },
              size: 100,
              orderBy: ['created_on', 'DESC'],
              include: [
                {
                  table: 'product_price_rules',
                  alias: 'product_price_rules',
                  foreign_key: 'product_id',
                  reference_key: 'id',
                  where: { deleted_on: 'null' },
                  columns: ['id', 'min_qty', 'price'],
                },
                {
                  table: 'product_variants',
                  alias: 'product_variants',
                  foreign_key: 'product_id',
                  reference_key: 'id',
                  where: { deleted_on: 'null' },
                  columns: ['id', 'variant_name', 'base_price', 'is_default'],
                },
              ],
            }),
          }),
        ]);

        // 1. Process Categories
        if (catSettled.status === 'fulfilled' && catSettled.value.ok) {
          try {
            const catJson = await catSettled.value.json();
            const items = Array.isArray(catJson?.data)
              ? catJson.data
              : catJson?.data?.items ?? catJson?.items ?? [];

            if (items.length > 0) {
              categories = items.map((c: any) => ({
                id: c.id,
                uid: c.uid,
                name: c.name || 'Kategori',
                description: (!c.description || c.description === 'undefined' || c.description === 'null') ? '' : c.description,
                default_drive_folders: c.default_drive_folders,
                created_on: c.created_on,
                deleted: c.deleted ?? 0,
              }));
            }
          } catch (err) {
            ErrorCatch({ error: err, context: 'ProductService:parseCategories' });
          }
        }

        // 2. Process Products
        if (prodSettled.status === 'fulfilled' && prodSettled.value.ok) {
          try {
            const prodJson = await prodSettled.value.json();
            const items = Array.isArray(prodJson?.data)
              ? prodJson.data
              : prodJson?.data?.items ?? prodJson?.items ?? [];

            if (items.length > 0) {
              products = items.map((p: any) => {
                const matchedCat = categories.find((c) => String(c.id) === String(p.category_id));
                const priceRules = Array.isArray(p.product_price_rules)
                  ? p.product_price_rules
                  : typeof p.product_price_rules === 'string'
                  ? JSON.parse(p.product_price_rules || '[]')
                  : [];
                const variants = Array.isArray(p.product_variants)
                  ? p.product_variants
                  : typeof p.product_variants === 'string'
                  ? JSON.parse(p.product_variants || '[]')
                  : [];

                const rawName = String(p.name || '').trim();
                const name = (!rawName || rawName === 'undefined' || rawName === 'null') ? 'Produk' : rawName;
                const rawDesc = String(p.description || '').trim();
                const description = (!rawDesc || rawDesc === 'undefined' || rawDesc === 'null') ? '' : rawDesc;
                const rawImg = String(p.image || '').trim();
                const image = (!rawImg || rawImg === 'undefined' || rawImg === 'null') ? '' : rawImg;
                const rawCatName = String(matchedCat?.name || p.category_name || '').trim();
                const category_name = (!rawCatName || rawCatName === 'undefined' || rawCatName === 'null') ? 'Lainnya' : rawCatName;

                return {
                  id: p.id,
                  uid: p.uid,
                  code: p.code || '',
                  name,
                  image,
                  type: p.type || 'single',
                  category_id: p.category_id,
                  category_name,
                  description,
                  price: Number(p.total_price || p.price || 0),
                  total_price: Number(p.total_price || p.price || 0),
                  show_in_dashboard: p.show_in_dashboard ?? 1,
                  product_price_rules: priceRules,
                  product_variants: variants,
                  created_on: p.created_on,
                  deleted: p.deleted ?? 0,
                };
              });
            }
          } catch (err) {
            ErrorCatch({ error: err, context: 'ProductService:parseProducts' });
          }
        }

        // 3. Count products per category
        categories = categories.map((cat) => ({
          ...cat,
          product_count: products.filter((p) => String(p.category_id) === String(cat.id)).length,
        }));

        // 4. Apply Filters
        let filteredProducts = [...products];

        if (state.search) {
          const q = state.search.toLowerCase();
          filteredProducts = filteredProducts.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.description && p.description.toLowerCase().includes(q)) ||
              (p.category_name && p.category_name.toLowerCase().includes(q)) ||
              (p.code && p.code.toLowerCase().includes(q))
          );
        }

        if (state.category && state.category !== 'all') {
          filteredProducts = filteredProducts.filter(
            (p) =>
              String(p.category_id) === String(state.category) ||
              p.category_name?.toLowerCase() === state.category?.toLowerCase()
          );
        }

        if (state.show_in_dashboard && state.show_in_dashboard !== 'all') {
          const isShow = state.show_in_dashboard === '1';
          filteredProducts = filteredProducts.filter(
            (p) => Boolean(+p.show_in_dashboard!) === isShow
          );
        }

        const totalProducts = products.length;
        const totalCategories = categories.length;
        const activeInDashboardCount = products.filter((p) => +(p.show_in_dashboard ?? 0) > 0).length;

        const categoryOptions = categories.map((c) => ({
          value: c.id,
          label: c.name,
          data: c,
        }));

        return {
          products: filteredProducts,
          categories,
          totalProducts,
          totalCategories,
          activeInDashboardCount,
          categoryOptions,
        };
      },
      { tags: ['products'] }
    );
  },

  /**
   * Create or Update Product
   */
  async createOrUpdateProduct(payload: Record<string, any>) {
    try {
      const id = payload.id ? Number(payload.id) : 0;
      const name = String(payload.name || '').trim();
      const description = String(payload.description || '').trim();
      const image = String(payload.image || '').trim();
      const category_id = payload.category_id ? Number(payload.category_id) : null;
      const category_name = payload.category_name || null;
      const type = ['single', 'package', 'material'].includes(payload.type) ? payload.type : 'single';
      const show_in_dashboard = +(payload.show_in_dashboard ?? 1) ? 1 : 0;

      let price_rules: any[] = [];
      let variants: any[] = [];

      try {
        price_rules = typeof payload.product_price_rules === 'string'
          ? JSON.parse(payload.product_price_rules)
          : Array.isArray(payload.product_price_rules)
          ? payload.product_price_rules
          : [];
      } catch {}

      try {
        variants = typeof payload.product_variants === 'string'
          ? JSON.parse(payload.product_variants)
          : Array.isArray(payload.product_variants)
          ? payload.product_variants
          : [];
      } catch {}

      // Calculate base price
      const defaultVariant = variants.find((v: any) => +v.is_default === 1);
      const basePrice = defaultVariant
        ? Number(defaultVariant.base_price || 0)
        : price_rules.length > 0
        ? Number(price_rules[0].price || 0)
        : Number(payload.price || payload.total_price || 0);

      const productPayload: any = {
        name,
        description,
        image,
        category_id,
        category_name,
        type,
        total_price: basePrice,
        subtotal: basePrice,
        show_in_dashboard,
      };

      if (!id) {
        productPayload.code = `PRD-${Date.now().toString().slice(-6)}`;
      }

      let savedProduct: any = null;

      if (id > 0) {
        // Update Product Header
        const updateRes = await fetch(`${BACKEND_URL}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'products',
            data: productPayload,
            where: { id },
          }),
        });

        if (!updateRes.ok) {
          const errJson = await updateRes.json().catch(() => ({}));
          throw new Error(errJson?.message || 'Gagal memperbarui data produk di backend.');
        }

        savedProduct = { id, ...productPayload };

        // Soft delete old price rules and variants to sync fresh rows
        await fetch(`${BACKEND_URL}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'product_price_rules',
            where: { product_id: id },
          }),
        }).catch(() => {});

        await fetch(`${BACKEND_URL}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'product_variants',
            where: { product_id: id },
          }),
        }).catch(() => {});
      } else {
        // Insert Product Header
        const insertRes = await fetch(`${BACKEND_URL}/insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'products',
            data: productPayload,
          }),
        });

        if (!insertRes.ok) {
          const errJson = await insertRes.json().catch(() => ({}));
          throw new Error(errJson?.message || 'Gagal menambahkan produk baru ke backend.');
        }

        const resData = await insertRes.json();
        savedProduct = resData?.data || { id: Date.now(), ...productPayload };
      }

      const targetProductId = Number(savedProduct?.id || id);

      // Insert fresh price rules
      if (targetProductId > 0 && price_rules.length > 0) {
        const ruleRows = price_rules.map((r: any) => ({
          product_id: targetProductId,
          min_qty: Number(r.min_qty || 1),
          price: Number(r.price || 0),
        }));

        await fetch(`${BACKEND_URL}/bulk-insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'product_price_rules',
            data: ruleRows,
          }),
        }).catch((e) => console.warn('[ProductService] Error inserting price rules:', e));
      }

      // Insert fresh variants
      if (targetProductId > 0 && variants.length > 0) {
        const variantRows = variants.map((v: any) => ({
          product_id: targetProductId,
          variant_name: String(v.variant_name || 'Standar'),
          base_price: Number(v.base_price || 0),
          is_default: +v.is_default === 1 ? 1 : 0,
        }));

        await fetch(`${BACKEND_URL}/bulk-insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'product_variants',
            data: variantRows,
          }),
        }).catch((e) => console.warn('[ProductService] Error inserting variants:', e));
      }

      invalidateCacheByTag('products');
      invalidateCacheByTag('order-form');

      return savedProduct;
    } catch (err: any) {
      ErrorCatch({ error: err, context: 'ProductService:createOrUpdateProduct' });
      throw err;
    }
  },

  /**
   * Delete Product
   */
  async deleteProduct(id: string | number) {
    try {
      const prodId = Number(id);
      const res = await fetch(`${BACKEND_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'products',
          where: { id: prodId },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || 'Gagal menghapus produk.');
      }

      // Soft delete related relations
      await fetch(`${BACKEND_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'product_price_rules',
          where: { product_id: prodId },
        }),
      }).catch(() => {});

      await fetch(`${BACKEND_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'product_variants',
          where: { product_id: prodId },
        }),
      }).catch(() => {});

      invalidateCacheByTag('products');
      invalidateCacheByTag('order-form');
      return true;
    } catch (err: any) {
      ErrorCatch({ error: err, context: 'ProductService:deleteProduct' });
      throw err;
    }
  },

  /**
   * Duplicate Product
   */
  async duplicateProduct(product: Partial<ProductItem>) {
    try {
      const copyPayload = {
        name: `${product.name || 'Produk'} (Copy)`,
        category_id: product.category_id,
        category_name: product.category_name,
        description: product.description || '',
        image: product.image || '',
        type: product.type || 'single',
        show_in_dashboard: product.show_in_dashboard ?? 1,
        product_price_rules: product.product_price_rules || [],
        product_variants: product.product_variants || [],
      };

      return await this.createOrUpdateProduct(copyPayload);
    } catch (err: any) {
      ErrorCatch({ error: err, context: 'ProductService:duplicateProduct' });
      throw err;
    }
  },

  /**
   * Create or Update Category
   */
  async createOrUpdateCategory(payload: Record<string, any>) {
    try {
      const id = payload.id ? Number(payload.id) : 0;
      const name = String(payload.name || '').trim();
      const description = String(payload.description || '').trim();
      const default_drive_folders = typeof payload.default_drive_folders === 'string'
        ? payload.default_drive_folders
        : JSON.stringify(payload.default_drive_folders || []);

      const catData: any = {
        name,
        description,
        default_drive_folders,
      };

      if (id > 0) {
        const updateRes = await fetch(`${BACKEND_URL}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'product_categories',
            data: catData,
            where: { id },
          }),
        });

        if (!updateRes.ok) {
          const errJson = await updateRes.json().catch(() => ({}));
          throw new Error(errJson?.message || 'Gagal memperbarui kategori produk.');
        }
      } else {
        const insertRes = await fetch(`${BACKEND_URL}/insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'product_categories',
            data: catData,
          }),
        });

        if (!insertRes.ok) {
          const errJson = await insertRes.json().catch(() => ({}));
          throw new Error(errJson?.message || 'Gagal menambahkan kategori produk baru.');
        }
      }

      invalidateCacheByTag('products');
      invalidateCacheByTag('order-form');
      return true;
    } catch (err: any) {
      ErrorCatch({ error: err, context: 'ProductService:createOrUpdateCategory' });
      throw err;
    }
  },

  /**
   * Delete Category
   */
  async deleteCategory(id: string | number) {
    try {
      const catId = Number(id);
      const res = await fetch(`${BACKEND_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'product_categories',
          where: { id: catId },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || 'Gagal menghapus kategori produk.');
      }

      invalidateCacheByTag('products');
      invalidateCacheByTag('order-form');
      return true;
    } catch (err: any) {
      ErrorCatch({ error: err, context: 'ProductService:deleteCategory' });
      throw err;
    }
  },
};

// ============================================================================
// Action Strategy Dispatcher (Single-File Architecture Standard)
// ============================================================================

export async function handleProductAction({ request }: ActionFunctionArgs) {
  let intent = '';
  try {
    let payload: Record<string, any> = {};

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = Object.fromEntries(formData);
    }

    intent = String(payload.intent || '').trim();

    switch (intent) {
      case 'create_product':
      case 'update_product': {
        const saved = await ProductService.createOrUpdateProduct(payload);
        const isUpdate = Boolean(payload.id && Number(payload.id) > 0);
        return successResponse({
          product: saved,
          message: isUpdate ? 'Produk berhasil diperbarui' : 'Produk baru berhasil ditambahkan',
        });
      }

      case 'delete_product': {
        const id = payload.id;
        if (!id) return errorResponse('ID produk wajib diisi untuk menghapus', 400);
        await ProductService.deleteProduct(id);
        return successResponse({ message: 'Produk berhasil dihapus' });
      }

      case 'duplicate_product': {
        let parsedRules = [];
        let parsedVariants = [];
        try { parsedRules = JSON.parse(payload.product_price_rules || '[]'); } catch {}
        try { parsedVariants = JSON.parse(payload.product_variants || '[]'); } catch {}

        await ProductService.duplicateProduct({
          ...payload,
          product_price_rules: parsedRules,
          product_variants: parsedVariants,
        });
        return successResponse({ message: 'Produk berhasil diduplikasi' });
      }

      case 'create_category':
      case 'update_category': {
        await ProductService.createOrUpdateCategory(payload);
        const isUpdate = Boolean(payload.id && Number(payload.id) > 0);
        return successResponse({
          message: isUpdate ? 'Kategori berhasil diperbarui' : 'Kategori baru berhasil ditambahkan',
        });
      }

      case 'delete_category': {
        const id = payload.id;
        if (!id) return errorResponse('ID kategori wajib diisi untuk menghapus', 400);
        await ProductService.deleteCategory(id);
        return successResponse({ message: 'Kategori berhasil dihapus' });
      }

      case 'toggle_dashboard': {
        const id = Number(payload.id);
        const currentVal = +(payload.show_in_dashboard ?? 0);
        const newVal = currentVal > 0 ? 0 : 1;
        await fetch(`${BACKEND_URL}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'products',
            data: { show_in_dashboard: newVal },
            where: { id },
          }),
        });
        invalidateCacheByTag('products');
        return successResponse({
          show_in_dashboard: newVal,
          message: newVal === 1 ? 'Produk ditampilkan di dashboard' : 'Produk disembunyikan dari dashboard',
        });
      }

      default:
        return errorResponse(`Intent '${intent}' tidak dikenali.`, 400);
    }
  } catch (error: any) {
    ErrorCatch({ error, context: `handleProductAction:${intent}` });
    const errMessage = typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan sistem';
    return errorResponse(errMessage, 400);
  }
}
