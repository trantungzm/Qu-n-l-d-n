import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { legacyDoneToStatus, normalizeTaskStatus } from '@/lib/task-status';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, done } = body;
    const nextStatus = status
      ? normalizeTaskStatus(status)
      : done !== undefined
        ? legacyDoneToStatus(Boolean(done))
        : 'todo';

    const task = await prisma.task.update({
      where: { id: params.id },
      data: { status: nextStatus },
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
