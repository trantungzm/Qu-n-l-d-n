import { reorderTasksOnDrop } from '@/lib/task-order';

describe('reorderTasksOnDrop', () => {
  it('recomputes order for surrounding tasks when a task is inserted in the middle of the same column', () => {
    const tasks = [
      { id: 'a', columnId: 'col-a', order: 0 },
      { id: 'b', columnId: 'col-a', order: 1 },
      { id: 'c', columnId: 'col-a', order: 2 },
      { id: 'd', columnId: 'col-a', order: 3 },
    ];

    // Move "d" (last) to index 1, i.e. between "a" and "b".
    const updates = reorderTasksOnDrop(tasks, 'd', 'col-a', 1);

    const byId = Object.fromEntries(updates.map((u) => [u.id, u]));
    expect(byId.d).toEqual({ id: 'd', columnId: 'col-a', order: 1 });
    expect(byId.b).toEqual({ id: 'b', columnId: 'col-a', order: 2 });
    expect(byId.c).toEqual({ id: 'c', columnId: 'col-a', order: 3 });
    expect(byId.a).toBeUndefined(); // unaffected, stays at order 0
  });

  it('moves a task to the front of the same column', () => {
    const tasks = [
      { id: 'a', columnId: 'col-a', order: 0 },
      { id: 'b', columnId: 'col-a', order: 1 },
      { id: 'c', columnId: 'col-a', order: 2 },
    ];

    const updates = reorderTasksOnDrop(tasks, 'c', 'col-a', 0);
    const byId = Object.fromEntries(updates.map((u) => [u.id, u]));

    expect(byId.c).toEqual({ id: 'c', columnId: 'col-a', order: 0 });
    expect(byId.a).toEqual({ id: 'a', columnId: 'col-a', order: 1 });
    expect(byId.b).toEqual({ id: 'b', columnId: 'col-a', order: 2 });
  });

  it('reassigns order for both columns when a task moves across columns', () => {
    const tasks = [
      { id: 'a', columnId: 'col-a', order: 0 },
      { id: 'b', columnId: 'col-a', order: 1 },
      { id: 'c', columnId: 'col-b', order: 0 },
      { id: 'd', columnId: 'col-b', order: 1 },
    ];

    const updates = reorderTasksOnDrop(tasks, 'a', 'col-b', 1);
    const byId = Object.fromEntries(updates.map((u) => [u.id, u]));

    expect(byId.a).toEqual({ id: 'a', columnId: 'col-b', order: 1 });
    expect(byId.c).toBeUndefined(); // already order 0 in "col-b", unaffected
    expect(byId.d).toEqual({ id: 'd', columnId: 'col-b', order: 2 });
    expect(byId.b).toEqual({ id: 'b', columnId: 'col-a', order: 0 }); // "col-a" reindexed after "a" leaves
  });

  it('appends to the end of an empty column when dropped there', () => {
    const tasks = [
      { id: 'a', columnId: 'col-a', order: 0 },
      { id: 'b', columnId: 'col-a', order: 1 },
    ];

    const updates = reorderTasksOnDrop(tasks, 'a', 'col-c', 0);
    const byId = Object.fromEntries(updates.map((u) => [u.id, u]));

    expect(byId.a).toEqual({ id: 'a', columnId: 'col-c', order: 0 });
    expect(byId.b).toEqual({ id: 'b', columnId: 'col-a', order: 0 });
  });

  it('clamps an out-of-range target index to the end of the column', () => {
    const tasks = [
      { id: 'a', columnId: 'col-a', order: 0 },
      { id: 'b', columnId: 'col-a', order: 1 },
    ];

    const updates = reorderTasksOnDrop(tasks, 'a', 'col-a', 99);
    const byId = Object.fromEntries(updates.map((u) => [u.id, u]));

    expect(byId.a).toEqual({ id: 'a', columnId: 'col-a', order: 1 });
    expect(byId.b).toEqual({ id: 'b', columnId: 'col-a', order: 0 });
  });

  it('returns no updates when the task is dropped back in its original position', () => {
    const tasks = [
      { id: 'a', columnId: 'col-a', order: 0 },
      { id: 'b', columnId: 'col-a', order: 1 },
    ];

    const updates = reorderTasksOnDrop(tasks, 'a', 'col-a', 0);
    expect(updates).toEqual([]);
  });

  it('returns no updates for an unknown task id', () => {
    const tasks = [{ id: 'a', columnId: 'col-a', order: 0 }];
    expect(reorderTasksOnDrop(tasks, 'missing', 'col-a', 0)).toEqual([]);
  });
});
