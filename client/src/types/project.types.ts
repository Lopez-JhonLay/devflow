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

export type ProjectFileWithProject = ProjectFile & {
  project: {
    id: string;
    name: string;
    status: ProjectStatus;
  };
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
