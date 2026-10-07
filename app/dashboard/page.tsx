import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, ListChecks } from 'lucide-react';
import {
  countTasksByDoneStatus,
  countOverdueTasks,
  countOpenTasksByPriority,
  getUpcomingTasks,
  type DashboardTask,
  type DoneStatusCounts,
} from '@/lib/dashboard-stats';
import { PRIORITY_LABELS, PRIORITY_BADGE_CLASSES } from '@/lib/task-priority';
import { formatDueDate } from '@/lib/task-due-date';

export const dynamic = 'force-dynamic';

const DONE_STATUS_ORDER = ['done', 'open'] as const;

const DONE_STATUS_LABELS: Record<(typeof DONE_STATUS_ORDER)[number], string> = {
  done: 'Đã hoàn thành',
  open: 'Đang mở',
};

const DONE_STATUS_COLORS: Record<(typeof DONE_STATUS_ORDER)[number], string> = {
  done: '#22c55e',
  open: '#94a3b8',
};

const PRIORITY_ORDER = ['high', 'medium', 'low'] as const;

async function getDashboardTasks(): Promise<DashboardTask[]> {
  const tasks = await prisma.task.findMany({
    where: { archivedAt: null, project: { archivedAt: null } },
    select: {
      id: true,
      title: true,
      priority: true,
      dueDate: true,
      projectId: true,
      project: { select: { name: true } },
      column: { select: { isDoneColumn: true } },
    },
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    isDoneColumn: task.column?.isDoneColumn === true,
    priority: task.priority,
    dueDate: task.dueDate,
    projectId: task.projectId,
    projectName: task.project.name,
  }));
}

function buildDoneConicGradient(doneCounts: DoneStatusCounts): string {
  const total = doneCounts.done + doneCounts.open;
  if (total === 0) return '#9ca3af';

  let cursor = 0;
  const segments: string[] = [];
  for (const key of DONE_STATUS_ORDER) {
    const count = doneCounts[key];
    if (count === 0) continue;
    const start = (cursor / total) * 360;
    cursor += count;
    const end = (cursor / total) * 360;
    segments.push(`${DONE_STATUS_COLORS[key]} ${start}deg ${end}deg`);
  }
  return `conic-gradient(${segments.join(', ')})`;
}

export default async function DashboardPage() {
  const tasks = await getDashboardTasks();

  const doneCounts = countTasksByDoneStatus(tasks);
  const overdueCount = countOverdueTasks(tasks);
  const priorityCounts = countOpenTasksByPriority(tasks);
  const upcomingTasks = getUpcomingTasks(tasks);

  const totalTasks = doneCounts.done + doneCounts.open;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Tổng quan</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Thống kê Task trên tất cả dự án</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Về trang dự án
          </Link>
        </div>

        <Card
          className={
            overdueCount > 0
              ? 'border-red-400 bg-red-50 mb-6 dark:border-red-700 dark:bg-red-950'
              : 'mb-6'
          }
        >
          <CardContent className="flex items-center gap-4 py-6">
            <div
              className={
                overdueCount > 0
                  ? 'flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                  : 'flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }
            >
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <p
                className={
                  overdueCount > 0
                    ? 'text-3xl font-bold text-red-600 dark:text-red-400'
                    : 'text-3xl font-bold text-gray-700 dark:text-gray-300'
                }
              >
                {overdueCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Task quá hạn (chưa hoàn thành)</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Task theo tiến độ</CardTitle>
              <CardDescription>Tổng {totalTasks} task trên tất cả dự án</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div
                className="h-32 w-32 shrink-0 rounded-full"
                style={{ background: buildDoneConicGradient(doneCounts) }}
                aria-hidden="true"
              />
              <ul className="space-y-2 flex-1">
                {DONE_STATUS_ORDER.map((key) => (
                  <li key={key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: DONE_STATUS_COLORS[key] }} />
                      {DONE_STATUS_LABELS[key]}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{doneCounts[key]}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task đang mở theo độ ưu tiên</CardTitle>
              <CardDescription>Không tính task đã Done</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PRIORITY_ORDER.map((key) => (
                  <li key={key} className="flex items-center justify-between">
                    <span className={`rounded-full border px-3 py-1 text-sm font-medium ${PRIORITY_BADGE_CLASSES[key]}`}>
                      {PRIORITY_LABELS[key]}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priorityCounts[key]}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              5 Task sắp đến hạn gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">Không có task nào sắp đến hạn.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{task.projectName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {task.dueDate ? formatDueDate(task.dueDate) : ''}
                      </span>
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Xem dự án
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
