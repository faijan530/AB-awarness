import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { ToastContainer } from '@/components/common/ToastContainer';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white relative w-full overflow-x-hidden">
      {/* Background ambient lighting for Admin Desk */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen w-full overflow-x-hidden">
        <AdminHeader />
        <div className="flex-1 flex overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-7xl w-full min-w-0 mx-auto overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};
