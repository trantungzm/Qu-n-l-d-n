'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ProjectFormValues {
  id?: string;
  name: string;
  description: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: any) => void;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  onProjectUpdated: (project: any) => void;
}

function ProjectDialog({
  open,
  onOpenChange,
  mode,
  initialProject,
  onProjectCreated,
  onProjectUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialProject?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  onProjectCreated?: (project: any) => void;
  onProjectUpdated?: (project: any) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;

    setName(initialProject?.name ?? '');
    setDescription(initialProject?.description ?? '');
    setError(false);
  }, [open, initialProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) return;

    setLoading(true);
    setError(false);

    try {
      const endpoint = mode === 'edit' && initialProject ? `/api/projects/${initialProject.id}` : '/api/projects';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          description,
        }),
      });

      if (response.ok) {
        const savedProject = await response.json();

        if (mode === 'edit' && onProjectUpdated) {
          onProjectUpdated(savedProject);
        }

        if (mode === 'create' && onProjectCreated) {
          onProjectCreated(savedProject);
        }

        setName('');
        setDescription('');
        onOpenChange(false);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} project:`, error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cập nhật thông tin dự án của bạn.'
              : 'Nhập thông tin để tạo dự án mới của bạn'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="mb-4">
            {isEditing ? 'Không cập nhật được dự án, thử lại' : 'Không tạo được dự án, thử lại'}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Tên dự án <span className="text-red-500">*</span>
              </label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên dự án"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Mô tả
              </label>
              <Input
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả dự án (tùy chọn)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? (isEditing ? 'Đang cập nhật...' : 'Đang tạo...') : isEditing ? 'Lưu thay đổi' : 'Tạo dự án'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectDialogProps) {
  return (
    <ProjectDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="create"
      onProjectCreated={onProjectCreated}
    />
  );
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onProjectUpdated,
}: EditProjectDialogProps) {
  return (
    <ProjectDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="edit"
      initialProject={project}
      onProjectUpdated={onProjectUpdated}
    />
  );
}

