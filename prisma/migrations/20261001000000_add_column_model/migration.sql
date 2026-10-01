-- CreateTable
CREATE TABLE "Column" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDoneColumn" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Column_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill: give every existing Project the 3 default columns (Todo/Doing/Done)
INSERT INTO "Column" ("id", "name", "color", "order", "isDoneColumn", "projectId")
SELECT lower(hex(randomblob(16))), 'Todo', 'blue', 0, false, "id" FROM "Project";

INSERT INTO "Column" ("id", "name", "color", "order", "isDoneColumn", "projectId")
SELECT lower(hex(randomblob(16))), 'Doing', 'amber', 1, false, "id" FROM "Project";

INSERT INTO "Column" ("id", "name", "color", "order", "isDoneColumn", "projectId")
SELECT lower(hex(randomblob(16))), 'Done', 'emerald', 2, true, "id" FROM "Project";

-- RedefineTables: add Task.columnId and backfill it from each Task's current status.
-- SQLite cannot ALTER a column into an FK target reliably across engines, so the
-- table is recreated the same way prior migrations in this project have done it.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "type" TEXT NOT NULL DEFAULT 'feature',
    "order" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "columnId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("id", "title", "status", "priority", "type", "order", "dueDate", "columnId", "projectId", "createdAt")
SELECT
  "id", "title", "status", "priority", "type", "order", "dueDate",
  (
    SELECT "c"."id" FROM "Column" "c"
    WHERE "c"."projectId" = "Task"."projectId"
      AND "c"."name" = (
        CASE "Task"."status"
          WHEN 'todo' THEN 'Todo'
          WHEN 'doing' THEN 'Doing'
          WHEN 'done' THEN 'Done'
          ELSE 'Todo'
        END
      )
  ),
  "projectId", "createdAt"
FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Column_projectId_order_idx" ON "Column"("projectId", "order");

-- CreateIndex
CREATE INDEX "Task_columnId_idx" ON "Task"("columnId");
