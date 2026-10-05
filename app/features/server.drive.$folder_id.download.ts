import type { LoaderFunctionArgs } from 'react-router';
import { DriveService } from '~/services/drive.service';
import { ErrorCatch } from '~/lib/api';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const folderId = params.folder_id;
  if (!folderId) throw new Response('Folder ID wajib diisi', { status: 400 });

  try {
    return await DriveService.streamFolderZip(folderId);
  } catch (error) {
    ErrorCatch({ error, context: 'server.drive.$folder_id.download' });
    throw new Response('Gagal membuat arsip zip folder', { status: 500 });
  }
};
