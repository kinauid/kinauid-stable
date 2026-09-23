import { cn } from '~/lib/utils';

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

function LoadingState({ rows = 3, className }: LoadingStateProps) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 px-4 py-3 border border-[var(--border)] bg-[var(--card)] rounded-[var(--radius-card-sm)]"
        >
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded-md bg-white/[0.06] animate-pulse" />
            <div className="h-2.5 w-1/2 rounded-md bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-4 w-16 rounded-full bg-white/[0.05] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export { LoadingState };
