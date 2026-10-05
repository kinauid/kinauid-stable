import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { VendorService } from '~/services/vendor.service';
import { VendorWidget } from '~/components/feature/VendorWidgets';
import type { VendorState, VendorCategory } from '~/schemas/vendor.schema';

export const meta = () => [{ title: 'Manajemen Vendor & Subkon - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const category = (url.searchParams.get('category') || 'selempang') as VendorCategory;
  const search = url.searchParams.get('search') || '';
  return VendorService.getVendorOrders({ category, search });
};

export const action = async (args: ActionFunctionArgs) => VendorService.handleVendorAction(args);

export default createPage<InferLoader<typeof loader>, any, VendorState>((ctx) => {
  const { data, updateUrlState, send, isSubmitting } = ctx;

  const handleUpdateStatus = (id: string, status: string) => {
    send.submit({ intent: 'update-vendor-status', id, status }, { method: 'post' });
  };

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Manajemen Vendor & Subkon',
      subtitle: 'Monitoring pengerjaan pihak ketiga untuk selempang gelar, seragam, dan bordir.',
      breadcrumbs: [
        { label: 'Master & Vendor', href: '/app/master/supplier' },
        { label: 'Vendor Subkon', href: '/app/vendor' },
      ],
    }),
    createElement(VendorWidget, {
      data: data || { orders: [], activeCount: 0, doneCount: 0, category: 'selempang' },
      onCategoryChange: (category: VendorCategory) => updateUrlState({ category }),
      onUpdateStatus: handleUpdateStatus,
      isSubmitting,
    })
  );
}, { defaultState: { category: 'selempang', search: '' } });
