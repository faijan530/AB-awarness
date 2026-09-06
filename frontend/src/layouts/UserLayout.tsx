import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserHeader } from '@/components/layout/UserHeader';
import { UserSidebar } from '@/components/layout/UserSidebar';
import { UserFooter } from '@/components/layout/UserFooter';
import { ToastContainer } from '@/components/common/ToastContainer';

export const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-600 selection:text-white relative">
      <UserHeader />
      <UserSidebar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <UserFooter />
      <ToastContainer />
    </div>
  );
};
