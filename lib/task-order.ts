export interface OrderableTask {
  id: string;
  columnId: string | null;
  order: number;
}

export interface TaskOrderUpdate {
  id: string;
  columnId: string | null;
  order: number;
}

/**
 * Recomputes `columnId`/`order` for every task in the affected column(s)
 * after dropping `activeId` into `targetColumnId` at `targetIndex` (its
 * index within the destination column, excluding the dragged task itself).
 * Returns only the tasks whose columnId/order actually changed.
 */
export function reorderTasksOnDrop<T extends OrderableTask>(
  allTasks: T[],
  activeId: string,
  targetColumnId: string | null,
  targetIndex: number
): TaskOrderUpdate[] {
  const activeTask = allTasks.find((task) => task.id === activeId);
  if (!activeTask) return [];

  const sourceColumnId = activeTask.columnId;

  const columnTasksExcludingActive = (columnId: string | null) =>
    allTasks
      .filter((task) => task.columnId === columnId && task.id !== activeId)
      .sort((a, b) => a.order - b.order);

  const destTasks = columnTasksExcludingActive(targetColumnId);
  const clampedIndex = Math.max(0, Math.min(targetIndex, destTasks.length));
  destTasks.splice(clampedIndex, 0, activeTask);

  const updates = new Map<string, TaskOrderUpdate>();
  destTasks.forEach((task, index) => {
    updates.set(task.id, { id: task.id, columnId: targetColumnId, order: index });
  });

  if (sourceColumnId !== targetColumnId) {
    columnTasksExcludingActive(sourceColumnId).forEach((task, index) => {
      updates.set(task.id, { id: task.id, columnId: sourceColumnId, order: index });
    });
  }

  return Array.from(updates.values()).filter((update) => {
    const original = allTasks.find((task) => task.id === update.id);
    return !original || original.columnId !== update.columnId || original.order !== update.order;
  });
}
