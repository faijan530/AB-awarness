import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated || role !== 'SUPER_ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
