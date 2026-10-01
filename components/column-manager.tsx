'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  CheckCircle2,
  Loader2,
  X as CloseIcon,
} from 'lucide-react';
import {
  COLUMN_COLORS,
  COLUMN_COLOR_CHIP_CLASSES,
  COLUMN_COLOR_SWATCH_CLASSES,
  normalizeColumnColor,
  type ColumnColor,
} from '@/lib/column';

export interface ProjectColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  isDoneColumn: boolean;
  projectId: string;
}

interface ColumnManagerProps {
  projectId: string;
  columns: ProjectColumn[];
  onColumnsChanged: (columns: ProjectColumn[]) => void;
  onColumnDeleted: (columnId: string) => void;
  taskCountByColumnId: Record<string, number>;
}

function ColumnEditForm({
  column,
  onSaved,
  onCancel,
}: {
  column: ProjectColumn;
  onSaved: (column: ProjectColumn) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(column.name);
  const [color, setColor] = useState<ColumnColor>(normalizeColumnColor(column.color));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/columns/${column.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      if (response.ok) {
        onSaved(await response.json());
      } else {
        setError('Không lưu được cột, thử lại');
      }
    } catch (err) {
      console.error('Failed to update column:', err);
      setError('Không lưu được cột, thử lại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên cột"
        aria-label="Tên cột"
        className="mb-2"
      />
      <div className="flex flex-wrap gap-1.5">
        {COLUMN_COLORS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setColor(value)}
            aria-label={value}
            aria-pressed={color === value}
            className={`h-5 w-5 rounded-full ${COLUMN_COLOR_SWATCH_CLASSES[value]} ${
              color === value ? 'ring-2 ring-offset-1 ring-gray-500 dark:ring-offset-gray-800' : ''
            }`}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Hủy
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}
        </Button>
      </div>
    </div>
  );
}

function ColumnMenu({
  column,
  taskCount,
  onUpdated,
  onDeleted,
}: {
  column: ProjectColumn;
  taskCount: number;
  onUpdated: (column: ProjectColumn) => void;
  onDeleted: (columnId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingDone, setSettingDone] = useState(false);

  const handleSetDoneColumn = async () => {
    setSettingDone(true);
    try {
      const response = await fetch(`/api/columns/${column.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDoneColumn: true }),
      });
      if (response.ok) {
        onUpdated(await response.json());
        setOpen(false);
      }
    } catch (err) {
      console.error('Failed to set done column:', err);
    } finally {
      setSettingDone(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/columns/${column.id}`, { method: 'DELETE' });
      if (response.ok) {
        onDeleted(column.id);
      }
    } catch (err) {
      console.error('Failed to delete column:', err);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Tùy chọn cột ${column.name}`}
        onClick={() => {
          setOpen((current) => !current);
          setEditing(false);
        }}
        className="h-7 w-7"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {editing ? (
            <ColumnEditForm
              column={column}
              onSaved={(updated) => {
                onUpdated(updated);
                setEditing(false);
                setOpen(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Sửa tên/màu
              </button>
              <button
                type="button"
                onClick={handleSetDoneColumn}
                disabled={column.isDoneColumn || settingDone}
                className="flex items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {column.isDoneColumn ? 'Đã là cột hoàn thành' : 'Đặt làm cột hoàn thành'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cột &quot;{column.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa cột {column.name} sẽ xóa vĩnh viễn {taskCount} công việc bên trong. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmingDelete(false)} disabled={deleting}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ColumnManager({
  projectId,
  columns,
  onColumnsChanged,
  onColumnDeleted,
  taskCountByColumnId,
}: ColumnManagerProps) {
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState<ColumnColor>('blue');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [movingColumnId, setMovingColumnId] = useState<string | null>(null);

  const replaceColumn = (updated: ProjectColumn) => {
    onColumnsChanged(columns.map((c) => (c.id === updated.id ? updated : c)));
  };

  const removeColumn = (columnId: string) => {
    onColumnsChanged(columns.filter((c) => c.id !== columnId));
    onColumnDeleted(columnId);
  };

  const handleMove = async (columnId: string, direction: 'left' | 'right') => {
    setMovingColumnId(columnId);
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      if (response.ok) {
        const response2 = await fetch(`/api/projects/${projectId}/columns`);
        if (response2.ok) {
          onColumnsChanged(await response2.json());
        }
      }
    } catch (err) {
      console.error('Failed to reorder column:', err);
    } finally {
      setMovingColumnId(null);
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const response = await fetch(`/api/projects/${projectId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColumnName, color: newColumnColor }),
      });
      if (response.ok) {
        const newColumn = await response.json();
        onColumnsChanged([...columns, newColumn]);
        setNewColumnName('');
        setNewColumnColor('blue');
        setShowCreateForm(false);
      } else {
        setCreateError('Không tạo được cột, thử lại');
      }
    } catch (err) {
      console.error('Failed to create column:', err);
      setCreateError('Không tạo được cột, thử lại');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Quản lý cột</h2>
      <div className="flex flex-wrap items-stretch gap-3">
        {sortedColumns.map((column, index) => (
          <div
            key={column.id}
            className="flex min-w-[220px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Chuyển cột ${column.name} sang trái`}
                onClick={() => handleMove(column.id, 'left')}
                disabled={index === 0 || movingColumnId !== null}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium ${
                  COLUMN_COLOR_CHIP_CLASSES[normalizeColumnColor(column.color)]
                }`}
              >
                {column.name}
                {column.isDoneColumn && <CheckCircle2 className="h-3.5 w-3.5" />}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {taskCountByColumnId[column.id] ?? 0}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Chuyển cột ${column.name} sang phải`}
                onClick={() => handleMove(column.id, 'right')}
                disabled={index === sortedColumns.length - 1 || movingColumnId !== null}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <ColumnMenu
              column={column}
              taskCount={taskCountByColumnId[column.id] ?? 0}
              onUpdated={replaceColumn}
              onDeleted={removeColumn}
            />
          </div>
        ))}

        <div className="flex min-w-[220px] flex-col justify-center rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
          {showCreateForm ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Cột mới</span>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  aria-label="Đóng"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Tên cột"
                aria-label="Tên cột mới"
                className="mt-2"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COLUMN_COLORS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNewColumnColor(value)}
                    aria-label={value}
                    aria-pressed={newColumnColor === value}
                    className={`h-5 w-5 rounded-full ${COLUMN_COLOR_SWATCH_CLASSES[value]} ${
                      newColumnColor === value
                        ? 'ring-2 ring-offset-1 ring-gray-500 dark:ring-offset-gray-800'
                        : ''
                    }`}
                  />
                ))}
              </div>
              {createError && (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{createError}</p>
              )}
              <Button
                type="button"
                size="sm"
                className="mt-2 w-full"
                disabled={creating || !newColumnName.trim()}
                onClick={handleCreateColumn}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Thêm cột'}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Plus className="h-4 w-4" />
              Thêm cột
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
