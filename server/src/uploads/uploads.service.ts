import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

const UPLOAD_MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_ALLOWED_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'pdf'];
const ALLOWED_UPLOAD_FOLDERS = ['assets', 'documents', 'images'] as const;

type UploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

type UploadSignatureInput = {
  folder?: string;
  publicId?: string;
};

@Injectable()
export class UploadsService {
  createUploadSignature(userId: string, input: UploadSignatureInput) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured.',
      );
    }

    const folder = this.validateFolder(input.folder);
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `devflow/uploads/${userId}/${folder}/${this.createSafePublicId(
      input.publicId,
    )}`;
    const uploadParams = {
      invalidate: true,
      overwrite: false,
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
        folder,
        invalidate: true,
        overwrite: false,
        signature: this.signCloudinaryParams(uploadParams, apiSecret),
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        maxFileSize: UPLOAD_MAX_FILE_SIZE,
        allowedFormats: UPLOAD_ALLOWED_FORMATS,
      },
    };
  }

  private validateFolder(folder: string | undefined): UploadFolder {
    if (folder === undefined || folder.trim() === '') {
      return 'assets';
    }

    const normalizedFolder = folder.trim().toLowerCase();

    if (!ALLOWED_UPLOAD_FOLDERS.includes(normalizedFolder as UploadFolder)) {
      throw new BadRequestException(
        `Upload folder must be one of: ${ALLOWED_UPLOAD_FOLDERS.join(', ')}.`,
      );
    }

    return normalizedFolder as UploadFolder;
  }

  private createSafePublicId(publicId: string | undefined) {
    if (publicId === undefined || publicId.trim() === '') {
      return randomUUID();
    }

    const normalizedPublicId = publicId
      .trim()
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (normalizedPublicId.length < 1) {
      return randomUUID();
    }

    return normalizedPublicId.slice(0, 80);
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
