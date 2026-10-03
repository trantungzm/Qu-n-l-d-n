import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { archivedAt: { not: null } },
      orderBy: { archivedAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching archived tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived tasks' },
      { status: 500 }
    );
  }
}
