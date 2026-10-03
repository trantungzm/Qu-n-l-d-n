import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/projects/[id]/tasks/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/projects/[id]/tasks (archived filtering)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('excludes archived tasks from the Kanban board list', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

    await GET(
      new Request('http://localhost/api/projects/project-1/tasks'),
      { params: { id: 'project-1' } }
    );

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'project-1', archivedAt: null },
      })
    );
  });
});
