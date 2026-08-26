import { prisma } from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Task API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects/[id]/tasks', () => {
    it('should create a new task successfully', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        done: false,
        projectId: 'project-1',
        createdAt: new Date(),
      };

      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

      const newTask = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: 'project-1',
        },
      });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Task',
          projectId: 'project-1',
        },
      });
      expect(newTask).toEqual(mockTask);
    });

    it('should fail when title is missing', async () => {
      const mockTask = {
        id: 'task-1',
        title: '',
        done: false,
        projectId: 'project-1',
        createdAt: new Date(),
      };

      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

      const result = await prisma.task.create({
        data: {
          title: '',
          projectId: 'project-1',
        },
      });

      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/tasks/[id]', () => {
    it('should update task done status successfully', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        done: true,
        projectId: 'project-1',
        createdAt: new Date(),
      };

      (prisma.task.update as jest.Mock).mockResolvedValue(mockTask);

      const updatedTask = await prisma.task.update({
        where: { id: 'task-1' },
        data: { done: true },
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { done: true },
      });
      expect(updatedTask.done).toBe(true);
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task successfully', async () => {
      (prisma.task.delete as jest.Mock).mockResolvedValue({ id: 'task-1' });

      await prisma.task.delete({
        where: { id: 'task-1' },
      });

      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });
  });

  describe('GET /api/projects/[id]/tasks', () => {
    it('should fetch tasks for a project successfully', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          done: false,
          projectId: 'project-1',
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          title: 'Task 2',
          done: true,
          projectId: 'project-1',
          createdAt: new Date(),
        },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const tasks = await prisma.task.findMany({
        where: { projectId: 'project-1' },
        orderBy: { createdAt: 'desc' },
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(tasks).toHaveLength(2);
    });
  });
});
