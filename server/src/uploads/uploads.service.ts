import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

const UPLOAD_MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_ALLOWED_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'pdf'];
const ALLOWED_UPLOAD_FOLDERS = ['assets', 'documents', 'images'] as const;
const ALLOWED_RESOURCE_TYPES = ['auto', 'image', 'raw'] as const;

type UploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];
type UploadResourceType = (typeof ALLOWED_RESOURCE_TYPES)[number];

type UploadSignatureInput = {
  folder?: string;
  publicId?: string;
  resourceType?: string;
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
    const resourceType = this.validateResourceType(input.resourceType, folder);
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `devflow/uploads/${userId}/${folder}/${this.createSafePublicId(
      input.publicId,
      resourceType === 'raw',
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
        resourceType,
        invalidate: true,
        overwrite: false,
        signature: this.signCloudinaryParams(uploadParams, apiSecret),
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
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

  private validateResourceType(
    resourceType: string | undefined,
    folder: UploadFolder,
  ): UploadResourceType {
    if (resourceType === undefined || resourceType.trim() === '') {
      if (folder === 'documents') return 'raw';
      if (folder === 'images') return 'image';
      return 'auto';
    }

    const normalizedResourceType = resourceType.trim().toLowerCase();

    if (
      !ALLOWED_RESOURCE_TYPES.includes(
        normalizedResourceType as UploadResourceType,
      )
    ) {
      throw new BadRequestException(
        `Resource type must be one of: ${ALLOWED_RESOURCE_TYPES.join(', ')}.`,
      );
    }

    if (folder === 'documents' && normalizedResourceType !== 'raw') {
      throw new BadRequestException(
        'Document uploads must use raw resource type.',
      );
    }

    if (folder === 'images' && normalizedResourceType !== 'image') {
      throw new BadRequestException(
        'Image uploads must use image resource type.',
      );
    }

    return normalizedResourceType as UploadResourceType;
  }

  private createSafePublicId(
    publicId: string | undefined,
    preserveExtension = false,
  ) {
    if (publicId === undefined || publicId.trim() === '') {
      return randomUUID();
    }

    const trimmedPublicId = publicId.trim().toLowerCase();
    const extensionMatch = trimmedPublicId.match(/\.([a-z0-9]+)$/i);
    const extension =
      preserveExtension && extensionMatch ? `.${extensionMatch[1]}` : '';
    const nameWithoutExtension = trimmedPublicId.replace(/\.[a-z0-9]+$/i, '');
    const normalizedPublicId = nameWithoutExtension
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (normalizedPublicId.length < 1) {
      return `${randomUUID()}${extension}`;
    }

    return `${normalizedPublicId.slice(0, 80)}${extension}`;
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
