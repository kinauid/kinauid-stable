import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { OrderEditService } from '~/services/order-edit.service';
import { OrderEditWidget } from '~/components/feature/OrderEditWidgets';
import type { OrderEditState } from '~/schemas/order-edit.schema';

export const meta = () => [{ title: 'Edit Spesifikasi Pesanan - Kinau Studio' }];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id || '1';
  return OrderEditService.getOrderDetail(id);
};

export const action = async (args: ActionFunctionArgs) => OrderEditService.handleOrderEditAction(args);

export default createPage<InferLoader<typeof loader>, any, OrderEditState>((ctx) => {
  const { data, send, navigate, isSubmitting } = ctx;
  const handleSave = (payload: any) => send.submit(payload, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Edit & Manajemen Detail Pesanan',
      subtitle: 'Sesuaikan rincian kuantitas, estimasi deadline selesai, data KKN, dan pembayaran.',
      breadcrumbs: [{ label: 'App', href: '/app/dashboard' }, { label: 'Pesanan', href: '/app/order-list' }, { label: 'Edit Order', href: '#' }],
    }),
    createElement(OrderEditWidget, {
      order: data || { id: '1', order_number: 'ORD-1', institution_name: '', pic_name: '', pic_phone: '', status: 'pending', payment_status: 'unpaid', dp_amount: 0, total_amount: 0, items: [], images: [] },
      onSave: handleSave,
      onNavigate: navigate,
      isSubmitting,
    })
  );
}, { defaultState: {} });
