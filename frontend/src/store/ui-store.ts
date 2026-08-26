import { create } from 'zustand';
import { ToastMessage, ToastType } from '@/types/common.types';

interface UIState {
  isAdminSidebarOpen: boolean;
  toggleAdminSidebar: () => void;
  setAdminSidebarOpen: (isOpen: boolean) => void;

  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAdminSidebarOpen: true,
  toggleAdminSidebar: () => set((state) => ({ isAdminSidebarOpen: !state.isAdminSidebarOpen })),
  setAdminSidebarOpen: (isOpen) => set({ isAdminSidebarOpen: isOpen }),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, duration: 4000, ...toast };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
