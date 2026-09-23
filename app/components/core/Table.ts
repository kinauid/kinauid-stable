import { renderTable } from '~/builder/components';
import type { TableProps, TableColumn } from '~/builder/types';

export type { TableProps, TableColumn };

/**
 * Atomic Table DSL Primitive
 */
export const Table = <T = any>(props: TableProps<T>) => renderTable<T>(props);

export default Table;
