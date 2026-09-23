import type { ReactNode } from 'react';
import { renderModal } from '~/builder/components';
import type { ModalProps } from '~/builder/types';
import type { FluentBuilder } from '~/builder/proxy';

export type { ModalProps };

/**
 * Atomic Modal DSL Primitive
 */
export const Modal = (props: ModalProps, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  renderModal(props, ...children);

export default Modal;
