export const COLUMN_COLORS = [
  'red',
  'orange',
  'amber',
  'emerald',
  'teal',
  'blue',
  'indigo',
  'purple',
  'pink',
  'gray',
] as const;

export type ColumnColor = (typeof COLUMN_COLORS)[number];

export function isColumnColor(value: string | null | undefined): value is ColumnColor {
  return typeof value === 'string' && COLUMN_COLORS.includes(value as ColumnColor);
}

export function normalizeColumnColor(value: string | null | undefined): ColumnColor {
  return isColumnColor(value) ? value : 'gray';
}

export const COLUMN_COLOR_CHIP_CLASSES: Record<ColumnColor, string> = {
  red: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  orange:
    'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  amber:
    'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  emerald:
    'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  teal: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
  blue: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  indigo:
    'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  purple:
    'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  pink: 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
  gray: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
};

// Solid swatch used for the color-picker buttons when creating/editing a Column.
export const COLUMN_COLOR_SWATCH_CLASSES: Record<ColumnColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  gray: 'bg-gray-500',
};

export interface OrderableColumn {
  id: string;
  order: number;
}

export function nextColumnOrder(columns: { order: number }[]): number {
  if (columns.length === 0) return 0;
  return Math.max(...columns.map((column) => column.order)) + 1;
}

export interface ColumnOrderUpdate {
  id: string;
  order: number;
}

/**
 * Swaps `columnId`'s order with its immediate neighbor in the sorted column
 * list. Returns an empty array (no-op) when the column is already at that
 * boundary (leftmost for 'left', rightmost for 'right').
 */
export function reorderColumn(
  columns: OrderableColumn[],
  columnId: string,
  direction: 'left' | 'right'
): ColumnOrderUpdate[] {
  const sorted = [...columns].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((column) => column.id === columnId);
  if (index === -1) return [];

  const neighborIndex = direction === 'left' ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= sorted.length) return [];

  const current = sorted[index];
  const neighbor = sorted[neighborIndex];

  return [
    { id: current.id, order: neighbor.order },
    { id: neighbor.id, order: current.order },
  ];
}
