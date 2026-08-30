import { type TaskStatus } from '@/lib/task-status';

export function formatTaskDueDate(dueDate?: string | Date | null) {
  if (!dueDate) return '';

  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function isTaskOverdue(dueDate?: string | Date | null, status?: TaskStatus | string) {
  if (!dueDate || status === 'done') return false;

  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  return due < today;
}
