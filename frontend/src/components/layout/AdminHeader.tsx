import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Shield, ExternalLink, Globe, Activity, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { HealthService } from '@/services/api/health-service';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const toggleAdminSidebar = useUIStore((state) => state.toggleAdminSidebar);
  const { user, logout } = useAuthStore();

  const { isSuccess } = useQuery({
    queryKey: ['backend-health'],
    queryFn: () => HealthService.getHealth(),
    refetchInterval: 10000,
    retry: 1,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      {/* Left section: Hamburger & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleAdminSidebar}
          aria-label="Toggle sidebar"
          className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-950">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-100 leading-tight">Super Admin Desk</h2>
            <p className="text-[10px] text-rose-400 uppercase font-mono font-bold">Panel 1 — Abhishek Bhardwaj Media</p>
          </div>
        </Link>
      </div>

      {/* Right section: Global Website Switcher & Backend Health Status */}
      <div className="flex items-center gap-3">
        {/* Backend API Integration Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full text-[11px] font-mono">
          <Activity className={`w-3 h-3 ${isSuccess ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-slate-400">Backend API:</span>
          <span className={isSuccess ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isSuccess ? 'Connected (/api/v1)' : 'Standby'}
          </span>
        </div>

        <Link
          to="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" /> View Public Site <ExternalLink className="w-3 h-3 text-slate-500" />
        </Link>

        <div className="flex items-center gap-3 border-l border-slate-800 pl-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-xs">
              SA
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-100">{user?.fullName || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-400">Editorial Authority</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
