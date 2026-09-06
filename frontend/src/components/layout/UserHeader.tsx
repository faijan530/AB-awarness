import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '@/services/api/category-service';
import {
  Newspaper,
  Flame,
  Search,
  MapPin,
  Menu,
  Sparkles,
  LogIn,
  LogOut,
  Sun,
  Moon,
  PenTool,
  Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export const UserHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const { theme, toggleTheme, toggleUserSidebar } = useUIStore();

  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories-header'],
    queryFn: () => CategoryService.getCategories(),
  });

  const isNavActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070a14]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      {/* Top Live Ticker Strip */}
      <div className="bg-gradient-to-r from-slate-950 via-rose-950/20 to-slate-950 text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <span className="bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Live Desk
          </span>
          <span className="text-slate-300 font-medium text-[11px] truncate max-w-sm sm:max-w-xl">
            Jharkhand Regional Coverage — Palamu, Garhwa & Latehar Digital News Network
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <MapPin className="w-3 h-3 text-rose-400" /> Jharkhand, India
          </span>
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Main Header Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Sidebar Toggle Menu + Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Menu Drawer Toggle Button */}
          <button
            onClick={toggleUserSidebar}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 transition-all shadow-sm group"
            title="Open News & Reporter Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs font-black tracking-wide">Menu</span>
          </button>

          {/* Brand Logo Lockup */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 p-0.5 shadow-md group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#070a12] rounded-[10px] flex items-center justify-center">
                <Newspaper className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
              </div>
            </div>
            <div className="hidden min-[380px]:block">
              <h1 className="font-black text-base sm:text-lg tracking-tight text-white leading-tight">
                Abhishek Bhardwaj <span className="text-rose-500">Media</span>
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold leading-none">
                Digital News & Verification
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Pills */}
        <nav className="hidden lg:flex items-center gap-1 font-bold text-xs">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              isNavActive('/')
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" /> Breaking
          </Link>
          <Link
            to="/location/palamu"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              isNavActive('/location/palamu')
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900/60'
            }`}
          >
            Palamu
          </Link>
          <Link
            to="/location/garhwa"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              isNavActive('/location/garhwa')
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900/60'
            }`}
          >
            Garhwa
          </Link>
          <Link
            to="/location/latehar"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              isNavActive('/location/latehar')
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900/60'
            }`}
          >
            Latehar
          </Link>

          {/* Top Live Categories */}
          {categories.slice(0, 3).map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                isNavActive(`/category/${cat.slug}`)
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'text-slate-300 hover:text-rose-400 hover:bg-slate-900/60'
              }`}
            >
              {cat.name}
            </Link>
          ))}

          <Link
            to="/search"
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              isNavActive('/search')
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                : 'text-slate-300 hover:text-sky-400 hover:bg-slate-900/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Search
          </Link>
        </nav>

        {/* Right: Actions & User / Reporter Desk */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 text-slate-400 hover:text-amber-300 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all shadow-sm flex items-center"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Super Admin Desk Access Button (Visible only to Super Admin) */}
          {hasRole('SUPER_ADMIN') && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-950/80 border border-indigo-400/40 transition-all hover:scale-105"
              title="Open Super Admin Desk"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-200" />
              <span>Super Admin Panel ➔</span>
            </Link>
          )}

          {/* Reporter Desk Action Button */}
          <Link
            to="/reporter/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-rose-600/20 via-slate-900 to-amber-600/20 hover:from-rose-600/30 hover:to-amber-600/30 border border-rose-500/40 text-rose-300 hover:text-white transition-all shadow-sm group"
            title="Open Reporter Workspace Desk"
          >
            <PenTool className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Reporter Desk</span>
          </Link>

          {/* User Account / Sign In */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5">
              <NotificationBell />

              <Link
                to="/profile"
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 hover:border-rose-500/30 p-1.5 pr-2.5 rounded-xl text-xs font-bold text-slate-200 transition-all shadow-sm"
                title="View Citizen Profile"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-[10px] shadow-sm">
                  {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <span className="hidden sm:inline truncate max-w-[80px] text-xs">
                  {user?.fullName.split(' ')[0]}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-800 transition-colors"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white transition-all shadow-md flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> <span>Log In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
