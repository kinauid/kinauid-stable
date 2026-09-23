import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '~/lib/utils';

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: 'default' | 'profit' | 'loss' | 'warning' | 'info' | 'purple' | 'neutral' | 'mint';
  variant?: 'subtle' | 'outline' | 'solid';
}

function Badge({ tone = 'default', variant = 'subtle', className, ...props }: BadgeProps) {
  const tones = {
    default: {
      subtle: 'bg-[var(--surface-subtle)] text-[var(--foreground)] border-[var(--border)]',
      outline: 'bg-transparent text-[var(--foreground)] border-[var(--border-strong)]',
      solid: 'bg-white/20 text-white border-transparent',
    },
    profit: {
      subtle: 'bg-[var(--profit-bg)] text-[var(--profit)] border-[var(--profit-border)]',
      outline: 'bg-transparent text-[var(--profit)] border-[var(--profit-border)]',
      solid: 'bg-[var(--profit)] text-[var(--accent-foreground)] font-semibold border-transparent',
    },
    mint: {
      subtle: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]',
      outline: 'bg-transparent text-[var(--accent)] border-[var(--accent-border)]',
      solid: 'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold border-transparent',
    },
    loss: {
      subtle: 'bg-[var(--loss-bg)] text-[var(--loss)] border-[var(--loss-border)]',
      outline: 'bg-transparent text-[var(--loss)] border-[var(--loss-border)]',
      solid: 'bg-[var(--loss)] text-white font-semibold border-transparent',
    },
    warning: {
      subtle: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]',
      outline: 'bg-transparent text-[var(--warning)] border-[var(--warning-border)]',
      solid: 'bg-[var(--warning)] text-slate-950 font-semibold border-transparent',
    },
    info: {
      subtle: 'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-border)]',
      outline: 'bg-transparent text-[var(--info)] border-[var(--info-border)]',
      solid: 'bg-[var(--info)] text-white font-semibold border-transparent',
    },
    purple: {
      subtle: 'bg-[var(--purple-bg)] text-[var(--purple)] border-[var(--purple-border)]',
      outline: 'bg-transparent text-[var(--purple)] border-[var(--purple-border)]',
      solid: 'bg-[var(--purple)] text-white font-semibold border-transparent',
    },
    neutral: {
      subtle: 'bg-white/[0.04] text-[var(--muted-foreground)] border-[var(--border)]',
      outline: 'bg-transparent text-[var(--muted-foreground)] border-[var(--border)]',
      solid: 'bg-[var(--card-hover)] text-[var(--foreground)] border-[var(--border)]',
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-tight rounded-full border',
        tones[tone][variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps };
