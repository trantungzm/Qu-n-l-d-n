import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeTaskStatus } from '@/lib/task-status';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, status, dueDate } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    let parsedDueDate: Date | null = null;
    if (typeof dueDate === 'string' && dueDate.trim()) {
      const candidate = new Date(dueDate);
      if (Number.isNaN(candidate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid due date' },
          { status: 400 }
        );
      }
      parsedDueDate = candidate;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        projectId: params.id,
        status: normalizeTaskStatus(status),
        dueDate: parsedDueDate,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
