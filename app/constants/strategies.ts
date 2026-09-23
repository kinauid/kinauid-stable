export interface StrategyDef {
  id: string;
  name: string;
  code: string;
  description: string;
  accent: string;
}

// Strategi default (seed) — user bisa menambah strategi sendiri dari /journal.
export const STRATEGY_DEFS: StrategyDef[] = [
  {
    id: 'pola-n',
    name: 'Pola N',
    code: 'Pola N',
    description: 'Breakout pullback pattern — entry setelah retest area breakout.',
    accent: '#16a34a',
  },
  {
    id: 'daily-breakout',
    name: 'Daily Breakout',
    code: 'Daily Breakout',
    description: 'Trading breakout level harian (Asian range, London/NY open).',
    accent: '#16a34a',
  },
  {
    id: 'ict-concept',
    name: 'ICT Concept',
    code: 'ICT Concept',
    description: 'Inner Circle Trader — order blocks, fair value gap, liquidity.',
    accent: '#16a34a',
  },
];

export function getStrategyByCode(code: string | null | undefined): StrategyDef | undefined {
  if (!code) return undefined;
  return STRATEGY_DEFS.find((s) => s.code === code || s.id === code);
}
