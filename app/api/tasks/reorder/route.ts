import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeTaskStatus } from '@/lib/task-status';

interface ReorderUpdate {
  id: string;
  status: string;
  order: number;
}

function isValidUpdate(value: unknown): value is ReorderUpdate {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ReorderUpdate).id === 'string' &&
    typeof (value as ReorderUpdate).status === 'string' &&
    typeof (value as ReorderUpdate).order === 'number' &&
    Number.isFinite((value as ReorderUpdate).order)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updates = body?.updates;

    if (!Array.isArray(updates) || updates.length === 0 || !updates.every(isValidUpdate)) {
      return NextResponse.json(
        { error: 'updates must be a non-empty array of { id, status, order }' },
        { status: 400 }
      );
    }

    const tasks = await prisma.$transaction(
      updates.map((update: ReorderUpdate) =>
        prisma.task.update({
          where: { id: update.id },
          data: {
            status: normalizeTaskStatus(update.status),
            order: update.order,
          },
        })
      )
    );

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder tasks' },
      { status: 500 }
    );
  }
}
