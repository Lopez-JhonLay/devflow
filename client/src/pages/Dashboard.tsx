import { Link, useOutletContext } from 'react-router-dom';
import { useWorkspaceActivity } from '@/hooks/use-workspace';
import type { AuthUser } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus, Scissors, Cloud, Copy, FileText, Image } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useOutletContext<{ user: AuthUser }>();
  const { data, isLoading, error } = useWorkspaceActivity();

  if (isLoading) return <div className="animate-pulse p-4 text-muted-foreground">Loading workspace...</div>;
  if (error) return <div className="p-4 text-destructive">Failed to load activity.</div>;

  return (
    <div className="font-sans pb-8 md:pb-12 animate-in fade-in duration-500">
      {/* Responsive Typography */}
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:mb-10 md:text-4xl">
        Welcome back, {user?.name || 'Developer'} <span className="inline-block animate-wave">👋</span>
      </h1>

      {/* QUICK ACTIONS */}
      <div className="mb-10 md:mb-12">
        <h2 className="mb-4 px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground md:px-0">
          Quick Actions
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Link
            to="/projects"
            className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-medium shadow-sm transition-all hover:bg-muted sm:w-auto sm:max-w-60 sm:flex-1"
          >
            <Plus className="mr-2 h-4 w-4 text-muted-foreground" /> New Project
          </Link>
          <Button
            variant="outline"
            className="h-12 w-full border-border bg-card px-6 text-sm font-medium shadow-sm transition-all hover:bg-muted sm:w-auto sm:max-w-60 sm:flex-1"
          >
            <Scissors className="mr-2 h-4 w-4 text-muted-foreground" /> New Snippet
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full border-border bg-card px-6 text-sm font-medium shadow-sm transition-all hover:bg-muted sm:w-auto sm:max-w-60 sm:flex-1"
          >
            <Cloud className="mr-2 h-4 w-4 text-muted-foreground" /> Upload Asset
          </Button>
        </div>
      </div>

      {/* RECENT PROJECTS */}
      <div className="mb-10 md:mb-12">
        <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div className="h-px w-8 bg-border md:w-12"></div>
          <h2 className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Recent Projects
          </h2>
          <div className="h-px flex-1 bg-border"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {data?.recentProjects?.length === 0 ? (
            <p className="col-span-full px-1 text-sm text-muted-foreground">No recent projects.</p>
          ) : (
            data?.recentProjects?.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group flex cursor-pointer flex-col rounded-[28px] border border-border bg-card p-4 shadow-sm transition-all hover:border-ring hover:shadow-md md:p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`h-2 w-2 rounded-full ${project.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}
                  ></div>
                  <span
                    className={`text-xs font-semibold ${project.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}
                  >
                    {project.status === 'ACTIVE' ? 'Active' : 'Paused'}
                  </span>
                </div>
                <h3 className="mb-1.5 truncate font-bold text-card-foreground">{project.name}</h3>
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground md:mb-5">
                  {project.description || 'No description provided.'}
                </p>
                <div className="text-xs font-medium text-muted-foreground">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12">
        {/* RECENT SNIPPETS */}
        <div>
          <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="h-px w-8 bg-border md:w-12"></div>
            <h2 className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Recent Snippets
            </h2>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          <div className="space-y-3">
            {data?.recentSnippets?.length === 0 ? (
              <p className="px-1 text-sm text-muted-foreground">No recent snippets.</p>
            ) : (
              data?.recentSnippets?.map((snippet) => (
                <div
                  key={snippet.id}
                  className="group flex cursor-pointer items-center justify-between rounded-[28px] border border-border bg-card p-4 shadow-sm transition-all hover:border-ring hover:shadow-md"
                >
                  <div className="flex-1 min-w-0 pr-3 md:pr-4">
                    <div className="text-[10px] md:text-xs font-bold text-blue-600 mb-1 md:mb-1.5 uppercase tracking-widest">
                      [{snippet.language}]
                    </div>
                    <h3 className="mb-0.5 truncate text-sm font-bold text-card-foreground md:mb-1 md:text-base">
                      {snippet.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground md:text-sm">{snippet.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground md:opacity-0 group-hover:opacity-100"
                  >
                    <Copy className="h-4 w-4 md:mr-1.5" />
                    <span className="hidden md:inline-block text-xs font-semibold">Copy</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT UPLOADS */}
        <div>
          <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="h-px w-8 bg-border md:w-12"></div>
            <h2 className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Recent Uploads
            </h2>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          {/* Mobile: 1 col, Tablet/Desktop: 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data?.recentUploads?.length === 0 ? (
              <p className="col-span-full px-1 text-sm text-muted-foreground">No recent files.</p>
            ) : (
              data?.recentUploads?.map((file) => (
                <div
                  key={file.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-[28px] border border-border bg-card p-3 shadow-sm transition-all hover:border-ring hover:shadow-md md:p-3.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted transition-colors group-hover:bg-accent md:h-12 md:w-12">
                    {file.fileType.includes('image') ? (
                      <Image className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 truncate text-sm font-bold text-card-foreground">{file.name}</p>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground md:text-xs">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
