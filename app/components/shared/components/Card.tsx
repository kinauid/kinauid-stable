import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '~/lib/utils';

function Card({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)]',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-5 py-4 border-b border-[var(--border)]',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3
      className={cn('text-sm font-semibold text-[var(--foreground)] tracking-tight', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      className={cn('text-xs text-[var(--muted-foreground)] leading-relaxed mt-0.5', className)}
      {...props}
    />
  );
}

function CardBody({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('p-5', className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)] bg-[var(--surface-subtle)] rounded-b-[var(--radius-card)]',
        className
      )}
      {...props}
    />
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card };
