import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { Check, Copy, Edit3, Loader2, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useCreateSnippet,
  useDeleteSnippet,
  useSnippets,
  useUpdateSnippet,
  type Snippet,
  type SnippetPayload,
} from '@/hooks/use-snippets';

const tagsSchema = z.string().refine((value) => parseTags(value).length <= 10, 'A snippet can have up to 10 tags.').refine(
  (value) => parseTags(value).every((tag) => tag.length <= 32),
  'Tags cannot exceed 32 characters.',
);

const snippetFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().max(300, 'Description cannot exceed 300 characters').optional(),
  language: z.string().trim().min(1, 'Language is required').max(50, 'Language cannot exceed 50 characters'),
  code: z.string().refine((value) => value.trim().length > 0, 'Code is required').refine(
    (value) => value.length <= 100000,
    'Code cannot exceed 100,000 characters',
  ),
  tags: tagsSchema.optional(),
});

type SnippetFormValues = z.infer<typeof snippetFormSchema>;
type FavoriteFilter = 'ALL' | 'FAVORITES';

const FAVORITE_FILTERS: Array<{ value: FavoriteFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'FAVORITES', label: 'Favorites' },
];

function parseTags(tags?: string) {
  return Array.from(
    new Set(
      (tags ?? '')
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function toPayload(values: SnippetFormValues, isFavorite?: boolean): SnippetPayload {
  return {
    title: values.title,
    description: values.description?.trim() || null,
    language: values.language.trim().toLowerCase(),
    code: values.code,
    isFavorite,
    tags: parseTags(values.tags),
  };
}

export default function SnippetsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>('ALL');
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 350);
  const { data: snippets = [], isLoading, error } = useSnippets({
    search: debouncedSearch.trim(),
  });
  const sortedSnippets = useMemo(
    () =>
      snippets
        .filter((snippet) => favoriteFilter === 'ALL' || snippet.isFavorite)
        .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)),
    [favoriteFilter, snippets],
  );

  function openCreateForm() {
    setEditingSnippet(null);
    setIsFormOpen(true);
  }

  function openEditForm(snippet: Snippet) {
    setEditingSnippet(snippet);
    setIsFormOpen(true);
  }

  return (
    <div className="pb-8 md:pb-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Snippets</h1>
          <p className="mt-2 text-sm text-muted-foreground">Find, reuse, and manage code patterns.</p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus />
          New snippet
        </Button>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            placeholder="Search title, code, language, or tags..."
            className="pl-10"
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <FavoriteFilterControl value={favoriteFilter} onChange={setFavoriteFilter} />
      </div>

      {isLoading && <div className="animate-pulse p-4 text-muted-foreground">Loading snippets...</div>}
      {error && <div className="p-4 text-destructive">Failed to load snippets.</div>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {sortedSnippets.length > 0 ? (
            sortedSnippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} onEdit={openEditForm} />
            ))
          ) : (
            <p className="rounded-[28px] border border-dashed border-border p-8 text-sm text-muted-foreground">
              No snippets found.
            </p>
          )}
        </div>
      )}

      {isFormOpen && (
        <SnippetFormModal
          snippet={editingSnippet}
          onClose={() => {
            setEditingSnippet(null);
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

function FavoriteFilterControl({
  value,
  onChange,
}: {
  value: FavoriteFilter;
  onChange: (value: FavoriteFilter) => void;
}) {
  return (
    <div className="flex w-fit rounded-full border border-border bg-card p-1 shadow-sm">
      {FAVORITE_FILTERS.map((filter) => {
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

function SnippetCard({ snippet, onEdit }: { snippet: Snippet; onEdit: (snippet: Snippet) => void }) {
  const updateSnippet = useUpdateSnippet(snippet.id);
  const deleteSnippet = useDeleteSnippet();
  const [didCopy, setDidCopy] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet.code);
    setDidCopy(true);
    window.setTimeout(() => setDidCopy(false), 1200);
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">{snippet.title}</CardTitle>
            <CardDescription className="line-clamp-1">
              {snippet.description || 'No description provided.'}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={snippet.isFavorite ? 'Remove favorite' : 'Favorite'}
              onClick={() => void updateSnippet.mutateAsync({ isFavorite: !snippet.isFavorite })}
            >
              <Star
                className={`transition-none ${snippet.isFavorite ? 'fill-foreground text-foreground' : 'fill-transparent text-muted-foreground'}`}
              />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
              {didCopy ? <Check /> : <Copy />}
              {didCopy ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <HighlightedCode code={snippet.code} language={snippet.language} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {snippet.language}
          </span>
          {snippet.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {tag}
            </span>
          ))}
          <div className="ml-auto flex gap-1">
            <Button type="button" variant="ghost" size="icon" title="Edit snippet" onClick={() => onEdit(snippet)}>
              <Edit3 />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Delete snippet"
              disabled={deleteSnippet.isPending}
              onClick={() => void deleteSnippet.mutateAsync(snippet.id)}
            >
              {deleteSnippet.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SnippetFormModal({ snippet, onClose }: { snippet: Snippet | null; onClose: () => void }) {
  const createSnippet = useCreateSnippet();
  const updateSnippet = useUpdateSnippet(snippet?.id ?? '');
  const [formError, setFormError] = useState('');
  const form = useForm<SnippetFormValues>({
    resolver: zodResolver(snippetFormSchema),
    defaultValues: {
      title: snippet?.title ?? '',
      description: snippet?.description ?? '',
      language: snippet?.language ?? 'typescript',
      code: snippet?.code ?? '',
      tags: snippet?.tags.join(', ') ?? '',
    },
  });

  async function handleSubmit(values: SnippetFormValues) {
    setFormError('');

    try {
      if (snippet) {
        await updateSnippet.mutateAsync(toPayload(values, snippet.isFavorite));
      } else {
        await createSnippet.mutateAsync(toPayload(values, false));
      }

      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save snippet.');
    }
  }

  const isPending = createSnippet.isPending || updateSnippet.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="scrollbar-hidden max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-border shadow-2xl">
        <CardHeader className="border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{snippet ? 'Edit Snippet' : 'New Snippet'}</CardTitle>
              <CardDescription>{snippet ? 'Update reusable code.' : 'Save a reusable code pattern.'}</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="snippet-title">Title</Label>
              <Input id="snippet-title" {...form.register('title')} aria-invalid={Boolean(form.formState.errors.title)} />
              <FieldError message={form.formState.errors.title?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="snippet-description">Description</Label>
              <Input id="snippet-description" {...form.register('description')} />
              <FieldError message={form.formState.errors.description?.message} />
            </div>

            <div className="grid gap-2 md:grid-cols-[200px_1fr]">
              <div className="grid gap-2">
                <Label htmlFor="snippet-language">Language</Label>
                <Input id="snippet-language" {...form.register('language')} />
                <FieldError message={form.formState.errors.language?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="snippet-tags">Tags</Label>
                <Input id="snippet-tags" placeholder="react, hooks, query" {...form.register('tags')} />
                <FieldError message={form.formState.errors.tags?.message} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="snippet-code">Code</Label>
              <textarea
                id="snippet-code"
                {...form.register('code')}
                aria-invalid={Boolean(form.formState.errors.code)}
                className="min-h-80 resize-y rounded-[24px] border border-input bg-muted/40 p-4 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              />
              <FieldError message={form.formState.errors.code?.message} />
            </div>

            {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                {snippet ? 'Save changes' : 'Create snippet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function HighlightedCode({ code, language }: { code: string; language: string }) {
  const highlightedCode = useMemo(() => {
    try {
      if (hljs.getLanguage(language)) {
        return hljs.highlight(code, { language, ignoreIllegals: true }).value;
      }
    } catch {
      return escapeHtml(code);
    }

    return hljs.highlightAuto(code).value;
  }, [code, language]);

  return (
    <pre className="max-h-64 overflow-auto rounded-[24px] border border-border bg-muted p-4">
      <code
        className="font-mono text-sm leading-6"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
