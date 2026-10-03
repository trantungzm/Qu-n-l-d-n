import {
  countTasksByDoneStatus,
  countOverdueTasks,
  countDueSoonTasks,
  countReminderTasks,
  countOpenTasksByPriority,
  getUpcomingTasks,
  getProjectProgress,
  type DashboardTask,
} from '@/lib/dashboard-stats';

function makeTask(overrides: Partial<DashboardTask>): DashboardTask {
  return {
    id: 'task-1',
    title: 'Task',
    isDoneColumn: false,
    priority: 'medium',
    dueDate: null,
    projectId: 'project-1',
    projectName: 'Project 1',
    ...overrides,
  };
}

describe('countTasksByDoneStatus', () => {
  it('counts tasks grouped by done vs open', () => {
    const tasks = [
      makeTask({ id: '1', isDoneColumn: false }),
      makeTask({ id: '2', isDoneColumn: false }),
      makeTask({ id: '3', isDoneColumn: false }),
      makeTask({ id: '4', isDoneColumn: true }),
    ];

    expect(countTasksByDoneStatus(tasks)).toEqual({ done: 1, open: 3 });
  });

  it('returns all zeros for an empty list', () => {
    expect(countTasksByDoneStatus([])).toEqual({ done: 0, open: 0 });
  });
});

describe('countOverdueTasks', () => {
  const today = new Date('2026-09-15T12:00:00.000Z');

  it('counts tasks whose due date is strictly before today and not in a done column', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-09-01', isDoneColumn: false }),
      makeTask({ id: '2', dueDate: '2026-09-14', isDoneColumn: false }),
      makeTask({ id: '3', dueDate: '2026-09-20', isDoneColumn: false }),
    ];

    expect(countOverdueTasks(tasks, today)).toBe(2);
  });

  it('does not count a task due exactly today as overdue', () => {
    const tasks = [makeTask({ dueDate: '2026-09-15', isDoneColumn: false })];
    expect(countOverdueTasks(tasks, today)).toBe(0);
  });

  it('does not count a task in a done column as overdue even if its due date has passed', () => {
    const tasks = [makeTask({ dueDate: '2026-09-01', isDoneColumn: true })];
    expect(countOverdueTasks(tasks, today)).toBe(0);
  });

  it('counts a task in a custom non-done column (e.g. "Review") as overdue when its due date has passed', () => {
    const tasks = [makeTask({ dueDate: '2026-09-01', isDoneColumn: false })];
    expect(countOverdueTasks(tasks, today)).toBe(1);
  });

  it('ignores tasks without a due date', () => {
    const tasks = [makeTask({ dueDate: null, isDoneColumn: false })];
    expect(countOverdueTasks(tasks, today)).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(countOverdueTasks([], today)).toBe(0);
  });
});

describe('countDueSoonTasks', () => {
  const today = new Date('2026-09-15T12:00:00.000Z');

  it('counts not-done tasks due today', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-09-15', isDoneColumn: false }),
      makeTask({ id: '2', dueDate: '2026-09-15', isDoneColumn: false }),
      makeTask({ id: '3', dueDate: '2026-09-16', isDoneColumn: false }),
    ];

    expect(countDueSoonTasks(tasks, today)).toBe(2);
  });

  it('excludes a task in a done column due today', () => {
    const tasks = [makeTask({ dueDate: '2026-09-15', isDoneColumn: true })];
    expect(countDueSoonTasks(tasks, today)).toBe(0);
  });

  it('excludes an overdue task', () => {
    const tasks = [makeTask({ dueDate: '2026-09-01', isDoneColumn: false })];
    expect(countDueSoonTasks(tasks, today)).toBe(0);
  });

  it('ignores tasks without a due date', () => {
    const tasks = [makeTask({ dueDate: null, isDoneColumn: false })];
    expect(countDueSoonTasks(tasks, today)).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(countDueSoonTasks([], today)).toBe(0);
  });
});

describe('countReminderTasks', () => {
  const today = new Date('2026-09-15T12:00:00.000Z');

  it('sums overdue and due-soon tasks', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-09-01', isDoneColumn: false }), // overdue
      makeTask({ id: '2', dueDate: '2026-09-15', isDoneColumn: false }), // due soon
      makeTask({ id: '3', dueDate: '2026-09-20', isDoneColumn: false }), // future
      makeTask({ id: '4', dueDate: '2026-09-01', isDoneColumn: true }), // done, ignored
    ];

    expect(countReminderTasks(tasks, today)).toBe(2);
  });

  it('returns 0 when there are no overdue or due-soon tasks', () => {
    const tasks = [makeTask({ dueDate: '2026-09-20', isDoneColumn: false })];
    expect(countReminderTasks(tasks, today)).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(countReminderTasks([], today)).toBe(0);
  });
});

