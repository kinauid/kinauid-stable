import { renderInput, renderTextarea } from '~/builder/components';
import type { InputProps, TextareaProps } from '~/builder/types';

export type { InputProps, TextareaProps };

/**
 * Atomic Input DSL Primitive
 */
export const Input = (props: InputProps) => renderInput(props);

/**
 * Atomic Textarea DSL Primitive
 */
export const Textarea = (props: TextareaProps) => renderTextarea(props);

export default Input;
