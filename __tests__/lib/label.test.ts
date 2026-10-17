import { filterTasksByLabel, isLabelColor, normalizeLabelColor } from '@/lib/label';

describe('isLabelColor', () => {
  it('accepts known color values', () => {
    expect(isLabelColor('red')).toBe(true);
    expect(isLabelColor('blue')).toBe(true);
    expect(isLabelColor('gray')).toBe(true);
  });

  it('rejects unknown or missing values', () => {
    expect(isLabelColor('turquoise')).toBe(false);
    expect(isLabelColor('#ff0000')).toBe(false);
    expect(isLabelColor(undefined)).toBe(false);
    expect(isLabelColor(null)).toBe(false);
  });
});

describe('normalizeLabelColor', () => {
  it('returns the value when it is a known color', () => {
    expect(normalizeLabelColor('purple')).toBe('purple');
  });

  it('falls back to gray for unknown or missing values', () => {
    expect(normalizeLabelColor('turquoise')).toBe('gray');
    expect(normalizeLabelColor(undefined)).toBe('gray');
    expect(normalizeLabelColor(null)).toBe('gray');
  });
});

describe('filterTasksByLabel', () => {
  const tasks = [
    { id: '1', labels: [{ id: 'l1', name: 'Q4-2026', color: 'blue' }] },
    { id: '2', labels: [{ id: 'l2', name: 'Cần review', color: 'red' }] },
    {
      id: '3',
      labels: [
        { id: 'l1', name: 'Q4-2026', color: 'blue' },
        { id: 'l2', name: 'Cần review', color: 'red' },
      ],
    },
    { id: '4', labels: [] },
  ];

  it('returns all tasks when labelId is "all" or empty', () => {
    expect(filterTasksByLabel(tasks, 'all')).toEqual(tasks);
    expect(filterTasksByLabel(tasks, '')).toEqual(tasks);
  });

  it('returns tasks that have the given label attached, including multi-label tasks', () => {
    expect(filterTasksByLabel(tasks, 'l1')).toEqual([tasks[0], tasks[2]]);
    expect(filterTasksByLabel(tasks, 'l2')).toEqual([tasks[1], tasks[2]]);
  });

  it('returns an empty list when no task has the given label', () => {
    expect(filterTasksByLabel(tasks, 'l-unknown')).toEqual([]);
  });

  it('excludes tasks with no labels', () => {
    expect(filterTasksByLabel(tasks, 'l1')).not.toContainEqual(tasks[3]);
  });
});
