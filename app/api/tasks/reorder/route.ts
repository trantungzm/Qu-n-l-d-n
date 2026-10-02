import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ReorderUpdate {
  id: string;
  columnId: string;
  order: number;
}

function isValidUpdate(value: unknown): value is ReorderUpdate {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ReorderUpdate).id === 'string' &&
    typeof (value as ReorderUpdate).columnId === 'string' &&
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
        { error: 'updates must be a non-empty array of { id, columnId, order }' },
        { status: 400 }
      );
    }

    const columnIds = Array.from(new Set(updates.map((update: ReorderUpdate) => update.columnId)));
    const columns = await prisma.column.findMany({
      where: { id: { in: columnIds } },
      select: { id: true, isDoneColumn: true },
    });
    const isDoneColumnById = new Map(columns.map((column) => [column.id, column.isDoneColumn]));

    const tasks = await prisma.$transaction(
      updates.map((update: ReorderUpdate) =>
        prisma.task.update({
          where: { id: update.id },
          data: {
            columnId: update.columnId,
            order: update.order,
            status: isDoneColumnById.get(update.columnId) ? 'done' : 'todo',
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
