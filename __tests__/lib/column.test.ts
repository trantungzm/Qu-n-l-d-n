import {
  isColumnColor,
  normalizeColumnColor,
  nextColumnOrder,
  reorderColumn,
} from '@/lib/column';

describe('isColumnColor', () => {
  it('accepts known color values', () => {
    expect(isColumnColor('red')).toBe(true);
    expect(isColumnColor('blue')).toBe(true);
    expect(isColumnColor('gray')).toBe(true);
  });

  it('rejects unknown or missing values', () => {
    expect(isColumnColor('turquoise')).toBe(false);
    expect(isColumnColor('#ff0000')).toBe(false);
    expect(isColumnColor(undefined)).toBe(false);
    expect(isColumnColor(null)).toBe(false);
  });
});

describe('normalizeColumnColor', () => {
  it('returns the value when it is a known color', () => {
    expect(normalizeColumnColor('emerald')).toBe('emerald');
  });

  it('falls back to gray for unknown or missing values', () => {
    expect(normalizeColumnColor('turquoise')).toBe('gray');
    expect(normalizeColumnColor(undefined)).toBe('gray');
    expect(normalizeColumnColor(null)).toBe('gray');
  });
});

describe('nextColumnOrder', () => {
  it('returns 0 for an empty column list', () => {
    expect(nextColumnOrder([])).toBe(0);
  });

  it('returns one past the current max order', () => {
    expect(nextColumnOrder([{ order: 0 }, { order: 1 }, { order: 2 }])).toBe(3);
    expect(nextColumnOrder([{ order: 5 }])).toBe(6);
  });

  it('is not confused by out-of-order input', () => {
    expect(nextColumnOrder([{ order: 2 }, { order: 0 }, { order: 1 }])).toBe(3);
  });
});

describe('reorderColumn', () => {
  const columns = [
    { id: 'todo', order: 0 },
    { id: 'doing', order: 1 },
    { id: 'done', order: 2 },
  ];

  it('swaps a middle column with its left neighbor', () => {
    expect(reorderColumn(columns, 'doing', 'left')).toEqual([
      { id: 'doing', order: 0 },
      { id: 'todo', order: 1 },
    ]);
  });

  it('swaps a middle column with its right neighbor', () => {
    expect(reorderColumn(columns, 'doing', 'right')).toEqual([
      { id: 'doing', order: 2 },
      { id: 'done', order: 1 },
    ]);
  });

  it('is a no-op moving the leftmost column further left', () => {
    expect(reorderColumn(columns, 'todo', 'left')).toEqual([]);
  });

  it('is a no-op moving the rightmost column further right', () => {
    expect(reorderColumn(columns, 'done', 'right')).toEqual([]);
  });

  it('returns an empty array for an unknown column id', () => {
    expect(reorderColumn(columns, 'missing', 'left')).toEqual([]);
  });

  it('works regardless of input order by sorting on `order` first', () => {
    const shuffled = [columns[2], columns[0], columns[1]];
    expect(reorderColumn(shuffled, 'doing', 'left')).toEqual([
      { id: 'doing', order: 0 },
      { id: 'todo', order: 1 },
    ]);
  });
});
