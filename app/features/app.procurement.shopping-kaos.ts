import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { ShoppingKaosService } from '~/services/shopping-kaos.service';
import { ShoppingKaosWidget } from '~/components/feature/ShoppingKaosWidgets';
import type { ShoppingKaosState } from '~/schemas/shopping-kaos.schema';

export const meta = () => [{ title: 'Kalkulator Belanja Kaos & Sablon - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  return ShoppingKaosService.getShoppingKaosData({ search });
};

export const action = async (args: ActionFunctionArgs) => ShoppingKaosService.handleShoppingKaosAction(args);

export default createPage<InferLoader<typeof loader>, any, ShoppingKaosState>((ctx) => {
  const { data, send, isSubmitting } = ctx;

  const handleSubmitProcurement = (payload: any) => {
    send.submit(payload, { method: 'post' });
  };

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Pengadaan & Belanja Kaos',
      subtitle: 'Kalkulator otomatis modal bahan kaos polos dan sablon DTF berdasarkan rincian ukuran.',
      breadcrumbs: [
        { label: 'Pengadaan', href: '/app/procurement/shopping' },
        { label: 'Belanja Kaos', href: '/app/procurement/shopping-kaos' },
      ],
    }),
    createElement(ShoppingKaosWidget, {
      orders: data?.orders || [],
      suppliers: data?.suppliers || [],
      sablonSuppliers: data?.sablonSuppliers || [],
      stockLogs: data?.stockLogs || [],
      onSubmitProcurement: handleSubmitProcurement,
      isSubmitting,
    })
  );
});