describe('countOpenTasksByPriority', () => {
  it('counts only tasks not in a done column, grouped by priority', () => {
    const tasks = [
      makeTask({ id: '1', priority: 'high', isDoneColumn: false }),
      makeTask({ id: '2', priority: 'high', isDoneColumn: false }),
      makeTask({ id: '3', priority: 'medium', isDoneColumn: false }),
      makeTask({ id: '4', priority: 'low', isDoneColumn: false }),
      makeTask({ id: '5', priority: 'high', isDoneColumn: true }),
    ];

    expect(countOpenTasksByPriority(tasks)).toEqual({ low: 1, medium: 1, high: 2 });
  });

  it('excludes tasks in a done column regardless of priority', () => {
    const tasks = [
      makeTask({ priority: 'high', isDoneColumn: true }),
      makeTask({ priority: 'low', isDoneColumn: true }),
    ];

    expect(countOpenTasksByPriority(tasks)).toEqual({ low: 0, medium: 0, high: 0 });
  });

  it('normalizes unknown priority values to medium', () => {
    const tasks = [makeTask({ priority: 'urgent', isDoneColumn: false })];
    expect(countOpenTasksByPriority(tasks)).toEqual({ low: 0, medium: 1, high: 0 });
  });

  it('returns all zeros for an empty list', () => {
    expect(countOpenTasksByPriority([])).toEqual({ low: 0, medium: 0, high: 0 });
  });
});

describe('getUpcomingTasks', () => {
  const today = new Date('2026-09-15T12:00:00.000Z');

  it('sorts open tasks with a due date ascending and limits the result', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-09-25', isDoneColumn: false }),
      makeTask({ id: '2', dueDate: '2026-09-16', isDoneColumn: false }),
      makeTask({ id: '3', dueDate: '2026-09-20', isDoneColumn: false }),
    ];

    const result = getUpcomingTasks(tasks, today, 2);
    expect(result.map((t) => t.id)).toEqual(['2', '3']);
  });

  it('includes a task due exactly today', () => {
    const tasks = [makeTask({ id: '1', dueDate: '2026-09-15', isDoneColumn: false })];
    expect(getUpcomingTasks(tasks, today).map((t) => t.id)).toEqual(['1']);
  });

  it('excludes overdue tasks', () => {
    const tasks = [makeTask({ id: '1', dueDate: '2026-09-01', isDoneColumn: false })];
    expect(getUpcomingTasks(tasks, today)).toEqual([]);
  });

  it('excludes tasks in a done column even with an upcoming due date', () => {
    const tasks = [makeTask({ id: '1', dueDate: '2026-09-20', isDoneColumn: true })];
    expect(getUpcomingTasks(tasks, today)).toEqual([]);
  });

  it('excludes tasks without a due date', () => {
    const tasks = [makeTask({ id: '1', dueDate: null, isDoneColumn: false })];
    expect(getUpcomingTasks(tasks, today)).toEqual([]);
  });

  it('defaults the limit to 5', () => {
    const tasks = Array.from({ length: 8 }, (_, i) =>
      makeTask({ id: String(i), dueDate: `2026-09-${16 + i}`, isDoneColumn: false })
    );
    expect(getUpcomingTasks(tasks, today)).toHaveLength(5);
  });
});

describe('getProjectProgress', () => {
  it('returns 0 total and 0 percent for an empty task list without dividing by zero', () => {
    expect(getProjectProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it('returns 100 percent when all tasks are in a done column', () => {
    const tasks = [
      makeTask({ id: '1', isDoneColumn: true }),
      makeTask({ id: '2', isDoneColumn: true }),
    ];

    expect(getProjectProgress(tasks)).toEqual({ done: 2, total: 2, percent: 100 });
  });

  it('computes a rounded percentage for a partially completed project', () => {
    const tasks = [
      makeTask({ id: '1', isDoneColumn: true }),
      makeTask({ id: '2', isDoneColumn: false }),
      makeTask({ id: '3', isDoneColumn: false }),
    ];

    expect(getProjectProgress(tasks)).toEqual({ done: 1, total: 3, percent: 33 });
  });

  it('treats a task in a custom non-done column as not done', () => {
    const tasks = [makeTask({ id: '1', isDoneColumn: false })];
    expect(getProjectProgress(tasks)).toEqual({ done: 0, total: 1, percent: 0 });
  });

  it('treats a task in a custom column marked as the done column as done', () => {
    const tasks = [makeTask({ id: '1', isDoneColumn: true })];
    expect(getProjectProgress(tasks)).toEqual({ done: 1, total: 1, percent: 100 });
  });
});
