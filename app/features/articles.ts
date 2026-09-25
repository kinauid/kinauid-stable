import type { LoaderFunctionArgs } from 'react-router';
import { createPage, createMeta, cacheHeaders, CACHE_PRESETS, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { ArticleService } from '~/services/article.service';
import { ArticleViewWidget } from '~/components/feature';
import { getSessionData } from '~/lib/session.server';

export const metaAccess: MetaAccessConfig = { roles: ['*'] };
export const meta = createMeta({
  title: 'Panduan & Edukasi Percetakan — Kinau ID Knowledge Hub',
  description: 'Panduan lengkap material kain jersey, standar sublimasi full print, dan teknik apparel custom.',
});
export const headers = cacheHeaders(CACHE_PRESETS.semiStatic);

export const loader = withMiddleware([withTelemetry('loader:articles'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug') || undefined;
    const user = await getSessionData(request);
    const data = await ArticleService.getArticleBySlug(slug);
    return successResponse({ ...data, user });
  } catch (error) {
    ErrorCatch({ error, context: 'loader:articles' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;

export default createPage<InferLoader<typeof loader>>((ctx) =>
  ArticleViewWidget({
    activeArticle: ctx.data?.activeArticle,
    recentArticles: ctx.data?.recentArticles,
    allArticles: ctx.data?.allArticles,
    user: ctx.data?.user || ctx.user,
  })
);
