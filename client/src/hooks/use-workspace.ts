import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants'; //

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
}

export interface Snippet {
  id: string;
  title: string;
  description: string | null;
  language: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  fileType: string;
  size: number;
}

export interface WorkspaceActivity {
  recentProjects: Project[];
  recentSnippets: Snippet[];
  recentUploads: ProjectFile[];
}

export function useWorkspaceActivity() {
  return useQuery<WorkspaceActivity>({
    queryKey: ['workspace', 'activity'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/workspace/activity`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workspace activity');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
