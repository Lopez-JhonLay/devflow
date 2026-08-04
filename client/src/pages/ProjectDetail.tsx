import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Edit3, ExternalLink, FileText, GitBranch, ImageOff, Loader2, Save, X } from 'lucide-react';
import { AssetUpload } from '@/components/projects/AssetUpload';
import { MarkdownEditor } from '@/components/projects/MarkdownEditor';
import { CoverUploadField } from '@/components/shared/CoverUploadField';
import { StatusSelect } from '@/components/shared/StatusSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getProjectCoverSignature,
  uploadProjectCover,
  useProject,
  useUpdateProject,
  type ProjectPayload,
  type ProjectStatus,
} from '@/hooks/use-projects';

const COVER_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const COVER_MAX_FILE_SIZE = 10 * 1024 * 1024;

const tagsSchema = z.string().refine((value) => parseTags(value).length <= 10, 'A project can have up to 10 tags.').refine(
  (value) => parseTags(value).every((tag) => tag.length <= 32),
  'Tags cannot exceed 32 characters.',
);

const projectOverviewSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100, 'Project name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  repositoryUrl: z.string().url('Enter a valid repository URL').or(z.literal('')).optional(),
  liveUrl: z.string().url('Enter a valid live URL').or(z.literal('')).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']),
  tags: tagsSchema.optional(),
});

type ProjectOverviewValues = z.infer<typeof projectOverviewSchema>;

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

function toPayload(values: ProjectOverviewValues): ProjectPayload {
  return {
    name: values.name,
    description: values.description?.trim() || null,
    repositoryUrl: values.repositoryUrl?.trim() || null,
    liveUrl: values.liveUrl?.trim() || null,
    status: values.status,
    tags: parseTags(values.tags),
  };
}

