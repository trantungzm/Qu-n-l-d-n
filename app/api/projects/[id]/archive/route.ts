import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { archived } = body;

    if (typeof archived !== 'boolean') {
      return NextResponse.json(
        { error: 'archived must be a boolean' },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: { archivedAt: archived ? new Date() : null },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project archive status:', error);
    return NextResponse.json(
      { error: 'Failed to update archive status' },
      { status: 500 }
    );
  }
}
