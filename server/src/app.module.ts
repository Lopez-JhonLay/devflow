import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth';
import { WorkspaceService } from './workspace/workspace.service';
import { WorkspaceController } from './workspace/workspace.controller';
import { SettingsModule } from './settings/settings.module';
import { ProjectsModule } from './projects/projects.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule.forRoot({ auth }),
    SettingsModule,
    ProjectsModule,
    UploadsModule,
  ],
  controllers: [AppController, WorkspaceController],
  providers: [AppService, WorkspaceService],
})
export class AppModule {}
