import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, cacheHeaders, CACHE_PRESETS, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { PublicDriveService, handlePublicDriveAction } from '~/services/public-drive.service';
import { PublicDriveWidget } from '~/components/feature';

export const metaAccess: MetaAccessConfig = { roles: ['*'] };
export const meta = createMeta({
  title: 'Drive File Cetak & Nota — Kinau ID',
  description: 'Akses publik folder drive file cetak dan nota pesanan Kinau ID.',
});
export const headers = cacheHeaders(CACHE_PRESETS.semiStatic);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const folderId = url.searchParams.get('folder_id');
    const data = await PublicDriveService.getPublicDriveData(params.domain || '', folderId);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
};
(loader as any).metaAccess = metaAccess;

export const action = (args: ActionFunctionArgs) => handlePublicDriveAction(args);

export default createPage<InferLoader<typeof loader>>((ctx) =>
  PublicDriveWidget({ data: ctx.data, isSubmitting: ctx.isSubmitting })
);
