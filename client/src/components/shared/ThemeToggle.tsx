import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/hooks/use-ui-store';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted p-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <span
        className={cn(
          'absolute left-1 flex h-7 w-7 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform',
          isDark && 'translate-x-7',
        )}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
}
