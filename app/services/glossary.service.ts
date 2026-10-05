import { type TermItem, type GlossaryState } from '~/schemas/glossary.schema';

export const TERMS_DATABASE: TermItem[] = [
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

export class GlossaryService {
  static async getGlossaryData(state: GlossaryState = {}) {
    const filtered = TERMS_DATABASE.filter((t) => {
      const matchSearch =
        !state.search ||
        t.name.toLowerCase().includes(state.search.toLowerCase()) ||
        t.desc.toLowerCase().includes(state.search.toLowerCase());
      const matchCat = !state.category || state.category === 'all' || t.cat === state.category;
      return matchSearch && matchCat;
    });

    return {
      terms: filtered,
      total: TERMS_DATABASE.length,
      categories: ['all', 'Architecture', 'Structure', 'Routing', 'Security & State', 'UI Pattern'],
    };
  }
}
