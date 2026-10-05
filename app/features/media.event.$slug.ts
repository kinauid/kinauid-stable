import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { MediaEventService } from '~/services/media-event.service';
import { MediaEventWidget } from '~/components/feature/MediaEventWidgets';
import type { MediaEventState } from '~/schemas/media-event.schema';

export const meta = () => [{ title: 'Twibbon & Event Campaign - Kinau Studio' }];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const slug = params.slug || 'kkn-unisma-2026';
  return MediaEventService.getEventBySlug(slug);
};

export const action = async (args: ActionFunctionArgs) => MediaEventService.handleMediaEventAction(args);

export default createPage<InferLoader<typeof loader>, any, MediaEventState>((ctx) => {
  const { data, send } = ctx;
  const handleRecordDownload = () => send.submit({ intent: 'record-download', slug: data?.slug || 'event' }, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-6xl mx-auto pb-12 pt-4 px-4' },
    createElement(MediaEventWidget, {
      data: data || { id: '1', slug: 'event', title: 'Twibbon Event', organization: 'Kinau Studio', description: '', frame_url: '', aspect_ratio: '1:1', caption_template: '', hashtags: [], total_downloads: 0 },
      onRecordDownload: handleRecordDownload,
    })
  );
}, { defaultState: {} });
