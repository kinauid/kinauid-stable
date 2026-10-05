import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { DiscountService } from '~/services/discount.service';
import { DiscountWidget } from '~/components/feature/DiscountWidgets';
import type { DiscountState } from '~/schemas/discount.schema';

export const meta = () => [{ title: 'Kupon Diskon & Promo - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  return DiscountService.getDiscountCodes({ search });
};

export const action = async (args: ActionFunctionArgs) => DiscountService.handleDiscountAction(args);

export default createPage<InferLoader<typeof loader>, any, DiscountState>((ctx) => {
  const { data, urlState, updateUrlState, send, isSubmitting } = ctx;
  const handleCreate = (payload: any) => send.submit(payload, { method: 'post' });
  const handleToggle = (id: string, active: number) => send.submit({ intent: 'toggle-discount', id, active }, { method: 'post' });
  const handleDelete = (id: string) => send.submit({ intent: 'delete-discount', id }, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Kupon Diskon & Kode Promo',
      subtitle: 'Kelola kode voucher potongan harga untuk pemesanan produk dan kampanye marketing.',
      breadcrumbs: [{ label: 'Pengaturan', href: '/app/setting/account' }, { label: 'Diskon Promo', href: '/app/setting/discount' }],
    }),
    createElement(DiscountWidget, {
      data: data || { items: [], totalActive: 0, totalCodes: 0 },
      search: urlState?.search || '',
      onSearchChange: (search: string) => updateUrlState({ search }),
      onCreateDiscount: handleCreate,
      onToggleActive: handleToggle,
      onDeleteDiscount: handleDelete,
      isSubmitting,
    })
  );
}, { defaultState: { search: '' } });
