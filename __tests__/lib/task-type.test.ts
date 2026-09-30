import { filterTasksByType, isTaskType, normalizeTaskType } from '@/lib/task-type';

describe('isTaskType', () => {
  it('accepts known type values', () => {
    expect(isTaskType('bug')).toBe(true);
    expect(isTaskType('feature')).toBe(true);
    expect(isTaskType('chore')).toBe(true);
    expect(isTaskType('other')).toBe(true);
  });

  it('rejects unknown or missing values', () => {
    expect(isTaskType('improvement')).toBe(false);
    expect(isTaskType(undefined)).toBe(false);
    expect(isTaskType(null)).toBe(false);
  });
});

describe('normalizeTaskType', () => {
  it('returns the value when it is a known type', () => {
    expect(normalizeTaskType('bug')).toBe('bug');
  });

  it('falls back to feature for unknown or missing values', () => {
    expect(normalizeTaskType('improvement')).toBe('feature');
    expect(normalizeTaskType(undefined)).toBe('feature');
    expect(normalizeTaskType(null)).toBe('feature');
  });
});

describe('filterTasksByType', () => {
  const tasks = [
    { id: '1', type: 'bug' },
    { id: '2', type: 'feature' },
    { id: '3', type: 'chore' },
    { id: '4', type: 'other' },
  ];

  it('returns all tasks when type is "all" or empty', () => {
    expect(filterTasksByType(tasks, 'all')).toEqual(tasks);
    expect(filterTasksByType(tasks, '')).toEqual(tasks);
  });

  it('filters tasks matching the given type', () => {
    expect(filterTasksByType(tasks, 'bug')).toEqual([tasks[0]]);
  });

  it('returns an empty list when no task matches', () => {
    expect(filterTasksByType(tasks, 'improvement')).toEqual([]);
  });
});
