import type { ActionFunctionArgs } from 'react-router';
import {
  OrderItemSchema,
  JerseyConfigSchema,
  type OrderItem,
  type OrderState,
  type JerseyConfig,
} from '~/schemas/order.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch, apiFetch } from '~/lib/api';

let ORDERS_DB: OrderItem[] = [
  {
    id: 'ord-101',
    order_number: 'KNU-2026-089',
    customer_name: 'Bima Satria',
    customer_phone: '081234567890',
    institution_name: 'BEM Universitas Airlangga',
    is_kkn: false,
    product_name: 'Lanyard Sublim 2.5cm + ID Card Glossy',
    category: 'ID Card & Lanyard',
    total_qty: 850,
    unit_price: 12500,
    subtotal: 10625000,
    discount: 625000,
    grand_total: 10000000,
    status: 'in_production',
    status_printed: 'printed',
    payment_status: 'partial_dp',
    created_at: '2026-03-14',
    deadline_at: '2026-03-28',
    notes: 'Kait stopper hitam matte, packaging per 50 pcs.',
  },
  {
    id: 'ord-102',
    order_number: 'KNU-2026-090',
    customer_name: 'Dwi Prasetyo',
    customer_phone: '085712345678',
    institution_name: 'KKN PPM UGM Kelompok 12',
    is_kkn: true,
    kkn_type: 'PPM',
    kkn_period: '2026',
    kkn_detail: 'Desa Sumberagung',
    product_name: 'Jersey KKN Dryfit Milano Full Print',
    category: 'Jersey',
    total_qty: 35,
    unit_price: 125000,
    subtotal: 4375000,
    discount: 0,
    grand_total: 4375000,
    status: 'ready_to_ship',
    status_printed: 'printed',
    payment_status: 'paid',
    created_at: '2026-03-10',
    deadline_at: '2026-03-24',
    notes: 'Sudah lunas via transfer BCA.',
  },
  {
    id: 'ord-103',
    order_number: 'KNU-2026-091',
    customer_name: 'Sarah Amalia',
    customer_phone: '081987654321',
    institution_name: 'PT Telkom Regional V',
    is_kkn: false,
    product_name: 'Polo Shirt Lacoste Bordir Komputer',
    category: 'Polo Shirt',
    total_qty: 50,
    unit_price: 120000,
    subtotal: 6000000,
    discount: 0,
    grand_total: 6000000,
    status: 'completed',
    status_printed: 'printed',
    payment_status: 'paid',
    created_at: '2026-03-05',
    deadline_at: '2026-03-18',
    notes: 'Bordir dada kiri dan punggung.',
  },
  {
    id: 'ord-104',
    order_number: 'KNU-2026-092',
    customer_name: 'Rian Pratama',
    customer_phone: '082188887777',
    institution_name: 'Komunitas Badminton Surabaya',
    is_kkn: false,
    product_name: 'Kaos Sablon DTF Komunitas',
    category: 'Kaos Polos',
    total_qty: 25,
    unit_price: 85000,
    subtotal: 2125000,
    discount: 0,
    grand_total: 2125000,
    status: 'ordered',
    status_printed: 'unprinted',
    payment_status: 'unpaid',
    created_at: '2026-03-18',
    deadline_at: '2026-04-02',
    notes: 'Menunggu konfirmasi final mockup ukuran XL.',
  },
  {
    id: 'ord-105',
    order_number: 'KNU-2026-093',
    customer_name: 'Nadia Salsabila',
    customer_phone: '081122334455',
    institution_name: 'KKN Mandiri Unair Periode II',
    is_kkn: true,
    kkn_type: 'Mandiri',
    kkn_period: '2026',
    kkn_detail: 'Desa Karangmojo',
    product_name: 'Hoodie Zipper Bordir Komputer',
    category: 'Jaket / Hoodie',
    total_qty: 30,
    unit_price: 185000,
    subtotal: 5550000,
    discount: 150000,
    grand_total: 5400000,
    status: 'in_design',
    status_printed: 'unprinted',
    payment_status: 'partial_dp',
    created_at: '2026-03-16',
    deadline_at: '2026-03-30',
    notes: 'Revisi warna tali hoodie.',
  },
];

