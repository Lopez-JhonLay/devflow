import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingSpinnerProps = {
  label?: string;
  fullScreen?: boolean;
  className?: string;
};

export function LoadingSpinner({ label = 'Loading...', fullScreen = false, className }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-3 text-sm font-medium text-muted-foreground',
        fullScreen ? 'min-h-screen' : 'min-h-40 p-4',
        className,
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
