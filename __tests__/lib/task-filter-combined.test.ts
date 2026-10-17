import { filterTasksByTitle } from '@/lib/task-filter';
import { filterTasksByPriority } from '@/lib/task-priority';
import { filterTasksByType } from '@/lib/task-type';
import { filterTasksByLabel, type TaskLabel } from '@/lib/label';

interface CombinableTask {
  id: string;
  title: string;
  priority: string;
  type: string;
  labels: TaskLabel[];
}

function applyFilters(
  tasks: CombinableTask[],
  {
    search = '',
    priority = 'all',
    type = 'all',
    label = 'all',
  }: { search?: string; priority?: string; type?: string; label?: string }
) {
  return filterTasksByLabel(
    filterTasksByType(filterTasksByPriority(filterTasksByTitle(tasks, search), priority), type),
    label
  );
}

const REVIEW_LABEL: TaskLabel = { id: 'label-review', name: 'Cần review', color: 'red' };
const Q4_LABEL: TaskLabel = { id: 'label-q4', name: 'Q4-2026', color: 'blue' };

describe('combined task filters (search + priority + type + label)', () => {
  const tasks: CombinableTask[] = [
    { id: '1', title: 'Sửa lỗi đăng nhập', priority: 'high', type: 'bug', labels: [REVIEW_LABEL] },
    { id: '2', title: 'Sửa lỗi hiển thị', priority: 'low', type: 'bug', labels: [REVIEW_LABEL] },
    { id: '3', title: 'Thêm tính năng đăng nhập', priority: 'high', type: 'feature', labels: [REVIEW_LABEL] },
    { id: '4', title: 'Dọn dẹp code đăng nhập', priority: 'high', type: 'chore', labels: [Q4_LABEL] },
  ];

  it('applies AND semantics: a task must match every active filter, not just one', () => {
    const result = applyFilters(tasks, { search: 'đăng nhập', priority: 'high', type: 'bug' });
    expect(result).toEqual([tasks[0]]);
  });

  it('returns every task matching priority+type alone when search is empty', () => {
    const result = applyFilters(tasks, { priority: 'high', type: 'bug' });
    expect(result).toEqual([tasks[0]]);
  });

  it('returns an empty list when the filters have no intersection', () => {
    const result = applyFilters(tasks, { search: 'tính năng', priority: 'high', type: 'bug' });
    expect(result).toEqual([]);
  });

  it('behaves like a no-op when every filter is left at its default', () => {
    expect(applyFilters(tasks, {})).toEqual(tasks);
  });

  it('narrows progressively as more filters are combined (never widens back out)', () => {
    const byTypeOnly = applyFilters(tasks, { type: 'bug' });
    const byTypeAndPriority = applyFilters(tasks, { type: 'bug', priority: 'high' });

    expect(byTypeOnly).toEqual([tasks[0], tasks[1]]);
    expect(byTypeAndPriority).toEqual([tasks[0]]);
    expect(byTypeAndPriority.length).toBeLessThanOrEqual(byTypeOnly.length);
  });

  it('combines label with search + priority + type using AND, not OR', () => {
    // task 1 and 3 both carry the "Cần review" label, but only task 1
    // also matches priority=high + type=bug + search="đăng nhập" at once.
    const result = applyFilters(tasks, {
      search: 'đăng nhập',
      priority: 'high',
      type: 'bug',
      label: REVIEW_LABEL.id,
    });
    expect(result).toEqual([tasks[0]]);
  });

  it('returns an empty list when the label does not intersect with the other filters', () => {
    // task 4 has the Q4 label but is a "chore", not a "bug".
    const result = applyFilters(tasks, { type: 'bug', label: Q4_LABEL.id });
    expect(result).toEqual([]);
  });

  it('filters by label alone across every task carrying it, ignoring type/priority differences', () => {
    const result = applyFilters(tasks, { label: REVIEW_LABEL.id });
    expect(result).toEqual([tasks[0], tasks[1], tasks[2]]);
  });
});
