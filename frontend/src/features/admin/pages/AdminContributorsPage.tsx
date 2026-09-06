import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  PenTool,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { AdminUserService } from '@/services/api/admin-user-service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';

export const AdminContributorsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contributors-list', search, statusFilter],
    queryFn: () =>
      AdminUserService.getUsers({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const users = data?.users || [];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
            <PenTool className="w-6 h-6 text-rose-500" /> Contributor & Reporter Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage grassroots journalists, local stringers, and approved community contributors.
          </p>
        </div>

        <Link to="/admin/news">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Submitted Stories
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Total Contributors</span>
          <p className="text-2xl font-black text-slate-100 mt-1">{data?.total || 0}</p>
        </Card>
        <Card variant="glass" className="p-4 border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Active Status</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {users.filter((u) => u.status === 'ACTIVE').length}
          </p>
        </Card>
        <Card variant="glass" className="p-4 border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Suspended</span>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {users.filter((u) => u.status === 'SUSPENDED').length}
          </p>
        </Card>
        <Card variant="glass" className="p-4 border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Verified Reporters</span>
          <p className="text-2xl font-black text-indigo-400 mt-1">
            {users.filter((u) => u.emailVerified).length}
          </p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card variant="glass" className="p-4 border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contributor by name or email..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500/50"
          >
            <option value="ALL">All Contributors</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card variant="glass" className="border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800/80">
              <tr>
                <th className="py-3.5 px-4 font-bold">Contributor / Reporter</th>
                <th className="py-3.5 px-4 font-bold">Contact Email</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Joined Date</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4">
                      <Skeleton className="h-6 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No contributors found matching query.
                  </td>
                </tr>
              ) : (
                users.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500/20 to-indigo-600/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{c.fullName}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {c.roles?.includes('SUPER_ADMIN') ? 'Super Admin' : 'Civic Reporter'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{c.email || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/admin/users/${c.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Inspect <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
