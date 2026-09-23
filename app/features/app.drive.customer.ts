import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, Table, TextColumn, PageHeader, StatsGrid, FilterBar, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { extractUrlState } from '~/utils/cryptoState';
import { type DriveItem, type DriveState } from '~/schemas/drive.schema';
import { DriveService, handleDriveAction } from '~/services/drive.service';

export const metaAccess: MetaAccessConfig = { roles: ['customer', 'admin', 'staff'], permissions: ['drive:read'] };
export const meta = createMeta({ title: 'Customer Drive & Mockup Workspace — Kinau ID', description: 'Folder desain dan approval pesanan Anda.' });

export const loader = withMiddleware([withTelemetry('loader:drive.customer'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const state = extractUrlState<DriveState>(request, { folderId: 'root', search: '', viewMode: 'table' });
    return successResponse(await DriveService.getItems(state));
  } catch (error) {
    ErrorCatch({ error, context: 'loader:drive.customer' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleDriveAction(args);

export default createPage<InferLoader<typeof loader>, any, DriveState>((ctx) => {
  const { data, urlState, updateUrlState } = ctx;

  return Div({ className: 'space-y-5 max-w-6xl mx-auto' },
    PageHeader({ title: 'Ruang Desain & Mockup Anda', subtitle: 'File artwork resolusi tinggi, pola jersey, dan approval pesanan.', badges: [{ label: `${data?.totalCount ?? 0} File Tersedia`, variant: 'outline' }] }),
    StatsGrid([{ label: 'File Siap Unduh', value: data?.fileCount, icon: 'DownloadCloud', color: 'cyan' }, { label: 'Format Desain', value: 'AI / PDF / PNG', icon: 'FileImage', color: 'purple' }, { label: 'Status Verifikasi Desain', value: 'Disetujui', icon: 'CheckCircle2', color: 'green' }]),
    FilterBar({ search: urlState.search, onSearchChange: (search) => updateUrlState({ search }), searchPlaceholder: 'Cari mockup atau file desain...', showReset: Boolean(urlState.search), onReset: () => updateUrlState({ search: '' }) }),
    Table<DriveItem>({ data: data?.items?.filter((i: any) => i.type !== 'folder') ?? [], keyField: 'id', columns: [TextColumn({ key: 'name', header: 'Nama File Desain', className: 'font-bold' }), TextColumn({ key: 'type', header: 'Format' }), TextColumn({ key: 'size', header: 'Ukuran File' }), TextColumn({ key: 'updated_at', header: 'Tanggal Upload' })] })
  );
}, { defaultState: { folderId: 'root', search: '', viewMode: 'table' } });
