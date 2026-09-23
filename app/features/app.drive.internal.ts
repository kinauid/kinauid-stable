import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Button, Table, ConfirmDialog, modals, TextColumn, TableActions, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { type DriveItem, type DriveState } from '~/schemas/drive.schema';
import { DriveService, handleDriveAction } from '~/services/drive.service';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff'], permissions: ['drive:read'] };
export const meta = createMeta({ title: 'Internal Cloud Drive — Kinau ID', description: 'Penyimpanan file desain & mockup.' });

export const loader = withMiddleware([withTelemetry('loader:drive.internal'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<DriveState>(request, { folderId: 'root', search: '', viewMode: 'table' });
    return successResponse(await DriveService.getItems(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:drive.internal' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleDriveAction(args);

export default createPage<InferLoader<typeof loader>, any, DriveState>((ctx) => {
  const { data, urlState, updateUrlState, send } = ctx;
  const post = (intent: string, id: string) => send.submit({ intent, id }, { method: 'post' });

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({
      title: 'Internal Cloud Drive', subtitle: 'Manajemen aset visual & dokumen produksi.',
      badges: [{ label: `${data?.totalCount ?? 0} Item`, variant: 'outline' }],
      actions: [
        urlState.folderId && urlState.folderId !== 'root' ? Button({ label: 'Kembali', icon: 'ArrowLeft', variant: 'ghost', size: 'sm', onClick: () => updateUrlState({ folderId: 'root' }) }) : null,
        Button({ label: 'Buat Folder', icon: 'FolderPlus', variant: 'primary', size: 'sm', onClick: () => modals.open('CREATE_FOLDER_MODAL', { parentId: urlState.folderId, onSubmit: (v: any) => send.submit(v, { method: 'post' }) }) }),
      ].filter(Boolean) as any,
    }),
    StatsGrid([{ label: 'Total Folder', value: data?.folderCount, icon: 'Folder', color: 'cyan' }, { label: 'File Desain', value: data?.fileCount, icon: 'FileText', color: 'green' }, { label: 'Storage Engine', value: 'Cloud Sync', icon: 'HardDrive', color: 'purple' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), searchPlaceholder: 'Cari file atau folder...', showReset: Boolean(urlState.search), onReset: () => updateUrlState({ search: '' }) }),
    Table<DriveItem>({ data: data?.items ?? [], keyField: 'id', columns: [TextColumn({ key: 'name', header: 'Nama File / Folder', className: 'font-bold' }), TextColumn({ key: 'type', header: 'Tipe' }), TextColumn({ key: 'size', header: 'Ukuran' }), TextColumn({ key: 'updated_at', header: 'Terakhir Diubah' }), TableActions<DriveItem>([{ icon: 'FolderOpen', guard: 'drive:read', onClick: (d) => d.type === 'folder' && updateUrlState({ folderId: d.id }) }, { icon: 'Trash2', variant: 'danger', onClick: (d) => ConfirmDialog.delete({ name: d.name, onConfirm: () => post('delete-item', d.id) }) }])] })
  );
}, { defaultState: { folderId: 'root', search: '', viewMode: 'table' } });
