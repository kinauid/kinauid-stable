import type { ReactNode } from 'react';
import { renderCard } from '~/builder/components';
import type { CardProps } from '~/builder/types';
import type { FluentBuilder } from '~/builder/proxy';

export type { CardProps };

/**
 * Atomic Card DSL Primitive
 */
export const Card = (props: CardProps, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  renderCard(props, ...children);

export default Card;
