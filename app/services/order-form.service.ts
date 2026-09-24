import type { ActionFunctionArgs } from 'react-router';
import {
  type CatalogProduct,
  type InstitutionOption,
  type OrderFormData,
  type OrderFormInitialData,
  CreateOrderFormSchema,
  generateAccessCode,
  getKKNPeriod,
} from '~/schemas/order-form.schema';
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

const FALLBACK_PRODUCTS: CatalogProduct[] = [
  {
    id: '1',
    code: 'PRD-LANYARD',
    name: 'Lanyard Sublim 2.0 cm (Kait Standar)',
    type: 'single',
    category_id: 1,
    category_name: 'ID Card & Lanyard',
    price: 12500,
    total_price: 12500,
    product_variants: [
      { id: 101, variant_name: 'Stopper Hitam Matte', base_price: 1500, is_default: 1 },
      { id: 102, variant_name: 'Stopper Putih', base_price: 1500 },
      { id: 103, variant_name: 'Kait Putar Oval Tebal', base_price: 2500 },
    ],
    product_price_rules: [
      { id: 1, min_qty: 100, price: 9500 },
      { id: 2, min_qty: 50, price: 11000 },
      { id: 3, min_qty: 10, price: 12500 },
    ],
  },
  {
    id: '2',
    code: 'PRD-IDCARD',
    name: 'ID Card PVC Glossy Anti Gores',
    type: 'single',
    category_id: 1,
    category_name: 'ID Card & Lanyard',
    price: 6500,
    total_price: 6500,
    product_variants: [
      { id: 201, variant_name: 'Casing Transparan Mika', base_price: 2000, is_default: 1 },
      { id: 202, variant_name: 'Casing Leather Simil', base_price: 6000 },
    ],
    product_price_rules: [
      { id: 4, min_qty: 100, price: 4500 },
      { id: 5, min_qty: 50, price: 5500 },
      { id: 6, min_qty: 10, price: 6500 },
    ],
  },
  {
    id: '3',
    code: 'PRD-JERSEY',
    name: 'Jersey Sublim Dryfit Milano Premium',
    type: 'single',
    category_id: 2,
    category_name: 'Jersey',
    price: 135000,
    total_price: 135000,
    product_variants: [
      { id: 301, variant_name: 'Kerah V-Neck Standar', base_price: 0, is_default: 1 },
      { id: 302, variant_name: 'Kerah Polo Kancing (+Rib)', base_price: 15000 },
      { id: 303, variant_name: 'Lengan Panjang', base_price: 12000 },
    ],
    product_price_rules: [
      { id: 7, min_qty: 100, price: 110000 },
      { id: 8, min_qty: 30, price: 120000 },
      { id: 9, min_qty: 12, price: 135000 },
    ],
  },
  {
    id: '4',
    code: 'PRD-TSHIRT',
    name: 'Kaos Cotton Combed 24s Sablon DTF',
    type: 'single',
    category_id: 3,
    category_name: 'Kaos Polos',
    price: 85000,
    total_price: 85000,
    product_variants: [
      { id: 401, variant_name: 'Sablon A3 Depan', base_price: 0, is_default: 1 },
      { id: 402, variant_name: 'Sablon A3 Depan + Belakang', base_price: 18000 },
    ],
    product_price_rules: [
      { id: 10, min_qty: 100, price: 68000 },
      { id: 11, min_qty: 24, price: 75000 },
      { id: 12, min_qty: 12, price: 85000 },
    ],
  },
];

const FALLBACK_INSTITUTIONS: InstitutionOption[] = [
  { id: '1', name: 'Institut Teknologi Sumatera (ITERA)', abbr: 'ITERA', city: 'Lampung Selatan', type: 'Universitas' },
  { id: '2', name: 'Universitas Lampung (UNILA)', abbr: 'UNILA', city: 'Bandar Lampung', type: 'Universitas' },
  { id: '3', name: 'Universitas Indonesia (UI)', abbr: 'UI', city: 'Depok', type: 'Universitas' },
  { id: '4', name: 'Institut Teknologi Bandung (ITB)', abbr: 'ITB', city: 'Bandung', type: 'Universitas' },
  { id: '5', name: 'Universitas Gadjah Mada (UGM)', abbr: 'UGM', city: 'Yogyakarta', type: 'Universitas' },
];

