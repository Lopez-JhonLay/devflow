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
    <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Triangle className="h-5 w-5 fill-gray-900 text-gray-900" />
          <span className="text-base font-bold tracking-tight text-gray-900">DevFlow</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out bg-gray-50/50
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
