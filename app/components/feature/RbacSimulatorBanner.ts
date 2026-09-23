import React from 'react';
import { Row, Col, Span, P, Badge, Button, Icon, ui } from '~/builder';

// ============================================================================
// RBAC Simulator Banner Component (Feature Specific: Admin & RBAC)
// ============================================================================

export interface RbacSimulatorBannerProps {
  activeRole: string;
  onSwitch: (role: 'admin' | 'editor' | 'viewer') => void;
  description?: string;
}

export function RbacSimulatorBanner(props: RbacSimulatorBannerProps): React.ReactElement {
  const {
    activeRole,
    onSwitch,
    description = 'Ubah role simulasi untuk menguji declarative UI permission guard (.guard()) secara real-time.',
  } = props;

  return ui('div')
    .class(
      'p-3.5 rounded-[var(--radius-card-sm)] bg-radial from-indigo-500/10 via-[var(--surface-subtle)] to-[var(--card)] border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs'
    )
    .childrenOf(
      Row(
        { className: 'gap-2.5' },
        ui('div')
          .class(
            'w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0'
          )
          .childrenOf(Icon('ShieldAlert', { size: 16 })),
        Col(
          { className: 'gap-0.5' },
          Row(
            { className: 'gap-2' },
            Span({ className: 'text-xs font-bold text-[var(--foreground)]' }, 'RBAC Simulator:'),
            Badge({
              label: `Active Role: ${activeRole.toUpperCase()}`,
              variant:
                activeRole === 'admin' ? 'info' : activeRole === 'editor' ? 'primary' : 'secondary',
            })
          ),
          P({ className: 'text-[11px] text-[var(--muted-foreground)]' }, description)
        )
      ),
      Row(
        { className: 'gap-1.5' },
        Button({
          label: 'Simulate Admin',
          size: 'xs',
          variant: activeRole === 'admin' ? 'primary' : 'outline',
          onClick: () => onSwitch('admin'),
        }),
        Button({
          label: 'Simulate Editor',
          size: 'xs',
          variant: activeRole === 'editor' ? 'primary' : 'outline',
          onClick: () => onSwitch('editor'),
        }),
        Button({
          label: 'Simulate Viewer',
          size: 'xs',
          variant: activeRole === 'viewer' ? 'primary' : 'outline',
          onClick: () => onSwitch('viewer'),
        })
      )
    )
    .build();
}

export default RbacSimulatorBanner;
