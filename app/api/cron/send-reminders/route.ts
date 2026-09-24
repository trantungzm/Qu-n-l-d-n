import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { isTaskOverdue, isTaskDueSoon } from '@/lib/task-due-date';
import { buildReminderEmailContent, type ReminderEmailTask } from '@/lib/reminder-email';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: {
        status: { not: 'done' },
        dueDate: { not: null },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        project: { select: { name: true } },
      },
    });

    const now = new Date();
    const reminderTasks: ReminderEmailTask[] = tasks
      .filter((task) => isTaskOverdue(task.dueDate, task.status, now) || isTaskDueSoon(task.dueDate, task.status, now))
      .map((task) => ({
        id: task.id,
        title: task.title,
        projectName: task.project.name,
        dueDate: task.dueDate as Date,
      }));

    const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? '';
    const emailContent = buildReminderEmailContent(reminderTasks, appUrl);

    if (!emailContent) {
      return NextResponse.json({ sent: false, count: 0 });
    }

    const toEmail = process.env.AUTH_ALLOWED_EMAIL;
    if (!toEmail) {
      console.error('AUTH_ALLOWED_EMAIL is not configured, skipping reminder email');
      return NextResponse.json({ error: 'AUTH_ALLOWED_EMAIL is not configured' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.REMINDER_EMAIL_FROM ?? 'onboarding@resend.dev',
      to: toEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({ sent: true, count: reminderTasks.length });
  } catch (error) {
    console.error('Error sending task reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
