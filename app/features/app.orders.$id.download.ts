import { createElement } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { createPage, Div, type InferLoader } from '~/builder';
import { OrderDownloadService } from '~/services/order-download.service';
import { OrderDownloadWidget } from '~/components/feature/OrderDownloadWidgets';
import type { OrderDownloadState, PrintDocumentType } from '~/schemas/order-download.schema';

export const meta = () => [{ title: 'Cetak Nota & Dokumen Pesanan - Kinau Studio' }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const id = params.id || '1';
  const url = new URL(request.url);
  const docType = (url.searchParams.get('type') || 'nota') as PrintDocumentType;
  const printData = await OrderDownloadService.getPrintData(id);
  return { ...printData, initialDocType: docType };
};

export default createPage<InferLoader<typeof loader>, any, OrderDownloadState>((ctx) => {
  const { data, navigate } = ctx;

  return Div(
    { className: 'space-y-6 max-w-5xl mx-auto pt-4 px-4' },
    createElement(OrderDownloadWidget, {
      data: data as any,
      activeDocType: data?.initialDocType || 'nota',
      onNavigate: navigate,
    })
  );
}, { defaultState: { docType: 'nota' } });
