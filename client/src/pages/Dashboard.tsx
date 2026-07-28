import { useNavigate, useOutletContext } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();

  const { user } = useOutletContext<{ user: { name: string; email: string } }>();

  const handleLogout = async () => {
    await authClient.signOut();

    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-sm border border-gray-100 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Developer'}!</h1>
          <p className="text-sm text-gray-500">You are logged in as {user?.email}</p>
        </div>

        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-100">
          You have successfully reached the protected dashboard route.
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="cursor-pointer w-full rounded-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
