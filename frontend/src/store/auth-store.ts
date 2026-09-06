import { create } from 'zustand';
import { UserProfile, UserRole, PermissionCode, SessionStatus } from '@/types/common.types';
import { AuthService, LoginPayload, RegisterPayload } from '@/services/api/auth-service';
import { setOnSessionExpired } from '@/services/api/api-client';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  sessionStatus: SessionStatus;
  isLoading: boolean;
  error: string | null;

  // Actions
  initAuth: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearError: () => void;
  setSessionExpired: () => void;
  dismissSessionExpired: () => void;

  // Helper Authorization Queries
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (permissions: PermissionCode[]) => boolean;
  hasAllPermissions: (permissions: PermissionCode[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Bind API 401 session expiration interceptor callback
  setOnSessionExpired(() => {
    get().setSessionExpired();
  });

  return {
    user: null,
    isAuthenticated: false,
    isInitializing: true,
    sessionStatus: 'UNAUTHENTICATED',
    isLoading: false,
    error: null,

    initAuth: async () => {
      set({ isInitializing: true });
      const token = localStorage.getItem('ab_access_token');
      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          sessionStatus: 'UNAUTHENTICATED',
          isInitializing: false,
        });
        return;
      }

      try {
        const user = await AuthService.getCurrentUser();
        set({
          user,
          isAuthenticated: true,
          sessionStatus: 'AUTHENTICATED',
          isInitializing: false,
        });
      } catch (err: any) {
        localStorage.removeItem('ab_access_token');
        const isAuthPath = typeof window !== 'undefined' && 
          (window.location.pathname === '/login' || window.location.pathname === '/register');
        set({
          user: null,
          isAuthenticated: false,
          sessionStatus: isAuthPath ? 'UNAUTHENTICATED' : 'EXPIRED',
          isInitializing: false,
        });
      }
    },

    login: async (payload: LoginPayload) => {
      set({ isLoading: true, error: null });
      try {
        const data = await AuthService.login(payload);
        set({
          user: data.user,
          isAuthenticated: true,
          sessionStatus: 'AUTHENTICATED',
          isLoading: false,
        });
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || 'Invalid credentials or login failed';
        set({ error: message, isLoading: false });
        throw new Error(message);
      }
    },

    register: async (payload: RegisterPayload) => {
      set({ isLoading: true, error: null });
      try {
        const data = await AuthService.register(payload);
        set({
          user: data.user,
          isAuthenticated: true,
          sessionStatus: 'AUTHENTICATED',
          isLoading: false,
        });
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || 'Registration failed';
        set({ error: message, isLoading: false });
        throw new Error(message);
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await AuthService.logout();
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          sessionStatus: 'UNAUTHENTICATED',
          isLoading: false,
          error: null,
        });
      }
    },

    logoutAll: async () => {
      set({ isLoading: true });
      try {
        await AuthService.logoutAll();
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          sessionStatus: 'UNAUTHENTICATED',
          isLoading: false,
          error: null,
        });
      }
    },

    clearError: () => set({ error: null }),

    setSessionExpired: () => {
      localStorage.removeItem('ab_access_token');
      set({
        user: null,
        isAuthenticated: false,
        sessionStatus: 'EXPIRED',
      });
    },

    dismissSessionExpired: () => {
      set({
        sessionStatus: 'UNAUTHENTICATED',
        error: null,
      });
    },

    hasRole: (role: UserRole) => {
      const user = get().user;
      if (!user) return false;
      return user.roles?.includes(role) || false;
    },

    hasPermission: (permission: PermissionCode) => {
      const user = get().user;
      if (!user) return false;
      if (user.roles?.includes('SUPER_ADMIN')) return true;
      return user.permissions?.includes(permission) || false;
    },

    hasAnyPermission: (permissions: PermissionCode[]) => {
      const user = get().user;
      if (!user) return false;
      if (user.roles?.includes('SUPER_ADMIN')) return true;
      return permissions.some((p) => user.permissions?.includes(p));
    },

    hasAllPermissions: (permissions: PermissionCode[]) => {
      const user = get().user;
      if (!user) return false;
      if (user.roles?.includes('SUPER_ADMIN')) return true;
      return permissions.every((p) => user.permissions?.includes(p));
    },
  };
});
