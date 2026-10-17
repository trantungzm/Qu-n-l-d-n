import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { normalizeLabelColor } from '@/lib/label';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, color } = body;

    const data: { name?: string; color?: string } = {};

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
      data.color = normalizeLabelColor(color);
    }

    const label = await prisma.label.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(label);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Label name already exists in this project' },
        { status: 409 }
      );
    }
    console.error('Error updating label:', error);
    return NextResponse.json(
      { error: 'Failed to update label' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Deleting a Label automatically removes its rows from the implicit
    // Task<->Label join table (Prisma cascades implicit m2m join tables),
    // so every Task keeps existing and simply loses this Label.
    await prisma.label.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    );
  }
}
