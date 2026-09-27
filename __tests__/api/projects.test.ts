import { prisma } from '@/lib/prisma';
import { PATCH } from '@/app/api/projects/[id]/route';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      update: jest.fn(),
    },
  },
}));

describe('Project API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
