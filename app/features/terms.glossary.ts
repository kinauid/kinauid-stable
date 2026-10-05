import { createPage, createMeta, cacheHeaders, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';
import { type GlossaryState } from '~/schemas/glossary.schema';
import { GlossaryService } from '~/services/glossary.service';
import { renderGlossaryView } from '~/components/feature/GlossaryWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'editor', 'viewer'] };
export const meta = createMeta({
  title: 'Kinau Architecture & Strategy Glossary',
  description: 'Daftar terminologi dan strategi arsitektur Clean Core v2.',
});
export const headers = cacheHeaders('SemiStatic');

export const loader = withMiddleware(
  [withTelemetry('loader:terms.glossary'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })],
  async ({ request }) => {
    const state = extractUrlState<GlossaryState>(request, { search: '', category: 'all' });
    return GlossaryService.getGlossaryData(state);
  }
);
(loader as any).metaAccess = metaAccess;

export default createPage<InferLoader<typeof loader>, any, GlossaryState>(
  ({ data, urlState, updateUrlState }) => renderGlossaryView({ data, urlState, updateUrlState }),
  { defaultState: { search: '', category: 'all' } }
);
