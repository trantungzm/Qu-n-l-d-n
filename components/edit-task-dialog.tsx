'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, X as CloseIcon } from 'lucide-react';
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
import {
  LABEL_COLORS,
  LABEL_COLOR_CHIP_CLASSES,
  LABEL_COLOR_SWATCH_CLASSES,
  normalizeLabelColor,
  type LabelColor,
  type TaskLabel,
} from '@/lib/label';

interface Task {
  id: string;
  title: string;
  dueDate?: string | null;
  priority?: string;
  type?: string;
  labels?: TaskLabel[];
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: any) => void;
  task: Task | null;
  projectId: string;
  labels: TaskLabel[];
  onLabelsChanged: (labels: TaskLabel[]) => void;
  onDeleteLabel: (label: TaskLabel) => Promise<boolean>;
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
  projectId,
  labels,
  onLabelsChanged,
  onDeleteLabel,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('feature');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [showNewLabelForm, setShowNewLabelForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<LabelColor>('blue');
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [newLabelError, setNewLabelError] = useState('');
  const [deletingLabel, setDeletingLabel] = useState<TaskLabel | null>(null);
  const [deletingLabelLoading, setDeletingLabelLoading] = useState(false);

  const TypeIcon = TYPE_ICONS[type];

  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDueDate(toDateInputValue(task.dueDate));
      setPriority(normalizeTaskPriority(task.priority));
      setType(normalizeTaskType(task.type));
      setSelectedLabelIds((task.labels ?? []).map((label) => label.id));
      setError(false);
      setShowNewLabelForm(false);
      setNewLabelName('');
      setNewLabelColor('blue');
      setNewLabelError('');
      setDeletingLabel(null);
    }
  }, [open, task]);

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId]
    );
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;

    setCreatingLabel(true);
    setNewLabelError('');
    try {
      const response = await fetch(`/api/projects/${projectId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelName, color: newLabelColor }),
      });

      if (response.ok) {
        const newLabel = await response.json();
        onLabelsChanged([...labels, newLabel]);
        setSelectedLabelIds((current) => [...current, newLabel.id]);
        setNewLabelName('');
        setNewLabelColor('blue');
        setShowNewLabelForm(false);
      } else {
        const data = await response.json().catch(() => null);
        setNewLabelError(data?.error === 'Label name already exists in this project'
          ? 'Nhãn này đã tồn tại trong dự án'
          : 'Không tạo được nhãn, thử lại');
      }
    } catch (error) {
      console.error('Failed to create label:', error);
      setNewLabelError('Không tạo được nhãn, thử lại');
    } finally {
      setCreatingLabel(false);
    }
  };

  const handleConfirmDeleteLabel = async () => {
    if (!deletingLabel) return;
    const labelToDelete = deletingLabel;

    setDeletingLabelLoading(true);
    // Optimistically drop it from this dialog's own selection; onDeleteLabel
    // handles the parent's `labels` state and every Task's `labels[]`, and
    // rolls both back (plus this one, below) if the API call fails.
    setSelectedLabelIds((current) => current.filter((id) => id !== labelToDelete.id));

    const success = await onDeleteLabel(labelToDelete);

    if (!success) {
      setSelectedLabelIds((current) => [...current, labelToDelete.id]);
    }

    setDeletingLabelLoading(false);
    setDeletingLabel(null);
  };

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
        body: JSON.stringify({
          title,
          dueDate: dueDate || null,
          priority,
          type,
          labelIds: selectedLabelIds,
        }),
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
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nhãn</label>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => {
                  const selected = selectedLabelIds.includes(label.id);
                  return (
                    <span key={label.id} className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleLabel(label.id)}
                        aria-pressed={selected}
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium transition-opacity ${
                          LABEL_COLOR_CHIP_CLASSES[normalizeLabelColor(label.color)]
                        } ${selected ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 dark:ring-offset-gray-800' : 'opacity-50'}`}
                      >
                        {label.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingLabel(label)}
                        aria-label={`Xóa nhãn ${label.name}`}
                        className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {!showNewLabelForm && (
                  <button
                    type="button"
                    onClick={() => setShowNewLabelForm(true)}
                    className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
                  >
                    <Plus className="h-3 w-3" />
                    Tạo nhãn mới
                  </button>
                )}
              </div>

              {showNewLabelForm && (
                <div className="mt-1 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Nhãn mới</span>
                    <button
                      type="button"
                      onClick={() => setShowNewLabelForm(false)}
                      aria-label="Đóng"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Tên nhãn"
                      aria-label="Tên nhãn mới"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingLabel || !newLabelName.trim()}
                      onClick={handleCreateLabel}
                    >
                      {creatingLabel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Thêm'}
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {LABEL_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewLabelColor(color)}
                        aria-label={color}
                        aria-pressed={newLabelColor === color}
                        className={`h-5 w-5 rounded-full ${LABEL_COLOR_SWATCH_CLASSES[color]} ${
                          newLabelColor === color
                            ? 'ring-2 ring-offset-1 ring-gray-500 dark:ring-offset-gray-800'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                  {newLabelError && (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{newLabelError}</p>
                  )}
                </div>
              )}
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

      <AlertDialog
        open={deletingLabel !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingLabel(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhãn &quot;{deletingLabel?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Nhãn này đang gắn vào {deletingLabel?.taskCount ?? 0} Task (kể cả Task đã lưu trữ).
              Xóa sẽ gỡ nhãn khỏi tất cả Task đó, Task vẫn được giữ lại. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingLabel(null)} disabled={deletingLabelLoading}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteLabel} disabled={deletingLabelLoading}>
              {deletingLabelLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
