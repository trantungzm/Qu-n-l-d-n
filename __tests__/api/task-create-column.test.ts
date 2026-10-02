import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/projects/[id]/tasks/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    column: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    task: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('POST /api/projects/[id]/tasks (column defaulting)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults into the project\'s first column by order when no columnId is given', async () => {
    (prisma.column.findFirst as jest.Mock).mockResolvedValue({ id: 'col-todo', isDoneColumn: false });
    (prisma.task.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.task.create as jest.Mock).mockResolvedValue({ id: 'task-1', columnId: 'col-todo', status: 'todo' });

    const response = await POST(
      new Request('http://localhost/api/projects/project-1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New task' }),
      }),
      { params: { id: 'project-1' } }
    );

    expect(prisma.column.findFirst).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      orderBy: { order: 'asc' },
      select: { id: true, isDoneColumn: true },
    });
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ columnId: 'col-todo', status: 'todo', order: 0 }),
      })
    );
    expect(response.status).toBe(201);
  });

  it('uses the given columnId and derives status "done" when it is the done column', async () => {
    (prisma.column.findUnique as jest.Mock).mockResolvedValue({ id: 'col-done', isDoneColumn: true });
    (prisma.task.findFirst as jest.Mock).mockResolvedValue({ order: 2 });
    (prisma.task.create as jest.Mock).mockResolvedValue({ id: 'task-1', columnId: 'col-done', status: 'done' });

    await POST(
      new Request('http://localhost/api/projects/project-1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New task', columnId: 'col-done' }),
      }),
      { params: { id: 'project-1' } }
    );

    expect(prisma.column.findUnique).toHaveBeenCalledWith({
      where: { id: 'col-done' },
      select: { id: true, isDoneColumn: true },
    });
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ columnId: 'col-done', status: 'done', order: 1 }),
      })
    );
  });

  it('creates a columnless task with default status when the project has no columns', async () => {
    (prisma.column.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.task.create as jest.Mock).mockResolvedValue({ id: 'task-1', columnId: null, status: 'todo' });

    await POST(
      new Request('http://localhost/api/projects/project-1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New task' }),
      }),
      { params: { id: 'project-1' } }
    );

    expect(prisma.task.findFirst).not.toHaveBeenCalled();
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ columnId: null, status: 'todo', order: 0 }),
      })
    );
  });

  it('rejects an empty title with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/projects/project-1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '   ' }),
      }),
      { params: { id: 'project-1' } }
    );

    expect(response.status).toBe(400);
    expect(prisma.task.create).not.toHaveBeenCalled();
  });
});
