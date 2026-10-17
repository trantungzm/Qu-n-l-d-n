import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { legacyDoneToStatus, normalizeTaskStatus } from '@/lib/task-status';
import { normalizeTaskPriority } from '@/lib/task-priority';
import { normalizeTaskType } from '@/lib/task-type';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, done, title, dueDate, priority, type, labelIds } = body;

    const data: Prisma.TaskUpdateInput = {};

    if (status !== undefined || done !== undefined) {
      data.status = status
        ? normalizeTaskStatus(status)
        : legacyDoneToStatus(Boolean(done));
    }

    if (priority !== undefined) {
      data.priority = normalizeTaskPriority(priority);
    }

    if (type !== undefined) {
      data.type = normalizeTaskType(type);
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

    if (labelIds !== undefined) {
      if (!Array.isArray(labelIds) || !labelIds.every((id) => typeof id === 'string')) {
        return NextResponse.json(
          { error: 'labelIds must be an array of strings' },
          { status: 400 }
        );
      }
      // Replace the Task's full label set in one go, matching the edit dialog's
      // multi-select which always submits the complete desired selection.
      data.labels = { set: labelIds.map((id: string) => ({ id })) };
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: { labels: true },
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
