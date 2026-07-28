import { useOutletContext } from 'react-router-dom';
import { useWorkspaceActivity } from '@/hooks/use-workspace';
import type { AuthUser } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus, Scissors, Cloud, Copy, FileText, Image } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useOutletContext<{ user: AuthUser }>();
  const { data, isLoading, error } = useWorkspaceActivity();

  if (isLoading) return <div className="animate-pulse text-gray-400 p-4">Loading workspace...</div>;
  if (error) return <div className="text-red-500 p-4">Failed to load activity.</div>;

  return (
    <div className="font-sans pb-8 md:pb-12 animate-in fade-in duration-500">
      {/* Responsive Typography */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-8 md:mb-10">
        Welcome back, {user?.name || 'Developer'} <span className="inline-block animate-wave">👋</span>
      </h1>

      {/* QUICK ACTIONS */}
      <div className="mb-10 md:mb-12">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-1 md:px-0">Quick Actions</h2>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Button
            variant="outline"
            className="rounded-xl sm:rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 h-12 px-6 w-full sm:w-auto sm:flex-1 sm:max-w-60 text-sm font-medium transition-all"
          >
            <Plus className="mr-2 h-4 w-4 text-gray-500" /> New Project
          </Button>
          <Button
            variant="outline"
            className="rounded-xl sm:rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 h-12 px-6 w-full sm:w-auto sm:flex-1 sm:max-w-60 text-sm font-medium transition-all"
          >
            <Scissors className="mr-2 h-4 w-4 text-gray-500" /> New Snippet
          </Button>
          <Button
            variant="outline"
            className="rounded-xl sm:rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 h-12 px-6 w-full sm:w-auto sm:flex-1 sm:max-w-60 text-sm font-medium transition-all"
          >
            <Cloud className="mr-2 h-4 w-4 text-gray-500" /> Upload Asset
          </Button>
        </div>
      </div>

      {/* RECENT PROJECTS */}
      <div className="mb-10 md:mb-12">
        <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div className="h-px bg-gray-200 w-8 md:w-12"></div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
            Recent Projects
          </h2>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {data?.recentProjects?.length === 0 ? (
            <p className="text-sm text-gray-400 col-span-full px-1">No recent projects.</p>
          ) : (
            data?.recentProjects?.map((project) => (
              <div
                key={project.id}
                className="p-4 md:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col"
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
                <h3 className="font-bold text-gray-900 truncate mb-1.5">{project.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 md:mb-5 flex-1">
                  {project.description || 'No description provided.'}
                </p>
                <div className="text-xs text-gray-400 font-medium">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12">
        {/* RECENT SNIPPETS */}
        <div>
          <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="h-px bg-gray-200 w-8 md:w-12"></div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
              Recent Snippets
            </h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          <div className="space-y-3">
            {data?.recentSnippets?.length === 0 ? (
              <p className="text-sm text-gray-400 px-1">No recent snippets.</p>
            ) : (
              data?.recentSnippets?.map((snippet) => (
                <div
                  key={snippet.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm flex items-center justify-between group hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0 pr-3 md:pr-4">
                    <div className="text-[10px] md:text-xs font-bold text-blue-600 mb-1 md:mb-1.5 uppercase tracking-widest">
                      [{snippet.language}]
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base truncate mb-0.5 md:mb-1">
                      {snippet.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{snippet.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="h-px bg-gray-200 w-8 md:w-12"></div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
              Recent Uploads
            </h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          {/* Mobile: 1 col, Tablet/Desktop: 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data?.recentUploads?.length === 0 ? (
              <p className="text-sm text-gray-400 col-span-full px-1">No recent files.</p>
            ) : (
              data?.recentUploads?.map((file) => (
                <div
                  key={file.id}
                  className="p-3 md:p-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm flex items-center gap-3 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors">
                    {file.fileType.includes('image') ? (
                      <Image className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                    ) : (
                      <FileText className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{file.name}</p>
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-widest">
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
