import { isTaskOverdue, isTaskDueSoon } from './task-due-date';
import { normalizeTaskPriority } from './task-priority';
import { normalizeTaskStatus } from './task-status';

export interface DashboardTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | Date | null;
  projectId: string;
  projectName: string;
}

export interface StatusCounts {
  todo: number;
  doing: number;
  done: number;
}

export interface PriorityCounts {
  low: number;
  medium: number;
  high: number;
}

export interface ProjectProgress {
  done: number;
  total: number;
  percent: number;
}

export function countTasksByStatus<T extends { status: string }>(tasks: T[]): StatusCounts {
  const counts: StatusCounts = { todo: 0, doing: 0, done: 0 };
  for (const task of tasks) {
    counts[normalizeTaskStatus(task.status)] += 1;
  }
  return counts;
}

export function countOverdueTasks<T extends { status: string; dueDate?: string | Date | null }>(
  tasks: T[],
  now: Date = new Date()
): number {
  return tasks.filter((task) => isTaskOverdue(task.dueDate, task.status, now)).length;
}

export function countDueSoonTasks<T extends { status: string; dueDate?: string | Date | null }>(
  tasks: T[],
  now: Date = new Date()
): number {
  return tasks.filter((task) => isTaskDueSoon(task.dueDate, task.status, now)).length;
}

export function countReminderTasks<T extends { status: string; dueDate?: string | Date | null }>(
  tasks: T[],
  now: Date = new Date()
): number {
  return countOverdueTasks(tasks, now) + countDueSoonTasks(tasks, now);
}

export function countOpenTasksByPriority<T extends { status: string; priority: string }>(
  tasks: T[]
): PriorityCounts {
  const counts: PriorityCounts = { low: 0, medium: 0, high: 0 };
  for (const task of tasks) {
    if (normalizeTaskStatus(task.status) === 'done') continue;
    counts[normalizeTaskPriority(task.priority)] += 1;
  }
  return counts;
}

export function getProjectProgress<T extends { status: string }>(tasks: T[]): ProjectProgress {
  const total = tasks.length;
  const done = tasks.filter((task) => normalizeTaskStatus(task.status) === 'done').length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

export function getUpcomingTasks(
  tasks: DashboardTask[],
  now: Date = new Date(),
  limit: number = 5
): DashboardTask[] {
  return tasks
    .filter(
      (task) =>
        normalizeTaskStatus(task.status) !== 'done' &&
        !!task.dueDate &&
        !isTaskOverdue(task.dueDate, task.status, now)
    )
    .slice()
    .sort((a, b) => new Date(a.dueDate as string | Date).getTime() - new Date(b.dueDate as string | Date).getTime())
    .slice(0, limit);
}
