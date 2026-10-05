import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { RecycleBinService } from '~/services/recycle-bin.service';
import { RecycleBinWidget } from '~/components/feature/RecycleBinWidgets';
import type { RecycleBinState } from '~/schemas/recycle-bin.schema';

export const meta = () => [{ title: 'Recycle Bin & Pemulihan Data - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const page = Number(url.searchParams.get('page') || 0);
  const size = Number(url.searchParams.get('size') || 10);
  return RecycleBinService.getDeletedOrders({ search, page, size });
};

export const action = async (args: ActionFunctionArgs) => RecycleBinService.handleRecycleBinAction(args);

export default createPage<InferLoader<typeof loader>, any, RecycleBinState>((ctx) => {
  const { data, urlState, updateUrlState, send, isSubmitting } = ctx;
  const handleRestore = (id: string) => send.submit({ intent: 'restore', id }, { method: 'post' });
  const handlePurge = (id: string) => send.submit({ intent: 'purge', id }, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Recycle Bin',
      subtitle: 'Kelola dan pulihkan data pesanan yang telah dihapus sebelumnya.',
      breadcrumbs: [{ label: 'Sistem & Akses', href: '/dashboard/admin/manage' }, { label: 'Recycle Bin', href: '/app/setting/recycle-bin' }],
    }),
    createElement(RecycleBinWidget, {
      data: data || { items: [], total_items: 0, page: 0, size: 10 },
      search: urlState?.search || '',
      onSearchChange: (search: string) => updateUrlState({ search, page: 0 }),
      onPageChange: (page: number) => updateUrlState({ page }),
      onRestore: handleRestore,
      onPurge: handlePurge,
      isSubmitting,
    })
  );
}, { defaultState: { search: '', page: 0, size: 10 } });
