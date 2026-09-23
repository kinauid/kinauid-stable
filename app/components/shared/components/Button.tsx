import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '~/lib/utils';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const variants = {
      primary:
        'bg-[var(--primary)] hover:opacity-90 text-white font-semibold shadow-xs active:scale-[0.98]',
      secondary:
        'bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] font-semibold shadow-xs active:scale-[0.98]',
      outline:
        'bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-subtle)] active:scale-[0.98]',
      ghost:
        'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] active:scale-[0.98]',
      danger:
        'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98]',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
      md: 'h-9 px-3.5 text-xs gap-2 rounded-md',
      lg: 'h-10 px-4 text-sm gap-2.5 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-sans select-none',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
