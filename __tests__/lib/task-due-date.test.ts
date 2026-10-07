import { isTaskOverdue, isTaskDueSoon, formatDueDate } from '@/lib/task-due-date';

describe('isTaskOverdue', () => {
  const today = new Date('2026-09-13T12:00:00.000Z');

  it('returns false when there is no due date', () => {
    expect(isTaskOverdue(null, false, today)).toBe(false);
    expect(isTaskOverdue(undefined, false, today)).toBe(false);
  });

  it('returns false when the due date has not arrived yet', () => {
    expect(isTaskOverdue('2026-09-20', false, today)).toBe(false);
  });

  it('returns true when the due date is in the past and the task is not in a done column', () => {
    expect(isTaskOverdue('2026-09-01', false, today)).toBe(true);
  });

  it('returns false when the due date is in the past but the task is in a done column', () => {
    expect(isTaskOverdue('2026-09-01', true, today)).toBe(false);
  });

  it('returns false for a task in a custom non-done column (e.g. "Review") even when overdue would otherwise apply', () => {
    // A custom column like "Review" is represented the same as any other
    // non-done column: isDoneColumn === false. It should still count as overdue.
    expect(isTaskOverdue('2026-09-01', false, today)).toBe(true);
  });
});

describe('isTaskDueSoon', () => {
  const today = new Date('2026-09-13T12:00:00.000Z');

  it('returns false when there is no due date', () => {
    expect(isTaskDueSoon(null, false, today)).toBe(false);
    expect(isTaskDueSoon(undefined, false, today)).toBe(false);
  });

  it('returns true when the due date is today and the task is not in a done column', () => {
    expect(isTaskDueSoon('2026-09-13', false, today)).toBe(true);
  });

  it('returns false when the due date is today but the task is in a done column', () => {
    expect(isTaskDueSoon('2026-09-13', true, today)).toBe(false);
  });

  it('returns false when the due date is already overdue', () => {
    expect(isTaskDueSoon('2026-09-01', false, today)).toBe(false);
  });

  it('returns false when the due date is further in the future', () => {
    expect(isTaskDueSoon('2026-09-20', false, today)).toBe(false);
  });
});

describe('formatDueDate', () => {
  it('formats a date as dd/MM', () => {
    expect(formatDueDate('2026-09-25')).toBe('25/09');
  });
});
