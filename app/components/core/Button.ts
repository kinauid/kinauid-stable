import type { ReactNode } from 'react';
import { renderButton, renderSubmitButton } from '~/builder/components';
import type { ButtonProps, SubmitButtonProps } from '~/builder/types';
import type { FluentBuilder } from '~/builder/proxy';

export type { ButtonProps, SubmitButtonProps };

/**
 * Atomic Button DSL Primitive
 */
export const Button = (props: ButtonProps) => renderButton(props);

/**
 * Atomic SubmitButton DSL Primitive
 */
export const SubmitButton = (props: SubmitButtonProps) => renderSubmitButton(props);

export default Button;
