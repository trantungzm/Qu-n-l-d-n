import {
  countTasksByStatus,
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
    status: 'todo',
    priority: 'medium',
    dueDate: null,
    projectId: 'project-1',
    projectName: 'Project 1',
    ...overrides,
  };
}

describe('countTasksByStatus', () => {
  it('counts tasks grouped by status', () => {
    const tasks = [
      makeTask({ id: '1', status: 'todo' }),
      makeTask({ id: '2', status: 'todo' }),
      makeTask({ id: '3', status: 'doing' }),
      makeTask({ id: '4', status: 'done' }),
    ];

    expect(countTasksByStatus(tasks)).toEqual({ todo: 2, doing: 1, done: 1 });
  });

  it('normalizes unknown status values to todo', () => {
    const tasks = [makeTask({ status: 'unknown' })];
    expect(countTasksByStatus(tasks)).toEqual({ todo: 1, doing: 0, done: 0 });
  });

  it('returns all zeros for an empty list', () => {
    expect(countTasksByStatus([])).toEqual({ todo: 0, doing: 0, done: 0 });
  });
});

describe('countOverdueTasks', () => {
  const today = new Date('2026-09-15T12:00:00.000Z');

  it('counts tasks whose due date is strictly before today and not done', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-09-01', status: 'todo' }),
      makeTask({ id: '2', dueDate: '2026-09-14', status: 'doing' }),
      makeTask({ id: '3', dueDate: '2026-09-20', status: 'todo' }),
    ];

    expect(countOverdueTasks(tasks, today)).toBe(2);
  });

  it('does not count a task due exactly today as overdue', () => {
    const tasks = [makeTask({ dueDate: '2026-09-15', status: 'todo' })];
    expect(countOverdueTasks(tasks, today)).toBe(0);
  });

  it('does not count a done task as overdue even if its due date has passed', () => {
    const tasks = [makeTask({ dueDate: '2026-09-01', status: 'done' })];
    expect(countOverdueTasks(tasks, today)).toBe(0);
  });

  it('ignores tasks without a due date', () => {
    const tasks = [makeTask({ dueDate: null, status: 'todo' })];
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
      makeTask({ id: '1', dueDate: '2026-09-15', status: 'todo' }),
      makeTask({ id: '2', dueDate: '2026-09-15', status: 'doing' }),
      makeTask({ id: '3', dueDate: '2026-09-16', status: 'todo' }),
    ];

    expect(countDueSoonTasks(tasks, today)).toBe(2);
  });

  it('excludes a done task due today', () => {
    const tasks = [makeTask({ dueDate: '2026-09-15', status: 'done' })];
    expect(countDueSoonTasks(tasks, today)).toBe(0);
  });

  it('excludes an overdue task', () => {
    const tasks = [makeTask({ dueDate: '2026-09-01', status: 'todo' })];
    expect(countDueSoonTasks(tasks, today)).toBe(0);
  });

  it('ignores tasks without a due date', () => {
    const tasks = [makeTask({ dueDate: null, status: 'todo' })];
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
      makeTask({ id: '1', dueDate: '2026-09-01', status: 'todo' }), // overdue
      makeTask({ id: '2', dueDate: '2026-09-15', status: 'todo' }), // due soon
      makeTask({ id: '3', dueDate: '2026-09-20', status: 'todo' }), // future
      makeTask({ id: '4', dueDate: '2026-09-01', status: 'done' }), // done, ignored
    ];

    expect(countReminderTasks(tasks, today)).toBe(2);
  });

  it('returns 0 when there are no overdue or due-soon tasks', () => {
    const tasks = [makeTask({ dueDate: '2026-09-20', status: 'todo' })];
    expect(countReminderTasks(tasks, today)).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(countReminderTasks([], today)).toBe(0);
  });
});

describe('countOpenTasksByPriority', () => {
  it('counts only non-done tasks grouped by priority', () => {
    const tasks = [
      makeTask({ id: '1', priority: 'high', status: 'todo' }),
      makeTask({ id: '2', priority: 'high', status: 'doing' }),
      makeTask({ id: '3', priority: 'medium', status: 'todo' }),
      makeTask({ id: '4', priority: 'low', status: 'todo' }),
      makeTask({ id: '5', priority: 'high', status: 'done' }),
    ];

    expect(countOpenTasksByPriority(tasks)).toEqual({ low: 1, medium: 1, high: 2 });
  });

  it('excludes done tasks regardless of priority', () => {
    const tasks = [
      makeTask({ priority: 'high', status: 'done' }),
      makeTask({ priority: 'low', status: 'done' }),
    ];

    expect(countOpenTasksByPriority(tasks)).toEqual({ low: 0, medium: 0, high: 0 });
  });

  it('normalizes unknown priority values to medium', () => {
    const tasks = [makeTask({ priority: 'urgent', status: 'todo' })];
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
      makeTask({ id: '1', dueDate: '2026-09-25', status: 'todo' }),
      makeTask({ id: '2', dueDate: '2026-09-16', status: 'todo' }),
      makeTask({ id: '3', dueDate: '2026-09-20', status: 'doing' }),
    ];

    const result = getUpcomingTasks(tasks, today, 2);
    expect(result.map((t) => t.id)).toEqual(['2', '3']);
  });

  it('includes a task due exactly today', () => {
    const tasks = [makeTask({ id: '1', dueDate: '2026-09-15', status: 'todo' })];
    expect(getUpcomingTasks(tasks, today).map((t) => t.id)).toEqual(['1']);
  });

  it('excludes overdue tasks', () => {
    const tasks = [makeTask({ id: '1', dueDate: '2026-09-01', status: 'todo' })];
    expect(getUpcomingTasks(tasks, today)).toEqual([]);
  });

  it('excludes done tasks even with an upcoming due date', () => {
    const tasks = [makeTask({ id: '1', dueDate: '2026-09-20', status: 'done' })];
    expect(getUpcomingTasks(tasks, today)).toEqual([]);
  });

  it('excludes tasks without a due date', () => {
    const tasks = [makeTask({ id: '1', dueDate: null, status: 'todo' })];
    expect(getUpcomingTasks(tasks, today)).toEqual([]);
  });

  it('defaults the limit to 5', () => {
    const tasks = Array.from({ length: 8 }, (_, i) =>
      makeTask({ id: String(i), dueDate: `2026-09-${16 + i}`, status: 'todo' })
    );
    expect(getUpcomingTasks(tasks, today)).toHaveLength(5);
  });
});

describe('getProjectProgress', () => {
  it('returns 0 total and 0 percent for an empty task list without dividing by zero', () => {
    expect(getProjectProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it('returns 100 percent when all tasks are done', () => {
    const tasks = [
      makeTask({ id: '1', status: 'done' }),
      makeTask({ id: '2', status: 'done' }),
    ];

    expect(getProjectProgress(tasks)).toEqual({ done: 2, total: 2, percent: 100 });
  });

  it('computes a rounded percentage for a partially completed project', () => {
    const tasks = [
      makeTask({ id: '1', status: 'done' }),
      makeTask({ id: '2', status: 'todo' }),
      makeTask({ id: '3', status: 'doing' }),
    ];

    expect(getProjectProgress(tasks)).toEqual({ done: 1, total: 3, percent: 33 });
  });

  it('treats an unknown status as not done', () => {
    const tasks = [makeTask({ id: '1', status: 'unknown' })];
    expect(getProjectProgress(tasks)).toEqual({ done: 0, total: 1, percent: 0 });
  });
});
