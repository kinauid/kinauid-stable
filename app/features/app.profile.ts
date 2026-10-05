import type { ActionFunctionArgs } from 'react-router';
import { createElement } from 'react';
import { createPage, createMeta, Div, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ProfileService, handleProfileAction } from '~/services/profile.service';
import { MobileProfileView } from '~/components/mobile';
import { type ProfileState } from '~/schemas/profile.schema';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'staff', 'customer'], permissions: ['profile:read'] };
export const meta = createMeta({ title: 'Profil Pengguna — Kinau ID', description: 'Pengaturan akun staf, preferensi aplikasi, dan keamanan.' });

export const loader = withMiddleware([withTelemetry('loader:app.profile'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  return ProfileService.getProfile(request);
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleProfileAction(args);

export default createPage<InferLoader<typeof loader>, any, ProfileState>(
  ({ data, send, navigate }) => Div(
    { className: 'w-full min-h-screen bg-[#F8FAFC] dark:bg-[#0a1f30] transition-colors' },
    createElement(MobileProfileView, { profile: data?.profile as any, send, navigate })
  ),
  { defaultState: { tab: 'overview' } }
);
