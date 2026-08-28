export interface TitledTask {
  title: string;
}

export function filterTasksByTitle<T extends TitledTask>(tasks: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return tasks;
  }

  return tasks.filter((task) => task.title.toLocaleLowerCase().includes(normalizedQuery));
}
