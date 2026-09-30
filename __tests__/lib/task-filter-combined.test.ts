import { filterTasksByTitle } from '@/lib/task-filter';
import { filterTasksByPriority } from '@/lib/task-priority';
import { filterTasksByType } from '@/lib/task-type';

function applyFilters(
  tasks: { id: string; title: string; priority: string; type: string }[],
  { search = '', priority = 'all', type = 'all' }: { search?: string; priority?: string; type?: string }
) {
  return filterTasksByType(filterTasksByPriority(filterTasksByTitle(tasks, search), priority), type);
}

describe('combined task filters (search + priority + type)', () => {
  const tasks = [
    { id: '1', title: 'Sửa lỗi đăng nhập', priority: 'high', type: 'bug' },
    { id: '2', title: 'Sửa lỗi hiển thị', priority: 'low', type: 'bug' },
    { id: '3', title: 'Thêm tính năng đăng nhập', priority: 'high', type: 'feature' },
    { id: '4', title: 'Dọn dẹp code đăng nhập', priority: 'high', type: 'chore' },
  ];

  it('applies AND semantics: a task must match every active filter, not just one', () => {
    // Matches search + priority but NOT type -> excluded.
    // Matches search + type but NOT priority -> excluded.
    // Only task 1 matches all three at once.
    const result = applyFilters(tasks, { search: 'đăng nhập', priority: 'high', type: 'bug' });
    expect(result).toEqual([tasks[0]]);
  });

  it('returns every task matching priority+type alone when search is empty', () => {
    const result = applyFilters(tasks, { priority: 'high', type: 'bug' });
    expect(result).toEqual([tasks[0]]);
  });

  it('returns an empty list when the filters have no intersection', () => {
    // "Thêm tính năng đăng nhập" (task 3) is a feature, not a bug.
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
});
