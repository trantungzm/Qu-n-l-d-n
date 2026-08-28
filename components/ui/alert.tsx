import { cn } from '@/lib/utils';

function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn('rounded-lg border border-red-200 bg-red-50 p-4 text-red-800', className)}
      {...props}
    />
  );
}

export { Alert };
