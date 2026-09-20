import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
  },
}));

const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { GET } from '@/app/api/cron/send-reminders/route';

function makeRequest(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/cron/send-reminders', { headers });
}

describe('GET /api/cron/send-reminders', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      CRON_SECRET: 'test-secret',
      AUTH_ALLOWED_EMAIL: 'owner@example.com',
      RESEND_API_KEY: 're_test_key',
      APP_URL: 'https://app.example.com',
    };
    mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('rejects requests without the CRON_SECRET header with 401 and does not touch the database or send email', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(prisma.task.findMany).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rejects requests with an incorrect secret with 401 and does not send email', async () => {
    const response = await GET(makeRequest({ authorization: 'Bearer wrong-secret' }));

    expect(response.status).toBe(401);
    expect(prisma.task.findMany).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('does not send an email when no task is due soon or overdue', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET(makeRequest({ authorization: 'Bearer test-secret' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ sent: false, count: 0 });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('sends one combined email listing every due-soon/overdue task when the secret is correct', async () => {
    const today = new Date();
    const overdueDate = new Date(today);
    overdueDate.setDate(overdueDate.getDate() - 2);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Overdue task',
        status: 'todo',
        dueDate: overdueDate,
        project: { name: 'Project A' },
      },
      {
        id: 'task-2',
        title: 'Due today task',
        status: 'doing',
        dueDate: today,
        project: { name: 'Project B' },
      },
      {
        id: 'task-3',
        title: 'Already done task',
        status: 'done',
        dueDate: overdueDate,
        project: { name: 'Project A' },
      },
    ]);

    const response = await GET(makeRequest({ authorization: 'Bearer test-secret' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ sent: true, count: 2 });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const emailArgs = mockSend.mock.calls[0][0];
    expect(emailArgs.to).toBe('owner@example.com');
    expect(emailArgs.text).toContain('Overdue task');
    expect(emailArgs.text).toContain('Due today task');
    expect(emailArgs.text).not.toContain('Already done task');
  });
});
