import { Navigate, Outlet } from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { authClient } from '@/lib/auth-client';

export function AuthGuard() {
  const { data, isPending, error } = authClient.useSession();

  if (isPending) {
    return <LoadingSpinner label="Loading secure session..." fullScreen />;
  }

  if (error || !data?.session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={{ user: data.user }} />;
}
