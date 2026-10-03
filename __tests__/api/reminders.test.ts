import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/tasks/reminders/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/tasks/reminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries only non-archived tasks for the in-app reminder badge count', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

    await GET();

    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: { archivedAt: null },
      select: { status: true, dueDate: true },
    });
  });

  it('returns 0 when there are no tasks', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({ count: 0 });
  });
});
