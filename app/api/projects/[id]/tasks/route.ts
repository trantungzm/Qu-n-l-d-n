import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeTaskPriority } from '@/lib/task-priority';
import { normalizeTaskType } from '@/lib/task-type';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: params.id, archivedAt: null },
      orderBy: { order: 'asc' },
      include: { subTasks: { orderBy: { createdAt: 'asc' } } },
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
    const { title, columnId, dueDate, priority, type } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    let parsedDueDate: Date | null = null;
    if (dueDate) {
      const candidate = new Date(dueDate);
      if (Number.isNaN(candidate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid due date' },
          { status: 400 }
        );
      }
      parsedDueDate = candidate;
    }

    const targetColumn = columnId
      ? await prisma.column.findUnique({ where: { id: columnId }, select: { id: true } })
      : await prisma.column.findFirst({
          where: { projectId: params.id },
          orderBy: { order: 'asc' },
          select: { id: true },
        });

    const topTask = targetColumn
      ? await prisma.task.findFirst({
          where: { projectId: params.id, columnId: targetColumn.id },
          orderBy: { order: 'asc' },
          select: { order: true },
        })
      : null;
    const order = topTask ? topTask.order - 1 : 0;

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        projectId: params.id,
        columnId: targetColumn?.id ?? null,
        priority: normalizeTaskPriority(priority),
        type: normalizeTaskType(type),
        dueDate: parsedDueDate,
        order,
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
