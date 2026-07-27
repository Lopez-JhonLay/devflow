import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  // Public Routes
  {
    path: '/login',
    element: <div>Login Page (Public)</div>,
  },
  {
    path: '/register',
    element: <div>Register Page (Public)</div>,
  },
  // Protected Routes
  {
    path: '/dashboard',
    element: <div>Dashboard (Protected)</div>,
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
]);
