import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { type User } from '@prisma/client';
import { CurrentUser } from '@/auth/decorators/current-user-decorator';
import { SessionGuard } from '@/auth/guards/guard';
import { CreateProjectFileDto } from './dto/create-project-file.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateDocumentationDto } from './dto/update-documentation.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  createProject(@CurrentUser() user: User, @Body() body: CreateProjectDto) {
    return this.projectsService.createProject(user.id, body);
  }

  @Get()
  listProjects(@CurrentUser() user: User) {
    return this.projectsService.listProjects(user.id);
  }

  @Get(':id')
  getProject(@CurrentUser() user: User, @Param('id') projectId: string) {
    return this.projectsService.getProject(user.id, projectId);
  }

  @Put(':id')
  updateProject(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(user.id, projectId, body);
  }

  @Put(':id/documentation')
  updateDocumentation(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Body() body: UpdateDocumentationDto,
  ) {
    return this.projectsService.updateDocumentation(user.id, projectId, body);
  }

  @Post(':id/files')
  createProjectFile(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Body() body: CreateProjectFileDto,
  ) {
    return this.projectsService.createProjectFile(user.id, projectId, body);
  }

  @Delete(':id/files/:fileId')
  deleteProjectFile(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projectsService.deleteProjectFile(user.id, projectId, fileId);
  }

  @Post(':id/cover/signature')
  createExistingProjectCoverUploadSignature(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.createProjectCoverUploadSignature(
      user.id,
      projectId,
    );
  }

  @Put(':id/archive')
  archiveProject(@CurrentUser() user: User, @Param('id') projectId: string) {
    return this.projectsService.archiveProject(user.id, projectId);
  }

  @Delete(':id')
  deleteProject(@CurrentUser() user: User, @Param('id') projectId: string) {
    return this.projectsService.deleteProject(user.id, projectId);
  }
}
