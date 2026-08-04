import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Archive, ExternalLink, FolderPlus, GitBranch, Loader2, Plus, X } from 'lucide-react';
import { CoverUploadField } from '@/components/shared/CoverUploadField';
import { StatusSelect } from '@/components/shared/StatusSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getProjectCoverSignature,
  projectKeys,
  updateProjectCover,
  uploadProjectCover,
  useArchiveProject,
  useCreateProject,
  useProjects,
  type Project,
  type ProjectPayload,
  type ProjectStatus,
} from '@/hooks/use-projects';

const COVER_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const COVER_MAX_FILE_SIZE = 10 * 1024 * 1024;
type ProjectStatusFilter = 'ALL' | ProjectStatus;

const PROJECT_FILTERS: Array<{ value: ProjectStatusFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const tagsSchema = z.string().refine((value) => parseTags(value).length <= 10, 'A project can have up to 10 tags.').refine(
  (value) => parseTags(value).every((tag) => tag.length <= 32),
  'Tags cannot exceed 32 characters.',
);

const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100, 'Project name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  repositoryUrl: z.string().url('Enter a valid repository URL').or(z.literal('')).optional(),
  liveUrl: z.string().url('Enter a valid live URL').or(z.literal('')).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']),
  tags: tagsSchema.optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

function toPayload(values: ProjectFormValues): ProjectPayload {
  return {
    name: values.name,
    description: values.description?.trim() || null,
    repositoryUrl: values.repositoryUrl?.trim() || null,
    liveUrl: values.liveUrl?.trim() || null,
    status: values.status,
    tags: parseTags(values.tags),
  };
}

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

function statusLabel(status: string) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'PAUSED') return 'Paused';
  return 'Archived';
}

