'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  normalizeTaskPriority,
  PRIORITY_LABELS,
  TASK_PRIORITIES,
  type TaskPriority,
} from '@/lib/task-priority';
import {
  normalizeTaskType,
  TASK_TYPES,
  TYPE_ICON_CLASSES,
  TYPE_ICONS,
  TYPE_LABELS,
  type TaskType,
} from '@/lib/task-type';

interface Task {
  id: string;
  title: string;
  dueDate?: string | null;
  priority?: string;
  type?: string;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: any) => void;
  task: Task | null;
}

function toDateInputValue(dueDate?: string | null): string {
  if (!dueDate) return '';
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function EditTaskDialog({
  open,
  onOpenChange,
  onTaskUpdated,
  task,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('feature');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const TypeIcon = TYPE_ICONS[type];

  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDueDate(toDateInputValue(task.dueDate));
      setPriority(normalizeTaskPriority(task.priority));
      setType(normalizeTaskType(task.type));
      setError(false);
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim()) return;

    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, dueDate: dueDate || null, priority, type }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onTaskUpdated(updatedTask);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 bg-white text-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md mx-4 dark:bg-gray-800 dark:text-gray-100">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Sửa task
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cập nhật tiêu đề, hạn hoàn thành và mức độ ưu tiên của task
          </p>
        </div>
        {error && <Alert className="mb-4">Không sửa được task, thử lại</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Tiêu đề task <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề task"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-dueDate" className="text-sm font-medium">
                Hạn hoàn thành
              </label>
              <Input
                id="edit-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-priority" className="text-sm font-medium">
                Mức độ ưu tiên
              </label>
              <Select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {TASK_PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-type" className="text-sm font-medium">
                Loại công việc
              </label>
              <div className="flex items-center gap-2">
                <TypeIcon className={`h-4 w-4 shrink-0 ${TYPE_ICON_CLASSES[type]}`} />
                <Select
                  id="edit-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="flex-1"
                >
                  {TASK_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {TYPE_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
