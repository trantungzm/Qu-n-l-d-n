import { prisma } from '@/lib/prisma';
import { PATCH } from '@/app/api/tasks/[id]/archive/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      update: jest.fn(),
    },
  },
}));

describe('PATCH /api/tasks/[id]/archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets archivedAt to a Date when archived is true', async () => {
    (prisma.task.update as jest.Mock).mockImplementation(({ data }) =>
      Promise.resolve({ id: 'task-1', title: 'T', ...data })
    );

    const response = await PATCH(
      new Request('http://localhost/api/tasks/task-1/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      }),
      { params: { id: 'task-1' } }
    );

    expect(response.status).toBe(200);
    const [[call]] = (prisma.task.update as jest.Mock).mock.calls;
    expect(call.where).toEqual({ id: 'task-1' });
    expect(call.data.archivedAt).toBeInstanceOf(Date);
  });

  it('restores the task by setting archivedAt back to null when archived is false', async () => {
    (prisma.task.update as jest.Mock).mockResolvedValue({
      id: 'task-1',
      title: 'T',
      archivedAt: null,
    });

    const response = await PATCH(
      new Request('http://localhost/api/tasks/task-1/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      }),
      { params: { id: 'task-1' } }
    );

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { archivedAt: null },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.archivedAt).toBeNull();
  });

  it('rejects a non-boolean archived value with 400', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/tasks/task-1/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: { id: 'task-1' } }
    );

    expect(response.status).toBe(400);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});
