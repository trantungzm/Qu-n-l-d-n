export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export function isTaskStatus(value: string | null | undefined): value is TaskStatus {
  return typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus);
}

export function normalizeTaskStatus(value: string | null | undefined): TaskStatus {
  return isTaskStatus(value) ? value : 'todo';
}

export function legacyDoneToStatus(done: boolean): TaskStatus {
  return done ? 'done' : 'todo';
}
