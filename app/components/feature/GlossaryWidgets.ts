import {
  Div,
  Row,
  Card,
  Badge,
  Button,
  Input,
  Icon,
  H1,
  H3,
  P,
  Span,
} from '~/builder';
import { type TermItem, type GlossaryState } from '~/schemas/glossary.schema';

export function renderGlossaryView({
  data,
  urlState,
  updateUrlState,
}: {
  data: any;
  urlState: GlossaryState;
  updateUrlState: (s: Partial<GlossaryState>) => void;
}) {
  return Div(
    { className: 'space-y-6 max-w-5xl mx-auto select-none font-sans' },
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
          Input({
            name: 'search',
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
}
