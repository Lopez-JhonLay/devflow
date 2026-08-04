import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProjectFileDto } from './dto/create-project-file.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateDocumentationDto } from './dto/update-documentation.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_STATUSES = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;
const MAX_TAGS = 10;
const MAX_DOCUMENTATION_LENGTH = 200_000;
const COVER_MAX_FILE_SIZE = 10 * 1024 * 1024;
const COVER_ALLOWED_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];
const PROJECT_FILE_MAX_SIZE = 10 * 1024 * 1024;
const PROJECT_FILE_MAX_NAME_LENGTH = 160;
const PROJECT_FILE_MAX_TYPE_LENGTH = 120;

type ProjectStatus = (typeof PROJECT_STATUSES)[number];

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async listProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        tags: {
          include: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: projects.map((project) => this.serializeProject(project)),
    };
  }

  async getProject(userId: string, projectId: string) {
    this.validateProjectId(projectId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        documentation: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        files: {
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return {
      success: true,
      data: this.serializeProject(project),
    };
  }

  async createProjectCoverUploadSignature(userId: string, projectId: string) {
    this.validateProjectId(projectId);
    await this.ensureProjectOwnership(userId, projectId);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured.',
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `devflow/project-covers/${userId}/${projectId}`;
    const uploadParams = {
      invalidate: true,
      overwrite: true,
      public_id: publicId,
      timestamp,
    };

    return {
      success: true,
      data: {
        cloudName,
        apiKey,
        timestamp,
        publicId,
        invalidate: true,
        overwrite: true,
        signature: this.signCloudinaryParams(uploadParams, apiSecret),
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        maxFileSize: COVER_MAX_FILE_SIZE,
        allowedFormats: COVER_ALLOWED_FORMATS,
      },
    };
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    this.validateProjectId(projectId);

    const existingProject = await this.ensureProjectOwnership(
      userId,
      projectId,
    );

    const data = this.validateUpdateProjectInput(dto ?? {});
    const hasTagUpdate = dto?.tags !== undefined;
    const tagNames = hasTagUpdate ? this.normalizeTags(dto.tags) : [];

    if (Object.keys(data).length === 0 && !hasTagUpdate) {
      throw new BadRequestException('At least one project field is required.');
    }

    if (data.coverImage === null && existingProject.coverImage) {
      await this.deleteProjectCoverFromCloudinary(userId, projectId);
    }

    const project = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.project.update({
          where: { id: projectId },
          data,
        });
      }

      if (hasTagUpdate) {
        await tx.projectTags.deleteMany({
          where: { projectId },
        });

        if (tagNames.length > 0) {
          const tags = await Promise.all(
            tagNames.map((name) =>
              tx.tag.upsert({
                where: { name },
                update: {},
                create: { name },
              }),
            ),
          );

          await tx.projectTags.createMany({
            data: tags.map((tag) => ({
              projectId,
              tagId: tag.id,
            })),
          });
        }
      }

      return tx.project.findUniqueOrThrow({
        where: { id: projectId },
        include: {
          documentation: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          files: {
            orderBy: { createdAt: 'desc' },
          },
          tags: {
            include: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    return {
      success: true,
      data: this.serializeProject(project),
    };
  }

  async archiveProject(userId: string, projectId: string) {
    this.validateProjectId(projectId);

    await this.ensureProjectOwnership(userId, projectId);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'ARCHIVED' },
      include: {
        documentation: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        files: {
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: this.serializeProject(project),
    };
  }

  async updateDocumentation(
    userId: string,
    projectId: string,
    dto: UpdateDocumentationDto,
  ) {
    this.validateProjectId(projectId);

    await this.ensureProjectOwnership(userId, projectId);

    const content = this.validateDocumentationContent(dto ?? {});

    const documentation = await this.prisma.documentation.upsert({
      where: { projectId },
      update: { content },
      create: {
        projectId,
        content,
      },
      select: {
        id: true,
        projectId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: documentation,
    };
  }

  async createProjectFile(
    userId: string,
    projectId: string,
    dto: CreateProjectFileDto,
  ) {
    this.validateProjectId(projectId);
    await this.ensureProjectOwnership(userId, projectId);

    const data = this.validateProjectFileInput(userId, dto ?? {});

    const file = await this.prisma.projectFile.create({
      data: {
        projectId,
        url: data.url,
        publicId: data.publicId,
        name: data.name,
        fileType: data.fileType,
        size: data.size,
      },
    });

    return {
      success: true,
      data: file,
    };
  }

  async deleteProjectFile(userId: string, projectId: string, fileId: string) {
    this.validateProjectId(projectId);
    this.validateFileId(fileId);
    await this.ensureProjectOwnership(userId, projectId);

    const file = await this.prisma.projectFile.findFirst({
      where: {
        id: fileId,
        projectId,
      },
    });

    if (!file) {
      throw new NotFoundException('Project file not found.');
    }

    await this.deleteUploadedFileFromCloudinary(file.publicId);

    await this.prisma.projectFile.delete({
      where: { id: fileId },
    });

    return {
      success: true,
      message: 'Project file deleted successfully.',
    };
  }

  async deleteProject(userId: string, projectId: string) {
    this.validateProjectId(projectId);

    const project = await this.ensureProjectOwnership(userId, projectId);

    if (project.coverImage) {
      await this.deleteProjectCoverFromCloudinary(userId, projectId);
    }

    const files = await this.prisma.projectFile.findMany({
      where: { projectId },
      select: { publicId: true },
    });

    await Promise.all(
      files.map((file) => this.deleteUploadedFileFromCloudinary(file.publicId)),
    );

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return {
      success: true,
      message: 'Project deleted successfully.',
    };
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    const data = this.validateCreateProjectInput(dto ?? {});
    const tagNames = this.normalizeTags(dto?.tags);

    const project = await this.prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          repositoryUrl: data.repositoryUrl,
          liveUrl: data.liveUrl,
          status: data.status,
          coverImage: data.coverImage,
          documentation: {
            create: {
              content: '',
            },
          },
        },
      });

      if (tagNames.length > 0) {
        const tags = await Promise.all(
          tagNames.map((name) =>
            tx.tag.upsert({
              where: { name },
              update: {},
              create: { name },
            }),
          ),
        );

        await tx.projectTags.createMany({
          data: tags.map((tag) => ({
            projectId: createdProject.id,
            tagId: tag.id,
          })),
        });
      }

      return tx.project.findUniqueOrThrow({
        where: { id: createdProject.id },
        include: {
          documentation: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    return {
      success: true,
      data: this.serializeProject(project),
    };
  }

  private serializeProject<
    T extends {
      tags: Array<{
        tag: {
          name: string;
        };
      }>;
    },
  >(project: T) {
    return {
      ...project,
      tags: project.tags.map((projectTag) => projectTag.tag.name),
    };
  }

  private validateProjectId(projectId: string) {
    if (typeof projectId !== 'string' || projectId.trim().length === 0) {
      throw new BadRequestException('Project id is required.');
    }
  }

  private validateFileId(fileId: string) {
    if (typeof fileId !== 'string' || fileId.trim().length === 0) {
      throw new BadRequestException('File id is required.');
    }
  }

  private validateDocumentationContent(dto: Partial<UpdateDocumentationDto>) {
    if (typeof dto.content !== 'string') {
      throw new BadRequestException('Documentation content is required.');
    }

    if (dto.content.length > MAX_DOCUMENTATION_LENGTH) {
      throw new BadRequestException(
        'Documentation content cannot exceed 200,000 characters.',
      );
    }

    return dto.content;
  }

  private async ensureProjectOwnership(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: {
        id: true,
        coverImage: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  private validateCreateProjectInput(dto: Partial<CreateProjectDto>) {
    if (typeof dto.name !== 'string') {
      throw new BadRequestException('Project name is required.');
    }

    const name = dto.name.trim();

    if (name.length < 1) {
      throw new BadRequestException('Project name is required.');
    }

    if (name.length > 100) {
      throw new BadRequestException(
        'Project name cannot exceed 100 characters.',
      );
    }

    const description = this.validateOptionalText(
      dto.description,
      'Description',
      500,
    );
    const repositoryUrl = this.validateOptionalUrl(
      dto.repositoryUrl,
      'Repository URL',
    );
    const liveUrl = this.validateOptionalUrl(dto.liveUrl, 'Live URL');
    const coverImage = this.validateOptionalUrl(dto.coverImage, 'Cover image');
    const status = this.validateStatus(dto.status);

    return {
      name,
      description,
      repositoryUrl,
      liveUrl,
      coverImage,
      status,
    };
  }

  private validateUpdateProjectInput(dto: Partial<UpdateProjectDto>) {
    const data: {
      name?: string;
      description?: string | null;
      repositoryUrl?: string | null;
      liveUrl?: string | null;
      status?: ProjectStatus;
      coverImage?: string | null;
    } = {};

    if (dto.name !== undefined) {
      if (typeof dto.name !== 'string') {
        throw new BadRequestException('Project name must be a string.');
      }

      const name = dto.name.trim();

      if (name.length < 1) {
        throw new BadRequestException('Project name is required.');
      }

      if (name.length > 100) {
        throw new BadRequestException(
          'Project name cannot exceed 100 characters.',
        );
      }

      data.name = name;
    }

    if (dto.description !== undefined) {
      data.description = this.validateOptionalText(
        dto.description,
        'Description',
        500,
      );
    }

    if (dto.repositoryUrl !== undefined) {
      data.repositoryUrl = this.validateOptionalUrl(
        dto.repositoryUrl,
        'Repository URL',
      );
    }

    if (dto.liveUrl !== undefined) {
      data.liveUrl = this.validateOptionalUrl(dto.liveUrl, 'Live URL');
    }

    if (dto.coverImage !== undefined) {
      data.coverImage = this.validateOptionalUrl(dto.coverImage, 'Cover image');
    }

    if (dto.status !== undefined) {
      data.status = this.validateStatus(dto.status);
    }

    return data;
  }

  private validateProjectFileInput(
    userId: string,
    dto: Partial<CreateProjectFileDto>,
  ) {
    if (typeof dto.url !== 'string') {
      throw new BadRequestException('File URL is required.');
    }

    let url: URL;

    try {
      url = new URL(dto.url.trim());
    } catch {
      throw new BadRequestException('File URL must be a valid URL.');
    }

    this.validateCloudinaryFileUrl(userId, url);

    if (typeof dto.publicId !== 'string') {
      throw new BadRequestException('File public id is required.');
    }

    const publicId = dto.publicId.trim();
    const allowedPublicIdPrefix = `devflow/uploads/${userId}/`;

    if (!publicId.startsWith(allowedPublicIdPrefix)) {
      throw new BadRequestException(
        'File public id must belong to the current user upload folder.',
      );
    }

    if (typeof dto.name !== 'string') {
      throw new BadRequestException('File name is required.');
    }

    const name = dto.name.trim();

    if (name.length < 1) {
      throw new BadRequestException('File name is required.');
    }

    if (name.length > PROJECT_FILE_MAX_NAME_LENGTH) {
      throw new BadRequestException(
        `File name cannot exceed ${PROJECT_FILE_MAX_NAME_LENGTH} characters.`,
      );
    }

    if (typeof dto.fileType !== 'string') {
      throw new BadRequestException('File type is required.');
    }

    const fileType = dto.fileType.trim().toLowerCase();

    if (fileType.length < 1) {
      throw new BadRequestException('File type is required.');
    }

    if (fileType.length > PROJECT_FILE_MAX_TYPE_LENGTH) {
      throw new BadRequestException(
        `File type cannot exceed ${PROJECT_FILE_MAX_TYPE_LENGTH} characters.`,
      );
    }

    if (!Number.isInteger(dto.size)) {
      throw new BadRequestException('File size must be an integer.');
    }

    const size = Number(dto.size);

    if (size < 1) {
      throw new BadRequestException('File size must be greater than zero.');
    }

    if (size > PROJECT_FILE_MAX_SIZE) {
      throw new BadRequestException('File size cannot exceed 10 MB.');
    }

    return {
      url: url.toString(),
      publicId,
      name,
      fileType,
      size,
    };
  }

  private validateCloudinaryFileUrl(userId: string, url: URL) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured.',
      );
    }

    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'res.cloudinary.com' ||
      !url.pathname.startsWith(`/${cloudName}/`) ||
      !url.pathname.includes(`/devflow/uploads/${userId}/`)
    ) {
      throw new BadRequestException(
        'File URL must come from the current user upload folder.',
      );
    }
  }

  private validateStatus(status: string | undefined): ProjectStatus {
    if (status === undefined || status === '') {
      return 'ACTIVE';
    }

    if (!PROJECT_STATUSES.includes(status as ProjectStatus)) {
      throw new BadRequestException(
        `Status must be one of: ${PROJECT_STATUSES.join(', ')}.`,
      );
    }

    return status as ProjectStatus;
  }

  private validateOptionalText(
    value: string | null | undefined,
    label: string,
    maxLength: number,
  ) {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} must be a string.`);
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return null;
    }

    if (trimmed.length > maxLength) {
      throw new BadRequestException(
        `${label} cannot exceed ${maxLength} characters.`,
      );
    }

    return trimmed;
  }

  private validateOptionalUrl(value: string | null | undefined, label: string) {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} must be a URL string.`);
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return null;
    }

    let url: URL;

    try {
      url = new URL(trimmed);
    } catch {
      throw new BadRequestException(`${label} must be a valid URL.`);
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new BadRequestException(`${label} must use HTTP or HTTPS.`);
    }

    return trimmed;
  }

  private signCloudinaryParams(
    params: Record<string, string | number | boolean>,
    apiSecret: string,
  ) {
    const serializedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return createHash('sha1')
      .update(`${serializedParams}${apiSecret}`)
      .digest('hex');
  }

  private async deleteProjectCoverFromCloudinary(
    userId: string,
    projectId: string,
  ) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured.',
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `devflow/project-covers/${userId}/${projectId}`;
    const destroyParams = {
      invalidate: true,
      public_id: publicId,
      timestamp,
    };
    const body = new URLSearchParams({
      api_key: apiKey,
      invalidate: 'true',
      public_id: publicId,
      timestamp: String(timestamp),
      signature: this.signCloudinaryParams(destroyParams, apiSecret),
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to delete cover image from Cloudinary.',
      );
    }

    const result = (await response.json()) as { result?: string };

    if (result.result && !['ok', 'not found'].includes(result.result)) {
      throw new InternalServerErrorException(
        'Failed to delete cover image from Cloudinary.',
      );
    }
  }

  private async deleteUploadedFileFromCloudinary(publicId: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured.',
      );
    }

    const resourceTypes = ['image', 'raw', 'video'];
    let receivedCloudinaryResponse = false;
    let onlyNotFoundResponses = true;

    for (const resourceType of resourceTypes) {
      const timestamp = Math.round(Date.now() / 1000);
      const destroyParams = {
        invalidate: true,
        public_id: publicId,
        timestamp,
      };
      const body = new URLSearchParams({
        api_key: apiKey,
        invalidate: 'true',
        public_id: publicId,
        timestamp: String(timestamp),
        signature: this.signCloudinaryParams(destroyParams, apiSecret),
      });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        },
      );

      if (!response.ok) {
        continue;
      }

      receivedCloudinaryResponse = true;
      const result = (await response.json()) as { result?: string };

      if (result.result === 'ok') {
        return;
      }

      if (result.result !== 'not found') {
        onlyNotFoundResponses = false;
      }
    }

    if (!receivedCloudinaryResponse || !onlyNotFoundResponses) {
      throw new InternalServerErrorException(
        'Failed to delete uploaded file from Cloudinary.',
      );
    }
  }

  private normalizeTags(tags: string[] | undefined) {
    if (tags === undefined) {
      return [];
    }

    if (!Array.isArray(tags)) {
      throw new BadRequestException('Tags must be an array of strings.');
    }

    const normalizedTags = Array.from(
      new Set(
        tags
          .map((tag) => {
            if (typeof tag !== 'string') {
              throw new BadRequestException('Tags must be strings.');
            }

            return tag.trim().toLowerCase();
          })
          .filter(Boolean),
      ),
    );

    if (normalizedTags.length > MAX_TAGS) {
      throw new BadRequestException(
        `A project can have up to ${MAX_TAGS} tags.`,
      );
    }

    for (const tag of normalizedTags) {
      if (tag.length > 32) {
        throw new BadRequestException('Tags cannot exceed 32 characters.');
      }
    }

    return normalizedTags;
  }
}
