import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_ALLOWED_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data = this.validateProfileInput(dto ?? {});

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one profile field is required.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: user,
    };
  }

  createAvatarUploadSignature(userId: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured.',
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `devflow/avatars/${userId}`;
    const uploadParams = {
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
        overwrite: true,
        signature: this.signCloudinaryParams(uploadParams, apiSecret),
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        maxFileSize: AVATAR_MAX_FILE_SIZE,
        allowedFormats: AVATAR_ALLOWED_FORMATS,
      },
    };
  }

  private validateProfileInput(dto: UpdateProfileDto) {
    const data: { name?: string; image?: string | null } = {};

    if (dto.name !== undefined) {
      if (typeof dto.name !== 'string') {
        throw new BadRequestException('Name must be a string.');
      }

      const name = dto.name.trim();
      if (name.length < 1) {
        throw new BadRequestException('Name cannot be empty.');
      }

      if (name.length > 80) {
        throw new BadRequestException('Name cannot exceed 80 characters.');
      }

      data.name = name;
    }

    if (dto.image !== undefined) {
      if (dto.image === null || dto.image === '') {
        data.image = null;
      } else if (typeof dto.image !== 'string') {
        throw new BadRequestException('Image must be a URL string or null.');
      } else {
        let url: URL;

        try {
          url = new URL(dto.image);
        } catch {
          throw new BadRequestException('Image must be a valid URL.');
        }

        if (url.protocol !== 'https:') {
          throw new BadRequestException('Image URL must use HTTPS.');
        }

        this.validateCloudinaryImageUrl(url);

        data.image = dto.image;
      }
    }

    return data;
  }

  private validateCloudinaryImageUrl(url: URL) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured.',
      );
    }

    if (
      url.hostname !== 'res.cloudinary.com' ||
      !url.pathname.startsWith(`/${cloudName}/`)
    ) {
      throw new BadRequestException(
        'Image URL must come from the configured Cloudinary account.',
      );
    }
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
}
