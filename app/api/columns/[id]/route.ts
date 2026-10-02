import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeColumnColor, reorderColumn } from '@/lib/column';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, color, isDoneColumn, direction } = body;

    if (direction !== undefined) {
      if (direction !== 'left' && direction !== 'right') {
        return NextResponse.json(
          { error: 'direction must be "left" or "right"' },
          { status: 400 }
        );
      }

      const current = await prisma.column.findUnique({
        where: { id: params.id },
        select: { projectId: true },
      });
      if (!current) {
        return NextResponse.json({ error: 'Column not found' }, { status: 404 });
      }

      const siblings = await prisma.column.findMany({
        where: { projectId: current.projectId },
        select: { id: true, order: true },
      });

      const updates = reorderColumn(siblings, params.id, direction);
      if (updates.length > 0) {
        await prisma.$transaction(
          updates.map((update) =>
            prisma.column.update({ where: { id: update.id }, data: { order: update.order } })
          )
        );
      }

      const column = await prisma.column.findUnique({ where: { id: params.id } });
      return NextResponse.json(column);
    }

    if (isDoneColumn === true) {
      const current = await prisma.column.findUnique({
        where: { id: params.id },
        select: { projectId: true },
      });
      if (!current) {
        return NextResponse.json({ error: 'Column not found' }, { status: 404 });
      }

      const [, column] = await prisma.$transaction([
        prisma.column.updateMany({
          where: { projectId: current.projectId, id: { not: params.id } },
          data: { isDoneColumn: false },
        }),
        prisma.column.update({
          where: { id: params.id },
          data: { isDoneColumn: true },
        }),
      ]);

      return NextResponse.json(column);
    }

    const data: { name?: string; color?: string; isDoneColumn?: boolean } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }
      data.name = name.trim();
    }

    if (color !== undefined) {
      data.color = normalizeColumnColor(color);
    }

    if (isDoneColumn === false) {
      data.isDoneColumn = false;
    }

    const column = await prisma.column.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(column);
  } catch (error) {
    console.error('Error updating column:', error);
    return NextResponse.json(
      { error: 'Failed to update column' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Deleting a Column cascades (DB-level, see Task.column's onDelete:
    // Cascade in schema.prisma) to every Task that was inside it.
    await prisma.column.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting column:', error);
    return NextResponse.json(
      { error: 'Failed to delete column' },
      { status: 500 }
    );
  }
}
