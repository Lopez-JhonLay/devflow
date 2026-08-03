import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UIState {
  isSidebarOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      theme: 'light',
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const theme = state.theme === 'dark' ? 'light' : 'dark';
          applyTheme(theme);
          return { theme };
        }),
    }),
    {
      name: 'devflow-ui',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'light');
      },
    },
  ),
);
