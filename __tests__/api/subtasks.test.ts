import { prisma } from '@/lib/prisma';
import { POST as createSubTask } from '@/app/api/tasks/[id]/subtasks/route';
import { PATCH as patchSubTask, DELETE as deleteSubTask } from '@/app/api/subtasks/[id]/route';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    subTask: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('POST /api/tasks/[id]/subtasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new subtask for the task', async () => {
    const mockSubTask = {
      id: 'subtask-1',
      title: 'Viết tài liệu',
      done: false,
      taskId: 'task-1',
    };

    (prisma.subTask.create as jest.Mock).mockResolvedValue(mockSubTask);

    const response = await createSubTask(
      new Request('http://localhost/api/tasks/task-1/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Viết tài liệu' }),
      }),
      { params: { id: 'task-1' } }
    );

    expect(prisma.subTask.create).toHaveBeenCalledWith({
      data: { title: 'Viết tài liệu', taskId: 'task-1' },
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(mockSubTask);
  });

  it('rejects an empty title with 400 and does not call prisma', async () => {
    const response = await createSubTask(
      new Request('http://localhost/api/tasks/task-1/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '   ' }),
      }),
      { params: { id: 'task-1' } }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Title is required' });
    expect(prisma.subTask.create).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/subtasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggles done to true', async () => {
    const mockSubTask = {
      id: 'subtask-1',
      title: 'Viết tài liệu',
      done: true,
      taskId: 'task-1',
    };

    (prisma.subTask.update as jest.Mock).mockResolvedValue(mockSubTask);

    const response = await patchSubTask(
      new Request('http://localhost/api/subtasks/subtask-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: true }),
      }),
      { params: { id: 'subtask-1' } }
    );

    expect(prisma.subTask.update).toHaveBeenCalledWith({
      where: { id: 'subtask-1' },
      data: { done: true },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(mockSubTask);
  });

  it('updates the title', async () => {
    const mockSubTask = {
      id: 'subtask-1',
      title: 'Tiêu đề mới',
      done: false,
      taskId: 'task-1',
    };

    (prisma.subTask.update as jest.Mock).mockResolvedValue(mockSubTask);

    const response = await patchSubTask(
      new Request('http://localhost/api/subtasks/subtask-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Tiêu đề mới' }),
      }),
      { params: { id: 'subtask-1' } }
    );

    expect(prisma.subTask.update).toHaveBeenCalledWith({
      where: { id: 'subtask-1' },
      data: { title: 'Tiêu đề mới' },
    });
    expect(response.status).toBe(200);
  });

  it('rejects an empty title with 400 and does not call prisma', async () => {
    const response = await patchSubTask(
      new Request('http://localhost/api/subtasks/subtask-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '   ' }),
      }),
      { params: { id: 'subtask-1' } }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Title is required' });
    expect(prisma.subTask.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/subtasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the subtask', async () => {
    (prisma.subTask.delete as jest.Mock).mockResolvedValue({ id: 'subtask-1' });

    const response = await deleteSubTask(
      new Request('http://localhost/api/subtasks/subtask-1', {
        method: 'DELETE',
      }),
      { params: { id: 'subtask-1' } }
    );

    expect(prisma.subTask.delete).toHaveBeenCalledWith({
      where: { id: 'subtask-1' },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
