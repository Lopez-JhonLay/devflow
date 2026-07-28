import { Controller, Get, UseGuards } from '@nestjs/common';
import { WorkspaceService } from '@/workspace/workspace.service';
import { SessionGuard } from '@/auth/guards/guard';
import { CurrentUser } from '@/auth/decorators/current-user-decorator';
import { type User } from '@prisma/client';

@Controller('workspace')
@UseGuards(SessionGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('activity')
  async getRecentActivity(@CurrentUser() user: User) {
    return this.workspaceService.getRecentActivity(user.id);
  }
}
