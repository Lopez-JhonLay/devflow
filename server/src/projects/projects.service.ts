import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateDocumentationDto } from './dto/update-documentation.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_STATUSES = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;
const MAX_TAGS = 10;
const MAX_DOCUMENTATION_LENGTH = 200_000;

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

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    this.validateProjectId(projectId);

    await this.ensureProjectOwnership(userId, projectId);

    const data = this.validateUpdateProjectInput(dto ?? {});
    const hasTagUpdate = dto?.tags !== undefined;
    const tagNames = hasTagUpdate ? this.normalizeTags(dto.tags) : [];

    if (Object.keys(data).length === 0 && !hasTagUpdate) {
      throw new BadRequestException('At least one project field is required.');
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

  async deleteProject(userId: string, projectId: string) {
    this.validateProjectId(projectId);

    await this.ensureProjectOwnership(userId, projectId);

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
      select: { id: true },
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
