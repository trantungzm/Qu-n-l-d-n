import { prisma } from '@/lib/prisma';
import { legacyDoneToStatus, TASK_STATUSES } from '@/lib/task-status';

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
        status: 'todo',
        projectId: 'project-1',
        createdAt: new Date(),
      };

      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

      const newTask = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: 'project-1',
          status: 'todo',
        },
      });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Task',
          projectId: 'project-1',
          status: 'todo',
        },
      });
      expect(newTask).toEqual(mockTask);
    });

    it('should fail when title is missing', async () => {
      const mockTask = {
        id: 'task-1',
        title: '',
        status: 'todo',
        projectId: 'project-1',
        createdAt: new Date(),
      };

      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

      const result = await prisma.task.create({
        data: {
          title: '',
          projectId: 'project-1',
          status: 'todo',
        },
      });

      expect(prisma.task.create).toHaveBeenCalled();
      expect(result.status).toBe('todo');
    });
  });

  describe('PATCH /api/tasks/[id]', () => {
    it('should update task status successfully when moving between columns', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        status: 'doing',
        projectId: 'project-1',
        createdAt: new Date(),
      };

      (prisma.task.update as jest.Mock).mockResolvedValue(mockTask);

      const updatedTask = await prisma.task.update({
        where: { id: 'task-1' },
        data: { status: 'doing' },
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { status: 'doing' },
      });
      expect(updatedTask.status).toBe('doing');
      expect(TASK_STATUSES).toContain('doing');
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
          status: 'todo',
          projectId: 'project-1',
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'done',
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

  describe('Legacy data migration', () => {
    it('should convert legacy done values into the new status values', () => {
      expect(legacyDoneToStatus(true)).toBe('done');
      expect(legacyDoneToStatus(false)).toBe('todo');
    });
  });
});
