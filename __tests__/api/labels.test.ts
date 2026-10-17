import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/projects/[id]/labels/route';
import { PATCH, DELETE } from '@/app/api/labels/[id]/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    label: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.9.1',
  });
}

describe('Label API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects/[id]/labels', () => {
    it('lists labels for the given project ordered by name, with each one\'s attached task count', async () => {
      const mockLabels = [
        {
          id: 'label-1',
          name: 'Q4-2026',
          color: 'blue',
          projectId: 'project-1',
          _count: { tasks: 3 },
        },
      ];
      (prisma.label.findMany as jest.Mock).mockResolvedValue(mockLabels);

      const response = await GET(new Request('http://localhost/api/projects/project-1/labels'), {
        params: { id: 'project-1' },
      });

      expect(prisma.label.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        orderBy: { name: 'asc' },
        include: { _count: { select: { tasks: true } } },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        { id: 'label-1', name: 'Q4-2026', color: 'blue', projectId: 'project-1', taskCount: 3 },
      ]);
    });
  });

  describe('POST /api/projects/[id]/labels', () => {
    it('creates a label with a normalized color', async () => {
      const mockLabel = { id: 'label-1', name: 'Khách hàng A', color: 'purple', projectId: 'project-1' };
      (prisma.label.create as jest.Mock).mockResolvedValue(mockLabel);

      const response = await POST(
        new Request('http://localhost/api/projects/project-1/labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Khách hàng A', color: 'purple' }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(prisma.label.create).toHaveBeenCalledWith({
        data: { name: 'Khách hàng A', color: 'purple', projectId: 'project-1' },
      });
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual(mockLabel);
    });

    it('falls back to the default color for an unknown value', async () => {
      (prisma.label.create as jest.Mock).mockResolvedValue({
        id: 'label-1',
        name: 'Cần review',
        color: 'gray',
        projectId: 'project-1',
      });

      await POST(
        new Request('http://localhost/api/projects/project-1/labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Cần review', color: 'not-a-real-color' }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(prisma.label.create).toHaveBeenCalledWith({
        data: { name: 'Cần review', color: 'gray', projectId: 'project-1' },
      });
    });

    it('rejects an empty name with 400', async () => {
      const response = await POST(
        new Request('http://localhost/api/projects/project-1/labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '   ', color: 'blue' }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(response.status).toBe(400);
      expect(prisma.label.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate name within the same project with 409', async () => {
      (prisma.label.create as jest.Mock).mockRejectedValue(uniqueConstraintError());

      const response = await POST(
        new Request('http://localhost/api/projects/project-1/labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Q4-2026', color: 'blue' }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({
        error: 'Label name already exists in this project',
      });
    });
  });

  describe('PATCH /api/labels/[id]', () => {
    it('updates the name and color of a label', async () => {
      const mockLabel = { id: 'label-1', name: 'Q1-2027', color: 'emerald', projectId: 'project-1' };
      (prisma.label.update as jest.Mock).mockResolvedValue(mockLabel);

      const response = await PATCH(
        new Request('http://localhost/api/labels/label-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Q1-2027', color: 'emerald' }),
        }),
        { params: { id: 'label-1' } }
      );

      expect(prisma.label.update).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        data: { name: 'Q1-2027', color: 'emerald' },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(mockLabel);
    });

    it('rejects renaming to an empty name with 400', async () => {
      const response = await PATCH(
        new Request('http://localhost/api/labels/label-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '  ' }),
        }),
        { params: { id: 'label-1' } }
      );

      expect(response.status).toBe(400);
      expect(prisma.label.update).not.toHaveBeenCalled();
    });

    it('rejects renaming to a name already used in the project with 409', async () => {
      (prisma.label.update as jest.Mock).mockRejectedValue(uniqueConstraintError());

      const response = await PATCH(
        new Request('http://localhost/api/labels/label-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Khách hàng A' }),
        }),
        { params: { id: 'label-1' } }
      );

      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /api/labels/[id]', () => {
    it('deletes a label', async () => {
      (prisma.label.delete as jest.Mock).mockResolvedValue({ id: 'label-1' });

      const response = await DELETE(new Request('http://localhost/api/labels/label-1'), {
        params: { id: 'label-1' },
      });

      expect(prisma.label.delete).toHaveBeenCalledWith({ where: { id: 'label-1' } });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
    });
  });
});
