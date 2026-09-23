import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '~/lib/utils';

export interface SelectProps extends ComponentPropsWithoutRef<'select'> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 rounded-xl bg-[#161616] border border-zinc-800 text-white text-xs',
            'focus:outline-hidden focus:border-[#30b29e] focus:ring-1 focus:ring-[#30b29e]/30',
            'appearance-none pr-8 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
