import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '~/lib/utils';

export interface InputProps extends ComponentPropsWithoutRef<'input'> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full px-3 py-2 rounded-xl bg-[#161616] border border-zinc-800 text-white text-xs',
          'placeholder:text-zinc-500',
          'focus:outline-hidden focus:border-[#30b29e] focus:ring-1 focus:ring-[#30b29e]/30',
          'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
