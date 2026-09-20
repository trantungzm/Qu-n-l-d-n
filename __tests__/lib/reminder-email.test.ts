import { buildReminderEmailContent, type ReminderEmailTask } from '@/lib/reminder-email';

function makeTask(overrides: Partial<ReminderEmailTask> = {}): ReminderEmailTask {
  return {
    id: 'task-1',
    title: 'Viết báo cáo',
    projectName: 'Dự án A',
    dueDate: '2026-09-20',
    ...overrides,
  };
}

describe('buildReminderEmailContent', () => {
  it('returns null when there are no reminder tasks', () => {
    expect(buildReminderEmailContent([], 'https://app.example.com')).toBeNull();
  });

  it('builds subject/text/html listing every task, project name and due date', () => {
    const tasks = [
      makeTask({ id: '1', title: 'Viết báo cáo', projectName: 'Dự án A', dueDate: '2026-09-20' }),
      makeTask({ id: '2', title: 'Họp khách hàng', projectName: 'Dự án B', dueDate: '2026-09-18' }),
    ];

    const content = buildReminderEmailContent(tasks, 'https://app.example.com');

    expect(content).not.toBeNull();
    expect(content!.subject).toContain('2');
    expect(content!.text).toContain('Viết báo cáo');
    expect(content!.text).toContain('Dự án A');
    expect(content!.text).toContain('20/09');
    expect(content!.text).toContain('https://app.example.com/dashboard');
    expect(content!.html).toContain('Viết báo cáo');
    expect(content!.html).toContain('Dự án B');
    expect(content!.html).toContain('18/09');
    expect(content!.html).toContain('href="https://app.example.com/dashboard"');
  });

  it('escapes HTML special characters in task title and project name', () => {
    const tasks = [makeTask({ title: '<script>alert(1)</script>', projectName: 'A & B' })];

    const content = buildReminderEmailContent(tasks, 'https://app.example.com');

    expect(content!.html).not.toContain('<script>alert(1)</script>');
    expect(content!.html).toContain('&lt;script&gt;');
    expect(content!.html).toContain('A &amp; B');
  });

  it('normalizes a trailing slash on the app URL', () => {
    const content = buildReminderEmailContent([makeTask()], 'https://app.example.com/');
    expect(content!.text).toContain('https://app.example.com/dashboard');
    expect(content!.text).not.toContain('//dashboard');
  });
});
