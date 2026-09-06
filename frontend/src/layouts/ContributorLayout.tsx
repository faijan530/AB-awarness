import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Plus, Award, ShieldCheck } from 'lucide-react';

export const ContributorLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Contributor Sub-header Toolbar */}
      <div className="bg-slate-950/80 border border-rose-500/20 rounded-2xl backdrop-blur-md px-4 py-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-white font-serif">Reporter & Contributor Workspace</span>
          </div>

          <nav className="flex items-center gap-1.5 text-xs font-bold">
            <NavLink
              to="/contributor"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </NavLink>

            <NavLink
              to="/contributor/submissions"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <FileText className="w-3.5 h-3.5" /> My Submissions
            </NavLink>

            <NavLink
              to="/contributor/verification"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verification Desk
            </NavLink>

            <NavLink
              to="/contributor/news/create"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Write New Story
            </NavLink>
          </nav>
        </div>
      </div>

      <div>
        <Outlet />
      </div>
    </div>
  );
};
