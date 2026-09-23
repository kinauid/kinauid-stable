import { renderBadge } from '~/builder/components';
import type { BadgeProps } from '~/builder/types';

export type { BadgeProps };

/**
 * Atomic Badge DSL Primitive
 */
export const Badge = (props: BadgeProps) => renderBadge(props);

export default Badge;
