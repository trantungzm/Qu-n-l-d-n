import {
  filterTasksByPriority,
  isTaskPriority,
  normalizeTaskPriority,
} from '@/lib/task-priority';

describe('isTaskPriority', () => {
  it('accepts known priority values', () => {
    expect(isTaskPriority('low')).toBe(true);
    expect(isTaskPriority('medium')).toBe(true);
    expect(isTaskPriority('high')).toBe(true);
  });

  it('rejects unknown or missing values', () => {
    expect(isTaskPriority('urgent')).toBe(false);
    expect(isTaskPriority(undefined)).toBe(false);
    expect(isTaskPriority(null)).toBe(false);
  });
});

describe('normalizeTaskPriority', () => {
  it('returns the value when it is a known priority', () => {
    expect(normalizeTaskPriority('high')).toBe('high');
  });

  it('falls back to medium for unknown or missing values', () => {
    expect(normalizeTaskPriority('urgent')).toBe('medium');
    expect(normalizeTaskPriority(undefined)).toBe('medium');
    expect(normalizeTaskPriority(null)).toBe('medium');
  });
});

describe('filterTasksByPriority', () => {
  const tasks = [
    { id: '1', priority: 'low' },
    { id: '2', priority: 'medium' },
    { id: '3', priority: 'high' },
  ];

  it('returns all tasks when priority is "all" or empty', () => {
    expect(filterTasksByPriority(tasks, 'all')).toEqual(tasks);
    expect(filterTasksByPriority(tasks, '')).toEqual(tasks);
  });

  it('filters tasks matching the given priority', () => {
    expect(filterTasksByPriority(tasks, 'high')).toEqual([tasks[2]]);
  });

  it('returns an empty list when no task matches', () => {
    expect(filterTasksByPriority(tasks, 'urgent')).toEqual([]);
  });
});
