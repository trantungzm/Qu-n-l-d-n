import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { normalizeLabelColor } from '@/lib/label';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const labels = await prisma.label.findMany({
      where: { projectId: params.id },
      orderBy: { name: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });

    // _count.tasks counts every join row regardless of the Task's own
    // archivedAt, so an archived Task still counts toward "N Task" here.
    const labelsWithTaskCount = labels.map(({ _count, ...label }) => ({
      ...label,
      taskCount: _count.tasks,
    }));

    return NextResponse.json(labelsWithTaskCount);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
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

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: normalizeLabelColor(color),
        projectId: params.id,
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Label name already exists in this project' },
        { status: 409 }
      );
    }
    console.error('Error creating label:', error);
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  }
}
