import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';

export function AuthGuard() {
  const { data, isPending, error } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading secure session...</p>
      </div>
    );
  }

  if (error || !data?.session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={{ user: data.user }} />;
}
