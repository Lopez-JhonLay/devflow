import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async getRecentActivity(userId: string) {
    const [recentProjects, recentSnippets, recentFiles] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),

      this.prisma.snippet.findMany({
        where: { userId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),

      this.prisma.projectFile.findMany({
        where: {
          project: {
            userId: userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      recentProjects,
      recentSnippets,
      recentUploads: recentFiles,
    };
  }
}
