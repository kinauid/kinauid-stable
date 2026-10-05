import { createElement } from 'react';
import { createPage, createMeta, type MetaAccessConfig } from '~/builder';
import { UnderConstructionView } from '~/components/shared/UnderConstructionView';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager', 'staff'], permissions: [] };
export const meta = createMeta({ title: 'Halaman Tidak Ditemukan — Kinau ID', description: 'Rute ini belum tersedia atau sedang dalam pengembangan.' });

export const loader = async () => null;
(loader as any).metaAccess = metaAccess;

export default createPage(
  () => createElement(UnderConstructionView),
  { defaultState: {} }
);
