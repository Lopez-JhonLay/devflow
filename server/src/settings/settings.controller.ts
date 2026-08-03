import {
  Body,
  Controller,
  Put,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import type { Request } from 'express';
import { type User } from '@prisma/client';
import { CurrentUser } from '@/auth/decorators/current-user-decorator';
import { SessionGuard } from '@/auth/guards/guard';
import { auth } from '@/auth/auth';
import { SettingsService } from './settings.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('settings')
@UseGuards(SessionGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Put('profile')
  updateProfile(@CurrentUser() user: User, @Body() body: UpdateProfileDto) {
    return this.settingsService.updateProfile(user.id, body);
  }

  @Post('avatar/signature')
  createAvatarUploadSignature(@CurrentUser() user: User) {
    return this.settingsService.createAvatarUploadSignature(user.id);
  }

  @Put('password')
  async changePassword(
    @Req() request: Request,
    @Body() body: ChangePasswordDto,
  ) {
    if (
      typeof body?.currentPassword !== 'string' ||
      typeof body?.newPassword !== 'string'
    ) {
      throw new BadRequestException(
        'Current password and new password are required.',
      );
    }

    try {
      await auth.api.changePassword({
        headers: request.headers as Record<string, string>,
        body: {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
      });
    } catch (error) {
      this.throwAuthApiError(error);
    }

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  private throwAuthApiError(error: unknown): never {
    if (typeof error === 'object' && error !== null) {
      const possibleError = error as {
        statusCode?: number;
        status?: number;
        body?: { message?: string };
        message?: string;
      };

      throw new HttpException(
        possibleError.body?.message ||
          possibleError.message ||
          'Password update failed.',
        possibleError.statusCode || possibleError.status || 400,
      );
    }

    throw new BadRequestException('Password update failed.');
  }
}
