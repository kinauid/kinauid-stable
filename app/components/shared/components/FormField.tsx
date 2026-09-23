import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  helperText,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-medium text-zinc-400">
          {label} {required && <span className="text-[#30b29e]">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-zinc-500">{helperText}</p>}
    </div>
  );
}
