import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { type User } from '@prisma/client';
import { CurrentUser } from '@/auth/decorators/current-user-decorator';
import { SessionGuard } from '@/auth/guards/guard';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(SessionGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get('sign')
  createUploadSignature(
    @CurrentUser() user: User,
    @Query('folder') folder?: string,
    @Query('publicId') publicId?: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.uploadsService.createUploadSignature(user.id, {
      folder,
      publicId,
      resourceType,
    });
  }
}
