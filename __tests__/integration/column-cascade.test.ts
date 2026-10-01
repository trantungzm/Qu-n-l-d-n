/**
 * These tests hit a real, throwaway SQLite database instead of a mocked
 * Prisma client, because cascade-delete behavior and the Column backfill
 * migration are enforced/performed at the database layer — a mock cannot
 * prove either actually works.
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
      // Best-effort cleanup only; the filename is unique per run, so a
      // leftover file here can never corrupt a future test run.
    }
  }
}

describe('Column cascade delete (real SQLite)', () => {
  const TEST_DB_PATH = path.join(
    __dirname,
    `.tmp-column-cascade-test-${process.pid}-${Date.now()}.db`
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

  it('deletes every Column belonging to a Project when that Project is deleted', async () => {
    const project = await prisma.project.create({ data: { name: 'Cascade Test Project' } });
    const column = await prisma.column.create({
      data: { name: 'Todo', color: 'blue', projectId: project.id },
    });

    await prisma.project.delete({ where: { id: project.id } });

    const found = await prisma.column.findUnique({ where: { id: column.id } });
    expect(found).toBeNull();
  });

  it('deletes every Task inside a Column when that Column is deleted', async () => {
    const project = await prisma.project.create({ data: { name: 'Column Delete Project' } });
    const column = await prisma.column.create({
      data: { name: 'Doing', color: 'amber', projectId: project.id },
    });
    const otherColumn = await prisma.column.create({
      data: { name: 'Done', color: 'emerald', projectId: project.id },
    });
    const taskInColumn = await prisma.task.create({
      data: { title: 'Inside the deleted column', projectId: project.id, columnId: column.id },
    });
    const taskInOtherColumn = await prisma.task.create({
      data: { title: 'Inside a different column', projectId: project.id, columnId: otherColumn.id },
    });

    await prisma.column.delete({ where: { id: column.id } });

    const [foundDeleted, foundOther] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskInColumn.id } }),
      prisma.task.findUnique({ where: { id: taskInOtherColumn.id } }),
    ]);

    expect(foundDeleted).toBeNull();
    expect(foundOther).not.toBeNull();
  });
});

describe('Column backfill migration (real SQLite)', () => {
  const TEST_DB_PATH = path.join(
    __dirname,
    `.tmp-column-backfill-test-${process.pid}-${Date.now()}.db`
  );

  afterAll(() => {
    removeDbFiles(TEST_DB_PATH);
  });

  it('creates 3 default Columns per existing Project and assigns columnId by status', () => {
    removeDbFiles(TEST_DB_PATH);
    const dirs = sortedMigrationDirs();
    const backfillMigrationDir = dirs.find((dir) => dir.endsWith('_add_column_model'));
    if (!backfillMigrationDir) {
      throw new Error('add_column_model migration not found');
    }
    const priorDirs = dirs.filter((dir) => dir !== backfillMigrationDir);

    const db = new Database(TEST_DB_PATH);
    for (const dir of priorDirs) applyMigrationSql(db, dir);

    // Seed "old" data as it would have existed right before this migration ran.
    db.prepare('INSERT INTO "Project" ("id", "name") VALUES (?, ?)').run('proj-1', 'Old Project');
    const insertTask = db.prepare(
      'INSERT INTO "Task" ("id", "title", "status", "projectId") VALUES (?, ?, ?, ?)'
    );
    insertTask.run('task-todo', 'A todo task', 'todo', 'proj-1');
    insertTask.run('task-doing', 'A doing task', 'doing', 'proj-1');
    insertTask.run('task-done', 'A done task', 'done', 'proj-1');

    applyMigrationSql(db, backfillMigrationDir);

    const columns = db
      .prepare('SELECT "id", "name", "isDoneColumn" FROM "Column" WHERE "projectId" = ? ORDER BY "order" ASC')
      .all('proj-1') as { id: string; name: string; isDoneColumn: number }[];

    expect(columns.map((c) => c.name)).toEqual(['Todo', 'Doing', 'Done']);
    expect(columns.map((c) => c.isDoneColumn)).toEqual([0, 0, 1]);

    const columnIdByName = new Map(columns.map((c) => [c.name, c.id]));

    const tasks = db
      .prepare('SELECT "id", "status", "columnId" FROM "Task" WHERE "projectId" = ?')
      .all('proj-1') as { id: string; status: string; columnId: string | null }[];
    const columnIdByTaskId = new Map(tasks.map((t) => [t.id, t.columnId]));

    expect(columnIdByTaskId.get('task-todo')).toBe(columnIdByName.get('Todo'));
    expect(columnIdByTaskId.get('task-doing')).toBe(columnIdByName.get('Doing'));
    expect(columnIdByTaskId.get('task-done')).toBe(columnIdByName.get('Done'));

    db.close();
  });
});
