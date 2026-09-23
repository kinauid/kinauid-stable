import { renderSelect } from '~/builder/components';
import type { SelectProps, SelectOption } from '~/builder/types';

export type { SelectProps, SelectOption };

/**
 * Atomic Select DSL Primitive
 */
export const Select = (props: SelectProps) => renderSelect(props);

export default Select;
