import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Newspaper,
  ShieldCheck,
  Image as ImageIcon,
  MessageSquare,
  AlertTriangle,
  Settings,
  X,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/utils/cn';

export const AdminSidebar: React.FC = () => {
  const isOpen = useUIStore((state) => state.isAdminSidebarOpen);
  const toggleAdminSidebar = useUIStore((state) => state.toggleAdminSidebar);

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'User Management', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'News Management', path: '/admin/news', icon: <Newspaper className="w-4 h-4" /> },
    { label: 'Fact Verification', path: '/admin/verification', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Media Library', path: '/admin/media', icon: <ImageIcon className="w-4 h-4" /> },
    { label: 'Comments Moderation', path: '/admin/comments', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Reports & Flagged', path: '/admin/reports', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'System Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
          onClick={toggleAdminSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 p-4 transition-all duration-200 flex flex-col justify-between',
          !isOpen && 'hidden md:flex md:w-20'
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between md:justify-center">
            <span className={cn('text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono', !isOpen && 'hidden md:block md:text-[9px]')}>
              {isOpen ? 'Super Admin Nav' : 'Admin'}
            </span>
            <button onClick={toggleAdminSidebar} className="md:hidden p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    isActive
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
                    !isOpen && 'md:justify-center md:px-0'
                  )
                }
                title={item.label}
              >
                {item.icon}
                <span className={cn(!isOpen && 'md:hidden')}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Info */}
        <div className={cn('pt-4 border-t border-slate-900 text-[10px] text-slate-500 font-mono', !isOpen && 'hidden')}>
          <p>Super Admin Authority</p>
          <p className="text-emerald-400">REST API /api/v1 Active</p>
        </div>
      </aside>
    </>
  );
};
