import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning';

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
};

type ToastState = {
  toasts: Toast[];
  addToast: (toast: ToastInput & { variant: ToastVariant }) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: ({ title, description, variant }) => {
    const id = crypto.randomUUID();

    set((state) => ({
      toasts: [{ id, title, description, variant }, ...state.toasts].slice(0, 5),
    }));

    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  success: (title, description) => get().addToast({ title, description, variant: 'success' }),
  error: (title, description) => get().addToast({ title, description, variant: 'error' }),
  warning: (title, description) => get().addToast({ title, description, variant: 'warning' }),
}));
