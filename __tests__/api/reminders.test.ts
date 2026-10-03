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

  it('counts overdue/due-soon tasks using Column.isDoneColumn, not Task.status', async () => {
    const today = new Date();
    const overdueDate = new Date(today);
    overdueDate.setDate(overdueDate.getDate() - 2);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([
      { dueDate: overdueDate, column: { isDoneColumn: false } }, // overdue, open
      { dueDate: today, column: { isDoneColumn: false } }, // due soon, open
      { dueDate: overdueDate, column: { isDoneColumn: true } }, // overdue but done column -> ignored
      { dueDate: overdueDate, column: null }, // columnless, treated as open -> overdue
    ]);

    const response = await GET();
    const body = await response.json();

    expect(prisma.task.findMany).toHaveBeenCalledWith({
      select: { dueDate: true, column: { select: { isDoneColumn: true } } },
    });
    expect(body).toEqual({ count: 3 });
  });

  it('returns 0 when there are no tasks', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({ count: 0 });
  });
});
