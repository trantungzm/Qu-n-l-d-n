export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export function isTaskPriority(value: string | null | undefined): value is TaskPriority {
  return typeof value === 'string' && TASK_PRIORITIES.includes(value as TaskPriority);
}

export function normalizeTaskPriority(value: string | null | undefined): TaskPriority {
  return isTaskPriority(value) ? value : 'medium';
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

export const PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  high: 'border-red-400 bg-red-50 text-red-700',
  medium: 'border-amber-400 bg-amber-50 text-amber-700',
  low: 'border-emerald-400 bg-emerald-50 text-emerald-700',
};

export interface PrioritizedTask {
  priority: string;
}

export function filterTasksByPriority<T extends PrioritizedTask>(
  tasks: T[],
  priority: string
): T[] {
  if (!priority || priority === 'all') {
    return tasks;
  }

  return tasks.filter((task) => task.priority === priority);
}
