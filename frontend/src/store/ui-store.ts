import { create } from 'zustand';
import { ToastMessage } from '@/types/common.types';

export type ThemeMode = 'dark' | 'light';

interface UIState {
  theme: ThemeMode;
  toggleTheme: () => void;
  initTheme: () => void;

  isAdminSidebarOpen: boolean;
  toggleAdminSidebar: () => void;
  setAdminSidebarOpen: (isOpen: boolean) => void;

  isUserSidebarOpen: boolean;
  toggleUserSidebar: () => void;
  setUserSidebarOpen: (isOpen: boolean) => void;

  isUserSidebarCollapsed: boolean;
  toggleUserSidebarCollapsed: () => void;

  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ab_theme') as ThemeMode;
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
};

export const useUIStore = create<UIState>((set, get) => ({
  theme: getInitialTheme(),

  initTheme: () => {
    const theme = getInitialTheme();
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    if (next === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('ab_theme', next);
    set({ theme: next });
  },

  isAdminSidebarOpen: true,
  toggleAdminSidebar: () => set((state) => ({ isAdminSidebarOpen: !state.isAdminSidebarOpen })),
  setAdminSidebarOpen: (isOpen) => set({ isAdminSidebarOpen: isOpen }),

  isUserSidebarOpen: false,
  toggleUserSidebar: () => set((state) => ({ isUserSidebarOpen: !state.isUserSidebarOpen })),
  setUserSidebarOpen: (isOpen) => set({ isUserSidebarOpen: isOpen }),

  isUserSidebarCollapsed: false,
  toggleUserSidebarCollapsed: () => set((state) => ({ isUserSidebarCollapsed: !state.isUserSidebarCollapsed })),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 3500;
    const newToast: ToastMessage = { id, duration, ...toast };

    set((state) => {
      // Keep at most 3 active toasts
      const existing = state.toasts.slice(-2);
      return { toasts: [...existing, newToast] };
    });

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
