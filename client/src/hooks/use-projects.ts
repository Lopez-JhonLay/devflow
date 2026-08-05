import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/query-client';

export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export type ProjectFile = {
  id: string;
  projectId: string;
  url: string;
  publicId: string;
  name: string;
  fileType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type Documentation = {
  id: string;
  projectId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  repositoryUrl: string | null;
  liveUrl: string | null;
  coverImage: string | null;
  tags: string[];
  documentation?: Documentation | null;
  files?: ProjectFile[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectPayload = {
  name?: string;
  description?: string | null;
  repositoryUrl?: string | null;
  liveUrl?: string | null;
  status?: ProjectStatus;
  tags?: string[];
  coverImage?: string | null;
};

export type CoverSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  publicId: string;
  overwrite: boolean;
  invalidate: boolean;
  signature: string;
  uploadUrl: string;
  maxFileSize: number;
  allowedFormats: string[];
};

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  publicId: string;
  folder: string;
  resourceType: string;
  overwrite: boolean;
  invalidate: boolean;
  signature: string;
  uploadUrl: string;
  maxFileSize: number;
  allowedFormats: string[];
};

export type DocumentationPayload = {
  content: string;
};

export type ProjectFilePayload = {
  url: string;
  publicId: string;
  name: string;
  fileType: string;
  size: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const response = (await apiFetch('/projects')) as ApiResponse<Project[]>;
      return response.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = (await apiFetch(`/projects/${projectId}`)) as ApiResponse<Project>;
      return response.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectPayload) => {
      const response = (await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      })) as ApiResponse<Project>;
      return response.data;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.setQueryData(projectKeys.detail(project.id), project);
    },
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectPayload) => {
      const response = (await apiFetch(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })) as ApiResponse<Project>;
      return response.data;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.setQueryData(projectKeys.detail(project.id), project);
    },
  });
}

export function useArchiveProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = (await apiFetch(`/projects/${projectId}/archive`, {
        method: 'PUT',
      })) as ApiResponse<Project>;
      return response.data;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.setQueryData(projectKeys.detail(project.id), project);
    },
  });
}

export function useUpdateProjectDocumentation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const payload: DocumentationPayload = { content };
      const response = (await apiFetch(`/projects/${projectId}/documentation`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })) as ApiResponse<Documentation>;
      return response.data;
    },
    onSuccess: (documentation) => {
      queryClient.setQueryData<Project | undefined>(projectKeys.detail(projectId), (project) => {
        if (!project) return project;

        return {
          ...project,
          documentation,
        };
      });
    },
  });
}

export async function getProjectCoverSignature(projectId: string) {
  const response = (await apiFetch(`/projects/${projectId}/cover/signature`, {
    method: 'POST',
  })) as ApiResponse<CoverSignature>;
  return response.data;
}

export async function uploadProjectCover(file: File, signature: CoverSignature) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('public_id', signature.publicId);
  formData.append('overwrite', String(signature.overwrite));
  formData.append('invalidate', String(signature.invalidate));
  formData.append('signature', signature.signature);

  const response = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Cloudinary upload failed.');
  }

  const payload = (await response.json()) as { secure_url?: string };

  if (!payload.secure_url) {
    throw new Error('Cloudinary did not return a cover image URL.');
  }

  return payload.secure_url;
}

export async function updateProjectCover(projectId: string, coverImage: string | null) {
  const response = (await apiFetch(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ coverImage }),
  })) as ApiResponse<Project>;
  return response.data;
}

export async function getUploadSignature(folder = 'assets', publicId?: string, resourceType?: string) {
  const searchParams = new URLSearchParams({ folder });

  if (publicId) {
    searchParams.set('publicId', publicId);
  }

  if (resourceType) {
    searchParams.set('resourceType', resourceType);
  }

  const response = (await apiFetch(`/uploads/sign?${searchParams.toString()}`, {
    method: 'GET',
  })) as ApiResponse<UploadSignature>;
  return response.data;
}

export function useCreateProjectFile(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectFilePayload) => {
      const response = (await apiFetch(`/projects/${projectId}/files`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })) as ApiResponse<ProjectFile>;
      return response.data;
    },
    onSuccess: (file) => {
      queryClient.setQueryData<Project | undefined>(projectKeys.detail(projectId), (project) => {
        if (!project) return project;

        return {
          ...project,
          files: [file, ...(project.files ?? [])],
        };
      });
    },
  });
}

export function useDeleteProjectFile(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      await apiFetch(`/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
      });
      return fileId;
    },
    onSuccess: (fileId) => {
      queryClient.setQueryData<Project | undefined>(projectKeys.detail(projectId), (project) => {
        if (!project) return project;

        return {
          ...project,
          files: project.files?.filter((file) => file.id !== fileId) ?? [],
        };
      });
    },
  });
}
