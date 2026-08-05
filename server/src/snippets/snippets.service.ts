import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';

const MAX_TAGS = 10;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_LANGUAGE_LENGTH = 50;
const MAX_CODE_LENGTH = 100_000;
const MAX_SEARCH_LENGTH = 100;

type ListSnippetsQuery = {
  search?: string;
  language?: string;
};

@Injectable()
export class SnippetsService {
  constructor(private prisma: PrismaService) {}

  async listSnippets(userId: string, query: ListSnippetsQuery) {
    const search = this.validateSearchQuery(query.search);
    const language = this.validateLanguageFilter(query.language);

    const snippets = await this.prisma.snippet.findMany({
      where: {
        userId,
        ...(language ? { language } : {}),
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  code: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  tags: {
                    some: {
                      tag: {
                        name: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: this.snippetInclude(),
    });

    return {
      success: true,
      data: snippets.map((snippet) => this.serializeSnippet(snippet)),
    };
  }

  async getSnippet(userId: string, snippetId: string) {
    this.validateSnippetId(snippetId);

    const snippet = await this.prisma.snippet.findFirst({
      where: {
        id: snippetId,
        userId,
      },
      include: this.snippetInclude(),
    });

    if (!snippet) {
      throw new NotFoundException('Snippet not found.');
    }

    return {
      success: true,
      data: this.serializeSnippet(snippet),
    };
  }

  async createSnippet(userId: string, dto: CreateSnippetDto) {
    const data = this.validateCreateSnippetInput(dto ?? {});
    const tagNames = this.normalizeTags(dto?.tags);

    const snippet = await this.prisma.$transaction(async (tx) => {
      const createdSnippet = await tx.snippet.create({
        data: {
          userId,
          title: data.title,
          description: data.description,
          language: data.language,
          code: data.code,
          isFavorite: data.isFavorite,
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

        await tx.snippetTags.createMany({
          data: tags.map((tag) => ({
            snippetId: createdSnippet.id,
            tagId: tag.id,
          })),
        });
      }

      return tx.snippet.findUniqueOrThrow({
        where: { id: createdSnippet.id },
        include: this.snippetInclude(),
      });
    });

    return {
      success: true,
      data: this.serializeSnippet(snippet),
    };
  }

  async updateSnippet(
    userId: string,
    snippetId: string,
    dto: UpdateSnippetDto,
  ) {
    this.validateSnippetId(snippetId);
    await this.ensureSnippetOwnership(userId, snippetId);

    const data = this.validateUpdateSnippetInput(dto ?? {});
    const hasTagUpdate = dto?.tags !== undefined;
    const tagNames = hasTagUpdate ? this.normalizeTags(dto.tags) : [];

    if (Object.keys(data).length === 0 && !hasTagUpdate) {
      throw new BadRequestException('At least one snippet field is required.');
    }

    const snippet = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.snippet.update({
          where: { id: snippetId },
          data,
        });
      }

      if (hasTagUpdate) {
        await tx.snippetTags.deleteMany({
          where: { snippetId },
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

          await tx.snippetTags.createMany({
            data: tags.map((tag) => ({
              snippetId,
              tagId: tag.id,
            })),
          });
        }
      }

      return tx.snippet.findUniqueOrThrow({
        where: { id: snippetId },
        include: this.snippetInclude(),
      });
    });

    return {
      success: true,
      data: this.serializeSnippet(snippet),
    };
  }

  async deleteSnippet(userId: string, snippetId: string) {
    this.validateSnippetId(snippetId);
    await this.ensureSnippetOwnership(userId, snippetId);

    await this.prisma.snippet.delete({
      where: { id: snippetId },
    });

    return {
      success: true,
      message: 'Snippet deleted successfully.',
    };
  }

  private serializeSnippet<
    T extends {
      tags: Array<{
        tag: {
          name: string;
        };
      }>;
    },
  >(snippet: T) {
    return {
      ...snippet,
      tags: snippet.tags.map((snippetTag) => snippetTag.tag.name),
    };
  }

  private snippetInclude() {
    return {
      tags: {
        include: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
    };
  }

  private validateSnippetId(snippetId: string) {
    if (typeof snippetId !== 'string' || snippetId.trim().length === 0) {
      throw new BadRequestException('Snippet id is required.');
    }
  }

  private validateSearchQuery(search: string | undefined) {
    if (search === undefined || search.trim() === '') {
      return null;
    }

    if (typeof search !== 'string') {
      throw new BadRequestException('Search must be a string.');
    }

    const trimmed = search.trim();

    if (trimmed.length > MAX_SEARCH_LENGTH) {
      throw new BadRequestException(
        `Search cannot exceed ${MAX_SEARCH_LENGTH} characters.`,
      );
    }

    return trimmed;
  }

  private async ensureSnippetOwnership(userId: string, snippetId: string) {
    const snippet = await this.prisma.snippet.findFirst({
      where: {
        id: snippetId,
        userId,
      },
      select: { id: true },
    });

    if (!snippet) {
      throw new NotFoundException('Snippet not found.');
    }

    return snippet;
  }

  private validateLanguageFilter(language: string | undefined) {
    if (language === undefined || language.trim() === '') {
      return null;
    }

    if (typeof language !== 'string') {
      throw new BadRequestException('Language must be a string.');
    }

    const normalizedLanguage = language.trim().toLowerCase();

    if (normalizedLanguage.length > MAX_LANGUAGE_LENGTH) {
      throw new BadRequestException(
        `Language cannot exceed ${MAX_LANGUAGE_LENGTH} characters.`,
      );
    }

    return normalizedLanguage;
  }

  private validateCreateSnippetInput(dto: Partial<CreateSnippetDto>) {
    if (typeof dto.title !== 'string') {
      throw new BadRequestException('Snippet title is required.');
    }

    const title = dto.title.trim();

    if (title.length < 1) {
      throw new BadRequestException('Snippet title is required.');
    }

    if (title.length > MAX_TITLE_LENGTH) {
      throw new BadRequestException(
        `Snippet title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
      );
    }

    const description = this.validateOptionalText(
      dto.description,
      'Description',
      MAX_DESCRIPTION_LENGTH,
    );

    if (typeof dto.language !== 'string') {
      throw new BadRequestException('Snippet language is required.');
    }

    const language = dto.language.trim().toLowerCase();

    if (language.length < 1) {
      throw new BadRequestException('Snippet language is required.');
    }

    if (language.length > MAX_LANGUAGE_LENGTH) {
      throw new BadRequestException(
        `Snippet language cannot exceed ${MAX_LANGUAGE_LENGTH} characters.`,
      );
    }

    if (typeof dto.code !== 'string') {
      throw new BadRequestException('Snippet code is required.');
    }

    const code = dto.code.trim();

    if (code.length < 1) {
      throw new BadRequestException('Snippet code is required.');
    }

    if (code.length > MAX_CODE_LENGTH) {
      throw new BadRequestException(
        `Snippet code cannot exceed ${MAX_CODE_LENGTH} characters.`,
      );
    }

    if (dto.isFavorite !== undefined && typeof dto.isFavorite !== 'boolean') {
      throw new BadRequestException('Favorite must be a boolean.');
    }

    return {
      title,
      description,
      language,
      code,
      isFavorite: dto.isFavorite ?? false,
    };
  }

  private validateUpdateSnippetInput(dto: Partial<UpdateSnippetDto>) {
    const data: {
      title?: string;
      description?: string | null;
      language?: string;
      code?: string;
      isFavorite?: boolean;
    } = {};

    if (dto.title !== undefined) {
      if (typeof dto.title !== 'string') {
        throw new BadRequestException('Snippet title must be a string.');
      }

      const title = dto.title.trim();

      if (title.length < 1) {
        throw new BadRequestException('Snippet title is required.');
      }

      if (title.length > MAX_TITLE_LENGTH) {
        throw new BadRequestException(
          `Snippet title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
        );
      }

      data.title = title;
    }

    if (dto.description !== undefined) {
      data.description = this.validateOptionalText(
        dto.description,
        'Description',
        MAX_DESCRIPTION_LENGTH,
      );
    }

    if (dto.language !== undefined) {
      if (typeof dto.language !== 'string') {
        throw new BadRequestException('Snippet language must be a string.');
      }

      const language = dto.language.trim().toLowerCase();

      if (language.length < 1) {
        throw new BadRequestException('Snippet language is required.');
      }

      if (language.length > MAX_LANGUAGE_LENGTH) {
        throw new BadRequestException(
          `Snippet language cannot exceed ${MAX_LANGUAGE_LENGTH} characters.`,
        );
      }

      data.language = language;
    }

    if (dto.code !== undefined) {
      if (typeof dto.code !== 'string') {
        throw new BadRequestException('Snippet code must be a string.');
      }

      const code = dto.code.trim();

      if (code.length < 1) {
        throw new BadRequestException('Snippet code is required.');
      }

      if (code.length > MAX_CODE_LENGTH) {
        throw new BadRequestException(
          `Snippet code cannot exceed ${MAX_CODE_LENGTH} characters.`,
        );
      }

      data.code = code;
    }

    if (dto.isFavorite !== undefined) {
      if (typeof dto.isFavorite !== 'boolean') {
        throw new BadRequestException('Favorite must be a boolean.');
      }

      data.isFavorite = dto.isFavorite;
    }

    return data;
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
        `A snippet can have up to ${MAX_TAGS} tags.`,
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
