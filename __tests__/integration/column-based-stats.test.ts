/**
 * These tests hit a real, throwaway SQLite database (see
 * column-cascade.test.ts for why) and run the same Prisma `select`/`include`
 * shape the API routes use, to prove Column.isDoneColumn - not Task.status -
 * actually drives dashboard/progress/reminder results end to end, including
 * the case of a project-defined column that isn't named Todo/Doing/Done.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { getProjectProgress, countOverdueTasks, countReminderTasks } from '@/lib/dashboard-stats';

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'prisma', 'migrations');

function sortedMigrationDirs() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => fs.statSync(path.join(MIGRATIONS_DIR, name)).isDirectory())
    .sort();
}

function applyMigrationSql(db: Database.Database, dir: string) {
  const sqlPath = path.join(MIGRATIONS_DIR, dir, 'migration.sql');
  if (!fs.existsSync(sqlPath)) return;
  db.exec(fs.readFileSync(sqlPath, 'utf8'));
}

function removeDbFiles(dbPath: string) {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const file = `${dbPath}${suffix}`;
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {
      // Best-effort cleanup only; the filename is unique per run.
    }
  }
}

async function loadTasksWithDoneFlag(prisma: PrismaClient, projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { id: true, dueDate: true, priority: true, column: { select: { isDoneColumn: true } } },
  });
  return tasks.map((task) => ({
    ...task,
    isDoneColumn: task.column?.isDoneColumn === true,
  }));
}

describe('Column.isDoneColumn drives dashboard/progress/reminder stats (real SQLite)', () => {
  const TEST_DB_PATH = path.join(
    __dirname,
    `.tmp-column-based-stats-test-${process.pid}-${Date.now()}.db`
  );
  let prisma: PrismaClient;

  beforeAll(() => {
    removeDbFiles(TEST_DB_PATH);
    const db = new Database(TEST_DB_PATH);
    for (const dir of sortedMigrationDirs()) applyMigrationSql(db, dir);
    db.close();

    const adapter = new PrismaLibSql({ url: `file:${TEST_DB_PATH}` });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    removeDbFiles(TEST_DB_PATH);
  });

  it('treats a task in a custom non-done column ("Review") as open, including for overdue counting', async () => {
    const project = await prisma.project.create({ data: { name: 'Phase 3 Project' } });
    const reviewColumn = await prisma.column.create({
      data: { name: 'Review', color: 'purple', isDoneColumn: false, projectId: project.id },
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.task.create({
      data: {
        title: 'In review, overdue',
        projectId: project.id,
        columnId: reviewColumn.id,
        dueDate: yesterday,
      },
    });

    const tasks = await loadTasksWithDoneFlag(prisma, project.id);

    expect(getProjectProgress(tasks)).toEqual({ done: 0, total: 1, percent: 0 });
    expect(countOverdueTasks(tasks)).toBe(1);
    expect(countReminderTasks(tasks)).toBe(1);
  });

  it('treats a task as done once it sits in whichever column is currently flagged isDoneColumn, even if renamed/not called "Done"', async () => {
    const project = await prisma.project.create({ data: { name: 'Custom Done Column Project' } });
    const shippedColumn = await prisma.column.create({
      data: { name: 'Shipped', color: 'emerald', isDoneColumn: false, projectId: project.id },
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const task = await prisma.task.create({
      data: {
        title: 'Overdue but about to be shipped',
        projectId: project.id,
        columnId: shippedColumn.id,
        dueDate: yesterday,
      },
    });

    // Before "Shipped" is marked as the done column: open + overdue.
    let tasks = await loadTasksWithDoneFlag(prisma, project.id);
    expect(getProjectProgress(tasks)).toEqual({ done: 0, total: 1, percent: 0 });
    expect(countOverdueTasks(tasks)).toBe(1);

    // Mark "Shipped" as the project's done column (mirrors ColumnMenu's PATCH).
    await prisma.column.update({ where: { id: shippedColumn.id }, data: { isDoneColumn: true } });

    // No write to Task/task.status happened - moving/flagging the column is enough.
    const unchangedTask = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(unchangedTask.status).toBe('todo');

    tasks = await loadTasksWithDoneFlag(prisma, project.id);
    expect(getProjectProgress(tasks)).toEqual({ done: 1, total: 1, percent: 100 });
    expect(countOverdueTasks(tasks)).toBe(0);
    expect(countReminderTasks(tasks)).toBe(0);
  });
});
