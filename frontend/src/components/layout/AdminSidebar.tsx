import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Newspaper,
  Layers,
  MapPin,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Settings,
  X,
  ChevronRight,
  PenTool,
  Bell,
  Megaphone,
  BarChart3,
  Activity,
  Image,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/utils/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export const AdminSidebar: React.FC = () => {
  const isOpen = useUIStore((state) => state.isAdminSidebarOpen);
  const toggleAdminSidebar = useUIStore((state) => state.toggleAdminSidebar);

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Analytics & Insights', path: '/admin/analytics', icon: <BarChart3 className="w-4 h-4 text-indigo-400" /> },
    { label: 'News Management', path: '/admin/news', icon: <Newspaper className="w-4 h-4" /> },
    { label: 'User Directory', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'Contributor Desk', path: '/admin/contributors', icon: <PenTool className="w-4 h-4 text-rose-400" /> },
    { label: 'Fact Verification', path: '/admin/verification', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
    { label: 'Media & Storage', path: '/admin/media', icon: <Image className="w-4 h-4 text-violet-400" /> },
    { label: 'Comments Moderation', path: '/admin/comments', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Reports & Flagged', path: '/admin/reports', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
    { label: 'Categories Taxonomy', path: '/admin/categories', icon: <Layers className="w-4 h-4" /> },
    { label: 'Locations Registry', path: '/admin/locations', icon: <MapPin className="w-4 h-4" /> },
    { label: 'Notification Center', path: '/admin/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Advertising Desk', path: '/admin/advertising', icon: <Megaphone className="w-4 h-4" /> },
    { label: 'Activity & Audit', path: '/admin/activity', icon: <Activity className="w-4 h-4" /> },
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
          'fixed md:static inset-y-0 left-0 z-40 bg-[#090d19] border-r border-indigo-500/15 p-4 transition-all duration-300 flex flex-col justify-between shadow-2xl shrink-0 min-h-screen md:min-h-0',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-64'
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Super Admin Desk
            </span>
            <button 
              onClick={toggleAdminSidebar} 
              className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768 && isOpen) {
                    toggleAdminSidebar();
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/80 border border-indigo-400/30'
                      : 'text-slate-400 hover:bg-indigo-950/40 hover:text-indigo-200 hover:border hover:border-indigo-500/15'
                  )
                }
                title={item.label}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-300" />
                </div>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-indigo-950/60 text-[11px] text-slate-400 font-mono flex items-center justify-between px-1">
          <span className="text-slate-400 font-semibold">Governance</span>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      </aside>
    </>
  );
};