const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_KINAU_BACKEND_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_KINAU_BACKEND_URL) ||
  'https://kinauid-backend.vercel.app';

const INTERNAL_API_SECRET =
  (typeof process !== 'undefined' && process.env?.INTERNAL_API_SECRET) ||
  'REPLACE_WITH_STRONG_KEY';

let SAVED_CONFIGS_DB: Array<JerseyConfig & { id: string; created_at: string }> = [];

export class OrderService {
  /**
   * Fetch real orders from Kinau Backend API with caching & fallback
   */
  static async getOrders(state: OrderState = {}) {
    return cacheData(
      `orders_list:${JSON.stringify(state)}`,
      60,
      async () => {
        try {
          const where: Record<string, any> = { deleted_on: 'null' };

          // Tab filtering: reguler (is_kkn = 0) vs KKN (is_kkn = 1)
          if (state.tab === 'kkn') {
            where.is_kkn = 1;
          } else if (state.tab === 'reguler' || !state.tab) {
            where.is_kkn = 0;
          }

          // Status filter
          if (state.status && state.status !== 'all') {
            where.status = state.status;
          }

          // Payment status filter
          if (state.payment_status && state.payment_status !== 'all') {
            if (state.payment_status === 'partial_dp') {
              where.payment_status = 'down_payment';
            } else if (state.payment_status === 'unpaid') {
              where.payment_status = 'none';
            } else {
              where.payment_status = state.payment_status;
            }
          }

          // Year filter
          if (state.year) {
            where['year:order_date'] = parseInt(state.year, 10);
          }

          // Sorting
          let orderBy: [string, string] = ['created_on', 'desc'];
          if (state.sortBy) {
            const [col, dir] = state.sortBy.split(':');
            if (col) {
              orderBy = [col, dir === 'asc' ? 'asc' : 'desc'];
            }
          }

          const requestBody: any = {
            table: 'orders',
            columns: [
              'id',
              'uid',
              'order_number',
              'institution_id',
              'institution_name',
              'institution_abbr',
              'institution_domain',
              'order_type',
              'images',
              'review',
              'rating',
              'payment_status',
              'payment_method',
              'payment_proof',
              'payment_detail',
              'dp_payment_proof',
              'dp_payment_detail',
              'discount_value',
              'order_date',
              'shipping_fee',
              'subtotal',
              'total_amount',
              'dp_amount',
              'grand_total',
              'is_sponsor',
              'is_kkn',
              'is_archive',
              'kkn_source',
              'kkn_type',
              'kkn_detail',
              'kkn_period',
              'kkn_year',
              'is_personal',
              'pic_name',
              'pic_phone',
              'drive_folder_id',
              'status',
              'status_printed',
              'deadline',
              'created_on',
              'created_by',
            ],
            where,
            include: [
              {
                table: 'order_items',
                alias: 'order_items',
                foreign_key: 'order_number',
                reference_key: 'order_number',
                where: { deleted_on: 'null' },
                columns: [
                  'id',
                  'product_id',
                  'product_name',
                  'qty',
                  'unit_price',
                  'subtotal',
                  'variant_name',
                  'variant_price',
                  'variant_final_price',
                ],
              },
            ],
            page: Math.max(0, (state.page || 1) - 1),
            size: 50,
            orderBy,
          };

          if (state.search) {
            requestBody.search = state.search;
            requestBody.searchBy =
              'order_number,institution_name,institution_abbr,institution_domain,pic_name';
          }

          const response = await fetch(`${BACKEND_URL}/select`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${INTERNAL_API_SECRET}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const res = await response.json();
            const rawItems = Array.isArray(res?.data)
              ? res.data
              : res?.data?.items ?? res?.items ?? [];

            let orders: OrderItem[] = rawItems.map((raw: any) => {
              const orderItems = Array.isArray(raw.order_items) ? raw.order_items : [];
              const primaryProduct =
                orderItems[0]?.product_name || raw.order_type || 'Pesanan Custom';
              const totalQty =
                orderItems.reduce((sum: number, it: any) => sum + (Number(it.qty) || 0), 0) ||
                Number(raw.total_product) ||
                1;
              const grandTotal =
                Number(raw.grand_total) ||
                Number(raw.total_amount) ||
                Number(raw.subtotal) ||
                0;
              const subtotal = Number(raw.subtotal) || grandTotal;
              const discount = Number(raw.discount_value) || 0;
              const unitPrice = orderItems[0]?.unit_price
                ? Number(orderItems[0].unit_price)
                : totalQty > 0
                ? Math.round(subtotal / totalQty)
                : grandTotal;

              // Normalize payment_status
              let pStatus = raw.payment_status || 'none';
              if (pStatus === 'none' || pStatus === 'unpaid') pStatus = 'unpaid';
              else if (pStatus === 'down_payment' || pStatus === 'partial_dp') pStatus = 'partial_dp';
              else if (pStatus === 'paid') pStatus = 'paid';

              // Normalize status
              let sStatus = raw.status || 'pending';
              if (sStatus === 'done') sStatus = 'completed';

              // Normalize status_printed
              let sPrinted = raw.status_printed || 'waiting';
              if (sPrinted === 'done') sPrinted = 'printed';

              return {
                id: String(raw.id || raw.uid || raw.order_number),
                order_number: raw.order_number || `ORD-${raw.id}`,
                customer_name: raw.pic_name || raw.institution_name || 'Pelanggan Kinau',
                customer_phone: raw.pic_phone || '',
                institution_name: raw.institution_name || '',
                is_kkn: Boolean(+raw.is_kkn),
                kkn_type: raw.kkn_type || '',
                kkn_period: raw.kkn_period ? String(raw.kkn_period) : '',
                kkn_year: raw.kkn_year ? String(raw.kkn_year) : '',
                kkn_detail:
                  typeof raw.kkn_detail === 'string'
                    ? raw.kkn_detail
                    : raw.kkn_detail?.value || '',
                product_name: primaryProduct,
                category: raw.category || raw.order_type || 'Jersey',
                total_qty: totalQty,
                unit_price: unitPrice,
                subtotal,
                discount,
                grand_total: grandTotal,
                status: sStatus,
                status_printed: sPrinted,
                payment_status: pStatus,
                payment_proof: raw.payment_proof || undefined,
                dp_payment_proof: raw.dp_payment_proof || undefined,
                created_at: raw.created_on
                  ? raw.created_on.split('T')[0]
                  : raw.order_date
                  ? raw.order_date.split('T')[0]
                  : '',
                deadline_at: raw.deadline ? raw.deadline.split('T')[0] : '',
                notes: raw.notes || '',
                order_items: orderItems,
                is_sponsor: Number(raw.is_sponsor) || 0,
                created_by: raw.created_by,
              };
            });

            // Client-side category filter if category is selected
            if (state.category && state.category !== 'all') {
              orders = orders.filter(
                (o) =>
                  o.category.toLowerCase().includes(state.category!.toLowerCase()) ||
                  o.product_name.toLowerCase().includes(state.category!.toLowerCase()) ||
                  o.order_items?.some((it) =>
                    it.product_name?.toLowerCase().includes(state.category!.toLowerCase())
                  )
              );
            }

            // Client-side KKN institution filter
            if (state.kkn_institution) {
              orders = orders.filter((o) =>
                (o.institution_name || '').toLowerCase().includes(state.kkn_institution!.toLowerCase())
              );
            }

            const totalCount = res?.summary?.total ?? res?.total_items ?? orders.length;
            const activePipelines = orders.filter(
              (o) => o.status !== 'completed' && o.status !== 'cancelled'
            ).length;
            const completedCount = orders.filter(
              (o) => o.status === 'completed'
            ).length;
            const readyToShipCount = orders.filter(
              (o) => o.status === 'ready_to_ship' || o.status === 'in_production' || o.status === 'confirmed'
            ).length;
            const printedCount = orders.filter(
              (o) => o.status_printed === 'printed'
            ).length;
            const unprintedCount = orders.filter(
              (o) => o.status_printed === 'waiting' || o.status_printed === 'unprinted'
            ).length;
            const totalRevenue = orders.reduce((sum, o) => sum + o.grand_total, 0);

            return {
              orders,
              totalCount,
              filteredCount: orders.length,
              activePipelines,
              completedCount,
              readyToShipCount,
              printedCount,
              unprintedCount,
              totalRevenue,
            };
          }
        } catch (err) {
          ErrorCatch({ error: err, context: 'OrderService:getOrders:apiFetch' });
        }

        // Local Database Fallback
        let items = [...ORDERS_DB];

        if (state.tab === 'reguler') {
          items = items.filter((o) => !o.is_kkn);
        } else if (state.tab === 'kkn') {
          items = items.filter((o) => Boolean(o.is_kkn));
        }

        if (state.search) {
          const q = state.search.toLowerCase();
          items = items.filter(
            (o) =>
              o.order_number.toLowerCase().includes(q) ||
              o.customer_name.toLowerCase().includes(q) ||
              o.product_name.toLowerCase().includes(q) ||
              (o.institution_name && o.institution_name.toLowerCase().includes(q))
          );
        }

        if (state.status && state.status !== 'all') {
          items = items.filter((o) => o.status === state.status);
        }

        if (state.category && state.category !== 'all') {
          items = items.filter((o) => o.category === state.category);
        }

        if (state.payment_status && state.payment_status !== 'all') {
          items = items.filter((o) => o.payment_status === state.payment_status);
        }

        if (state.year) {
          items = items.filter((o) => o.created_at.startsWith(state.year!));
        }

        if (state.kkn_institution) {
          items = items.filter((o) =>
            (o.institution_name || '').toLowerCase().includes(state.kkn_institution!.toLowerCase())
          );
        }

        const activePipelines = items.filter(
          (o) => o.status !== 'completed' && o.status !== 'cancelled'
        ).length;
        const completedCount = items.filter((o) => o.status === 'completed').length;
        const readyToShipCount = items.filter((o) => o.status === 'ready_to_ship').length;
        const printedCount = items.filter((o) => o.status_printed === 'printed').length;
        const unprintedCount = items.filter((o) => o.status_printed === 'unprinted' || o.status_printed === 'waiting').length;
        const totalRevenue = items.reduce((sum, o) => sum + o.grand_total, 0);

        return {
          orders: items,
          totalCount: ORDERS_DB.length,
          filteredCount: items.length,
          activePipelines,
          completedCount,
          readyToShipCount,
          printedCount,
          unprintedCount,
          totalRevenue,
        };
      },
      { tags: ['orders'], staleWhileRevalidateSeconds: 60 }
    );
  }

