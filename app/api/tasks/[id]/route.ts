import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { legacyDoneToStatus, normalizeTaskStatus } from '@/lib/task-status';
import { normalizeTaskPriority } from '@/lib/task-priority';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, done, title, dueDate, priority } = body;

    const data: {
      status?: string;
      title?: string;
      dueDate?: Date | null;
      priority?: string;
    } = {};

    if (status !== undefined || done !== undefined) {
      data.status = status
        ? normalizeTaskStatus(status)
        : legacyDoneToStatus(Boolean(done));
    }

    if (priority !== undefined) {
      data.priority = normalizeTaskPriority(priority);
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }
      data.title = title.trim();
    }

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        data.dueDate = null;
      } else {
        const candidate = new Date(dueDate);
        if (Number.isNaN(candidate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid due date' },
            { status: 400 }
          );
        }
        data.dueDate = candidate;
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