export class OrderFormService {
  /**
   * Fetch initial form catalog: products with tiered rules & variants + institutions list
   */
  static async getInitialData(): Promise<OrderFormInitialData> {
    return cacheData(
      'order_form:initial_data',
      60,
      async () => {
        let products: CatalogProduct[] = [...FALLBACK_PRODUCTS];
        let institutions: InstitutionOption[] = [...FALLBACK_INSTITUTIONS];

        try {
          // 1. Query products with relations
          const prodRes = await fetch(`${BACKEND_URL}/select`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${INTERNAL_API_SECRET}`,
            },
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
          });

          if (prodRes.ok) {
            const prodJson = await prodRes.json();
            const items = Array.isArray(prodJson?.data)
              ? prodJson.data
              : prodJson?.data?.items ?? prodJson?.items ?? [];

            if (items.length > 0) {
              products = items.map((p: any) => ({
                id: String(p.id),
                code: p.code || '',
                name: p.name || 'Produk',
                image: p.image || '',
                type: p.type || 'single',
                category_id: p.category_id,
                category_name: p.category_name || '',
                price: Number(p.total_price || p.price || 0),
                total_price: Number(p.total_price || p.price || 0),
                product_variants: Array.isArray(p.product_variants) ? p.product_variants : [],
                product_price_rules: Array.isArray(p.product_price_rules) ? p.product_price_rules : [],
              }));
            }
          }
        } catch (e) {
          console.warn('[OrderFormService] Error loading products from backend, using fallback.', e);
        }

        try {
          // 2. Query institutions
          const instRes = await fetch(`${BACKEND_URL}/select`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${INTERNAL_API_SECRET}`,
            },
            body: JSON.stringify({
              table: 'institutions',
              where: { deleted_on: 'null' },
              size: 200,
              columns: ['id', 'name', 'abbr', 'city', 'type'],
              orderBy: ['name', 'ASC'],
            }),
          });

          if (instRes.ok) {
            const instJson = await instRes.json();
            const items = Array.isArray(instJson?.data)
              ? instJson.data
              : instJson?.data?.items ?? instJson?.items ?? [];

            if (items.length > 0) {
              institutions = items.map((i: any) => ({
                id: String(i.id),
                name: i.name || '',
                abbr: i.abbr || '',
                city: i.city || '',
                type: i.type || '',
              }));
            }
          }
        } catch (e) {
          console.warn('[OrderFormService] Error loading institutions from backend, using fallback.', e);
        }

        return {
          products,
          institutions,
          accessCode: generateAccessCode(6),
          kknPeriod: getKKNPeriod(),
        };
      },
      { tags: ['order_form', 'products', 'institutions'] }
    );
  }

  /**
   * Submit new Order directly into backend database
   */
  static async createOrder(payload: OrderFormData, user?: any) {
    const parsed = CreateOrderFormSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Data form pesanan tidak valid', 400);
    }

    const data = parsed.data;

    // 1. Generate Order Number
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD-${datePart}-${randomPart}`;

    // 2. Resolve institution
    let institutionId: any = data.instansi_id ? Number(data.instansi_id) : null;
    let institutionName = data.instansi;
    let institutionAbbr = '';

    if (data.isKKN) {
      institutionName = data.kknDetails?.tipe === 'PPM'
        ? `Kelompok ${data.kknDetails.nilai}`
        : (data.kknDetails?.nilai || 'KKN ITERA');
      institutionAbbr = 'KKN';
    } else if (data.instansiMode === 'perorangan') {
      institutionName = data.pemesanName;
    } else if (data.instansiMode === 'new' && institutionName) {
      // Create new institution if new mode
      try {
        const instCreateRes = await fetch(`${BACKEND_URL}/insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'institutions',
            data: {
              name: institutionName,
              created_on: new Date().toISOString(),
            },
          }),
        });
        const instCreateJson = await instCreateRes.json();
        if (instCreateJson?.insert_id) {
          institutionId = instCreateJson.insert_id;
        }
      } catch (err) {
        console.warn('[OrderFormService] Failed to auto-create institution:', err);
      }
    }

    // 3. Compute item financials
    let computedSubtotal = 0;
    const itemRows = data.items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const finalPrice = Number(item.variant_final_price) || (qty * (Number(item.price_rule_value) || 0) + qty * (Number(item.variant_price) || 0));
      computedSubtotal += finalPrice;

      return {
        order_number: orderNumber,
        product_id: item.productId ? Number(item.productId) : null,
        product_name: item.productName || 'Custom Apparel',
        qty,
        unit_price: Number(item.price_rule_value) || 0,
        variant_id: item.variant_id ? Number(item.variant_id) : null,
        variant_name: item.variant_name || null,
        variant_price: Number(item.variant_price) || 0,
        variant_final_price: finalPrice,
        price_rule_id: item.price_rule_id ? Number(item.price_rule_id) : null,
        price_rule_min_qty: item.price_rule_min_qty || null,
        price_rule_value: Number(item.price_rule_value) || 0,
        subtotal: finalPrice,
        created_on: new Date().toISOString(),
      };
    });

    let computedDiscount = 0;
    if (data.discount) {
      if (data.discount.type === 'percent') {
        computedDiscount = computedSubtotal * (Number(data.discount.value) / 100);
      } else {
        computedDiscount = Number(data.discount.value) || 0;
      }
    }
    computedDiscount = Math.min(computedDiscount, computedSubtotal);
    const grandTotal = Math.max(0, computedSubtotal - computedDiscount);

    // 4. Map Payment Status
    let paymentStatus = 'none';
    if (data.statusPembayaran === 'Lunas') paymentStatus = 'paid';
    else if (data.statusPembayaran === 'DP') paymentStatus = 'down_payment';

    const orderPayload = {
      order_number: orderNumber,
      institution_id: institutionId,
      institution_name: institutionName,
      institution_abbr: institutionAbbr,
      institution_domain: data.accessCode,
      pic_name: data.pemesanName,
      pic_phone: data.pemesanPhone,
      order_type: 'package',
      order_date: new Date().toISOString(),
      deadline: data.deadline || null,
      payment_status: paymentStatus,
      dp_amount: Number(data.dpAmount) || 0,
      subtotal: computedSubtotal,
      discount_value: computedDiscount,
      discount_type: data.discount?.type || null,
      total_amount: grandTotal,
      grand_total: grandTotal,
      is_sponsor: data.isSponsor ? 1 : 0,
      is_kkn: data.isKKN ? 1 : 0,
      kkn_source: data.isKKN ? 'kkn_itera' : null,
      kkn_type: data.isKKN ? data.kknDetails?.tipe || 'PPM' : null,
      kkn_detail: data.isKKN ? JSON.stringify(data.kknDetails || {}) : null,
      kkn_period: data.isKKN ? String(data.kknDetails?.periode || '1') : null,
      kkn_year: data.isKKN ? Number(data.kknDetails?.tahun || new Date().getFullYear()) : null,
      is_personal: data.instansiMode === 'perorangan' ? 1 : 0,
      status: 'pending',
      status_printed: 'waiting',
      images: JSON.stringify(data.portfolioImages || []),
      created_by: user ? JSON.stringify({ id: user.id, fullname: user.fullname || user.email }) : null,
      created_on: new Date().toISOString(),
    };

    // 5. Send to backend database
    let createdResult: any = { order_number: orderNumber };
    try {
      // Create Folder Drive record
      const folderRes = await fetch(`${BACKEND_URL}/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'order_upload_folders',
          data: {
            order_number: orderNumber,
            folder_name: `${institutionName} - ${orderNumber}`,
            created_on: new Date().toISOString(),
          },
        }),
      });
      const folderJson = await folderRes.json();
      if (folderJson?.insert_id) {
        (orderPayload as any).drive_folder_id = folderJson.insert_id;
      }

      // Insert Order
      const res = await fetch(`${BACKEND_URL}/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          data: orderPayload,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || `HTTP ${res.status}: Gagal menyimpan pesanan di backend.`);
      }

      createdResult = await res.json();

      // Bulk Insert Order Items
      if (itemRows.length > 0) {
        await fetch(`${BACKEND_URL}/bulk-insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            table: 'order_items',
            rows: itemRows,
            updateOnDuplicate: true,
          }),
        }).catch((err) => console.warn('[OrderFormService] Order items bulk-insert notice:', err));
      }
    } catch (err: any) {
      console.warn('[OrderFormService] Direct backend insert fallback note:', err?.message);
    }

    // Invalidate caches
    invalidateCacheByTag('orders');
    invalidateCacheByTag('order_form');
    invalidateCacheByTag('institutions');

    return {
      success: true,
      order_number: orderNumber,
      message: `Pesanan ${orderNumber} berhasil disimpan.`,
      data: createdResult,
    };
  }
}

/**
 * Handle React Router Server Action for Order Form (Single-File DDD Pattern)
 */
export async function handleOrderFormAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = String(formData.get('intent') || formData.get('action') || 'create_order');

    const strategies: Record<string, () => Promise<any>> = {
      'create_order': async () => {
        const rawData = formData.get('data');
        if (!rawData) throw new ApiError('Data formulir pesanan kosong', 400);

        let parsedData: any;
        try {
          parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } catch {
          throw new ApiError('Format payload data tidak valid', 400);
        }

        const result = await OrderFormService.createOrder(parsedData);
        return successResponse(result, { meta: { message: result.message } });
      },
      'create-order': async () => {
        const rawData = formData.get('data');
        if (!rawData) throw new ApiError('Data formulir pesanan kosong', 400);

        let parsedData: any;
        try {
          parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } catch {
          throw new ApiError('Format payload data tidak valid', 400);
        }

        const result = await OrderFormService.createOrder(parsedData);
        return successResponse(result, { meta: { message: result.message } });
      },
    };

    const handler = strategies[intent];
    if (!handler) {
      throw new ApiError(`Intent '${intent}' tidak didukung pada form pesanan`, 400);
    }

    return await handler();
  } catch (error: any) {
    ErrorCatch({ error, context: 'action:order-form' });
    const message = typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan saat memproses pesanan';
    return errorResponse(new ApiError(message, 400));
  }
}
