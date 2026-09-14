import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { done, title } = body;

    const data: { done?: boolean; title?: string } = {};

    if (done !== undefined) {
      data.done = Boolean(done);
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

    const subTask = await prisma.subTask.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(subTask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.subTask.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json(
      { error: 'Failed to delete subtask' },
      { status: 500 }
    );
  }
}
