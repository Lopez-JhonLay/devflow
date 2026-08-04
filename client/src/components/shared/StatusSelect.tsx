import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectStatus } from '@/hooks/use-projects';

const STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ARCHIVED', label: 'Archived' },
];

type StatusSelectProps = {
  id: string;
  value: ProjectStatus;
  onChange: (value: ProjectStatus) => void;
};

export function StatusSelect({ id, value, onChange }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <Button
        id={id}
        type="button"
        variant="outline"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="h-10 w-full justify-between border-input bg-muted/40 px-4 text-left font-normal hover:bg-muted"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selected.label}</span>
        <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="mt-2 overflow-hidden rounded-[24px] border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
        >
          {STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className="flex h-10 w-full cursor-pointer items-center justify-between rounded-full px-4 text-left text-sm transition-colors hover:bg-muted aria-selected:bg-primary aria-selected:text-primary-foreground"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
