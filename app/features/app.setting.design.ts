import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { DesignTemplateService } from '~/services/design-template.service';
import { DesignTemplateWidget } from '~/components/feature/DesignTemplateWidgets';
import type { DesignState, DesignCategory } from '~/schemas/design-template.schema';

export const meta = () => [{ title: 'Studio Template & Desain - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const category = (url.searchParams.get('category') || 'idcard') as DesignCategory;
  const search = url.searchParams.get('search') || '';
  return DesignTemplateService.getDesignDashboardData({ category, search });
};

export const action = async (args: ActionFunctionArgs) => DesignTemplateService.handleDesignTemplateAction(args);

export default createPage<InferLoader<typeof loader>, any, DesignState>((ctx) => {
  const { data, updateUrlState, send, isSubmitting } = ctx;
  const handleSave = (payload: any) => send.submit(payload, { method: 'post' });
  const handleDelete = (id: string) => send.submit({ intent: 'delete-template', id }, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Studio Desain & Master Template',
      subtitle: 'Kelola master template ID Card, strip lanyard, dan bank aset bordir selempang wisuda.',
      breadcrumbs: [{ label: 'Pengaturan', href: '/app/setting/account' }, { label: 'Studio Desain', href: '/app/setting/design' }],
    }),
    createElement(DesignTemplateWidget, {
      data: data || { templates: [], selempangAssets: [], activeCategory: 'idcard' },
      onCategoryChange: (category: DesignCategory) => updateUrlState({ category }),
      onSaveTemplate: handleSave,
      onDeleteTemplate: handleDelete,
      isSubmitting,
    })
  );
}, { defaultState: { category: 'idcard', search: '' } });
