-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "order" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "dueDate", "id", "priority", "projectId", "status", "title") SELECT "createdAt", "dueDate", "id", "priority", "projectId", "status", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Backfill `order` for existing tasks: rank ascending by createdAt (id as tiebreaker)
-- within each Project + status group, so drag-and-drop starts from a stable order.
UPDATE "Task"
SET "order" = (
    SELECT COUNT(*)
    FROM "Task" AS "t2"
    WHERE "t2"."projectId" = "Task"."projectId"
      AND "t2"."status" = "Task"."status"
      AND (
        "t2"."createdAt" < "Task"."createdAt"
        OR ("t2"."createdAt" = "Task"."createdAt" AND "t2"."id" < "Task"."id")
      )
);
