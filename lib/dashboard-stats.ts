import { isTaskOverdue, isTaskDueSoon } from './task-due-date';
import { normalizeTaskPriority } from './task-priority';

export interface DashboardTask {
  id: string;
  title: string;
  isDoneColumn: boolean;
  priority: string;
  dueDate: string | Date | null;
  projectId: string;
  projectName: string;
}

export interface DoneStatusCounts {
  done: number;
  open: number;
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

export function countTasksByDoneStatus<T extends { isDoneColumn: boolean }>(
  tasks: T[]
): DoneStatusCounts {
  const counts: DoneStatusCounts = { done: 0, open: 0 };
  for (const task of tasks) {
    counts[task.isDoneColumn ? 'done' : 'open'] += 1;
  }
  return counts;
}

export function countOverdueTasks<T extends { isDoneColumn: boolean; dueDate?: string | Date | null }>(
  tasks: T[],
  now: Date = new Date()
): number {
  return tasks.filter((task) => isTaskOverdue(task.dueDate, task.isDoneColumn, now)).length;
}

export function countDueSoonTasks<T extends { isDoneColumn: boolean; dueDate?: string | Date | null }>(
  tasks: T[],
  now: Date = new Date()
): number {
  return tasks.filter((task) => isTaskDueSoon(task.dueDate, task.isDoneColumn, now)).length;
}

export function countReminderTasks<T extends { isDoneColumn: boolean; dueDate?: string | Date | null }>(
  tasks: T[],
  now: Date = new Date()
): number {
  return countOverdueTasks(tasks, now) + countDueSoonTasks(tasks, now);
}

export function countOpenTasksByPriority<T extends { isDoneColumn: boolean; priority: string }>(
  tasks: T[]
): PriorityCounts {
  const counts: PriorityCounts = { low: 0, medium: 0, high: 0 };
  for (const task of tasks) {
    if (task.isDoneColumn) continue;
    counts[normalizeTaskPriority(task.priority)] += 1;
  }
  return counts;
}

export function getProjectProgress<T extends { isDoneColumn: boolean }>(tasks: T[]): ProjectProgress {
  const total = tasks.length;
  const done = tasks.filter((task) => task.isDoneColumn).length;
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
        !task.isDoneColumn &&
        !!task.dueDate &&
        !isTaskOverdue(task.dueDate, task.isDoneColumn, now)
    )
    .slice()
    .sort((a, b) => new Date(a.dueDate as string | Date).getTime() - new Date(b.dueDate as string | Date).getTime())
    .slice(0, limit);
}
