import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { PrintAreaService } from '~/services/print-area.service';
import { PrintAreaWidget } from '~/components/feature/PrintAreaWidgets';
import type { PrintAreaState } from '~/schemas/print-area.schema';

export const meta = () => [{ title: 'Area Cetak & Antrean Print - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const category = (url.searchParams.get('category') || 'idcard') as any;
  return PrintAreaService.getPrintOrders({ category });
};

export const action = async (args: ActionFunctionArgs) => {
  return PrintAreaService.handlePrintAreaAction(args);
};

export default createPage<InferLoader<typeof loader>, any, PrintAreaState>((ctx) => {
  const { data, send, isSubmitting } = ctx;

  const handleUpdateStatus = (id: string, status: string) => {
    send.submit({ intent: 'update-status', id, status }, { method: 'post' });
  };

  return Div(
    { className: 'space-y-4 max-w-[1700px] mx-auto' },
    PageHeader({
      title: 'Area Cetak & Antrean Print',
      subtitle: 'Tata letak layout cetak otomatis sheet A4 ID Card dan strip Lanyard workshop.',
      breadcrumbs: [
        { label: 'Pesanan', href: '/app/order-list' },
        { label: 'Area Cetak', href: '/app/print-area' },
      ],
    }),
    createElement(PrintAreaWidget, {
      orders: data?.orders || [],
      initialCategory: data?.category || 'idcard',
      onUpdateStatus: handleUpdateStatus,
      isSubmitting,
    })
  );
});
