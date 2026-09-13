import { isTaskOverdue, formatDueDate } from '@/lib/task-due-date';

describe('isTaskOverdue', () => {
  const today = new Date('2026-09-13T12:00:00.000Z');

  it('returns false when there is no due date', () => {
    expect(isTaskOverdue(null, 'todo', today)).toBe(false);
    expect(isTaskOverdue(undefined, 'todo', today)).toBe(false);
  });

  it('returns false when the due date has not arrived yet', () => {
    expect(isTaskOverdue('2026-09-20', 'todo', today)).toBe(false);
  });

  it('returns true when the due date is in the past and status is not done', () => {
    expect(isTaskOverdue('2026-09-01', 'todo', today)).toBe(true);
    expect(isTaskOverdue('2026-09-01', 'doing', today)).toBe(true);
  });

  it('returns false when the due date is in the past but status is done', () => {
    expect(isTaskOverdue('2026-09-01', 'done', today)).toBe(false);
  });
});

describe('formatDueDate', () => {
  it('formats a date as dd/MM', () => {
    expect(formatDueDate('2026-09-25')).toBe('25/09');
  });
});
