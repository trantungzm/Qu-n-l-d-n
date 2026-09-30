import { Bug, Zap, Wrench, Circle, type LucideIcon } from 'lucide-react';

export const TASK_TYPES = ['bug', 'feature', 'chore', 'other'] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export function isTaskType(value: string | null | undefined): value is TaskType {
  return typeof value === 'string' && TASK_TYPES.includes(value as TaskType);
}

export function normalizeTaskType(value: string | null | undefined): TaskType {
  return isTaskType(value) ? value : 'feature';
}

export const TYPE_LABELS: Record<TaskType, string> = {
  bug: 'Bug',
  feature: 'Tính năng',
  chore: 'Việc vặt',
  other: 'Khác',
};

export const TYPE_ICONS: Record<TaskType, LucideIcon> = {
  bug: Bug,
  feature: Zap,
  chore: Wrench,
  other: Circle,
};

export const TYPE_ICON_CLASSES: Record<TaskType, string> = {
  bug: 'text-red-600 dark:text-red-400',
  feature: 'text-blue-600 dark:text-blue-400',
  chore: 'text-gray-500 dark:text-gray-400',
  other: 'text-gray-400 dark:text-gray-500',
};

export interface TypedTask {
  type: string;
}

export function filterTasksByType<T extends TypedTask>(tasks: T[], type: string): T[] {
  if (!type || type === 'all') {
    return tasks;
  }

  return tasks.filter((task) => task.type === type);
}
