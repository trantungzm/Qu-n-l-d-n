import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { countReminderTasks } from '@/lib/dashboard-stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      select: { dueDate: true, column: { select: { isDoneColumn: true } } },
    });

    const reminderTasks = tasks.map((task) => ({
      isDoneColumn: task.column?.isDoneColumn === true,
      dueDate: task.dueDate,
    }));

    return NextResponse.json({ count: countReminderTasks(reminderTasks) });
  } catch (error) {
    console.error('Error fetching task reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task reminders' },
      { status: 500 }
    );
  }
}
