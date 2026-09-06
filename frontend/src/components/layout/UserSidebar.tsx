import React, { useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '@/services/api/category-service';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/utils/cn';
import {
  Newspaper,
  Flame,
  Search,
  MapPin,
  ShieldCheck,
  Tag as TagIcon,
  PenTool,
  LayoutDashboard,
  User as UserIcon,
  LogIn,
  LogOut,
  X,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Bookmark,
  Layers,
  FileText,
  Shield,
  PlusCircle
} from 'lucide-react';

export const UserSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  
  const isOpen = useUIStore((state) => state.isUserSidebarOpen);
  const setUserSidebarOpen = useUIStore((state) => state.setUserSidebarOpen);
  const { theme, toggleTheme } = useUIStore();

  // Close sidebar automatically when route changes
  useEffect(() => {
    setUserSidebarOpen(false);
  }, [location.pathname, setUserSidebarOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setUserSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setUserSidebarOpen]);

  // Fetch dynamic categories
  const { data: categories = [] } = useQuery({
    queryKey: ['user-sidebar-categories'],
    queryFn: () => CategoryService.getCategories(),
  });

  const handleLogout = async () => {
    await logout();
    setUserSidebarOpen(false);
    navigate('/');
  };

  const closeSidebar = () => setUserSidebarOpen(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className={cn(
          'relative z-50 w-80 max-w-[85vw] bg-[#070a14] border-r border-slate-800/90 shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar h-full animate-in slide-in-from-left duration-300'
        )}
      >
        <div className="p-4 space-y-5">
          {/* Top Brand Header & Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <Link to="/" onClick={closeSidebar} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-md">
                <div className="w-full h-full bg-[#070a12] rounded-[9px] flex items-center justify-center">
                  <Newspaper className="w-4 h-4 text-rose-400" />
                </div>
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white tracking-tight leading-none">
                  Abhishek Bhardwaj
                </h2>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Media Platform
                </span>
              </div>
            </Link>

            <button
              onClick={closeSidebar}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 border border-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Citizen / User Profile Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 shadow-md">
            {isAuthenticated && user ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        user.fullName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 font-black uppercase border border-rose-500/30">
                    Citizen Contributor
                  </span>
                  <Link
                    to="/profile"
                    onClick={closeSidebar}
                    className="text-sky-400 hover:underline font-bold flex items-center gap-0.5"
                  >
                    My Account <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-center py-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Citizen Journalism
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Join citizen reporters covering Palamu, Garhwa & Latehar.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={closeSidebar}
                    className="flex-1 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 text-white rounded-xl text-xs font-bold shadow-md text-center transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeSidebar}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold text-center transition-all"
                  >
                    Join
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* FEATURED: THE REPORTER DESK (PROMINENTLY HIGHLIGHTED) */}
          {/* =============================================================== */}
          <div className="rounded-2xl p-3 bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-indigo-950/30 border border-rose-500/30 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-extrabold text-white tracking-tight font-serif">
                  Reporter Desk
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Workspace
              </span>
            </div>

            <Link
              to="/reporter/write"
              onClick={closeSidebar}
              className="w-full py-2 px-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all group"
            >
              <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Write New Story</span>
            </Link>

            <nav className="space-y-1 pt-1">
              <NavLink
                to="/reporter/dashboard"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                  <span>Reporter Dashboard</span>
                </div>
              </NavLink>

              <NavLink
                to="/reporter/submissions"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>My Submissions Timeline</span>
                </div>
              </NavLink>

              <NavLink
                to="/reporter/verification"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fact Verification Status</span>
                </div>
              </NavLink>
            </nav>
          </div>

          {/* =============================================================== */}
          {/* SECTION: NEWS FEEDS & DISCOVERY */}
          {/* =============================================================== */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 font-mono">
              News Feeds & Portals
            </span>

            <nav className="space-y-1">
              <NavLink
                to="/"
                end
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group',
                    isActive
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <Newspaper className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>All & Latest News</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/30 text-rose-300">
                  Live
                </span>
              </NavLink>

              <NavLink
                to="/search"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group',
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Search & Filter</span>
                </div>
              </NavLink>
            </nav>
          </div>

          {/* =============================================================== */}
          {/* SECTION: REGIONAL EDITIONS (JHARKHAND) */}
          {/* =============================================================== */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 px-2 font-mono flex items-center justify-between">
              <span>Regional Editions</span>
              <span className="text-[9px] text-slate-500">Jharkhand</span>
            </span>

            <nav className="space-y-1">
              <NavLink
                to="/location/palamu"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900/60'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Palamu Division Desk</span>
                </div>
              </NavLink>

              <NavLink
                to="/location/garhwa"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900/60'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Garhwa District Desk</span>
                </div>
              </NavLink>

              <NavLink
                to="/location/latehar"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900/60'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Latehar District Desk</span>
                </div>
              </NavLink>
            </nav>
          </div>

          {/* =============================================================== */}
          {/* SECTION: TOPICS & CATEGORIES */}
          {/* =============================================================== */}
          {categories.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 font-mono flex items-center justify-between">
                <span>Topics & Categories</span>
                <span className="text-[9px] text-slate-500">{categories.length} Sections</span>
              </span>

              <nav className="space-y-1">
                {categories.map((cat) => (
                  <NavLink
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all group',
                        isActive
                          ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      )
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <TagIcon className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </NavLink>
                ))}
              </nav>
            </div>
          )}

          {/* Super Admin Desk Access (Visible only to Super Admin) */}
          {hasRole('SUPER_ADMIN') && (
            <div className="pt-2 border-t border-indigo-500/20">
              <Link
                to="/admin/dashboard"
                onClick={closeSidebar}
                className="flex items-center justify-between p-2.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/40 text-indigo-300 hover:text-white hover:border-indigo-400 shadow-md group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform shrink-0" />
                  <span>Super Admin Panel</span>
                </div>
                <span className="text-[9px] font-black uppercase bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded">
                  Admin Desk ➔
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Dark Mode
                </>
              )}
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" /> Log Out
              </button>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-center leading-tight">
            Abhishek Bhardwaj Media v1.0
          </div>
        </div>
      </aside>
    </div>
  );
};
