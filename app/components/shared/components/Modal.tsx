import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  className?: string;
  bodyClassName?: string;
}

const MAX_WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  icon,
  title,
  description,
  maxWidth = 'md',
  children,
  footer,
  closeOnBackdrop = true,
  className,
  bodyClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          'relative w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden',
          MAX_WIDTHS[maxWidth],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0 text-sm font-bold">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-bold text-[var(--foreground)] tracking-tight truncate">
                {title}
              </h3>
              {description && (
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
                  {description}
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 h-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Content Body */}
        <div
          className={cn(
            'p-6 overflow-y-auto flex-1 scrollbar-thin space-y-4 text-xs',
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--surface)]/60 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
