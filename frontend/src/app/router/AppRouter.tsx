import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';

// Layouts
import { UserLayout } from '@/layouts/UserLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Route Guards & Status Screens
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { NotFoundPage } from './NotFoundPage';
import { UnauthorizedPage } from './UnauthorizedPage';
import { SessionExpiredModal } from '@/components/common/SessionExpiredModal';
import { Skeleton } from '@/components/common/Skeleton';

// Code Splitting & Lazy Loading Components
const HomePage = lazy(() => import('@/features/news/pages/HomePage').then((m) => ({ default: m.HomePage })));
const NewsDetailPage = lazy(() => import('@/features/news/pages/NewsDetailPage').then((m) => ({ default: m.NewsDetailPage })));
const CategoryPage = lazy(() => import('@/features/news/pages/CategoryPage').then((m) => ({ default: m.CategoryPage })));
const LocationPage = lazy(() => import('@/features/news/pages/LocationPage').then((m) => ({ default: m.LocationPage })));
const TagPage = lazy(() => import('@/features/news/pages/TagPage').then((m) => ({ default: m.TagPage })));
const SearchPage = lazy(() => import('@/features/search/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const ProfilePage = lazy(() => import('@/features/users/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

// Contributor Desk Lazy Pages
const ContributorDashboardPage = lazy(() => import('@/features/contributor/pages/ContributorDashboardPage').then((m) => ({ default: m.ContributorDashboardPage })));
const MySubmissionsPage = lazy(() => import('@/features/contributor/pages/MySubmissionsPage').then((m) => ({ default: m.MySubmissionsPage })));
const CreateNewsPage = lazy(() => import('@/features/contributor/pages/CreateNewsPage').then((m) => ({ default: m.CreateNewsPage })));
const SubmissionDetailsPage = lazy(() => import('@/features/contributor/pages/SubmissionDetailsPage').then((m) => ({ default: m.SubmissionDetailsPage })));
const ContributorVerificationPage = lazy(() => import('@/features/contributor/pages/ContributorVerificationPage').then((m) => ({ default: m.ContributorVerificationPage })));

// Super Admin Lazy Pages
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminUserDetailPage = lazy(() => import('@/features/admin/pages/AdminUserDetailPage').then((m) => ({ default: m.AdminUserDetailPage })));
const AdminContributorsPage = lazy(() => import('@/features/admin/pages/AdminContributorsPage').then((m) => ({ default: m.AdminContributorsPage })));
const AdminNewsPage = lazy(() => import('@/features/admin/pages/AdminNewsPage').then((m) => ({ default: m.AdminNewsPage })));
const AdminCategoriesPage = lazy(() => import('@/features/admin/pages/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminLocationsPage = lazy(() => import('@/features/admin/pages/AdminLocationsPage').then((m) => ({ default: m.AdminLocationsPage })));
const AdminVerificationPage = lazy(() => import('@/features/admin/pages/AdminVerificationPage').then((m) => ({ default: m.AdminVerificationPage })));
const VerificationDetailPage = lazy(() => import('@/features/admin/pages/VerificationDetailPage').then((m) => ({ default: m.VerificationDetailPage })));
const AdminMediaPage = lazy(() => import('@/features/admin/pages/AdminMediaPage').then((m) => ({ default: m.AdminMediaPage })));
const AdminCommentsPage = lazy(() => import('@/features/admin/pages/AdminCommentsPage').then((m) => ({ default: m.AdminCommentsPage })));
const AdminReportsPage = lazy(() => import('@/features/admin/pages/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })));
const AdminNotificationsPage = lazy(() => import('@/features/admin/pages/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage })));
const AdminAdvertisingPage = lazy(() => import('@/features/admin/pages/AdminAdvertisingPage').then((m) => ({ default: m.AdminAdvertisingPage })));
const AdminActivityPage = lazy(() => import('@/features/admin/pages/AdminActivityPage').then((m) => ({ default: m.AdminActivityPage })));
const AdminAnalyticsPage = lazy(() => import('@/features/admin/pages/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage })));

const PageLoaderFallback = () => (
  <div className="p-8 space-y-4 max-w-5xl mx-auto">
    <Skeleton className="h-12 w-1/3 rounded-2xl" />
    <Skeleton className="h-48 w-full rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initTheme = useUIStore((state) => state.initTheme);

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  return (
    <BrowserRouter>
      <SessionExpiredModal />
      <Suspense fallback={<PageLoaderFallback />}>
        <Routes>
          {/* Public & User Layout Routes */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/news" element={<HomePage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/location/:slug" element={<LocationPage />} />
            <Route path="/tag/:slug" element={<TagPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected User & Reporter Desk Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/bookmarks" element={<ProfilePage />} />
              <Route path="/notifications" element={<ProfilePage />} />

              {/* Reporter Desk inside User Panel */}
              <Route path="/reporter" element={<ContributorDashboardPage />} />
              <Route path="/reporter/dashboard" element={<ContributorDashboardPage />} />
              <Route path="/reporter/write" element={<CreateNewsPage />} />
              <Route path="/reporter/submissions" element={<MySubmissionsPage />} />
              <Route path="/reporter/submissions/:id" element={<SubmissionDetailsPage />} />
              <Route path="/reporter/verification" element={<ContributorVerificationPage />} />

              {/* Aliases for /contributor within User Panel */}
              <Route path="/contributor" element={<ContributorDashboardPage />} />
              <Route path="/contributor/dashboard" element={<ContributorDashboardPage />} />
              <Route path="/contributor/write" element={<CreateNewsPage />} />
              <Route path="/contributor/submissions" element={<MySubmissionsPage />} />
              <Route path="/contributor/submissions/:id" element={<SubmissionDetailsPage />} />
              <Route path="/contributor/news/create" element={<CreateNewsPage />} />
              <Route path="/contributor/news/:id/edit" element={<CreateNewsPage />} />
              <Route path="/contributor/verification" element={<ContributorVerificationPage />} />
              <Route path="/contributor/history" element={<MySubmissionsPage />} />
            </Route>
          </Route>

          {/* Super Admin Layout Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
              <Route path="/admin/contributors" element={<AdminContributorsPage />} />
              <Route path="/admin/news" element={<AdminNewsPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/locations" element={<AdminLocationsPage />} />
              <Route path="/admin/verification" element={<AdminVerificationPage />} />
              <Route path="/admin/verification/:id" element={<VerificationDetailPage />} />
              <Route path="/admin/media" element={<AdminMediaPage />} />
              <Route path="/admin/comments" element={<AdminCommentsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/moderation" element={<AdminReportsPage />} />
              <Route path="/admin/moderation/:id" element={<AdminReportsPage />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
              <Route path="/admin/advertising" element={<AdminAdvertisingPage />} />
              <Route path="/admin/activity" element={<AdminActivityPage />} />
              <Route path="/admin/audit-logs" element={<AdminActivityPage />} />
            </Route>
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
