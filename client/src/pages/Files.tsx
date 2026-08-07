import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, FileText, Folder, Image, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjectFiles, type ProjectFileWithProject } from '@/hooks/use-projects';
import { useToastStore } from '@/hooks/use-toast-store';

type FileFilter = 'ALL' | 'IMAGES' | 'PDFS' | 'DIAGRAMS';

const FILE_FILTERS: Array<{ value: FileFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'IMAGES', label: 'Images' },
  { value: 'PDFS', label: 'PDFs' },
  { value: 'DIAGRAMS', label: 'Diagrams' },
];

export default function FilesPage() {
  const { data: files = [], isLoading, error } = useProjectFiles();
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState<FileFilter>('ALL');
  const [copiedFileId, setCopiedFileId] = useState('');
  const toast = useToastStore();

  const filteredFiles = useMemo(() => {
    const search = searchInput.trim().toLowerCase();

    return files.filter((file) => {
      const matchesFilter = filter === 'ALL' || fileMatchesFilter(file, filter);
      const matchesSearch =
        !search ||
        file.name.toLowerCase().includes(search) ||
        file.fileType.toLowerCase().includes(search) ||
        file.project.name.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [files, filter, searchInput]);

  async function copyUrl(file: ProjectFileWithProject) {
    try {
      await navigator.clipboard.writeText(file.url);
      setCopiedFileId(file.id);
      toast.success('File URL copied', file.name);
      window.setTimeout(() => setCopiedFileId(''), 1200);
    } catch {
      toast.error('Copy failed', 'Your browser blocked clipboard access.');
    }
  }

  return (
    <div className="pb-8 md:pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Files</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse uploaded project assets from one place.</p>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            placeholder="Search files, projects, or file types..."
            className="pl-10"
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <FileFilterControl value={filter} onChange={setFilter} />
      </div>

      {isLoading && <LoadingSpinner label="Loading files..." />}
      {error && <div className="p-4 text-destructive">Failed to load files.</div>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isCopied={copiedFileId === file.id}
                onCopy={() => void copyUrl(file)}
              />
            ))
          ) : (
            <p className="rounded-[28px] border border-dashed border-border p-8 text-sm text-muted-foreground">
              No files found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FileFilterControl({
  value,
  onChange,
}: {
  value: FileFilter;
  onChange: (value: FileFilter) => void;
}) {
  return (
    <div className="flex w-fit rounded-full border border-border bg-card p-1 shadow-sm">
      {FILE_FILTERS.map((filter) => {
        const isActive = value === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={isActive}
            className="h-8 rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

function FileCard({
  file,
  isCopied,
  onCopy,
}: {
  file: ProjectFileWithProject;
  isCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="group flex gap-4 rounded-[28px] border border-border bg-card p-4 shadow-sm transition-all hover:border-ring hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
        {file.fileType.startsWith('image/') ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-card-foreground">{file.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFileSize(file.size)} - {fileTypeLabel(file.fileType)}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {formatDate(file.createdAt)}
          </span>
        </div>

        <Link
          to={`/projects/${file.project.id}`}
          className="mt-3 inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{file.project.name}</span>
        </Link>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </a>
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-full px-3" onClick={onCopy}>
            {isCopied ? <Check /> : <Copy />}
            {isCopied ? 'Copied' : 'Copy URL'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function fileMatchesFilter(file: ProjectFileWithProject, filter: FileFilter) {
  if (filter === 'IMAGES') {
    return file.fileType.startsWith('image/') && file.fileType !== 'image/svg+xml';
  }

  if (filter === 'PDFS') {
    return file.fileType === 'application/pdf';
  }

  if (filter === 'DIAGRAMS') {
    return file.fileType === 'image/svg+xml';
  }

  return true;
}

function fileTypeLabel(fileType: string) {
  if (fileType === 'application/pdf') return 'PDF';
  if (fileType === 'image/svg+xml') return 'SVG';
  if (fileType.startsWith('image/')) return fileType.replace('image/', '').toUpperCase();
  return fileType;
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}
