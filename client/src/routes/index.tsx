import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import RegisterPage from '@/pages/Register';
import LoginPage from '@/pages/Login';
import ForgotPasswordPage from '@/pages/ForgotPassword';
import DashboardPage from '@/pages/Dashboard';
import ProjectDetailPage from '@/pages/ProjectDetail';
import ProjectsPage from '@/pages/Projects';
import SettingsPage from '@/pages/Settings';
import SnippetsPage from '@/pages/Snippets';
import FilesPage from '@/pages/Files';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AppLayout } from '@/components/layout/AppLayout';
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  // --- Public Routes ---
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // --- Protected Routes ---
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/projects',
            element: <ProjectsPage />,
          },
          {
            path: '/projects/:id',
            element: <ProjectDetailPage />,
          },
          {
            path: '/snippets',
            element: <SnippetsPage />,
          },
          {
            path: '/files',
            element: <FilesPage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);
