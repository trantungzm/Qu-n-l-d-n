'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  taskId: string;
}

interface DetailTask {
  id: string;
  title: string;
  subTasks: SubTask[];
}

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: DetailTask | null;
  onSubTasksChanged: (taskId: string, subTasks: SubTask[]) => void;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  onSubTasksChanged,
}: TaskDetailDialogProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open && task) {
      setSubTasks(task.subTasks);
      setNewTitle('');
      setError(false);
    }
  }, [open, task]);

  if (!open || !task) return null;

  const updateSubTasks = (next: SubTask[]) => {
    setSubTasks(next);
    onSubTasksChanged(task.id, next);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAdding(true);
    setError(false);
    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        const created = await response.json();
        updateSubTasks([...subTasks, created]);
        setNewTitle('');
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to create subtask:', error);
      setError(true);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (subTask: SubTask) => {
    const prevSubTasks = subTasks;
    updateSubTasks(
      subTasks.map((item) =>
        item.id === subTask.id ? { ...item, done: !item.done } : item
      )
    );

    try {
      const response = await fetch(`/api/subtasks/${subTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !subTask.done }),
      });
      if (!response.ok) {
        updateSubTasks(prevSubTasks);
        setError(true);
      }
    } catch (error) {
      console.error('Failed to update subtask:', error);
      updateSubTasks(prevSubTasks);
      setError(true);
    }
  };

  const handleDelete = async (subTaskId: string) => {
    const prevSubTasks = subTasks;
    updateSubTasks(subTasks.filter((item) => item.id !== subTaskId));

    try {
      const response = await fetch(`/api/subtasks/${subTaskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        updateSubTasks(prevSubTasks);
        setError(true);
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      updateSubTasks(prevSubTasks);
      setError(true);
    }
  };

  const doneCount = subTasks.filter((item) => item.done).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-white p-6 shadow-lg mx-4">
        <div className="mb-4 flex flex-col space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {task.title}
          </h2>
          <p className="text-sm text-gray-500">
            {subTasks.length > 0
              ? `${doneCount}/${subTasks.length} việc con đã hoàn thành`
              : 'Chưa có việc con nào'}
          </p>
        </div>

        {error && <Alert className="mb-4">Có lỗi xảy ra, thử lại</Alert>}

        <div className="mb-4 space-y-2 overflow-y-auto">
          {subTasks.map((subTask) => (
            <div
              key={subTask.id}
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={subTask.done}
                onChange={() => handleToggle(subTask)}
                aria-label={`Đánh dấu hoàn thành: ${subTask.title}`}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span
                className={`flex-1 text-sm ${
                  subTask.done ? 'text-gray-400 line-through' : 'text-gray-800'
                }`}
              >
                {subTask.title}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(subTask.id)}
                aria-label={`Xóa: ${subTask.title}`}
                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Thêm việc con mới"
            aria-label="Thêm việc con mới"
          />
          <Button type="submit" size="icon" disabled={adding || !newTitle.trim()}>
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
