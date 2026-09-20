import { formatDueDate } from './task-due-date';

export interface ReminderEmailTask {
  id: string;
  title: string;
  projectName: string;
  dueDate: string | Date;
}

export interface ReminderEmailContent {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildReminderEmailContent(
  tasks: ReminderEmailTask[],
  appUrl: string
): ReminderEmailContent | null {
  if (tasks.length === 0) return null;

  const dashboardUrl = `${appUrl.replace(/\/$/, '')}/dashboard`;
  const subject = `Nhắc hạn: ${tasks.length} công việc sắp đến hạn hoặc đã quá hạn`;

  const text = [
    `Bạn có ${tasks.length} công việc sắp đến hạn hoặc đã quá hạn:`,
    '',
    ...tasks.map(
      (task) => `- ${task.title} (${task.projectName}) — hạn ${formatDueDate(task.dueDate)}`
    ),
    '',
    `Xem chi tiết: ${dashboardUrl}`,
  ].join('\n');

  const html = `
    <p>Bạn có <strong>${tasks.length}</strong> công việc sắp đến hạn hoặc đã quá hạn:</p>
    <ul>
      ${tasks
        .map(
          (task) =>
            `<li><strong>${escapeHtml(task.title)}</strong> (${escapeHtml(task.projectName)}) — hạn ${formatDueDate(task.dueDate)}</li>`
        )
        .join('\n      ')}
    </ul>
    <p><a href="${dashboardUrl}">Xem chi tiết trên Dashboard</a></p>
  `.trim();

  return { subject, html, text };
}
