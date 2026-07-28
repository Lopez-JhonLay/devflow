import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import RegisterPage from '@/pages/Register';
import LoginPage from '@/pages/Login';
import ForgotPasswordPage from '@/pages/ForgotPassword';
import DashboardPage from '@/pages/Dashboard';
import { AuthGuard } from '@/components/auth/auth-guard'; // 1. Import the guard

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
    element: <AuthGuard />, // 2. The Bouncer stands here
    children: [
      // 3. Everything inside this array is protected!
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/projects',
        element: <div>Projects (Protected)</div>,
      },
      {
        path: '/projects/:id',
        element: <div>Project Documentation (Protected)</div>,
      },
      {
        path: '/snippets',
        element: <div>Snippets (Protected)</div>,
      },
      {
        path: '/settings',
        element: <div>Settings (Protected)</div>,
      },
    ],
  },
]);
