import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Uses the real local SQLite dev database (never Turso) to verify that the
// ON DELETE CASCADE foreign key on SubTask.taskId actually works at the
// database level — this can't be proven with a mocked Prisma client.
const adapter = new PrismaLibSql({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

describe('SubTask cascade delete (real SQLite)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deletes subtasks automatically when the parent task is deleted', async () => {
    const project = await prisma.project.create({
      data: { name: 'Cascade test project' },
    });
    const task = await prisma.task.create({
      data: { title: 'Cascade test task', projectId: project.id },
    });
    const subTask = await prisma.subTask.create({
      data: { title: 'Cascade test subtask', taskId: task.id },
    });

    await prisma.task.delete({ where: { id: task.id } });

    const foundSubTask = await prisma.subTask.findUnique({ where: { id: subTask.id } });
    expect(foundSubTask).toBeNull();

    await prisma.project.delete({ where: { id: project.id } });
  });
});