function statusClass(status: string) {
  if (status === 'ACTIVE') return 'bg-green-500';
  if (status === 'PAUSED') return 'bg-yellow-500';
  return 'bg-muted-foreground';
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const [formError, setFormError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [coverError, setCoverError] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('ACTIVE');
  const coverPreviewRef = useRef('');

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'ALL') return projects;
    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      repositoryUrl: '',
      liveUrl: '',
      status: 'ACTIVE',
      tags: '',
    },
  });
  const selectedStatus = form.watch('status');

  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) {
        URL.revokeObjectURL(coverPreviewRef.current);
        coverPreviewRef.current = '';
      }
    };
  }, []);

  async function handleCreate(values: ProjectFormValues) {
    setFormError('');

    try {
      let project = await createProject.mutateAsync(toPayload(values));

      if (coverFile) {
        setIsUploadingCover(true);
        const signature = await getProjectCoverSignature(project.id);
        const uploadedUrl = await uploadProjectCover(coverFile, signature);
        project = await updateProjectCover(project.id, uploadedUrl);
        queryClient.invalidateQueries({ queryKey: projectKeys.all });
        queryClient.setQueryData(projectKeys.detail(project.id), project);
      }

      resetCreateModal();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setIsUploadingCover(false);
    }
  }

  function handleCoverSelect(file: File | undefined) {
    setCoverError('');

    if (!file) return;

    if (!COVER_ALLOWED_TYPES.includes(file.type)) {
      setCoverError('Use a PNG, JPG, or WebP image.');
      return;
    }

    if (file.size > COVER_MAX_FILE_SIZE) {
      setCoverError('Cover image must be 10 MB or smaller.');
      return;
    }

    revokeCoverPreview();
    const previewUrl = URL.createObjectURL(file);
    coverPreviewRef.current = previewUrl;
    setCoverFile(file);
    setCoverPreviewUrl(previewUrl);
  }

  function clearCoverSelection() {
    revokeCoverPreview();
    setCoverFile(null);
    setCoverPreviewUrl('');
    setCoverError('');
  }

  function resetCreateModal() {
    form.reset();
    clearCoverSelection();
    setFormError('');
    setIsCreateOpen(false);
  }

  function revokeCoverPreview() {
    if (coverPreviewRef.current) {
      URL.revokeObjectURL(coverPreviewRef.current);
      coverPreviewRef.current = '';
    }
  }

  if (isLoading) return <div className="animate-pulse p-4 text-muted-foreground">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Failed to load projects.</div>;

  return (
    <div className="pb-8 md:pb-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create, scan, and manage your software workspaces.</p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus />
          New project
        </Button>
      </div>

      <div className="space-y-5">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} projects={projects} />
        <ProjectGrid projects={filteredProjects} emptyText={emptyTextForFilter(statusFilter)} />
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="scrollbar-hidden max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border shadow-2xl">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Create Project</CardTitle>
                  <CardDescription>Start with the basics. You can edit everything later.</CardDescription>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={resetCreateModal}>
                  <X />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <CoverUploadField
                  id="create-project-cover-upload"
                  previewUrl={coverPreviewUrl}
                  error={coverError}
                  isBusy={isUploadingCover || createProject.isPending}
                  onSelect={handleCoverSelect}
                />

                <div className="grid gap-2">
                  <Label htmlFor="create-project-name">Name</Label>
                  <Input
                    id="create-project-name"
                    {...form.register('name')}
                    aria-invalid={Boolean(form.formState.errors.name)}
                  />
                  <FieldError message={form.formState.errors.name?.message} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="create-project-description">Description</Label>
                  <Input id="create-project-description" {...form.register('description')} />
                  <FieldError message={form.formState.errors.description?.message} />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="create-project-repo">Repository URL</Label>
                    <Input id="create-project-repo" placeholder="https://github.com/user/repo" {...form.register('repositoryUrl')} />
                    <FieldError message={form.formState.errors.repositoryUrl?.message} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-project-live">Live URL</Label>
                    <Input id="create-project-live" placeholder="https://example.com" {...form.register('liveUrl')} />
                    <FieldError message={form.formState.errors.liveUrl?.message} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="create-project-tags">Tags</Label>
                  <Input id="create-project-tags" placeholder="react, nestjs, prisma" {...form.register('tags')} />
                  <FieldError message={form.formState.errors.tags?.message} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="create-project-status">Status</Label>
                  <StatusSelect
                    id="create-project-status"
                    value={selectedStatus}
                    onChange={(status) => form.setValue('status', status, { shouldDirty: true, shouldValidate: true })}
                  />
                </div>

                {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={resetCreateModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProject.isPending || isUploadingCover}>
                    {createProject.isPending || isUploadingCover ? <Loader2 className="animate-spin" /> : <FolderPlus />}
                    Create project
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatusFilter({
  value,
  onChange,
  projects,
}: {
  value: ProjectStatusFilter;
  onChange: (value: ProjectStatusFilter) => void;
  projects: Project[];
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[28px] border border-border bg-card p-2 shadow-sm">
      {PROJECT_FILTERS.map((filter) => {
        const count = filter.value === 'ALL' ? projects.length : projects.filter((project) => project.status === filter.value).length;
        const isActive = value === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={isActive}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            onClick={() => onChange(filter.value)}
          >
            <span>{filter.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function emptyTextForFilter(filter: ProjectStatusFilter) {
  if (filter === 'ALL') return 'No projects yet.';
  if (filter === 'ACTIVE') return 'No active projects.';
  if (filter === 'PAUSED') return 'No paused projects.';
  return 'No archived projects.';
}

function ProjectGrid({ projects, emptyText }: { projects: Project[]; emptyText: string }) {
  if (!projects || projects.length === 0) {
    return emptyText ? <p className="rounded-[28px] border border-dashed border-border p-8 text-sm text-muted-foreground">{emptyText}</p> : null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const archiveProject = useArchiveProject(project.id);

  return (
    <div className="group rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-sm transition-all hover:border-ring hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusClass(project.status)}`} />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {statusLabel(project.status)}
            </span>
          </div>
          <Link
            to={`/projects/${project.id}`}
            className="block truncate text-lg font-bold text-foreground hover:text-muted-foreground"
          >
            {project.name}
          </Link>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Archive project"
          disabled={project.status === 'ARCHIVED' || archiveProject.isPending}
          onClick={() => void archiveProject.mutateAsync()}
        >
          {archiveProject.isPending ? <Loader2 className="animate-spin" /> : <Archive />}
        </Button>
      </div>

      <p className="mb-5 line-clamp-2 text-sm text-muted-foreground">
        {project.description || 'No description provided.'}
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {project.tags.length > 0 ? (
          project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
        {project.repositoryUrl && (
          <span className="inline-flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" />
            Repo
          </span>
        )}
        {project.liveUrl && (
          <span className="inline-flex items-center gap-1">
            <ExternalLink className="h-3.5 w-3.5" />
            Live
          </span>
        )}
        <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
      <Link
        to={`/projects/${project.id}`}
        className="mt-5 inline-flex text-sm font-semibold text-foreground hover:text-muted-foreground"
      >
        View details
      </Link>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
