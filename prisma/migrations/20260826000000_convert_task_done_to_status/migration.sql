-- AlterTable
ALTER TABLE "Task" RENAME COLUMN "done" TO "status";

-- Update legacy values
UPDATE "Task"
SET "status" = CASE
  WHEN "status" = 1 THEN 'done'
  ELSE 'todo'
END;

-- Update schema constraints to match string status
UPDATE "Task"
SET "status" = 'todo'
WHERE "status" NOT IN ('todo', 'doing', 'done');

-- SQLite cannot easily alter column type, so recreate table with proper type and data
CREATE TABLE "Task_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_new_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Task_new" ("id", "title", "status", "projectId", "createdAt")
SELECT "id", "title", "status", "projectId", "createdAt"
FROM "Task";

DROP TABLE "Task";
ALTER TABLE "Task_new" RENAME TO "Task";