function statusClass(status: ProjectStatus) {
  if (status === 'ACTIVE') return 'bg-green-500';
  if (status === 'PAUSED') return 'bg-yellow-500';
  return 'bg-muted-foreground';
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(id);
  const updateProject = useUpdateProject(id ?? '');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [coverError, setCoverError] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverPreviewRef = useRef('');

  const form = useForm<ProjectOverviewValues>({
    resolver: zodResolver(projectOverviewSchema),
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

  const defaultValues = useMemo<ProjectOverviewValues | null>(() => {
    if (!project) return null;

    return {
      name: project.name,
      description: project.description ?? '',
      repositoryUrl: project.repositoryUrl ?? '',
      liveUrl: project.liveUrl ?? '',
      status: project.status,
      tags: project.tags.join(', '),
    };
  }, [project]);

  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) {
        URL.revokeObjectURL(coverPreviewRef.current);
        coverPreviewRef.current = '';
      }
    };
  }, []);

  function openEditModal() {
    if (!defaultValues || !project) return;

    form.reset(defaultValues);
    clearLocalCoverPreview();
    setCoverFile(null);
    setCoverPreviewUrl(project.coverImage ?? '');
    setCoverError('');
    setFormError('');
    setFormMessage('');
    setIsEditOpen(true);
  }

  function closeEditModal() {
    clearLocalCoverPreview();
    setCoverFile(null);
    setCoverPreviewUrl('');
    setCoverError('');
    setFormError('');
    setIsEditOpen(false);
  }

  async function handleUpdate(values: ProjectOverviewValues) {
    if (!id) return;
    setFormMessage('');
    setFormError('');

    try {
      const payload = toPayload(values);

      if (coverFile) {
        setIsUploadingCover(true);
        const signature = await getProjectCoverSignature(id);
        payload.coverImage = await uploadProjectCover(coverFile, signature);
      }

      await updateProject.mutateAsync(payload);
      setFormMessage('Project updated.');
      closeEditModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update project.');
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

    clearLocalCoverPreview();
    const previewUrl = URL.createObjectURL(file);
    coverPreviewRef.current = previewUrl;
    setCoverFile(file);
    setCoverPreviewUrl(previewUrl);
  }

  function clearLocalCoverPreview() {
    if (coverPreviewRef.current) {
      URL.revokeObjectURL(coverPreviewRef.current);
      coverPreviewRef.current = '';
    }
  }

  if (isLoading) return <div className="animate-pulse p-4 text-muted-foreground">Loading project...</div>;

  if (error || !project) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-destructive">Project not found.</p>
        <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft />
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-8 md:pb-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to="/projects" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Projects
          </Link>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${statusClass(project.status)}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{project.status}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {project.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.repositoryUrl && (
            <Button type="button" variant="outline" onClick={() => window.open(project.repositoryUrl ?? '', '_blank')}>
              <GitBranch />
              Repo
            </Button>
          )}
          {project.liveUrl && (
            <Button type="button" variant="outline" onClick={() => window.open(project.liveUrl ?? '', '_blank')}>
              <ExternalLink />
              Live
            </Button>
          )}
          <Button type="button" onClick={openEditModal}>
            <Edit3 />
            Edit
          </Button>
        </div>
      </div>

      {formMessage && <p className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">{formMessage}</p>}
      {formError && !isEditOpen && <p className="mb-4 text-sm font-medium text-destructive">{formError}</p>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card className="overflow-hidden border border-border shadow-sm">
            {project.coverImage ? (
              <img src={project.coverImage} alt={`${project.name} cover`} className="h-72 w-full object-cover" />
            ) : (
              <div className="flex h-72 flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                <ImageOff className="h-10 w-10" />
                <span className="text-sm">No cover image</span>
              </div>
            )}
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>Project details used across your workspace.</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={() => setIsDocumentationOpen(true)}>
                  <FileText />
                  Open docs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Repository" value={project.repositoryUrl || 'Not set'} />
              <InfoRow label="Live URL" value={project.liveUrl || 'Not set'} />
              <InfoRow label="Status" value={project.status} />
              <InfoRow label="Updated" value={new Date(project.updatedAt).toLocaleDateString()} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle>Project Stats</CardTitle>
              <CardDescription>Overview metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Files" value={String(project.files?.length ?? 0)} />
              <InfoRow label="Documentation" value={project.documentation ? 'Ready' : 'Missing'} />
              <InfoRow label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
              <InfoRow label="Updated" value={new Date(project.updatedAt).toLocaleDateString()} />
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.tags.length > 0 ? (
                  project.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <AssetUpload projectId={project.id} files={project.files ?? []} />
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="scrollbar-hidden max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border shadow-2xl">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Edit Project</CardTitle>
                  <CardDescription>Update project details and cover image.</CardDescription>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeEditModal}>
                  <X />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                <CoverUploadField
                  id="edit-project-cover-upload"
                  previewUrl={coverPreviewUrl}
                  error={coverError}
                  isBusy={isUploadingCover || updateProject.isPending}
                  onSelect={handleCoverSelect}
                />

                <div className="grid gap-2">
                  <Label htmlFor="project-name">Name</Label>
                  <Input id="project-name" {...form.register('name')} aria-invalid={Boolean(form.formState.errors.name)} />
                  <FieldError message={form.formState.errors.name?.message} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Input id="project-description" {...form.register('description')} />
                  <FieldError message={form.formState.errors.description?.message} />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="project-repo">Repository URL</Label>
                    <Input id="project-repo" {...form.register('repositoryUrl')} />
                    <FieldError message={form.formState.errors.repositoryUrl?.message} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="project-live">Live URL</Label>
                    <Input id="project-live" {...form.register('liveUrl')} />
                    <FieldError message={form.formState.errors.liveUrl?.message} />
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-[180px_1fr]">
                  <div className="grid gap-2">
                    <Label htmlFor="project-status">Status</Label>
                    <StatusSelect
                      id="project-status"
                      value={selectedStatus}
                      onChange={(status) => form.setValue('status', status, { shouldDirty: true, shouldValidate: true })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="project-tags">Tags</Label>
                    <Input id="project-tags" placeholder="react, nestjs" {...form.register('tags')} />
                    <FieldError message={form.formState.errors.tags?.message} />
                  </div>
                </div>

                {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateProject.isPending || isUploadingCover}>
                    {updateProject.isPending || isUploadingCover ? <Loader2 className="animate-spin" /> : <Save />}
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {isDocumentationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="scrollbar-hidden max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Documentation</h2>
                <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsDocumentationOpen(false)}>
                <X />
              </Button>
            </div>
            <div className="p-5">
              <MarkdownEditor
                key={project.id}
                projectId={project.id}
                initialContent={project.documentation?.content ?? ''}
                variant="plain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
