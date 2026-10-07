import { prisma } from '@/lib/prisma';
import { PATCH } from '@/app/api/projects/[id]/route';
import { GET } from '@/app/api/projects/route';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Project API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects (archived filtering + progress via Column.isDoneColumn)', () => {
    it('defaults to only non-archived projects, excludes archived tasks, and computes progress from isDoneColumn (not Task.status)', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'project-1',
          name: 'Active project',
          _count: { tasks: 3 },
          tasks: [
            { column: { isDoneColumn: true } },
            { column: { isDoneColumn: false } },
            { column: null },
          ],
        },
      ]);

      const response = await GET(new Request('http://localhost/api/projects'));
      const body = await response.json();

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { archivedAt: null },
          include: expect.objectContaining({
            tasks: {
              where: { archivedAt: null },
              select: { column: { select: { isDoneColumn: true } } },
            },
          }),
        })
      );
      expect(response.status).toBe(200);
      expect(body[0].progress).toEqual({ done: 1, total: 3, percent: 33 });
    });

    it('returns only archived projects when ?archived=true', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      await GET(new Request('http://localhost/api/projects?archived=true'));

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { archivedAt: { not: null } } })
      );
    });
  });

  describe('PATCH /api/projects/[id]', () => {
    it('should update project successfully and return the updated data', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Project Updated',
        description: 'Updated description',
        createdAt: new Date().toISOString(),
      };

      (prisma.project.update as jest.Mock).mockResolvedValue(mockProject);

      const response = await PATCH(
        new Request('http://localhost/api/projects/project-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Project Updated',
            description: 'Updated description',
          }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: {
          name: 'Project Updated',
          description: 'Updated description',
        },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(mockProject);
    });

    it('should reject empty project name with 400', async () => {
      const response = await PATCH(
        new Request('http://localhost/api/projects/project-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '   ',
            description: 'Updated description',
          }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Name is required' });
      expect(prisma.project.update).not.toHaveBeenCalled();
    });
  });
});
