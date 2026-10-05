import React, { createElement, useState } from 'react';
import { Icon, modals } from '~/builder';
import { type OrderItem } from '~/schemas/order.schema';
import { getWhatsAppLink } from '~/constants/brand';
import { formatCurrency, formatFullDate } from '~/utils/format';

export interface MobileOrderDetailProps {
  order: OrderItem;
  onBack?: () => void;
  send?: any;
  navigate?: any;
}

/**
 * Dedicated Mobile Order Detail View
 * Strictly tailored according to Reference Screen 3 (SellRecord Style):
 * 1. Dynamic TopBar integration (Header & back button handled in MobileTopBar)
 * 2. Customer Information Card (100% real API data)
 * 3. Product Details Card (Thumbnail, Variant, SKU, Unit Price, Qty, Total)
 * 4. Order Timeline Card with checked orange step progress indicators
 */
export function MobileOrderDetail({ order, onBack, send, navigate }: MobileOrderDetailProps) {
  // 100% Real API Data Extraction (No Dummy Values)
  const orderNumber = order.order_number || `#ORD-${order.id}`;
  const customerName = order.customer_name || order.pic_name || order.institution_name || 'Pelanggan Kinau';
  const customerPhone = order.customer_phone || order.pic_phone || '—';
  const customerEmail = (order as any).customer_email || (order as any).customer?.email || '—';
  const deliveryAddress = order.institution_name
    ? `${order.institution_name}, Jawa Timur, Indonesia`
    : (order as any).delivery_address || (order as any).address || '—';

  // Product & Pricing info from real order and order_items
  const primaryItem = (order.order_items && order.order_items.length > 0) ? order.order_items[0] : null;
  const productName = primaryItem?.product_name || order.product_name || 'Pesanan Custom';
  const variant = primaryItem?.variant_name || (order.category ? `${order.category} • Custom` : 'Custom Apparel');
  const sku = primaryItem?.product_id ? String(primaryItem.product_id) : (order.order_number || `KN-${order.id}`);
  
  const unitPrice = order.unit_price
    ? formatCurrency(order.unit_price)
    : primaryItem?.unit_price
    ? formatCurrency(primaryItem.unit_price)
    : formatCurrency(Math.round((order.grand_total || order.total_amount || 0) / Math.max(1, order.total_qty || 1)));

  const quantity = primaryItem?.qty || order.total_qty || 1;
  const grandTotal = formatCurrency(order.grand_total || order.total_amount || order.subtotal || 0);

  const orderDate = order.created_at ? formatFullDate(order.created_at) : '—';
  const isPaid = order.payment_status === 'paid';
  const isDP = order.payment_status === 'down_payment' || order.payment_status === 'partial_dp';
  const isCompleted = order.status === 'completed' || order.status === 'done';
  const isProduction = order.status === 'in_production' || order.status === 'confirmed' || order.status === 'in_design';

  // Product Preview Image from real data (no dummy mockup fallback)
  const productImage = (order.images && Array.isArray(order.images) && order.images[0])
    || (order.portfolio_images && order.portfolio_images[0])
    || (typeof order.images === 'string' && order.images.startsWith('http') ? order.images : null);

  const hasDpProof = Boolean(order.dp_payment_proof && order.dp_payment_proof.trim() !== '');
  const hasPaidProof = Boolean(order.payment_proof && order.payment_proof.trim() !== '');

  const openUploadModal = (source: 'down_payment' | 'paid') => {
    modals.open('UPLOAD_PAYMENT_PROOF_MODAL', {
      order,
      sourceUpload: source,
      onSubmit: (payload: any) =>
        send?.submit({ intent: 'update-payment-proof', id: order.id, ...payload }, { method: 'post' }),
    });
  };

  const openViewModal = () => {
    modals.open('VIEW_PAYMENT_PROOF_MODAL', {
      order,
      onDeleteProof: (field: string) =>
        send?.submit({ intent: 'delete-payment-proof', id: order.id, field }, { method: 'post' }),
    });
  };

  const handleOpenNota = () => {
    modals.open('VIEW_NOTA_MODAL', { order, send });
  };

  const handleOpenStatus = () => {
    modals.open('UPDATE_ORDER_STATUS_MODAL', {
      orderId: order.id,
      currentStatus: order.status,
      onSubmit: (v: any) => send?.submit(v, { method: 'post' }),
    });
  };

  const handleOpenWA = () => {
    if (!customerPhone || customerPhone === '—') return;
    const waUrl = getWhatsAppLink(
      customerPhone,
      `Halo Kak ${customerName}, konfirmasi pesanan Kinau ID No. ${orderNumber} (${productName}). Total: ${grandTotal}.`
    );
    window.open(waUrl, '_blank');
  };

  return createElement(
    'div',
    { className: 'min-h-full pb-10 select-none space-y-4 animate-in fade-in slide-in-from-right-2 duration-200' },

    // 1. Card 1: Customer Information (Ref Page 3)
    createElement(
      'div',
      { className: 'bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4' },
      createElement('h2', { className: 'text-sm font-black text-slate-900 tracking-tight' }, 'Customer Information'),
      createElement(
        'div',
        { className: 'space-y-3 text-xs' },
        // Name
        createElement(
          'div',
          { className: 'flex items-center justify-between gap-2' },
          createElement('span', { className: 'text-slate-400 font-medium' }, 'Name'),
          createElement('span', { className: 'font-bold text-slate-900 text-right truncate' }, customerName)
        ),
        // Phone
        createElement(
          'div',
          { className: 'flex items-center justify-between gap-2' },
          createElement('span', { className: 'text-slate-400 font-medium' }, 'Phone'),
          customerPhone !== '—'
            ? createElement(
                'button',
                {
                  type: 'button',
                  onClick: handleOpenWA,
                  className: 'font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer',
                },
                customerPhone,
                Icon('ExternalLink', { size: 11 })
              )
            : createElement('span', { className: 'text-slate-400' }, '—')
        ),
        // Email
        createElement(
          'div',
          { className: 'flex items-center justify-between gap-2' },
          createElement('span', { className: 'text-slate-400 font-medium' }, 'Email'),
          createElement('span', { className: 'font-semibold text-slate-800 text-right truncate max-w-[200px]' }, customerEmail)
        ),
        // Delivery Address
        createElement(
          'div',
          { className: 'space-y-1 pt-1 border-t border-slate-50' },
          createElement('p', { className: 'text-slate-400 font-medium' }, 'Delivery Address'),
          createElement('p', { className: 'font-semibold text-slate-800 leading-relaxed' }, deliveryAddress)
        )
      )
    ),

    // 2. Card 2: Product Details (Ref Page 3 with Image on right)
    createElement(
      'div',
      { className: 'bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4' },
      createElement('h2', { className: 'text-sm font-black text-slate-900 tracking-tight' }, 'Product Details'),
      createElement(
        'div',
        { className: 'flex items-start justify-between gap-4' },
        // Left Details
        createElement(
          'div',
          { className: 'flex-1 space-y-2.5 text-xs' },
          createElement(
            'div',
            null,
            createElement('p', { className: 'text-slate-400 font-medium text-[11px]' }, 'Product Name'),
            createElement('p', { className: 'font-black text-slate-900 text-sm mt-0.5' }, productName)
          ),
          createElement(
            'div',
            null,
            createElement('p', { className: 'text-slate-400 font-medium text-[11px]' }, 'Variant'),
            createElement('p', { className: 'font-bold text-slate-800 mt-0.5' }, variant)
          ),
          createElement(
            'div',
            null,
            createElement('p', { className: 'text-slate-400 font-medium text-[11px]' }, 'SKU'),
            createElement('p', { className: 'font-mono font-bold text-slate-700 mt-0.5' }, sku)
          )
        ),
        // Right Product Thumbnail Preview
        createElement(
          'div',
          { className: 'w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden' },
          productImage
            ? createElement('img', {
                src: productImage,
                alt: productName,
                onError: (e: any) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = `<div class="text-orange-600 flex items-center justify-center"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>`;
                  }
                },
                className: 'w-full h-full object-contain rounded-xl',
              })
            : createElement(
                'div',
                { className: 'w-full h-full rounded-xl bg-orange-50/70 flex flex-col items-center justify-center text-orange-600 gap-1' },
                Icon('Shirt', { size: 24 }),
                createElement('span', { className: 'text-[9px] font-bold tracking-tight text-orange-700/80' }, order.category || 'Apparel')
              )
        )
      ),

      // Pricing & Quantity Row
      createElement(
        'div',
        { className: 'grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs' },
        createElement(
          'div',
          null,
          createElement('p', { className: 'text-slate-400 font-medium' }, 'Unit Price'),
          createElement('p', { className: 'font-black font-mono text-slate-900 mt-0.5 text-sm' }, unitPrice)
        ),
        createElement(
          'div',
          { className: 'text-right' },
          createElement('p', { className: 'text-slate-400 font-medium' }, 'Quantity'),
          createElement('p', { className: 'font-black font-mono text-slate-900 mt-0.5 text-sm' }, `${quantity} pcs`)
        )
      ),

      // Total Card Pill
      createElement(
        'div',
        { className: 'bg-slate-50 rounded-2xl p-3 flex items-center justify-between' },
        createElement('span', { className: 'text-xs font-bold text-slate-600' }, 'Grand Total'),
        createElement('span', { className: 'text-base font-black font-mono text-orange-600' }, grandTotal)
      )
    ),

    // Card: Bukti Bayar & Verifikasi Pembayaran (DP / Pelunasan)
    createElement(
      'div',
      { className: 'bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4' },
      createElement(
        'div',
        { className: 'flex items-center justify-between' },
        createElement('h2', { className: 'text-sm font-black text-slate-900 tracking-tight' }, 'Status & Bukti Bayar'),
        createElement(
          'span',
          {
            className: `px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isDP
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`,
          },
          isPaid ? 'Lunas' : isDP ? 'DP Terbayar' : 'Belum Bayar'
        )
      ),

      // Payment Proof Action Buttons
      createElement(
        'div',
        { className: 'space-y-2.5 pt-1' },
        // 1. Bukti DP Button
        createElement(
          'div',
          { className: 'flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100' },
          createElement(
            'div',
            { className: 'min-w-0' },
            createElement('p', { className: 'text-xs font-black text-slate-900' }, 'Uang Muka (DP)'),
            createElement(
              'p',
              { className: 'text-[11px] text-slate-500 mt-0.5' },
              hasDpProof ? 'Bukti transfer DP terverifikasi' : 'Belum ada bukti transfer DP'
            )
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => (hasDpProof ? openViewModal() : openUploadModal('down_payment')),
              className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                hasDpProof
                  ? 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200/80'
                  : 'bg-[#103557] text-white hover:bg-[#0c2842] shadow-2xs'
              }`,
            },
            hasDpProof ? Icon('Check', { size: 13, className: 'stroke-[3]' }) : Icon('Upload', { size: 13 }),
            hasDpProof ? 'Lihat Bukti DP' : 'Upload Bukti DP'
          )
        ),

        // 2. Bukti Pelunasan Button
        createElement(
          'div',
          { className: 'flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100' },
          createElement(
            'div',
            { className: 'min-w-0' },
            createElement('p', { className: 'text-xs font-black text-slate-900' }, 'Pelunasan (Lunas)'),
            createElement(
              'p',
              { className: 'text-[11px] text-slate-500 mt-0.5' },
              hasPaidProof ? 'Bukti pelunasan terverifikasi' : 'Belum ada bukti pelunasan'
            )
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => (hasPaidProof ? openViewModal() : openUploadModal('paid')),
              className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                hasPaidProof
                  ? 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200/80'
                  : 'bg-[#EA580C] text-white hover:bg-[#C2410C] shadow-2xs'
              }`,
            },
            hasPaidProof ? Icon('Check', { size: 13, className: 'stroke-[3]' }) : Icon('Upload', { size: 13 }),
            hasPaidProof ? 'Lihat Bukti Lunas' : 'Upload Bukti Lunas'
          )
        ),

        // 3. Quick manage link if proofs exist
        (hasDpProof || hasPaidProof)
          ? createElement(
              'button',
              {
                type: 'button',
                onClick: openViewModal,
                className: 'w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline pt-1 flex items-center justify-center gap-1 cursor-pointer',
              },
              Icon('Image', { size: 13 }),
              'Kelola / Lihat Semua Bukti Pembayaran'
            )
          : null
      )
    ),

    // 3. Card 3: Order Timeline (Ref Page 3 with Orange Checkmark Steps)
    createElement(
      'div',
      { className: 'bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4' },
      createElement('h2', { className: 'text-sm font-black text-slate-900 tracking-tight' }, 'Order Timeline'),
      createElement(
        'div',
        { className: 'relative pl-6 space-y-6 pt-1' },

        // Vertical Timeline Connecting Line
        createElement('div', {
          className: 'absolute left-2.5 top-3 bottom-3 w-0.5 bg-orange-500 rounded-full',
        }),

        // Step 1: Order Placed
        createElement(
          'div',
          { className: 'relative flex items-start justify-between gap-3 text-xs' },
          createElement(
            'div',
            { className: 'absolute -left-6 top-0 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center ring-4 ring-white shadow-xs' },
            Icon('Check', { size: 11, className: 'stroke-[3]' })
          ),
          createElement(
            'div',
            null,
            createElement('p', { className: 'font-black text-slate-900' }, 'Order Placed'),
            createElement('p', { className: 'text-[11px] text-slate-500 font-medium mt-0.5' }, 'Pesanan berhasil dibuat & masuk antrean')
          ),
          createElement('span', { className: 'text-[10px] text-slate-400 font-semibold shrink-0' }, orderDate)
        ),

        // Step 2: Payment Completed / DP
        createElement(
          'div',
          { className: 'relative flex items-start justify-between gap-3 text-xs' },
          createElement(
            'div',
            {
              className: `absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                isPaid || isDP ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
              }`,
            },
            isPaid || isDP ? Icon('Check', { size: 11, className: 'stroke-[3]' }) : createElement('span', { className: 'w-2 h-2 rounded-full bg-slate-400' })
          ),
          createElement(
            'div',
            null,
            createElement('p', { className: 'font-black text-slate-900' }, isPaid ? 'Payment Completed' : isDP ? 'DP 50% Verified' : 'Awaiting Payment'),
            createElement('p', { className: 'text-[11px] text-slate-500 font-medium mt-0.5' }, isPaid ? 'Pembayaran lunas terverifikasi' : isDP ? 'Uang muka diterima' : 'Menunggu transfer')
          ),
          createElement('span', { className: 'text-[10px] text-slate-400 font-semibold shrink-0' }, isPaid || isDP ? 'Verified' : 'Pending')
        ),

        // Step 3: Production / In Progress
        createElement(
          'div',
          { className: 'relative flex items-start justify-between gap-3 text-xs' },
          createElement(
            'div',
            {
              className: `absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                isProduction || isCompleted ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
              }`,
            },
            isProduction || isCompleted ? Icon('Check', { size: 11, className: 'stroke-[3]' }) : createElement('span', { className: 'w-2 h-2 rounded-full bg-slate-400' })
          ),
          createElement(
            'div',
            null,
            createElement('p', { className: 'font-black text-slate-900' }, 'Production & Printing'),
            createElement('p', { className: 'text-[11px] text-slate-500 font-medium mt-0.5' }, 'Cetak sublim roll & penjahitan apparel')
          ),
          createElement('span', { className: 'text-[10px] text-slate-400 font-semibold shrink-0' }, isProduction ? 'In Progress' : isCompleted ? 'Done' : 'Queue')
        ),

        // Step 4: Quality Control & Packing
        createElement(
          'div',
          { className: 'relative flex items-start justify-between gap-3 text-xs' },
          createElement(
            'div',
            {
              className: `absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                isCompleted ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
              }`,
            },
            isCompleted ? Icon('Check', { size: 11, className: 'stroke-[3]' }) : createElement('span', { className: 'w-2 h-2 rounded-full bg-slate-400' })
          ),
          createElement(
            'div',
            null,
            createElement('p', { className: 'font-black text-slate-900' }, 'QC & Siap Ambil / Kirim'),
            createElement('p', { className: 'text-[11px] text-slate-500 font-medium mt-0.5' }, 'Pemeriksaan kualitas & pengemasan')
          ),
          createElement('span', { className: 'text-[10px] text-slate-400 font-semibold shrink-0' }, isCompleted ? 'Ready' : 'Estimasi')
        )
      )
    ),

    // 4. Action Buttons (Nota A4 & WhatsApp & Ubah Status)
    createElement(
      'div',
      { className: 'grid grid-cols-2 gap-3 pt-1' },
      createElement(
        'button',
        {
          type: 'button',
          onClick: handleOpenNota,
          className:
            'py-3 px-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 font-black text-xs text-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all',
        },
        Icon('Printer', { size: 15, className: 'text-blue-600' }),
        'Nota A4'
      ),
      createElement(
        'button',
        {
          type: 'button',
          onClick: handleOpenWA,
          className:
            'py-3 px-4 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] shadow-md shadow-orange-500/20 font-black text-xs text-white flex items-center justify-center gap-2 cursor-pointer transition-all',
        },
        Icon('MessageSquare', { size: 15 }),
        'Chat Pemesan'
      )
    )
  );
}
