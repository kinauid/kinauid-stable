import { createPage, createMeta, cacheHeaders, CACHE_PRESETS, Div, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { LandingService } from '~/services/landing.service';
import { LandingNavbar, LandingHero, LandingStats, LandingProducts, LandingPortfolio, LandingArticles, LandingFooter, FloatingWhatsAppButton } from '~/components/feature';

import { getSessionData } from '~/lib/session.server';

export const metaAccess: MetaAccessConfig = { roles: ['*'] };
export const meta = createMeta({
  title: 'Kinau ID — Cetak ID Card, Lanyard, Jersey & Apparel Hub',
  description: 'Solusi percetakan profesional dan konveksi jersey, kaos, kemeja, serta merchandise event berkualitas tinggi.',
});
export const headers = cacheHeaders(CACHE_PRESETS.semiStatic);

export const loader = withMiddleware([withTelemetry('loader:landing'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }) => {
  try {
    const user = await getSessionData(request);
    const data = await LandingService.getLandingData();
    return successResponse({ ...data, user });
  } catch (error) {
    ErrorCatch({ error, context: 'loader:landing' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;

export default createPage<InferLoader<typeof loader>>((ctx) =>
  Div({ className: 'min-h-screen bg-[var(--customer-bg)] selection:bg-[var(--accent)]/30' },
    Div({ className: 'max-w-[1600px] mx-auto bg-[var(--card)] shadow-2xl relative min-h-screen overflow-hidden' },
      LandingNavbar({ user: ctx.data?.user || ctx.user }),
      LandingHero(),
      LandingStats(ctx.data?.stats),
      LandingProducts(ctx.data?.products),
      LandingPortfolio(ctx.data?.portfolioItems),
      LandingArticles(ctx.data?.articles),
      LandingFooter(),
    ),
    FloatingWhatsAppButton()
  )
);
