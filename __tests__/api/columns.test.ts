import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/projects/[id]/columns/route';
import { PATCH, DELETE } from '@/app/api/columns/[id]/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    column: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

describe('Column API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects/[id]/columns', () => {
    it('lists columns for the given project ordered by order', async () => {
      const mockColumns = [
        { id: 'col-1', name: 'Todo', color: 'blue', order: 0, isDoneColumn: false, projectId: 'project-1' },
      ];
      (prisma.column.findMany as jest.Mock).mockResolvedValue(mockColumns);

      const response = await GET(new Request('http://localhost/api/projects/project-1/columns'), {
        params: { id: 'project-1' },
      });

      expect(prisma.column.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        orderBy: { order: 'asc' },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(mockColumns);
    });
  });

  describe('POST /api/projects/[id]/columns', () => {
    it('creates a column with order one past the current max', async () => {
      (prisma.column.findMany as jest.Mock).mockResolvedValue([{ order: 0 }, { order: 1 }]);
      const mockColumn = {
        id: 'col-3',
        name: 'Review',
        color: 'purple',
        order: 2,
        isDoneColumn: false,
        projectId: 'project-1',
      };
      (prisma.column.create as jest.Mock).mockResolvedValue(mockColumn);

      const response = await POST(
        new Request('http://localhost/api/projects/project-1/columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Review', color: 'purple' }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(prisma.column.create).toHaveBeenCalledWith({
        data: { name: 'Review', color: 'purple', order: 2, projectId: 'project-1' },
      });
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual(mockColumn);
    });

    it('assigns order 0 for the first column in a project', async () => {
      (prisma.column.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.column.create as jest.Mock).mockResolvedValue({ id: 'col-1', order: 0 });

      await POST(
        new Request('http://localhost/api/projects/project-1/columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Todo' }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(prisma.column.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ order: 0 }) })
      );
    });

    it('falls back to the default color for an unknown value', async () => {
      (prisma.column.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.column.create as jest.Mock).mockResolvedValue({ id: 'col-1' });

      await POST(
        new Request('http://localhost/api/projects/project-1/columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Todo', color: 'not-a-real-color' }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(prisma.column.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ color: 'gray' }) })
      );
    });

    it('rejects an empty name with 400', async () => {
      const response = await POST(
        new Request('http://localhost/api/projects/project-1/columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '   ' }),
        }),
        { params: { id: 'project-1' } }
      );

      expect(response.status).toBe(400);
      expect(prisma.column.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/columns/[id]', () => {
    it('updates the name and color of a column', async () => {
      const mockColumn = { id: 'col-1', name: 'In Review', color: 'teal', projectId: 'project-1' };
      (prisma.column.update as jest.Mock).mockResolvedValue(mockColumn);

      const response = await PATCH(
        new Request('http://localhost/api/columns/col-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'In Review', color: 'teal' }),
        }),
        { params: { id: 'col-1' } }
      );

      expect(prisma.column.update).toHaveBeenCalledWith({
        where: { id: 'col-1' },
        data: { name: 'In Review', color: 'teal' },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(mockColumn);
    });

    it('rejects renaming to an empty name with 400', async () => {
      const response = await PATCH(
        new Request('http://localhost/api/columns/col-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '  ' }),
        }),
        { params: { id: 'col-1' } }
      );

      expect(response.status).toBe(400);
      expect(prisma.column.update).not.toHaveBeenCalled();
    });

    it('unsets isDoneColumn on every sibling before setting it on this column', async () => {
      (prisma.column.findUnique as jest.Mock).mockResolvedValue({ projectId: 'project-1' });
      (prisma.column.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      const updatedColumn = { id: 'col-2', isDoneColumn: true, projectId: 'project-1' };
      (prisma.column.update as jest.Mock).mockResolvedValue(updatedColumn);

      const response = await PATCH(
        new Request('http://localhost/api/columns/col-2', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDoneColumn: true }),
        }),
        { params: { id: 'col-2' } }
      );

      expect(prisma.column.updateMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1', id: { not: 'col-2' } },
        data: { isDoneColumn: false },
      });
      expect(prisma.column.update).toHaveBeenCalledWith({
        where: { id: 'col-2' },
        data: { isDoneColumn: true },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(updatedColumn);
    });

    it('swaps order with the right neighbor when moving right', async () => {
      (prisma.column.findUnique as jest.Mock)
        .mockResolvedValueOnce({ projectId: 'project-1' })
        .mockResolvedValueOnce({ id: 'col-1', order: 1 });
      (prisma.column.findMany as jest.Mock).mockResolvedValue([
        { id: 'col-1', order: 0 },
        { id: 'col-2', order: 1 },
      ]);
      (prisma.column.update as jest.Mock).mockResolvedValue({});

      const response = await PATCH(
        new Request('http://localhost/api/columns/col-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction: 'right' }),
        }),
        { params: { id: 'col-1' } }
      );

      expect(prisma.column.update).toHaveBeenCalledWith({ where: { id: 'col-1' }, data: { order: 1 } });
      expect(prisma.column.update).toHaveBeenCalledWith({ where: { id: 'col-2' }, data: { order: 0 } });
      expect(response.status).toBe(200);
    });

    it('rejects an invalid direction with 400', async () => {
      const response = await PATCH(
        new Request('http://localhost/api/columns/col-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction: 'up' }),
        }),
        { params: { id: 'col-1' } }
      );

      expect(response.status).toBe(400);
      expect(prisma.column.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/columns/[id]', () => {
    it('deletes a column', async () => {
      (prisma.column.delete as jest.Mock).mockResolvedValue({ id: 'col-1' });

      const response = await DELETE(new Request('http://localhost/api/columns/col-1'), {
        params: { id: 'col-1' },
      });

      expect(prisma.column.delete).toHaveBeenCalledWith({ where: { id: 'col-1' } });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
    });
  });
});
