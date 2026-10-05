import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { CustomerSupportService } from '~/services/customer-support.service';
import { CustomerSupportWidget } from '~/components/feature/CustomerSupportWidgets';
import type { CustomerSupportState } from '~/schemas/customer-support.schema';

export const meta = () => [{ title: 'Pusat Bantuan & Layanan CS - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'all';
  return CustomerSupportService.getSupportData({ category });
};

export const action = async (args: ActionFunctionArgs) => CustomerSupportService.handleSupportAction(args);

export default createPage<InferLoader<typeof loader>, any, CustomerSupportState>((ctx) => {
  const { data, send, isSubmitting } = ctx;
  const handleCreateTicket = (payload: any) => send.submit(payload, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Pusat Bantuan & Layanan Pelanggan',
      subtitle: 'Dapatkan solusi cepat seputar pemesanan merchandise, panduan desain, dan kontak CS.',
      breadcrumbs: [{ label: 'Customer', href: '/customer/dashboard' }, { label: 'Bantuan', href: '/customer/support' }],
    }),
    createElement(CustomerSupportWidget, {
      data: data || { faqs: [], recentTickets: [], csContacts: [] },
      onCreateTicket: handleCreateTicket,
      isSubmitting,
    })
  );
}, { defaultState: { category: 'all' } });
