import type { ProjectProgress } from '@/lib/dashboard-stats';

interface ProjectProgressBarProps {
  progress: ProjectProgress;
  className?: string;
}

export function ProjectProgressBar({ progress, className }: ProjectProgressBarProps) {
  const { done, total, percent } = progress;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
        <span>Tiến độ</span>
        <span>
          {done}/{total} hoàn thành ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
