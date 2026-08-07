import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToastStore, type Toast, type ToastVariant } from '@/hooks/use-toast-store';
import { cn } from '@/lib/utils';

const TOAST_DURATION = 3500;

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-3 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    const timer = window.setTimeout(() => removeToast(toast.id), TOAST_DURATION);
    return () => window.clearTimeout(timer);
  }, [removeToast, toast.id]);

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full max-w-96 items-start gap-3 rounded-[24px] border bg-card p-4 text-card-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2',
        variantClass(toast.variant),
      )}
    >
      <ToastIcon variant={toast.variant} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{toast.title}</p>
        {toast.description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{toast.description}</p>}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 rounded-full"
        aria-label="Dismiss notification"
        onClick={() => removeToast(toast.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const className = 'mt-0.5 h-5 w-5 shrink-0';

  if (variant === 'success') return <CheckCircle2 className={className} />;
  if (variant === 'warning') return <AlertTriangle className={className} />;
  return <XCircle className={className} />;
}

function variantClass(variant: ToastVariant) {
  if (variant === 'success') return 'border-green-500/30 text-green-700 dark:text-green-300';
  if (variant === 'warning') return 'border-yellow-500/40 text-yellow-700 dark:text-yellow-300';
  return 'border-destructive/30 text-destructive';
}
