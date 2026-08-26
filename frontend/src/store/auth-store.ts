import { create } from 'zustand';
import { UserProfile, UserRole } from '@/types/common.types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  setAuth: (user: UserProfile | null, token?: string) => void;
  logout: () => void;
}

// Foundation authentication store placeholder for Module 2
export const useAuthStore = create<AuthState>((set) => ({
  // Default mock state for Module 1 shell testing
  user: {
    id: 'usr_01',
    email: 'admin@abmedia.in',
    fullName: 'Abhishek Bhardwaj (Super Admin)',
    role: 'SUPER_ADMIN',
    district: 'Palamu',
  },
  isAuthenticated: true,
  role: 'SUPER_ADMIN',

  setAuth: (user, token) => {
    if (token) {
      localStorage.setItem('ab_media_access_token', token);
    }
    set({
      user,
      isAuthenticated: !!user,
      role: user?.role || null,
    });
  },

  logout: () => {
    localStorage.removeItem('ab_media_access_token');
    set({
      user: null,
      isAuthenticated: false,
      role: null,
    });
  },
}));
