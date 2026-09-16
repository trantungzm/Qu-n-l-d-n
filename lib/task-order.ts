export interface OrderableTask {
  id: string;
  status: string;
  order: number;
}

export interface TaskOrderUpdate {
  id: string;
  status: string;
  order: number;
}

/**
 * Recomputes `status`/`order` for every task in the affected column(s) after
 * dropping `activeId` into `targetStatus` at `targetIndex` (its index within
 * the destination column, excluding the dragged task itself).
 * Returns only the tasks whose status/order actually changed.
 */
export function reorderTasksOnDrop<T extends OrderableTask>(
  allTasks: T[],
  activeId: string,
  targetStatus: string,
  targetIndex: number
): TaskOrderUpdate[] {
  const activeTask = allTasks.find((task) => task.id === activeId);
  if (!activeTask) return [];

  const sourceStatus = activeTask.status;

  const columnTasksExcludingActive = (status: string) =>
    allTasks
      .filter((task) => task.status === status && task.id !== activeId)
      .sort((a, b) => a.order - b.order);

  const destTasks = columnTasksExcludingActive(targetStatus);
  const clampedIndex = Math.max(0, Math.min(targetIndex, destTasks.length));
  destTasks.splice(clampedIndex, 0, activeTask);

  const updates = new Map<string, TaskOrderUpdate>();
  destTasks.forEach((task, index) => {
    updates.set(task.id, { id: task.id, status: targetStatus, order: index });
  });

  if (sourceStatus !== targetStatus) {
    columnTasksExcludingActive(sourceStatus).forEach((task, index) => {
      updates.set(task.id, { id: task.id, status: sourceStatus, order: index });
    });
  }

  return Array.from(updates.values()).filter((update) => {
    const original = allTasks.find((task) => task.id === update.id);
    return !original || original.status !== update.status || original.order !== update.order;
  });
}
