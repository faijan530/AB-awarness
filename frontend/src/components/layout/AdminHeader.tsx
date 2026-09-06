import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Shield, ExternalLink, Globe, LogOut, Sun, Moon } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const toggleAdminSidebar = useUIStore((state) => state.toggleAdminSidebar);
  const { theme, toggleTheme } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090d19]/90 backdrop-blur-xl border-b border-indigo-500/15 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-all shadow-xl shadow-black/20">
      {/* Left section: Hamburger & Logo */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={toggleAdminSidebar}
          aria-label="Toggle sidebar"
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-indigo-950/50 border border-transparent hover:border-indigo-500/20 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/80 group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-100 leading-tight tracking-wide group-hover:text-indigo-300 transition-colors">
              Super Admin Desk
            </h2>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Editorial Governance</p>
          </div>
        </Link>
      </div>

      {/* Right section: Theme Toggle, Panel Switcher & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 text-slate-400 hover:text-amber-300 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/20 hover:border-indigo-400/40 transition-all shadow-sm flex items-center gap-1.5"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden lg:inline text-xs font-semibold text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="hidden lg:inline text-xs font-semibold text-indigo-300">Dark</span>
            </>
          )}
        </button>

        {/* Notification Bell Dropdown */}
        <NotificationBell />

        {/* Working Panel Switcher Toggle Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600/20 via-rose-500/20 to-amber-500/20 hover:from-rose-600/30 hover:to-amber-500/30 border border-rose-500/30 hover:border-rose-400/50 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-200 hover:text-white transition-all shadow-md shadow-rose-950/20 group"
          title="Switch to Public User News Portal"
        >
          <Globe className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-12 transition-transform" /> 
          <span className="hidden sm:inline">Switch to User Portal</span>
          <span className="sm:hidden">User</span>
          <span className="bg-rose-500/30 px-1.5 py-0.5 rounded text-[10px] text-rose-200 font-mono">⇄</span>
        </button>

        <div className="flex items-center gap-3.5 border-l border-indigo-900/40 pl-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'SA'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#090d19] rounded-full shadow-sm" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-100 leading-none">{user?.fullName || 'Super Admin'}</p>
              <p className="text-[10px] font-semibold text-indigo-400/90 mt-1">Editorial Authority</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all ml-1 border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
