import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { CustomerDashboardService } from '~/services/customer-dashboard.service';
import { CustomerDashboardWidget } from '~/components/feature/CustomerDashboardWidgets';
import type { CustomerDashboardState } from '~/schemas/customer-dashboard.schema';

export const meta = () => [{ title: 'Customer Portal & Dashboard - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'all';
  const search = url.searchParams.get('search') || '';
  return CustomerDashboardService.getDashboardData({ category, search });
};

export const action = async (args: ActionFunctionArgs) => CustomerDashboardService.handleDashboardAction(args);

export default createPage<InferLoader<typeof loader>, any, CustomerDashboardState>((ctx) => {
  const { data, navigate, send, isSubmitting } = ctx;
  const handleInquiry = (payload: any) => send.submit(payload, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Portal Pelanggan & Mitra',
      subtitle: 'Pantau riwayat order, jelajahi katalog merchandise, dan konsultasikan pesanan baru.',
      breadcrumbs: [{ label: 'Customer', href: '/customer/dashboard' }, { label: 'Dashboard', href: '/customer/dashboard' }],
    }),
    createElement(CustomerDashboardWidget, {
      data: data || { products: [], productionItems: [], user: { fullname: 'Pelanggan' }, activeOrderCount: 0 },
      onInquiry: handleInquiry,
      onNavigate: navigate,
      isSubmitting,
    })
  );
}, { defaultState: { category: 'all', search: '' } });
