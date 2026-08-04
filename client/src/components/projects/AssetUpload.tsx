import { useRef, useState } from 'react';
import { FileText, Image, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getUploadSignature,
  useCreateProjectFile,
  useDeleteProjectFile,
  type ProjectFile,
  type UploadSignature,
} from '@/hooks/use-projects';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];

type UploadStatus = 'queued' | 'uploading' | 'saving' | 'complete' | 'error';

type UploadItem = {
  id: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  bytes?: number;
  resource_type?: string;
  format?: string;
};

type AssetUploadProps = {
  projectId: string;
  files: ProjectFile[];
};

export function AssetUpload({ projectId, files }: AssetUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const createFile = useCreateProjectFile(projectId);
  const deleteFile = useDeleteProjectFile(projectId);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  async function handleFiles(fileList: FileList | File[]) {
    const selectedFiles = Array.from(fileList);

    for (const file of selectedFiles) {
      const uploadId = crypto.randomUUID();
      const validationError = validateFile(file);

      addUpload({
        id: uploadId,
        fileName: file.name,
        progress: 0,
        status: validationError ? 'error' : 'queued',
        error: validationError,
      });

      if (validationError) continue;

      try {
        updateUpload(uploadId, { status: 'uploading', progress: 2 });
        const signature = await getUploadSignature(folderForFile(file), file.name, resourceTypeForFile(file));
        const uploadedFile = await uploadToCloudinary(file, signature, (progress) => {
          updateUpload(uploadId, { progress, status: 'uploading' });
        });

        updateUpload(uploadId, { status: 'saving', progress: 100 });
        await createFile.mutateAsync({
          url: uploadedFile.secure_url,
          publicId: uploadedFile.public_id,
          name: file.name,
          fileType: file.type,
          size: uploadedFile.bytes ?? file.size,
        });
        updateUpload(uploadId, { status: 'complete', progress: 100 });
        window.setTimeout(() => {
          removeUpload(uploadId);
        }, 700);
      } catch (err) {
        updateUpload(uploadId, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed.',
        });
      }
    }
  }

  function addUpload(item: UploadItem) {
    setUploads((currentUploads) => [item, ...currentUploads]);
  }

  function updateUpload(uploadId: string, patch: Partial<UploadItem>) {
    setUploads((currentUploads) =>
      currentUploads.map((upload) => (upload.id === uploadId ? { ...upload, ...patch } : upload)),
    );
  }

  function removeUpload(uploadId: string) {
    setUploads((currentUploads) => currentUploads.filter((upload) => upload.id !== uploadId));
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle>Project Assets</CardTitle>
        <CardDescription>Upload images, PDFs, and SVG diagrams.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          type="button"
          className={`flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed bg-muted/40 p-5 text-center outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${isDragging ? 'border-ring ring-3 ring-ring/30' : 'border-border'}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Drop files here or click to upload</span>
          <span className="text-xs text-muted-foreground">Images, PDFs, and SVG diagrams up to 10 MB.</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(',')}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              void handleFiles(event.target.files);
              event.target.value = '';
            }
          }}
        />

        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((upload) => (
              <UploadProgressRow key={upload.id} upload={upload} />
            ))}
          </div>
        )}

        <div className="space-y-2">
          {files.length > 0 ? (
            files.map((file) => (
              <AssetRow
                key={file.id}
                file={file}
                isDeleting={deleteFile.isPending}
                onDelete={() => void deleteFile.mutateAsync(file.id)}
              />
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-border p-4 text-sm text-muted-foreground">
              No assets uploaded yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UploadProgressRow({ upload }: { upload: UploadItem }) {
  return (
    <div className="rounded-[24px] border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="truncate text-sm font-semibold text-foreground">{upload.fileName}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{statusLabel(upload)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${upload.status === 'error' ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${upload.status === 'error' ? 100 : upload.progress}%` }}
        />
      </div>
      {upload.error && <p className="mt-2 text-xs font-medium text-destructive">{upload.error}</p>}
    </div>
  );
}

function AssetRow({
  file,
  isDeleting,
  onDelete,
}: {
  file: ProjectFile;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[24px] border border-border bg-card p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {file.fileType.startsWith('image/') ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 hover:text-muted-foreground"
      >
        <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </a>
      <Button type="button" variant="ghost" size="icon" disabled={isDeleting} onClick={onDelete}>
        {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
      </Button>
    </div>
  );
}

function validateFile(file: File) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Only PNG, JPG, WebP, GIF, SVG, and PDF files are allowed.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File must be 10 MB or smaller.';
  }

  return '';
}

function folderForFile(file: File) {
  if (file.type === 'application/pdf') return 'documents';
  if (file.type.startsWith('image/')) return 'images';
  return 'assets';
}

function resourceTypeForFile(file: File) {
  if (file.type === 'application/pdf') return 'raw';
  if (file.type.startsWith('image/')) return 'image';
  return 'auto';
}

function statusLabel(upload: UploadItem) {
  if (upload.status === 'queued') return 'Queued';
  if (upload.status === 'uploading') return `${upload.progress}%`;
  if (upload.status === 'saving') return 'Saving';
  if (upload.status === 'complete') return 'Complete';
  return 'Failed';
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadToCloudinary(
  file: File,
  signature: UploadSignature,
  onProgress: (progress: number) => void,
) {
  return new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('public_id', signature.publicId);
    formData.append('overwrite', String(signature.overwrite));
    formData.append('invalidate', String(signature.invalidate));
    formData.append('signature', signature.signature);

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.min(99, Math.round((event.loaded / event.total) * 100));
      onProgress(progress);
    });

    request.addEventListener('load', () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error('Cloudinary upload failed.'));
        return;
      }

      try {
        const payload = JSON.parse(request.responseText) as CloudinaryUploadResponse;

        if (!payload.secure_url || !payload.public_id) {
          reject(new Error('Cloudinary upload response was incomplete.'));
          return;
        }

        resolve(payload);
      } catch {
        reject(new Error('Cloudinary upload response was invalid.'));
      }
    });

    request.addEventListener('error', () => reject(new Error('Cloudinary upload failed.')));
    request.addEventListener('abort', () => reject(new Error('Cloudinary upload was cancelled.')));
    request.open('POST', signature.uploadUrl);
    request.send(formData);
  });
}
