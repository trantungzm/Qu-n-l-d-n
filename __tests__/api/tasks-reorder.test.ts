import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/tasks/reorder/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    column: {
      findMany: jest.fn(),
    },
    task: {
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

describe('POST /api/tasks/reorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes columnId/order and derives status from the target column isDoneColumn flag', async () => {
    (prisma.column.findMany as jest.Mock).mockResolvedValue([
      { id: 'col-doing', isDoneColumn: false },
      { id: 'col-done', isDoneColumn: true },
    ]);
    (prisma.task.update as jest.Mock).mockImplementation(({ data }) => Promise.resolve({ id: 'x', ...data }));

    const response = await POST(
      new Request('http://localhost/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [
            { id: 'task-1', columnId: 'col-doing', order: 0 },
            { id: 'task-2', columnId: 'col-done', order: 0 },
          ],
        }),
      })
    );

    expect(prisma.column.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['col-doing', 'col-done'] } },
      select: { id: true, isDoneColumn: true },
    });
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { columnId: 'col-doing', order: 0, status: 'todo' },
    });
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-2' },
      data: { columnId: 'col-done', order: 0, status: 'done' },
    });
    expect(response.status).toBe(200);
  });

  it('rejects an empty updates array with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [] }),
      })
    );

    expect(response.status).toBe(400);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('rejects updates missing a string columnId with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ id: 'task-1', status: 'todo', order: 0 }] }),
      })
    );

    expect(response.status).toBe(400);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});
