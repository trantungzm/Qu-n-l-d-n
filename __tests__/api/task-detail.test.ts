import { prisma } from '@/lib/prisma';
import { PATCH } from '@/app/api/tasks/[id]/route';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      update: jest.fn(),
    },
  },
}));

describe('PATCH /api/tasks/[id] (edit title/dueDate)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update title and dueDate successfully without touching status', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Updated title',
      status: 'doing',
      dueDate: '2026-12-31T00:00:00.000Z',
      projectId: 'project-1',
      createdAt: new Date().toISOString(),
    };

    (prisma.task.update as jest.Mock).mockResolvedValue(mockTask);

    const response = await PATCH(
      new Request('http://localhost/api/tasks/task-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated title',
          dueDate: '2026-12-31',
        }),
      }),
      { params: { id: 'task-1' } }
    );

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        title: 'Updated title',
        dueDate: new Date('2026-12-31'),
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(mockTask);
  });

  it('should reject empty title with 400 and not call prisma', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/tasks/task-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '   ',
          dueDate: '2026-12-31',
        }),
      }),
      { params: { id: 'task-1' } }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Title is required' });
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('should allow clearing the due date by sending null', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Task without due date',
      status: 'todo',
      dueDate: null,
      projectId: 'project-1',
      createdAt: new Date().toISOString(),
    };

    (prisma.task.update as jest.Mock).mockResolvedValue(mockTask);

    const response = await PATCH(
      new Request('http://localhost/api/tasks/task-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Task without due date',
          dueDate: null,
        }),
      }),
      { params: { id: 'task-1' } }
    );

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        title: 'Task without due date',
        dueDate: null,
      },
    });
    expect(response.status).toBe(200);
  });
});
