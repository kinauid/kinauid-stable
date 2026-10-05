import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { AccountSettingService } from '~/services/account-setting.service';
import { AccountSettingWidget } from '~/components/feature/AccountSettingWidgets';
import type { AccountSettingState } from '~/schemas/account-setting.schema';

export const meta = () => [{ title: 'Pengaturan Perusahaan & Workspace - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const tab = (url.searchParams.get('tab') || 'general') as any;
  return AccountSettingService.getWorkspaceData({ tab });
};

export const action = async (args: ActionFunctionArgs) => AccountSettingService.handleAccountAction(args);

export default createPage<InferLoader<typeof loader>, any, AccountSettingState>((ctx) => {
  const { data, send, isSubmitting } = ctx;
  const handleSave = (payload: any) => send.submit(payload, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Pengaturan Workspace & Perusahaan',
      subtitle: 'Kelola identitas resmi workshop, kop surat, rekening pembayaran, dan gateway WhatsApp.',
      breadcrumbs: [{ label: 'Pengaturan', href: '/app/setting/account' }, { label: 'Akun & Profil Perusahaan', href: '/app/setting/account' }],
    }),
    createElement(AccountSettingWidget, {
      data: data || { company_name: 'Kinau Studio', tagline: '', address: '', phone: '', email: '', website: '', auto_notify_dp: true, auto_notify_delivery: true, bank_accounts: [] },
      onSaveGeneral: handleSave,
      onSaveBank: handleSave,
      onSaveWhatsApp: handleSave,
      isSubmitting,
    })
  );
}, { defaultState: { tab: 'general' } });
