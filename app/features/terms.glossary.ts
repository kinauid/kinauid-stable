import {
  UI,
  createPage,
  createMeta,
  cacheHeaders,
  Div,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Input,
  Icon,
  H1,
  H2,
  H3,
  P,
  Span,
  type InferLoader,
  type MetaAccessConfig,
} from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { extractUrlState } from '~/utils/cryptoState';

export const metaAccess: MetaAccessConfig = {
  roles: ['admin', 'editor', 'viewer'],
};

export const meta = createMeta({
  title: 'Kinau Architecture & Strategy Glossary',
  description: 'Daftar terminologi dan strategi arsitektur Clean Core v2.',
});

export const headers = cacheHeaders('SemiStatic');

interface TermItem {
  slug: string;
  name: string;
  cat: string;
  icon: string;
  desc: string;
}

const TERMS: TermItem[] = [
  {
    slug: 'zero-jsx-dsl',
    name: 'Zero-JSX Functional DSL',
    cat: 'Architecture',
    icon: 'Code2',
    desc: 'Pembuatan route UI murni berbasis tag DSL (.ts) untuk modularitas dan keseragaman desain.',
  },
  {
    slug: '3-layer-ddd',
    name: '3-Layer Domain Driven Design',
    cat: 'Structure',
    icon: 'Layers',
    desc: 'Pemisahan tegas: Layer 1 (Schema), Layer 2 (Service Logic), Layer 3 (Feature Route Presentation).',
  },
  {
    slug: 'dynamic-scanner',
    name: 'Dynamic Route Scanner',
    cat: 'Routing',
    icon: 'FolderTree',
    desc: 'Pemindaian otomatis file app/features/[dot.path].ts menjadi route React Router v7 tanpa registrasi manual.',
  },
  {
    slug: 'encrypted-url-state',
    name: 'Encrypted URL State (?q=...)',
    cat: 'Security & State',
    icon: 'Lock',
    desc: 'Enkripsi state query URL untuk filter, search, dan pagination yang bersih serta tamper-proof.',
  },
  {
    slug: 'modal-registry',
    name: 'Global Modal Registry',
    cat: 'UI Pattern',
    icon: 'Layout',
    desc: 'Manajemen modal terpusat (modals.open) tanpa markup modal berserakan di file route.',
  },
];

export interface GlossaryState {
  search?: string;
  category?: string;
}

export const loader = withMiddleware(
  [withTelemetry('loader:terms.glossary'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })],
  async ({ request }) => {
    const state = extractUrlState<GlossaryState>(request, {
      search: '',
      category: 'all',
    });

    const filtered = TERMS.filter((t) => {
      const matchSearch =
        !state.search ||
        t.name.toLowerCase().includes(state.search.toLowerCase()) ||
        t.desc.toLowerCase().includes(state.search.toLowerCase());
      const matchCat = !state.category || state.category === 'all' || t.cat === state.category;
      return matchSearch && matchCat;
    });

    return {
      terms: filtered,
      total: TERMS.length,
      categories: ['all', 'Architecture', 'Structure', 'Routing', 'Security & State', 'UI Pattern'],
    };
  }
);

export default createPage<InferLoader<typeof loader>, any, GlossaryState>(
  (ctx) => {
    const { data, urlState, updateUrlState } = ctx;

    return Div(
      { className: 'space-y-6 max-w-5xl mx-auto' },
      Div(
        {
          className:
            'p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2',
        },
        H1({ className: 'text-2xl font-bold text-[var(--foreground)]' }, 'Arsitektur Clean Core v2'),
        P(
          { className: 'text-xs text-[var(--muted-foreground)] leading-relaxed' },
          'Glosarium terminologi dan prinsip desain sistem yang diterapkan pada seluruh modul Kinau ID.'
        )
      ),
      Card(
        { className: 'p-4 space-y-4' },
        Row(
          { className: 'flex flex-wrap items-center justify-between gap-3' },
          Row(
            { className: 'flex flex-wrap gap-2' },
            ...(data?.categories || []).map((cat: string) =>
              Button({
                key: cat,
                label: cat === 'all' ? 'Semua Kategori' : cat,
                size: 'sm',
                variant: (urlState.category ?? 'all') === cat ? 'primary' : 'outline',
                onClick: () => updateUrlState({ category: cat }),
              })
            )
          ),
          Div(
            { className: 'relative w-64' },
            Input({ name: 'search',
              placeholder: 'Cari terminologi...',
              value: urlState.search ?? '',
              onChange: (e: any) => updateUrlState({ search: e.target.value }),
              className: 'pl-8 text-xs',
            }),
            Div(
              {
                className:
                  'absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]',
              },
              Icon('Search', { size: 14 })
            )
          )
        )
      ),
      Div(
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        ...(data?.terms || []).map((term: TermItem) =>
          Card(
            { key: term.slug, className: 'p-5 space-y-3' },
            Row(
              { className: 'flex items-center justify-between' },
              Row(
                { className: 'flex items-center gap-2.5' },
                Div(
                  {
                    className:
                      'w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center',
                  },
                  Icon(term.icon, { size: 16 })
                ),
                H3({ className: 'text-sm font-bold text-[var(--foreground)]' }, term.name)
              ),
              Badge({ label: term.cat, variant: 'outline' })
            ),
            P({ className: 'text-xs text-[var(--muted-foreground)] leading-relaxed' }, term.desc),
            Div(
              { className: 'pt-2 border-t border-[var(--border)] flex items-center justify-between' },
              Span({ className: 'font-mono text-[10px] text-[var(--muted-foreground)]' }, `slug: ${term.slug}`),
              Badge({ label: 'Clean Core Standard', variant: 'success' })
            )
          )
        )
      )
    );
  },
  { defaultState: { search: '', category: 'all' } }
);
