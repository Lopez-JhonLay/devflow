import { useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { Menu, X, Triangle } from 'lucide-react';
import { Sidebar } from './Sidebar';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export function AppLayout() {
  const { user } = useOutletContext<{ user: AuthUser }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background p-4 md:hidden">
        <div className="flex items-center gap-2">
          <Triangle className="h-5 w-5 fill-foreground text-foreground" />
          <span className="text-base font-bold tracking-tight text-foreground">DevFlow</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="-mr-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-300 ease-in-out
        md:relative md:transform-none md:flex shrink-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}
      >
        <Sidebar user={user} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 md:p-8">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}
