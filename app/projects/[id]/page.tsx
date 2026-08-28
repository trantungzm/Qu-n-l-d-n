'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { CreateTaskDialog } from '@/components/create-task-dialog';
import { TASK_STATUSES, type TaskStatus } from '@/lib/task-status';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  projectId: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done',
};

const columnStyles: Record<TaskStatus, string> = {
  todo: 'border-sky-200 bg-sky-50',
  doing: 'border-amber-200 bg-amber-50',
  done: 'border-emerald-200 bg-emerald-50',
};

function TaskCard({ task, onDelete }: { task: Task; onDelete: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing overflow-hidden border border-gray-200 bg-white shadow-sm"
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 text-sm font-medium text-gray-800">{task.title}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskColumn({
  status,
  tasks,
  onDelete,
}: {
  status: TaskStatus;
  tasks: Task[];
  onDelete: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 p-4 min-h-[420px] ${columnStyles[status]} ${
        isOver ? 'ring-2 ring-blue-300 ring-offset-1' : ''
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{statusLabels[status]}</h3>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-700">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white/50 p-4 text-center text-sm text-gray-500">
            Chưa có task nào
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} onDelete={onDelete} />)
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchProject = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to load project');
      if (Array.isArray(data)) {
        const foundProject = data.find((p: Project) => p.id === projectId);
        setProject(foundProject || null);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      setError(true);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to load tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa task này?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((currentTasks) => [newTask, ...currentTasks]);
    setIsDialogOpen(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedTaskId = String(active.id);
    const targetStatus = String(over.id) as TaskStatus;
    if (!TASK_STATUSES.includes(targetStatus as TaskStatus)) return;

    const taskToUpdate = tasks.find((task) => task.id === draggedTaskId);
    if (!taskToUpdate || taskToUpdate.status === targetStatus) return;

    const prevTasks = tasks;
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === draggedTaskId ? { ...task, status: targetStatus } : task
      )
    );

    try {
      setStatusUpdateError(false);
      const response = await fetch(`/api/tasks/${draggedTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!response.ok) {
        setTasks(prevTasks);
        setStatusUpdateError(true);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      setTasks(prevTasks);
      setStatusUpdateError(true);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-4 h-9 w-24" />
          <Skeleton className="mb-3 h-10 w-2/3" />
          <Skeleton className="mb-8 h-5 w-1/2" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3" aria-label="Đang tải task">
            {TASK_STATUSES.map((status) => (
              <div key={status} className="min-h-[420px] rounded-xl border-2 border-gray-200 bg-white p-4">
                <div className="mb-6 flex justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <p className="font-medium">Không tải được dữ liệu, thử lại</p>
            <Button variant="outline" className="mt-3" onClick={() => { setError(false); fetchProject(); fetchTasks(); }}>
              Thử lại
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Không tìm thấy dự án</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-4xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-2">{project.description || 'Không có mô tả'}</p>
          <p className="text-sm text-gray-500 mt-1">
            Ngày tạo: {new Date(project.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Board</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-5 w-5" />
            Thêm task mới
          </Button>
        </div>

        {statusUpdateError && (
          <Alert className="mb-6">
            <p className="font-medium">Không lưu được trạng thái task, task đã được khôi phục</p>
            <Button variant="outline" className="mt-3" onClick={() => setStatusUpdateError(false)}>
              Đã hiểu
            </Button>
          </Alert>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {TASK_STATUSES.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={tasks.filter((task) => task.status === status)}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        </DndContext>

        <CreateTaskDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onTaskCreated={handleTaskCreated}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
