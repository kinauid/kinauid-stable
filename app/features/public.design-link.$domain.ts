import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, type InferLoader } from '~/builder';
import { PublicDesignService } from '~/services/public-design.service';
import { PublicDesignWidget } from '~/components/feature/PublicDesignWidgets';

export const meta = () => [{ title: 'Persetujuan Desain & Mockup — Kinau Studio' }];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const domain = params.domain || '';
  return PublicDesignService.getPublicDesignData(domain);
};

export const action = async (args: ActionFunctionArgs) => PublicDesignService.handlePublicDesignAction(args);

export default createPage<InferLoader<typeof loader>, any, any>((ctx) => {
  const { data, send, isSubmitting } = ctx;

  const handleApprove = (orderNumber: string, notes?: string) => {
    send.submit({ intent: 'approve-design', order_number: orderNumber, notes: notes || '' } as any, { method: 'post' });
  };

  const handleRevision = (orderNumber: string, notes: string) => {
    send.submit({ intent: 'request-revision', order_number: orderNumber, notes } as any, { method: 'post' });
  };

  return Div(
    { className: 'min-h-screen bg-[var(--background)] px-4 py-8' },
    createElement(PublicDesignWidget, {
      data: data || { domain: '', orderData: null, templates: [], activeTemplate: null },
      onApprove: handleApprove,
      onRevision: handleRevision,
      isSubmitting,
    })
  );
});
