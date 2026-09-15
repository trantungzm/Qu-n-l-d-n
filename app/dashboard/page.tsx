import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, ListChecks } from 'lucide-react';
import {
  countTasksByStatus,
  countOverdueTasks,
  countOpenTasksByPriority,
  getUpcomingTasks,
  type DashboardTask,
  type StatusCounts,
} from '@/lib/dashboard-stats';
import { PRIORITY_LABELS, PRIORITY_BADGE_CLASSES } from '@/lib/task-priority';
import { formatDueDate } from '@/lib/task-due-date';

export const dynamic = 'force-dynamic';

const STATUS_ORDER = ['todo', 'doing', 'done'] as const;

const STATUS_LABELS: Record<(typeof STATUS_ORDER)[number], string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done',
};

const STATUS_COLORS: Record<(typeof STATUS_ORDER)[number], string> = {
  todo: '#94a3b8',
  doing: '#3b82f6',
  done: '#22c55e',
};

const PRIORITY_ORDER = ['high', 'medium', 'low'] as const;

async function getDashboardTasks(): Promise<DashboardTask[]> {
  const tasks = await prisma.task.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      projectId: true,
      project: { select: { name: true } },
    },
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    projectId: task.projectId,
    projectName: task.project.name,
  }));
}

function buildStatusConicGradient(statusCounts: StatusCounts): string {
  const total = statusCounts.todo + statusCounts.doing + statusCounts.done;
  if (total === 0) return '#e5e7eb';

  let cursor = 0;
  const segments: string[] = [];
  for (const key of STATUS_ORDER) {
    const count = statusCounts[key];
    if (count === 0) continue;
    const start = (cursor / total) * 360;
    cursor += count;
    const end = (cursor / total) * 360;
    segments.push(`${STATUS_COLORS[key]} ${start}deg ${end}deg`);
  }
  return `conic-gradient(${segments.join(', ')})`;
}

export default async function DashboardPage() {
  const tasks = await getDashboardTasks();

  const statusCounts = countTasksByStatus(tasks);
  const overdueCount = countOverdueTasks(tasks);
  const priorityCounts = countOpenTasksByPriority(tasks);
  const upcomingTasks = getUpcomingTasks(tasks);

  const totalTasks = statusCounts.todo + statusCounts.doing + statusCounts.done;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Tổng quan</h1>
            <p className="text-gray-600 mt-1">Thống kê Task trên tất cả dự án</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Về trang dự án
          </Link>
        </div>

        <Card className={overdueCount > 0 ? 'border-red-400 bg-red-50 mb-6' : 'mb-6'}>
          <CardContent className="flex items-center gap-4 py-6">
            <div
              className={
                overdueCount > 0
                  ? 'flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600'
                  : 'flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500'
              }
            >
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <p
                className={
                  overdueCount > 0 ? 'text-3xl font-bold text-red-600' : 'text-3xl font-bold text-gray-700'
                }
              >
                {overdueCount}
              </p>
              <p className="text-sm text-gray-600">Task quá hạn (chưa hoàn thành)</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Task theo trạng thái</CardTitle>
              <CardDescription>Tổng {totalTasks} task trên tất cả dự án</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div
                className="h-32 w-32 shrink-0 rounded-full"
                style={{ background: buildStatusConicGradient(statusCounts) }}
                aria-hidden="true"
              />
              <ul className="space-y-2 flex-1">
                {STATUS_ORDER.map((key) => (
                  <li key={key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[key] }} />
                      {STATUS_LABELS[key]}
                    </span>
                    <span className="font-semibold text-gray-900">{statusCounts[key]}</span>
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
                    <span className="text-lg font-bold text-gray-900">{priorityCounts[key]}</span>
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
              <p className="text-gray-600 text-sm">Không có task nào sắp đến hạn.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.projectName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-700">
                        {task.dueDate ? formatDueDate(task.dueDate) : ''}
                      </span>
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
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
