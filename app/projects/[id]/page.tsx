'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { CreateTaskDialog } from '@/components/create-task-dialog';
import { EditTaskDialog } from '@/components/edit-task-dialog';
import { ProjectProgressBar } from '@/components/project-progress-bar';
import { reorderTasksOnDrop } from '@/lib/task-order';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { filterTasksByTitle } from '@/lib/task-filter';
import { isTaskOverdue, formatDueDate } from '@/lib/task-due-date';
import {
  filterTasksByPriority,
  normalizeTaskPriority,
  PRIORITY_BADGE_CLASSES,
  PRIORITY_LABELS,
  TASK_PRIORITIES,
} from '@/lib/task-priority';
import {
  filterTasksByType,
  normalizeTaskType,
  TASK_TYPES,
  TYPE_ICON_CLASSES,
  TYPE_ICONS,
  TYPE_LABELS,
} from '@/lib/task-type';
import { getProjectProgress, countOverdueTasks, countOpenTasksByPriority } from '@/lib/dashboard-stats';
import { TaskDetailDialog, type SubTask } from '@/components/task-detail-dialog';
import { ColumnMenu, AddColumnTile, type ProjectColumn } from '@/components/column-manager';
import { COLUMN_COLOR_CHIP_CLASSES, normalizeColumnColor } from '@/lib/column';

interface Task {
  id: string;
  title: string;
  projectId: string;
  createdAt: string;
  dueDate?: string | null;
  priority: string;
  type: string;
  order: number;
  columnId: string | null;
  subTasks: SubTask[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

function TaskCard({
  task,
  isDoneColumn,
  onDelete,
  onEdit,
  onOpenDetail,
}: {
  task: Task;
  isDoneColumn: boolean;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const subTaskCount = task.subTasks?.length ?? 0;
  const subTaskDoneCount = task.subTasks?.filter((item) => item.done).length ?? 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpenDetail(task)}
      className="cursor-grab active:cursor-grabbing overflow-hidden border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{task.title}</p>
          {subTaskCount > 0 && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {subTaskDoneCount}/{subTaskCount}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          {(() => {
            const TypeIcon = TYPE_ICONS[normalizeTaskType(task.type)];
            return (
              <TypeIcon
                className={`h-3.5 w-3.5 shrink-0 ${TYPE_ICON_CLASSES[normalizeTaskType(task.type)]}`}
                aria-label={TYPE_LABELS[normalizeTaskType(task.type)]}
              />
            );
          })()}
          <span
            className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
              PRIORITY_BADGE_CLASSES[normalizeTaskPriority(task.priority)]
            }`}
          >
            {PRIORITY_LABELS[normalizeTaskPriority(task.priority)]}
          </span>
        </div>

        {task.dueDate && (
          <p
            className={`mt-2 text-xs font-medium ${
              isTaskOverdue(task.dueDate, isDoneColumn)
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Hạn: {formatDueDate(task.dueDate)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TaskColumn({
  column,
  index,
  columnsLength,
  tasks,
  taskCount,
  movingColumnId,
  onMove,
  onColumnUpdated,
  onColumnDeleted,
  onDelete,
  onEdit,
  onOpenDetail,
  isFiltering,
}: {
  column: ProjectColumn;
  index: number;
  columnsLength: number;
  tasks: Task[];
  taskCount: number;
  movingColumnId: string | null;
  onMove: (columnId: string, direction: 'left' | 'right') => void;
  onColumnUpdated: (column: ProjectColumn) => void;
  onColumnDeleted: (columnId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  isFiltering: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={setNodeRef}
      className={`w-80 shrink-0 rounded-xl border-2 border-gray-200 bg-white p-4 min-h-[420px] dark:border-gray-700 dark:bg-gray-800 ${
        isOver ? 'ring-2 ring-blue-300 ring-offset-1' : ''
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Chuyển cột ${column.name} sang trái`}
            onClick={() => onMove(column.id, 'left')}
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Chuyển cột ${column.name} sang phải`}
            onClick={() => onMove(column.id, 'right')}
            disabled={index === columnsLength - 1 || movingColumnId !== null}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {sortedTasks.length}
          </span>
          <ColumnMenu
            column={column}
            taskCount={taskCount}
            onUpdated={onColumnUpdated}
            onDeleted={onColumnDeleted}
          />
        </div>
      </div>

      <SortableContext items={sortedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white/50 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
              {isFiltering ? 'Không tìm thấy công việc phù hợp' : 'Chưa có công việc'}
            </div>
          ) : (
            sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isDoneColumn={column.isDoneColumn}
                onDelete={onDelete}
                onEdit={onEdit}
                onOpenDetail={onOpenDetail}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<ProjectColumn[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reorderError, setReorderError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [movingColumnId, setMovingColumnId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const filteredTasks = filterTasksByType(
    filterTasksByPriority(filterTasksByTitle(tasks, searchQuery), priorityFilter),
    typeFilter
  );

  const isDoneColumnById = new Map(columns.map((column) => [column.id, column.isDoneColumn]));
  const tasksWithDoneFlag = tasks.map((task) => ({
    ...task,
    isDoneColumn: task.columnId ? isDoneColumnById.get(task.columnId) === true : false,
  }));

  const progress = getProjectProgress(tasksWithDoneFlag);
  const overdueCount = countOverdueTasks(tasksWithDoneFlag);
  const openPriorityCounts = countOpenTasksByPriority(tasksWithDoneFlag);

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const taskCountByColumnId = tasks.reduce<Record<string, number>>((counts, task) => {
    if (task.columnId) {
      counts[task.columnId] = (counts[task.columnId] ?? 0) + 1;
    }
    return counts;
  }, {});

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

  const fetchColumns = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/columns`);
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to load columns');
      setColumns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch columns:', error);
    }
  };

  const handleColumnCreated = (newColumn: ProjectColumn) => {
    setColumns((currentColumns) => [...currentColumns, newColumn]);
  };

  const handleColumnUpdated = (updatedColumn: ProjectColumn) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) => (column.id === updatedColumn.id ? updatedColumn : column))
    );
  };

