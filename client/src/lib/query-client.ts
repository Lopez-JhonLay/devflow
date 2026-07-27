import { QueryClient } from '@tanstack/react-query';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
