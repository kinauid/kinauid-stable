import React from 'react';
import type { ReactNode } from 'react';
import { UI } from '~/builder';

export interface LayoutPublicProps {
  children: ReactNode;
  isNavigating?: boolean;
  user?: any;
}

/**
 * LayoutPublic — wrapper minimal untuk halaman publik (landing, login, dll).
 * Tidak ada sidebar/topbar. Hanya progress bar navigasi dan full-page container.
 */
export function renderLayoutPublic({ children, isNavigating = false }: LayoutPublicProps): React.ReactElement {
  const progressBar = isNavigating
    ? UI.div({ className: 'fixed top-0 left-0 right-0 h-0.5 bg-[var(--primary)] z-50 animate-pulse shadow-sm shadow-[var(--primary)]/50' })
    : null;

  return UI.div(
    { className: 'min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased font-sans' },
    progressBar,
    children as React.ReactElement
  );
}
