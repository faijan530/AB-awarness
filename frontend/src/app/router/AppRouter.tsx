import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import { UserLayout } from '@/layouts/UserLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { NotFoundPage } from './NotFoundPage';

// Feature Pages
import { HomePage } from '@/features/news/pages/HomePage';
import { NewsDetailPage } from '@/features/news/pages/NewsDetailPage';
import { SearchPage } from '@/features/search/pages/SearchPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';

import { ProfilePage } from '@/features/users/pages/ProfilePage';

// Admin Pages
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { AdminNewsPage } from '@/features/admin/pages/AdminNewsPage';
import { AdminVerificationPage } from '@/features/admin/pages/AdminVerificationPage';
import { AdminMediaPage } from '@/features/admin/pages/AdminMediaPage';
import { AdminCommentsPage } from '@/features/admin/pages/AdminCommentsPage';
import { AdminReportsPage } from '@/features/admin/pages/AdminReportsPage';
import { AdminSettingsPage } from '@/features/admin/pages/AdminSettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & User Layout Routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<HomePage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/category/:slug" element={<HomePage />} />
          <Route path="/location/:slug" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Citizen Reporter Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/bookmarks" element={<ProfilePage />} />
            <Route path="/notifications" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Super Admin Layout Routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/news" element={<AdminNewsPage />} />
            <Route path="/admin/verification" element={<AdminVerificationPage />} />
            <Route path="/admin/media" element={<AdminMediaPage />} />
            <Route path="/admin/comments" element={<AdminCommentsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
