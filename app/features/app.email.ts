import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { EmailService } from '~/services/email.service';
import { EmailWidget } from '~/components/feature/EmailWidgets';
import type { EmailState, EmailFolder } from '~/schemas/email.schema';

export const meta = () => [{ title: 'Email & Campaign Mailbox - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const folder = (url.searchParams.get('folder') || 'inbox') as EmailFolder;
  const account = url.searchParams.get('account') || 'official@kinau.id';
  const search = url.searchParams.get('search') || '';
  return EmailService.getMailboxData({ folder, account, search });
};

export const action = async (args: ActionFunctionArgs) => EmailService.handleEmailAction(args);

export default createPage<InferLoader<typeof loader>, any, EmailState>((ctx) => {
  const { data, state, updateUrlState, send, isSubmitting } = ctx;
  const handleSend = (payload: any) => send.submit({ ...payload, intent: 'send-email' }, { method: 'post' });
  const handleBroadcast = (payload: any) => send.submit({ ...payload, intent: 'broadcast-campaign' }, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Mailbox & Email Campaign',
      subtitle: 'Pantau email masuk, konfirmasi bukti transfer order, dan kirim campaign penawaran merchandise.',
      breadcrumbs: [{ label: 'App', href: '/app/dashboard' }, { label: 'Email', href: '/app/email' }],
    }),
    createElement(EmailWidget, {
      data: data || { inbox: [], spam: [], sent: [], unreadCount: 0, selectedAccount: 'official@kinau.id', isCEO: true, accounts: [] },
      activeFolder: (state.folder || 'inbox') as EmailFolder,
      onFolderChange: (folder: EmailFolder) => updateUrlState({ folder }),
      onAccountChange: (account: string) => updateUrlState({ account }),
      onSendEmail: handleSend,
      onBroadcast: handleBroadcast,
      isSubmitting,
    })
  );
}, { defaultState: { folder: 'inbox', account: 'official@kinau.id' } });