  const handleColumnDeleted = (columnId: string) => {
    setColumns((currentColumns) => currentColumns.filter((column) => column.id !== columnId));
    setTasks((currentTasks) => currentTasks.filter((task) => task.columnId !== columnId));
  };

  const handleMoveColumn = async (columnId: string, direction: 'left' | 'right') => {
    setMovingColumnId(columnId);
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      if (response.ok) {
        await fetchColumns();
      }
    } catch (error) {
      console.error('Failed to reorder column:', error);
    } finally {
      setMovingColumnId(null);
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
    setTasks((currentTasks) => [{ ...newTask, subTasks: newTask.subTasks ?? [] }, ...currentTasks]);
    setIsDialogOpen(false);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id ? { ...task, ...updatedTask, subTasks: task.subTasks } : task
      )
    );
    setEditingTask(null);
  };

  const handleSubTasksChanged = (taskId: string, subTasks: SubTask[]) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, subTasks } : task))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedTaskId = String(active.id);
    const overId = String(over.id);
    if (draggedTaskId === overId) return;

    const draggedTask = tasks.find((task) => task.id === draggedTaskId);
    if (!draggedTask) return;

    let targetColumnId: string | null;
    if (columns.some((column) => column.id === overId)) {
      targetColumnId = overId;
    } else {
      const overTask = tasks.find((task) => task.id === overId);
      if (!overTask) return;
      targetColumnId = overTask.columnId;
    }

    const destTasksExcludingActive = tasks
      .filter((task) => task.columnId === targetColumnId && task.id !== draggedTaskId)
      .sort((a, b) => a.order - b.order);
    const overIndex = destTasksExcludingActive.findIndex((task) => task.id === overId);
    const targetIndex = overIndex === -1 ? destTasksExcludingActive.length : overIndex;

    const updates = reorderTasksOnDrop(tasks, draggedTaskId, targetColumnId, targetIndex);
    if (updates.length === 0) return;

    const prevTasks = tasks;
    const updatesById = new Map(updates.map((update) => [update.id, update]));
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        const update = updatesById.get(task.id);
        return update ? { ...task, columnId: update.columnId, order: update.order } : task;
      })
    );

    try {
      setReorderError(false);
      const response = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        setTasks(prevTasks);
        setReorderError(true);
      }
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      setTasks(prevTasks);
      setReorderError(true);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTasks();
    fetchColumns();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-4 h-9 w-24" />
          <Skeleton className="mb-3 h-10 w-2/3" />
          <Skeleton className="mb-8 h-5 w-1/2" />
          <div className="flex gap-4 overflow-x-auto" aria-label="Đang tải task">
            {[0, 1, 2].map((placeholder) => (
              <div key={placeholder} className="w-80 shrink-0 min-h-[420px] rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Không tìm thấy dự án</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description || 'Không có mô tả'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ngày tạo: {new Date(project.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4">
              <ProjectProgressBar progress={progress} />
            </CardContent>
          </Card>

          <Card className={overdueCount > 0 ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950' : ''}>
            <CardContent className="flex items-center justify-between py-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Task quá hạn</span>
              <span
                className={`text-2xl font-bold ${
                  overdueCount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {overdueCount}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Đang mở theo mức ưu tiên</p>
              <ul className="space-y-1 text-sm">
                {TASK_PRIORITIES.map((priority) => (
                  <li key={priority} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                    <span>{PRIORITY_LABELS[priority]}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{openPriorityCounts[priority]}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Board</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-5 w-5" />
            Thêm task mới
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm công việc theo tiêu đề"
              aria-label="Tìm công việc"
              className="pl-9 pr-10"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Xóa tìm kiếm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Lọc theo mức độ ưu tiên"
            className="sm:w-48"
          >
            <option value="all">Tất cả mức ưu tiên</option>
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </Select>

          <Select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Lọc theo loại công việc"
            className="sm:w-48"
          >
            <option value="all">Tất cả loại công việc</option>
            {TASK_TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        {reorderError && (
          <Alert className="mb-6">
            <p className="font-medium">Không lưu được thứ tự task, task đã được khôi phục</p>
            <Button variant="outline" className="mt-3" onClick={() => setReorderError(false)}>
              Đã hiểu
            </Button>
          </Alert>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {sortedColumns.map((column, index) => (
              <TaskColumn
                key={column.id}
                column={column}
                index={index}
                columnsLength={sortedColumns.length}
                tasks={filteredTasks.filter((task) => task.columnId === column.id)}
                taskCount={taskCountByColumnId[column.id] ?? 0}
                movingColumnId={movingColumnId}
                onMove={handleMoveColumn}
                onColumnUpdated={handleColumnUpdated}
                onColumnDeleted={handleColumnDeleted}
                onDelete={handleDeleteTask}
                onEdit={setEditingTask}
                onOpenDetail={setViewingTask}
                isFiltering={
                  Boolean(searchQuery.trim()) || priorityFilter !== 'all' || typeFilter !== 'all'
                }
              />
            ))}
            <AddColumnTile projectId={projectId} onCreated={handleColumnCreated} />
          </div>
        </DndContext>

        <CreateTaskDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onTaskCreated={handleTaskCreated}
          projectId={projectId}
        />

        <EditTaskDialog
          open={editingTask !== null}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
          onTaskUpdated={handleTaskUpdated}
          task={editingTask}
        />

        <TaskDetailDialog
          open={viewingTask !== null}
          onOpenChange={(open) => {
            if (!open) setViewingTask(null);
          }}
          task={viewingTask}
          onSubTasksChanged={handleSubTasksChanged}
        />
      </div>
    </div>
  );
}
