export function isTaskOverdue(
  dueDate: string | Date | null | undefined,
  status: string,
  now: Date = new Date()
): boolean {
  if (!dueDate || status === 'done') return false;

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  if (Number.isNaN(due.getTime())) return false;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  return startOfDueDate.getTime() < startOfToday.getTime();
}

export function formatDueDate(dueDate: string | Date): string {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const day = due.getDate().toString().padStart(2, '0');
  const month = (due.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}
