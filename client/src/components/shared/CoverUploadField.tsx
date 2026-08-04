import { useRef, useState } from 'react';
import { Image, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

type CoverUploadFieldProps = {
  id: string;
  previewUrl: string;
  error?: string;
  isBusy?: boolean;
  onSelect: (file: File | undefined) => void;
};

export function CoverUploadField({
  id,
  previewUrl,
  error,
  isBusy = false,
  onSelect,
}: CoverUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Cover Image</Label>
      <button
        type="button"
        disabled={isBusy}
        className={`group relative overflow-hidden rounded-[24px] border bg-muted text-left outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-70 ${isDragging ? 'border-ring ring-3 ring-ring/30' : 'border-border'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          onSelect(event.dataTransfer.files?.[0]);
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Project cover preview" className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center gap-2 text-muted-foreground">
            {isBusy ? <Loader2 className="h-8 w-8 animate-spin" /> : <Image className="h-8 w-8" />}
            <span className="text-sm">{isBusy ? 'Uploading cover' : 'Click or drop image here'}</span>
          </div>
        )}
        {(previewUrl || isDragging) && (
          <span
            className={`absolute inset-0 flex items-center justify-center bg-background/60 text-sm font-semibold text-foreground transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            {isDragging ? 'Drop image to upload' : 'Click or drop to replace'}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          onSelect(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
