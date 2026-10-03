'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ArchivedProject {
  id: string;
  name: string;
  description: string | null;
  archivedAt: string;
}

interface ArchivedTask {
  id: string;
  title: string;
  archivedAt: string;
  project: { id: string; name: string };
}

type Tab = 'projects' | 'tasks';

export default function ArchivedPage() {
  const [tab, setTab] = useState<Tab>('projects');
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [tasks, setTasks] = useState<ArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ArchivedProject | null>(null);
  const [deletingTask, setDeletingTask] = useState<ArchivedTask | null>(null);

  const fetchArchived = async () => {
    setLoading(true);
    setError(false);
    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch('/api/projects?archived=true'),
        fetch('/api/tasks/archived'),
      ]);
      if (!projectsResponse.ok || !tasksResponse.ok) throw new Error('Failed to load archived items');

      const [projectsData, tasksData] = await Promise.all([
        projectsResponse.json(),
        tasksResponse.json(),
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error('Failed to fetch archived items:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestoreProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      });
      if (response.ok) {
        setProjects((current) => current.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to restore project:', err);
    }
  };

  const handleRestoreTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      });
      if (response.ok) {
        setTasks((current) => current.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to restore task:', err);
    }
  };

  const handleDeleteProjectForever = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects((current) => current.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setDeletingProject(null);
    }
  };

  const handleDeleteTaskForever = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTasks((current) => current.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setDeletingTask(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Đã lưu trữ</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Dự án và công việc đã lưu trữ. Khôi phục để đưa về màn hình chính, hoặc xóa vĩnh viễn.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <Button
            variant={tab === 'projects' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('projects')}
          >
            Dự án ({projects.length})
          </Button>
          <Button
            variant={tab === 'tasks' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('tasks')}
          >
            Công việc ({tasks.length})
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3" aria-label="Đang tải mục đã lưu trữ">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <Alert>
            <p className="font-medium">Không tải được dữ liệu, thử lại</p>
            <Button variant="outline" className="mt-3" onClick={fetchArchived}>
              Thử lại
            </Button>
          </Alert>
        ) : tab === 'projects' ? (
          projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">Chưa có dự án nào được lưu trữ.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Lưu trữ lúc {new Date(project.archivedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreProject(project.id)}
                      >
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Khôi phục
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingProject(project)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa vĩnh viễn
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Chưa có công việc nào được lưu trữ.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <Link
                        href={`/projects/${task.project.id}`}
                        className="underline hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {task.project.name}
                      </Link>
                      {' · '}
                      Lưu trữ lúc {new Date(task.archivedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreTask(task.id)}
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Khôi phục
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingTask(task)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa vĩnh viễn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={deletingProject !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingProject(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn dự án {deletingProject?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn {deletingProject?.name} và toàn bộ công việc bên trong.
              Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProject(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProject && handleDeleteProjectForever(deletingProject.id)}
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deletingTask !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingTask(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn công việc {deletingTask?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn công việc này. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTask(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingTask && handleDeleteTaskForever(deletingTask.id)}>
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
