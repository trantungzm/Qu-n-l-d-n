import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeColumnColor, nextColumnOrder } from '@/lib/column';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const columns = await prisma.column.findMany({
      where: { projectId: params.id },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(columns);
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch columns' },
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
    const { name, color } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const existingColumns = await prisma.column.findMany({
      where: { projectId: params.id },
      select: { order: true },
    });

    const column = await prisma.column.create({
      data: {
        name: name.trim(),
        color: normalizeColumnColor(color),
        order: nextColumnOrder(existingColumns),
        projectId: params.id,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json(
      { error: 'Failed to create column' },
      { status: 500 }
    );
  }
}
