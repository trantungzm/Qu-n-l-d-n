import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/tasks/archived/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/tasks/archived', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists only archived tasks across all projects, with project info included', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Archived task',
        archivedAt: new Date('2026-10-01'),
        project: { id: 'project-1', name: 'Project 1' },
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: { archivedAt: { not: null } },
      orderBy: { archivedAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('Archived task');
  });
});
