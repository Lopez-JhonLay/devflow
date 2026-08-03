import { useEffect, useMemo, useRef, useState } from 'react';
import { type UseFormRegisterReturn, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOutletContext } from 'react-router-dom';
import * as z from 'zod';
import { Check, Eye, EyeOff, Loader2, Save, Upload } from 'lucide-react';
import type { AuthUser } from '@/components/layout/AppLayout';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name cannot exceed 80 characters'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

type Status = {
  type: 'success' | 'error';
  message: string;
} | null;

type AvatarSignatureResponse = {
  success: boolean;
  data: {
    apiKey: string;
    timestamp: number;
    publicId: string;
    overwrite: boolean;
    invalidate: boolean;
    signature: string;
    uploadUrl: string;
    maxFileSize: number;
    allowedFormats: string[];
  };
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
};

type AccountSettingsResponse = {
  success: boolean;
  data: {
    hasPassword: boolean;
    providers: string[];
  };
};

async function readApiError(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    return payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
}

export default function SettingsPage() {
  const { user } = useOutletContext<{ user: AuthUser }>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.image ?? '');
  const [avatarStatus, setAvatarStatus] = useState<Status>(null);
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const initials = useMemo(() => {
    const source = user.name || user.email || 'D';
    return source
      .split(/[.@\s_-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }, [user.email, user.name]);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  const resetProfileForm = profileForm.reset;

  useEffect(() => {
    resetProfileForm({ name: user.name || '' });
  }, [resetProfileForm, user.name]);

  useEffect(() => {
    let isMounted = true;

    async function loadAccountSettings() {
      try {
        const response = await fetch(`${API_URL}/settings/account`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(await readApiError(response, 'Failed to load account settings.'));
        }

        const payload = (await response.json()) as AccountSettingsResponse;
        if (isMounted) setHasPassword(payload.data.hasPassword);
      } catch {
        if (isMounted) setHasPassword(false);
      }
    }

    void loadAccountSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function updateProfile(payload: { name?: string; image?: string | null }) {
    const response = await fetch(`${API_URL}/settings/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, 'Failed to update profile.'));
    }

    return response.json();
  }

  async function handleProfileSubmit(values: ProfileValues) {
    setProfileStatus(null);

    try {
      await updateProfile({
        name: values.name,
        image: avatarUrl || null,
      });
      setProfileStatus({ type: 'success', message: 'Profile updated.' });
    } catch (error) {
      setProfileStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update profile.',
      });
    }
  }

  async function handleAvatarSelected(file: File | undefined) {
    setAvatarStatus(null);

    if (!file) return;

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setAvatarStatus({ type: 'error', message: 'Use a PNG, JPG, or WebP image.' });
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE) {
      setAvatarStatus({ type: 'error', message: 'Avatar must be 5 MB or smaller.' });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const signatureResponse = await fetch(`${API_URL}/settings/avatar/signature`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!signatureResponse.ok) {
        throw new Error(await readApiError(signatureResponse, 'Failed to prepare avatar upload.'));
      }

      const signaturePayload = (await signatureResponse.json()) as AvatarSignatureResponse;
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('api_key', signaturePayload.data.apiKey);
      uploadForm.append('timestamp', String(signaturePayload.data.timestamp));
      uploadForm.append('public_id', signaturePayload.data.publicId);
      uploadForm.append('overwrite', String(signaturePayload.data.overwrite));
      uploadForm.append('invalidate', String(signaturePayload.data.invalidate));
      uploadForm.append('signature', signaturePayload.data.signature);

      const uploadResponse = await fetch(signaturePayload.data.uploadUrl, {
        method: 'POST',
        body: uploadForm,
      });

      if (!uploadResponse.ok) {
        throw new Error(await readApiError(uploadResponse, 'Cloudinary upload failed.'));
      }

      const uploadPayload = (await uploadResponse.json()) as CloudinaryUploadResponse;
      await updateProfile({ image: uploadPayload.secure_url });
      setAvatarUrl(uploadPayload.secure_url);
      setAvatarStatus({ type: 'success', message: 'Avatar uploaded.' });
    } catch (error) {
      setAvatarStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload avatar.',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveAvatar() {
    setAvatarStatus(null);
    setIsUploadingAvatar(true);

    try {
      await updateProfile({ image: null });
      setAvatarUrl('');
      setAvatarStatus({ type: 'success', message: 'Avatar removed.' });
    } catch (error) {
      setAvatarStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to remove avatar.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handlePasswordSubmit(values: PasswordValues) {
    setPasswordStatus(null);

    try {
      const response = await fetch(`${API_URL}/settings/password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Failed to update password.'));
      }

      passwordForm.reset();
      setPasswordStatus({ type: 'success', message: 'Password updated.' });
    } catch (error) {
      setPasswordStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update password.',
      });
    }
  }

  return (
    <div className="pb-8 md:pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your public workspace identity.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.name || 'Profile avatar'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => void handleAvatarSelected(event.target.files?.[0])}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? <Loader2 className="animate-spin" /> : <Upload />}
                        {isUploadingAvatar ? 'Uploading' : 'Upload avatar'}
                      </Button>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isUploadingAvatar}
                          onClick={() => void handleRemoveAvatar()}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or WebP. Maximum 5 MB.</p>
                    {avatarStatus && <StatusMessage status={avatarStatus} />}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...profileForm.register('name')}
                    aria-invalid={Boolean(profileForm.formState.errors.name)}
                  />
                  {profileForm.formState.errors.name && (
                    <p className="text-xs font-medium text-destructive">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled />
                </div>

                <div className="flex justify-end flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                    Save profile
                  </Button>
                  {profileStatus && <StatusMessage status={profileStatus} />}
                </div>
              </form>
            </CardContent>
          </Card>

          {hasPassword && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle>Password</CardTitle>
                <CardDescription>Change the password for your email login.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                  <PasswordField
                    id="currentPassword"
                    label="Current password"
                    visible={showPassword}
                    onToggleVisibility={() => setShowPassword((value) => !value)}
                    registration={passwordForm.register('currentPassword')}
                    error={passwordForm.formState.errors.currentPassword?.message}
                  />
                  <PasswordField
                    id="newPassword"
                    label="New password"
                    visible={showPassword}
                    onToggleVisibility={() => setShowPassword((value) => !value)}
                    registration={passwordForm.register('newPassword')}
                    error={passwordForm.formState.errors.newPassword?.message}
                  />
                  <PasswordField
                    id="confirmPassword"
                    label="Confirm new password"
                    visible={showPassword}
                    onToggleVisibility={() => setShowPassword((value) => !value)}
                    registration={passwordForm.register('confirmPassword')}
                    error={passwordForm.formState.errors.confirmPassword?.message}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                      {passwordForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
                      Change password
                    </Button>
                  </div>

                  {passwordStatus && <StatusMessage status={passwordStatus} />}
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit border border-border shadow-sm">
          <CardHeader className="border-b border-border">
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how DevFlow looks on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-[22px] border border-border bg-muted/50 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Dark mode</p>
                <p className="mt-1 text-xs text-muted-foreground">Saved on this device.</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status: Status }) {
  if (!status) return null;

  return (
    <p
      className={cn(
        'text-sm font-medium',
        status.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive',
      )}
    >
      {status.message}
    </p>
  );
}

function PasswordField({
  id,
  label,
  visible,
  onToggleVisibility,
  registration,
  error,
}: {
  id: string;
  label: string;
  visible: boolean;
  onToggleVisibility: () => void;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          {...registration}
          aria-invalid={Boolean(error)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
