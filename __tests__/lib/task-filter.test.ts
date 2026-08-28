import { filterTasksByTitle } from '@/lib/task-filter';

describe('filterTasksByTitle', () => {
  const tasks = [
    { id: '1', title: 'Thiết kế giao diện' },
    { id: '2', title: 'Viết tài liệu API' },
    { id: '3', title: 'Kiểm thử giao diện' },
  ];

  it('returns all tasks for an empty query', () => {
    expect(filterTasksByTitle(tasks, '')).toEqual(tasks);
    expect(filterTasksByTitle(tasks, '   ')).toEqual(tasks);
  });

  it('matches titles without case sensitivity', () => {
    expect(filterTasksByTitle(tasks, 'GIAO DIỆN')).toEqual([
      tasks[0],
      tasks[2],
    ]);
  });

  it('returns an empty list when no title matches', () => {
    expect(filterTasksByTitle(tasks, 'triển khai')).toEqual([]);
  });
});
