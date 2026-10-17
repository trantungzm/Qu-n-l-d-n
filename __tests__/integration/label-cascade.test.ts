/**
 * These tests hit a real, throwaway SQLite database instead of a mocked
 * Prisma client, because cascade-delete behavior is enforced by the
 * database's foreign keys — a mock cannot prove it actually works.
 *
 * Schema is provisioned by replaying the already-committed migration.sql
 * files with a plain SQLite driver (better-sqlite3), NOT via `prisma db
 * push`/`migrate` — those are schema-sync commands and must never run
 * unattended against any database, dev or otherwise.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'prisma', 'migrations');
// Unique per run so a file still locked by a previous (possibly crashed) test
// process on Windows never blocks this run from creating its own database.
const TEST_DB_PATH = path.join(__dirname, `.tmp-label-cascade-test-${process.pid}-${Date.now()}.db`);

let prisma: PrismaClient;

function removeTestDbFiles() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const file = `${TEST_DB_PATH}${suffix}`;
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {
      // Best-effort cleanup only; the filename is unique per run, so a
      // leftover file here can never corrupt a future test run.
    }
  }
}

function applyMigrations() {
  const db = new Database(TEST_DB_PATH);
  const migrationDirs = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => fs.statSync(path.join(MIGRATIONS_DIR, name)).isDirectory())
    .sort();

  for (const dir of migrationDirs) {
    const sqlPath = path.join(MIGRATIONS_DIR, dir, 'migration.sql');
    if (!fs.existsSync(sqlPath)) continue;
    db.exec(fs.readFileSync(sqlPath, 'utf8'));
  }

  db.close();
}

beforeAll(() => {
  removeTestDbFiles();
  applyMigrations();

  const adapter = new PrismaLibSql({ url: `file:${TEST_DB_PATH}` });
  prisma = new PrismaClient({ adapter });
});

afterAll(async () => {
  await prisma.$disconnect();
  removeTestDbFiles();
});

describe('Label cascade delete (real SQLite)', () => {
  it('deletes every Label belonging to a Project when that Project is deleted', async () => {
    const project = await prisma.project.create({ data: { name: 'Cascade Test Project' } });
    const label = await prisma.label.create({
      data: { name: 'Q4-2026', color: 'blue', projectId: project.id },
    });

    await prisma.project.delete({ where: { id: project.id } });

    const found = await prisma.label.findUnique({ where: { id: label.id } });
    expect(found).toBeNull();
  });

  it('removes the Task<->Label association but keeps the Task when the Label is deleted', async () => {
    const project = await prisma.project.create({ data: { name: 'Detach Test Project' } });
    const task = await prisma.task.create({ data: { title: 'Task A', projectId: project.id } });
    const label = await prisma.label.create({
      data: { name: 'Cần review', color: 'red', projectId: project.id },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { labels: { connect: [{ id: label.id }] } },
    });

    await prisma.label.delete({ where: { id: label.id } });

    const refetchedTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: { labels: true },
    });

    expect(refetchedTask).not.toBeNull();
    expect(refetchedTask!.labels).toEqual([]);
  });

  it('keeps a Label attached to other Tasks when it is removed from just one Task', async () => {
    const project = await prisma.project.create({ data: { name: 'Multi Task Label Project' } });
    const [taskA, taskB] = await Promise.all([
      prisma.task.create({ data: { title: 'Task A', projectId: project.id } }),
      prisma.task.create({ data: { title: 'Task B', projectId: project.id } }),
    ]);
    const label = await prisma.label.create({
      data: { name: 'Khách hàng A', color: 'purple', projectId: project.id },
    });

    await prisma.task.update({
      where: { id: taskA.id },
      data: { labels: { connect: [{ id: label.id }] } },
    });
    await prisma.task.update({
      where: { id: taskB.id },
      data: { labels: { connect: [{ id: label.id }] } },
    });

    // Detach from Task A only, by setting its label set to empty.
    await prisma.task.update({
      where: { id: taskA.id },
      data: { labels: { set: [] } },
    });

    const [refetchedA, refetchedB] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskA.id }, include: { labels: true } }),
      prisma.task.findUnique({ where: { id: taskB.id }, include: { labels: true } }),
    ]);

    expect(refetchedA!.labels).toEqual([]);
    expect(refetchedB!.labels.map((l) => l.id)).toEqual([label.id]);
  });

  it('deleting a Label attached to multiple Tasks (including an archived one) keeps every Task and only removes the Label', async () => {
    const project = await prisma.project.create({ data: { name: 'Multi Task Delete Project' } });
    const [taskOpen, taskOpen2, taskArchived] = await Promise.all([
      prisma.task.create({ data: { title: 'Open task 1', projectId: project.id } }),
      prisma.task.create({ data: { title: 'Open task 2', projectId: project.id } }),
      prisma.task.create({ data: { title: 'Archived task', projectId: project.id, archivedAt: new Date() } }),
    ]);
    const label = await prisma.label.create({
      data: { name: 'Nhiều task', color: 'teal', projectId: project.id },
    });

    await Promise.all(
      [taskOpen, taskOpen2, taskArchived].map((task) =>
        prisma.task.update({
          where: { id: task.id },
          data: { labels: { connect: [{ id: label.id }] } },
        })
      )
    );

    // Sanity check: _count counts the archived Task's join row too, matching
    // what the "N Task" confirm-dialog count must show.
    const beforeDelete = await prisma.label.findUniqueOrThrow({
      where: { id: label.id },
      include: { _count: { select: { tasks: true } } },
    });
    expect(beforeDelete._count.tasks).toBe(3);

    await prisma.label.delete({ where: { id: label.id } });

    const [refetchedOpen, refetchedOpen2, refetchedArchived] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskOpen.id }, include: { labels: true } }),
      prisma.task.findUnique({ where: { id: taskOpen2.id }, include: { labels: true } }),
      prisma.task.findUnique({ where: { id: taskArchived.id }, include: { labels: true } }),
    ]);

    // All three Tasks survive, including the archived one - deleting a Label
    // never deletes a Task, archived or not.
    expect(refetchedOpen).not.toBeNull();
    expect(refetchedOpen2).not.toBeNull();
    expect(refetchedArchived).not.toBeNull();
    expect(refetchedArchived!.archivedAt).not.toBeNull();

    expect(refetchedOpen!.labels).toEqual([]);
    expect(refetchedOpen2!.labels).toEqual([]);
    expect(refetchedArchived!.labels).toEqual([]);

    const labelGone = await prisma.label.findUnique({ where: { id: label.id } });
    expect(labelGone).toBeNull();
  });
});
