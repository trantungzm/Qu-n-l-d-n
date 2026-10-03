/**
 * These tests hit a real, throwaway SQLite database (see
 * column-cascade.test.ts for why) provisioned by replaying every committed
 * migration.sql file from scratch - this is the only way to prove the new
 * add_archived_at migration (plain ALTER TABLE ADD COLUMN) actually applies
 * cleanly to a brand new database, not just that the Prisma schema compiles.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

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
      // Best-effort cleanup only.
    }
  }
}

describe('archivedAt filtering, restore, and permanent delete (real SQLite)', () => {
  const TEST_DB_PATH = path.join(
    __dirname,
    `.tmp-archived-items-test-${process.pid}-${Date.now()}.db`
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

  it('new Project/Task rows default to archivedAt null (active)', async () => {
    const project = await prisma.project.create({ data: { name: 'Fresh Project' } });
    const task = await prisma.task.create({ data: { title: 'Fresh Task', projectId: project.id } });

    expect(project.archivedAt).toBeNull();
    expect(task.archivedAt).toBeNull();
  });

  it('archiving a Project hides it from the active list but keeps its Task active', async () => {
    const project = await prisma.project.create({ data: { name: 'To Archive' } });
    const task = await prisma.task.create({ data: { title: 'Still open', projectId: project.id } });

    await prisma.project.update({ where: { id: project.id }, data: { archivedAt: new Date() } });

    const activeProjects = await prisma.project.findMany({ where: { archivedAt: null } });
    expect(activeProjects.find((p) => p.id === project.id)).toBeUndefined();

    const archivedProjects = await prisma.project.findMany({ where: { archivedAt: { not: null } } });
    expect(archivedProjects.find((p) => p.id === project.id)).toBeDefined();

    const unchangedTask = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(unchangedTask.archivedAt).toBeNull();
  });

  it('restoring a Project sets archivedAt back to null, reappearing in the active list', async () => {
    const project = await prisma.project.create({
      data: { name: 'Round trip', archivedAt: new Date() },
    });

    expect(
      (await prisma.project.findMany({ where: { archivedAt: null } })).find((p) => p.id === project.id)
    ).toBeUndefined();

    await prisma.project.update({ where: { id: project.id }, data: { archivedAt: null } });

    expect(
      (await prisma.project.findMany({ where: { archivedAt: null } })).find((p) => p.id === project.id)
    ).toBeDefined();
  });

  it('permanently deleting an archived Project removes it and cascades to its Tasks', async () => {
    const project = await prisma.project.create({ data: { name: 'Delete me', archivedAt: new Date() } });
    const task = await prisma.task.create({ data: { title: 'Goes with it', projectId: project.id } });

    await prisma.project.delete({ where: { id: project.id } });

    expect(await prisma.project.findUnique({ where: { id: project.id } })).toBeNull();
    expect(await prisma.task.findUnique({ where: { id: task.id } })).toBeNull();
  });

  it('archiving a Task hides it from the active per-project task list but restoring brings it back', async () => {
    const project = await prisma.project.create({ data: { name: 'Task archive project' } });
    const task = await prisma.task.create({ data: { title: 'Archive me', projectId: project.id } });

    await prisma.task.update({ where: { id: task.id }, data: { archivedAt: new Date() } });

    let activeTasks = await prisma.task.findMany({ where: { projectId: project.id, archivedAt: null } });
    expect(activeTasks).toHaveLength(0);

    await prisma.task.update({ where: { id: task.id }, data: { archivedAt: null } });

    activeTasks = await prisma.task.findMany({ where: { projectId: project.id, archivedAt: null } });
    expect(activeTasks).toHaveLength(1);
  });
});
