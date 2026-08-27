import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Newspaper, Flame, Search, MapPin, Shield, Menu, X, Bell, Activity, Sparkles, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { HealthService } from '@/services/api/health-service';

export const UserHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();

  const { isSuccess } = useQuery({
    queryKey: ['backend-health-user'],
    queryFn: () => HealthService.getHealth(),
    refetchInterval: 10000,
    retry: 1,
  });

  const isNavActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 shadow-2xl backdrop-blur-xl">
      {/* Premium Ticker */}
      <div className="bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 text-xs py-1.5 px-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-md shadow-rose-950 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Live Desk
          </span>
          <span className="text-slate-300 font-medium text-[11px] truncate max-w-xl">
            Palamu, Garhwa & Latehar Digital Journalism Corridor — Super Admin Human Supervised
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
            <Activity className={`w-3 h-3 ${isSuccess ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            API: <span className={isSuccess ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{isSuccess ? 'Online' : 'Standby'}</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" /> Jharkhand, India
          </span>
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-rose-600 p-0.5 shadow-xl shadow-rose-950/50 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-rose-400 group-hover:text-rose-300 transition-colors" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-lg md:text-xl tracking-tight text-gradient-rose">
              Abhishek Bhardwaj Media
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-gradient-emerald font-extrabold">
              Dynamic Digital Journalism Ecosystem
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 font-bold text-xs">
          <Link
            to="/"
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              isNavActive('/')
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-md shadow-rose-950/30'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/60'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-500" /> Breaking & Latest
          </Link>
          <Link
            to="/news/palamu"
            className={`px-3 py-2 rounded-xl transition-all ${
              isNavActive('/news/palamu')
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/60'
            }`}
          >
            Palamu
          </Link>
          <Link
            to="/news/garhwa"
            className={`px-3 py-2 rounded-xl transition-all ${
              isNavActive('/news/garhwa')
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/60'
            }`}
          >
            Garhwa
          </Link>
          <Link
            to="/search"
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1 ${
              isNavActive('/search')
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-300 hover:text-sky-400 hover:bg-slate-900/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Search
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="p-2.5 text-slate-400 hover:text-slate-100 relative rounded-xl hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-800"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-1.5 pr-3 rounded-xl text-xs font-bold text-slate-200 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xs shadow-md">
                  {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <span className="truncate max-w-[90px]">{user?.fullName.split(' ')[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-xl border border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" /> Log In
            </Link>
          )}

          {hasRole('SUPER_ADMIN') && (
            <Link
              to="/admin/dashboard"
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-950 to-slate-900 border border-rose-500/30 text-rose-300 hover:border-rose-400 hover:text-white transition-all shadow-lg shadow-rose-950/40 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" /> Admin
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-900 border border-slate-800"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl p-4 space-y-2 animate-in slide-in-from-top-3 duration-200">
          <nav className="flex flex-col space-y-1 text-sm font-bold text-slate-300">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 hover:bg-slate-900 rounded-xl">
              Breaking & Latest News
            </Link>
            <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 hover:bg-slate-900 rounded-xl">
              Search News
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 hover:bg-slate-900 rounded-xl">
                  My Citizen Profile
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="p-2.5 hover:bg-slate-900 text-red-400 text-left rounded-xl"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 hover:bg-slate-900 text-emerald-400 rounded-xl">
                Log In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
