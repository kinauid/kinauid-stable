import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { CustomerProfileService } from '~/services/customer-profile.service';
import { CustomerProfileWidget } from '~/components/feature/CustomerProfileWidgets';
import type { CustomerProfileState } from '~/schemas/customer-profile.schema';

export const meta = () => [{ title: 'Profil Akun & Pengiriman - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const tab = (url.searchParams.get('tab') || 'profile') as any;
  return CustomerProfileService.getProfileData({ tab });
};

export const action = async (args: ActionFunctionArgs) => CustomerProfileService.handleProfileAction(args);

export default createPage<InferLoader<typeof loader>, any, CustomerProfileState>((ctx) => {
  const { data, send, navigate, isSubmitting } = ctx;
  const handleSave = (payload: any) => send.submit(payload, { method: 'post' });
  const handleLogout = () => send.submit({ intent: 'logout' }, { action: '/logout', method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Profil & Alamat Pelanggan',
      subtitle: 'Atur identitas akun, nomor kontak WhatsApp, dan alamat tujuan ekspedisi pesanan.',
      breadcrumbs: [{ label: 'Customer', href: '/customer/dashboard' }, { label: 'Profil', href: '/customer/profile' }],
    }),
    createElement(CustomerProfileWidget, {
      data: data || { fullname: 'Pelanggan', email: '', phone: '', institution: '', address: '', city: '', postal_code: '', total_orders: 0, joined_date: '2026', notify_email: true, notify_whatsapp: true },
      onSaveProfile: handleSave,
      onLogout: handleLogout,
      isSubmitting,
    })
  );
}, { defaultState: { tab: 'profile' } });
