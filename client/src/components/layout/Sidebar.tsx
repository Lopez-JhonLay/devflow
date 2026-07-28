import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Triangle, Home, Folder, Scissors, Cloud, Settings, LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import type { AuthUser } from './AppLayout';

interface SidebarProps {
  user: AuthUser;
  onClose?: () => void;
}

export function Sidebar({ user, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Projects', path: '/projects', icon: Folder },
    { name: 'Snippets', path: '/snippets', icon: Scissors },
    { name: 'Files', path: '/files', icon: Cloud },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-full border-r border-gray-200 bg-gray-50/50 flex flex-col h-screen font-sans">
      <div className="hidden md:flex h-16 items-center px-6 mb-4 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Triangle className="h-6 w-6 fill-gray-900 text-gray-900" />
          <span className="text-lg font-bold tracking-tight text-gray-900">DevFlow</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 md:py-0 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              <item.icon className={`h-5 w-5 md:h-4 md:w-4 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 shrink-0 bg-white md:bg-transparent">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-linear-to-tr from-gray-200 to-gray-300 border border-gray-300 overflow-hidden shrink-0">
              {user.image && <img src={user.image} alt={user.name} className="h-full w-full object-cover" />}
            </div>
            <span className="text-sm font-medium text-gray-700 truncate">{user?.name || 'Developer'}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full shrink-0"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