  static async getOrderById(id: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
          size: 1,
        }),
      });
      if (response.ok) {
        const res = await response.json();
        const order = res?.data?.[0] || res?.data?.items?.[0];
        if (order) return order;
      }
    } catch {}

    const order = ORDERS_DB.find((o) => o.id === id || o.order_number === id);
    if (!order) throw new ApiError('Pesanan tidak ditemukan', 404);
    return order;
  }

  static async createOrder(data: Partial<OrderItem>) {
    const nextNum = ORDERS_DB.length + 90;
    const order_number = `KNU-2026-0${nextNum}`;
    const total_qty = Number(data.total_qty) || 1;
    const unit_price = Number(data.unit_price) || 125000;
    const discount = Number(data.discount) || 0;
    const subtotal = total_qty * unit_price;
    const grand_total = Math.max(0, subtotal - discount);

    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      order_number,
      customer_name: data.customer_name || 'Pelanggan Baru',
      customer_phone: data.customer_phone || '',
      institution_name: data.institution_name || '',
      is_kkn: Boolean(data.is_kkn),
      kkn_type: data.kkn_type,
      kkn_period: data.kkn_period,
      kkn_detail: data.kkn_detail,
      product_name: data.product_name || 'Jersey Custom',
      category: (data.category as any) || 'Jersey',
      total_qty,
      unit_price,
      subtotal,
      discount,
      grand_total,
      status: (data.status as any) || 'in_production',
      status_printed: 'unprinted',
      payment_status: (data.payment_status as any) || 'partial_dp',
      created_at: new Date().toISOString().split('T')[0],
      deadline_at: data.deadline_at || '',
      notes: data.notes || '',
    };

    try {
      await fetch(`${BACKEND_URL}/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          data: {
            order_number,
            institution_name: data.institution_name,
            pic_name: data.customer_name,
            pic_phone: data.customer_phone,
            is_kkn: data.is_kkn ? 1 : 0,
            subtotal,
            grand_total,
            total_amount: grand_total,
            status: data.status || 'pending',
            status_printed: 'waiting',
            payment_status: data.payment_status || 'down_payment',
            deadline: data.deadline_at,
            notes: data.notes,
            created_on: new Date().toISOString(),
          },
        }),
      });
    } catch {}

    const parsed = OrderItemSchema.safeParse(newOrder);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Data pesanan tidak valid', 400);
    }

    ORDERS_DB.unshift(parsed.data);
    invalidateCacheByTag('orders');
    return parsed.data;
  }

  static async updateOrderStatus(id: string, status: any, notes?: string) {
    try {
      await fetch(`${BACKEND_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          data: {
            status,
            ...(notes ? { notes } : {}),
            modified_on: new Date().toISOString(),
          },
          where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
        }),
      });
    } catch {}

    const order = ORDERS_DB.find((o) => o.id === id || o.order_number === id);
    if (order) {
      order.status = status;
      if (status === 'completed') order.payment_status = 'paid';
      if (notes) order.notes = `${order.notes || ''} [Update: ${notes}]`.trim();
    }

    invalidateCacheByTag('orders');
    return order || { id, status };
  }

  static async updateStatusPrinted(id: string, status_printed: any) {
    try {
      await fetch(`${BACKEND_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          data: {
            status_printed: status_printed === 'printed' ? 'done' : 'waiting',
            modified_on: new Date().toISOString(),
          },
          where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
        }),
      });
    } catch {}

    const order = ORDERS_DB.find((o) => o.id === id || o.order_number === id);
    if (order) {
      order.status_printed = status_printed;
    }

    invalidateCacheByTag('orders');
    return order || { id, status_printed };
  }

  static async updateReview(id: string, rating: number, review: string) {
    try {
      await fetch(`${BACKEND_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          data: {
            rating,
            review,
            modified_on: new Date().toISOString(),
          },
          where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
        }),
      });
    } catch {}

    const order = ORDERS_DB.find((o) => o.id === id || o.order_number === id);
    if (order) {
      (order as any).rating = rating;
      (order as any).review = review;
    }

    invalidateCacheByTag('orders');
    return order || { id, rating, review };
  }

  static async updatePaymentProof(id: string, payload: {
    payment_proof?: string;
    dp_payment_proof?: string;
    payment_method?: string;
    payment_detail?: any;
    payment_status?: any;
    source_upload?: string;
  } | string, payment_status: any = 'paid') {
    const dataToUpdate: Record<string, any> = {
      modified_on: new Date().toISOString(),
    };

    let pStatus = payment_status;

    if (typeof payload === 'string') {
      dataToUpdate.payment_proof = payload;
      dataToUpdate.payment_status = payment_status === 'partial_dp' ? 'down_payment' : payment_status;
    } else {
      if (payload.payment_proof) dataToUpdate.payment_proof = payload.payment_proof;
      if (payload.dp_payment_proof) dataToUpdate.dp_payment_proof = payload.dp_payment_proof;
      if (payload.payment_method) dataToUpdate.payment_method = payload.payment_method;
      if (payload.payment_detail) dataToUpdate.payment_detail = payload.payment_detail;
      pStatus = payload.payment_status || (payload.dp_payment_proof ? 'partial_dp' : 'paid');
      dataToUpdate.payment_status = pStatus === 'partial_dp' ? 'down_payment' : pStatus;
    }

    try {
      await fetch(`${BACKEND_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          data: dataToUpdate,
          where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
        }),
      });
    } catch {}

    const order = ORDERS_DB.find((o) => o.id === id || o.order_number === id);
    if (order) {
      if (typeof payload === 'string') {
        order.payment_proof = payload;
      } else {
        if (payload.payment_proof) order.payment_proof = payload.payment_proof;
        if (payload.dp_payment_proof) order.dp_payment_proof = payload.dp_payment_proof;
      }
      order.payment_status = pStatus;
    }

    invalidateCacheByTag('orders');
    return order || { id, ...dataToUpdate };
  }

  static async deletePaymentProof(id: string, field: string = 'payment_proof') {
    try {
      await fetch(`${BACKEND_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          data: {
            [field]: null,
            ...(field === 'payment_proof' ? { payment_status: 'down_payment' } : {}),
            modified_on: new Date().toISOString(),
          },
          where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
        }),
      });
    } catch {}

    const order = ORDERS_DB.find((o) => o.id === id || o.order_number === id);
    if (order) {
      if (field === 'payment_proof') {
        order.payment_proof = undefined;
        order.payment_status = 'partial_dp';
      } else if (field === 'dp_payment_proof') {
        order.dp_payment_proof = undefined;
      }
    }

    invalidateCacheByTag('orders');
    return order || { id };
  }

  static async deleteOrder(id: string) {
    try {
      await fetch(`${BACKEND_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          table: 'orders',
          data: {
            deleted: 1,
            deleted_on: new Date().toISOString(),
          },
          where: isNaN(Number(id)) ? { order_number: id } : { id: Number(id) },
        }),
      });
    } catch {}

    const index = ORDERS_DB.findIndex((o) => o.id === id || o.order_number === id);
    if (index !== -1) {
      ORDERS_DB.splice(index, 1);
    }

    invalidateCacheByTag('orders');
    return { success: true };
  }

  static async saveJerseyConfig(configData: Partial<JerseyConfig>) {
    const parsed = JerseyConfigSchema.safeParse(configData);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Konfigurasi jersey tidak valid', 400);
    }

    const saved = {
      ...parsed.data,
      id: `cfg-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    SAVED_CONFIGS_DB.unshift(saved);
    return saved;
  }
}

/**
 * Handle React Router Server Action for Orders (Compatible with kinauid-frontend & Clean Core v2)
 */
export async function handleOrderAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const actionType = String(formData.get('action') || formData.get('intent') || 'create_order');
    const id = String(formData.get('id') || formData.get('order_number') || '');

    const strategies: Record<string, () => Promise<any>> = {
      // 1. Delete Order (from kinauid-frontend actionType === 'delete')
      delete: async () => {
        const result = await OrderService.deleteOrder(id);
        return successResponse(result, { meta: { message: 'Pesanan berhasil dihapus' } });
      },
      'delete-order': async () => {
        const result = await OrderService.deleteOrder(id);
        return successResponse(result, { meta: { message: 'Pesanan berhasil dihapus' } });
      },

      // 2. Update Production Status (from kinauid-frontend actionType === 'update_status')
      update_status: async () => {
        const status = String(formData.get('status') || 'in_production');
        const notes = String(formData.get('notes') || '');
        const updated = await OrderService.updateOrderStatus(id, status, notes);
        return successResponse(updated, { meta: { message: 'Status pesanan berhasil diperbarui' } });
      },
      'update-status': async () => {
        const status = String(formData.get('status') || 'in_production');
        const notes = String(formData.get('notes') || '');
        const updated = await OrderService.updateOrderStatus(id, status, notes);
        return successResponse(updated, { meta: { message: 'Status pesanan berhasil diperbarui' } });
      },

      // 3. Update Print Status (from kinauid-frontend actionType === 'update_status_printed')
      update_status_printed: async () => {
        const status_printed = String(formData.get('status_printed') || 'printed');
        const updated = await OrderService.updateStatusPrinted(id, status_printed);
        return successResponse(updated, { meta: { message: 'Status cetak berhasil diperbarui' } });
      },
      'update-status-printed': async () => {
        const status_printed = String(formData.get('status_printed') || 'printed');
        const updated = await OrderService.updateStatusPrinted(id, status_printed);
        return successResponse(updated, { meta: { message: 'Status cetak berhasil diperbarui' } });
      },

      // 4. Update Review & Rating (from kinauid-frontend actionType === 'update_review')
      update_review: async () => {
        const rating = Number(formData.get('rating') || 5);
        const review = String(formData.get('review') || '');
        const updated = await OrderService.updateReview(id, rating, review);
        return successResponse(updated, { meta: { message: 'Ulasan pesanan berhasil disimpan' } });
      },
      'update-review': async () => {
        const rating = Number(formData.get('rating') || 5);
        const review = String(formData.get('review') || '');
        const updated = await OrderService.updateReview(id, rating, review);
        return successResponse(updated, { meta: { message: 'Ulasan pesanan berhasil disimpan' } });
      },

      // 5. Update Payment Proof (from kinauid-frontend actionType === 'update_payment_proof')
      update_payment_proof: async () => {
        const payment_proof = formData.get('payment_proof') ? String(formData.get('payment_proof')) : undefined;
        const dp_payment_proof = formData.get('dp_payment_proof') ? String(formData.get('dp_payment_proof')) : undefined;
        const payment_method = formData.get('payment_method') ? String(formData.get('payment_method')) : undefined;
        const payment_status = formData.get('payment_status') ? String(formData.get('payment_status')) : undefined;
        const source_upload = formData.get('source_upload') ? String(formData.get('source_upload')) : undefined;

        const updated = await OrderService.updatePaymentProof(id, {
          payment_proof,
          dp_payment_proof,
          payment_method,
          payment_status,
          source_upload,
        });
        return successResponse(updated, { meta: { message: 'Bukti pembayaran berhasil disimpan' } });
      },
      'update-payment-proof': async () => {
        const payment_proof = formData.get('payment_proof') ? String(formData.get('payment_proof')) : undefined;
        const dp_payment_proof = formData.get('dp_payment_proof') ? String(formData.get('dp_payment_proof')) : undefined;
        const payment_method = formData.get('payment_method') ? String(formData.get('payment_method')) : undefined;
        const payment_status = formData.get('payment_status') ? String(formData.get('payment_status')) : undefined;
        const source_upload = formData.get('source_upload') ? String(formData.get('source_upload')) : undefined;

        const updated = await OrderService.updatePaymentProof(id, {
          payment_proof,
          dp_payment_proof,
          payment_method,
          payment_status,
          source_upload,
        });
        return successResponse(updated, { meta: { message: 'Bukti pembayaran berhasil disimpan' } });
      },

      // 6. Delete Payment Proof (from kinauid-frontend actionType === 'delete_payment_proof')
      delete_payment_proof: async () => {
        const field = String(formData.get('field') || 'payment_proof');
        const updated = await OrderService.deletePaymentProof(id, field);
        return successResponse(updated, { meta: { message: 'Bukti pembayaran berhasil dihapus' } });
      },
      'delete-payment-proof': async () => {
        const field = String(formData.get('field') || 'payment_proof');
        const updated = await OrderService.deletePaymentProof(id, field);
        return successResponse(updated, { meta: { message: 'Bukti pembayaran berhasil dihapus' } });
      },

      // 7. Create New Order (from kinauid-frontend intent === 'create_order')
      create_order: async () => {
        const customer_name = String(formData.get('customer_name') || '');
        const customer_phone = String(formData.get('customer_phone') || '');
        const institution_name = String(formData.get('institution_name') || '');
        const is_kkn = formData.get('is_kkn') === 'true' || formData.get('is_kkn') === '1';
        const kkn_type = String(formData.get('kkn_type') || '');
        const kkn_period = String(formData.get('kkn_period') || '');
        const kkn_detail = String(formData.get('kkn_detail') || '');
        const product_name = String(formData.get('product_name') || '');
        const category = String(formData.get('category') || 'Jersey');
        const total_qty = Number(formData.get('total_qty') || 1);
        const unit_price = Number(formData.get('unit_price') || 125000);
        const deadline_at = String(formData.get('deadline_at') || '');
        const notes = String(formData.get('notes') || '');

        const created = await OrderService.createOrder({
          customer_name,
          customer_phone,
          institution_name,
          is_kkn,
          kkn_type,
          kkn_period,
          kkn_detail,
          product_name,
          category: category as any,
          total_qty,
          unit_price,
          deadline_at,
          notes,
        });
        return successResponse(created, { meta: { message: 'Pesanan baru berhasil dibuat' } });
      },
      'create-order': async () => {
        const customer_name = String(formData.get('customer_name') || '');
        const customer_phone = String(formData.get('customer_phone') || '');
        const institution_name = String(formData.get('institution_name') || '');
        const is_kkn = formData.get('is_kkn') === 'true' || formData.get('is_kkn') === '1';
        const kkn_type = String(formData.get('kkn_type') || '');
        const kkn_period = String(formData.get('kkn_period') || '');
        const kkn_detail = String(formData.get('kkn_detail') || '');
        const product_name = String(formData.get('product_name') || '');
        const category = String(formData.get('category') || 'Jersey');
        const total_qty = Number(formData.get('total_qty') || 1);
        const unit_price = Number(formData.get('unit_price') || 125000);
        const deadline_at = String(formData.get('deadline_at') || '');
        const notes = String(formData.get('notes') || '');

        const created = await OrderService.createOrder({
          customer_name,
          customer_phone,
          institution_name,
          is_kkn,
          kkn_type,
          kkn_period,
          kkn_detail,
          product_name,
          category: category as any,
          total_qty,
          unit_price,
          deadline_at,
          notes,
        });
        return successResponse(created, { meta: { message: 'Pesanan baru berhasil dibuat' } });
      },

      // 8. Save Jersey Customizer Config
      'save-config': async () => {
        const template_id = String(formData.get('template_id') || 'tmpl-cyber-neon');
        const fabric = String(formData.get('fabric') || 'Dryfit Milano');
        const collar_type = String(formData.get('collar_type') || 'V-Neck');
        const sleeve_type = String(formData.get('sleeve_type') || 'Pendek');
        const primary_color = String(formData.get('primary_color') || '#0a192f');
        const secondary_color = String(formData.get('secondary_color') || '#0097b2');
        const accent_color = String(formData.get('accent_color') || '#f59e0b');
        const nameset_enabled = formData.get('nameset_enabled') === 'true' || formData.get('nameset_enabled') === 'on';
        const notes = String(formData.get('notes') || '');

        const saved = await OrderService.saveJerseyConfig({
          template_id,
          fabric: fabric as any,
          collar_type: collar_type as any,
          sleeve_type: sleeve_type as any,
          primary_color,
          secondary_color,
          accent_color,
          nameset_enabled,
          notes,
        });
        return successResponse(saved, { meta: { message: 'Konfigurasi jersey berhasil disimpan' } });
      },
    };

    const handler = strategies[actionType];
    if (!handler) throw new ApiError(`Aksi '${actionType}' tidak didukung`, 400);
    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: 'action:order' });
    return errorResponse(error);
  }
}

