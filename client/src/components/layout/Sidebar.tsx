import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Folder, Scissors, Cloud, Settings, LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import devflowLogo from '@/assets/devflow-logo-cropped.png';
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
    <aside className="flex h-screen w-full flex-col border-r border-sidebar-border bg-sidebar font-sans text-sidebar-foreground">
      <div className="hidden md:flex h-20 items-center px-5 mb-4 shrink-0">
        <Link to="/dashboard" className="flex w-full items-center">
          <img src={devflowLogo} alt="DevFlow" className="h-16 w-auto max-w-52 object-contain object-left" />
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
                  ? 'border border-sidebar-border bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 md:h-4 md:w-4 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border bg-background p-4 md:bg-transparent">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
              {user.image && <img src={user.image} alt={user.name} className="h-full w-full object-cover" />}
            </div>
            <span className="truncate text-sm font-medium text-foreground">{user?.name || 'Developer'}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
