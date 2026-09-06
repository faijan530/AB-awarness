import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminUserService, AdminUserListItem } from '@/services/api/admin-user-service';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Users,
  Search,
  ShieldCheck,
  Ban,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Filter,
} from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';

export const AdminUsersPage: React.FC = () => {
  useDocumentTitle('Super Admin Desk — User Management');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Action Modals State
  const [suspendModalUser, setSuspendModalUser] = useState<AdminUserListItem | null>(null);
  const [blockModalUser, setBlockModalUser] = useState<AdminUserListItem | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Fetch Statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => AdminUserService.getUserStatistics(),
  });

  // Fetch Parameterized User List
  const {
    data: userListData,
    isLoading: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
    refetch,
  } = useQuery({
    queryKey: ['admin-users-list', page, debouncedSearch, statusFilter],
    queryFn: () =>
      AdminUserService.getUsers({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    placeholderData: (prev) => prev,
  });

  // Suspend Mutation
  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      AdminUserService.suspendUser(userId, reason),
    onSuccess: () => {
      toast.success('User Suspended', 'User account status set to SUSPENDED. Active sessions revoked.');
      setSuspendModalUser(null);
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to suspend user.';
      toast.error('Action Failed', msg);
    },
  });

  // Unsuspend Mutation
  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => AdminUserService.unsuspendUser(userId),
    onSuccess: () => {
      toast.success('User Restored', 'User account unsuspended and set to ACTIVE.');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
    onError: (err: any) => {
      toast.error('Action Failed', err.response?.data?.message || 'Failed to unsuspend user.');
    },
  });

  // Block Mutation
  const blockMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      AdminUserService.blockUser(userId, reason),
    onSuccess: () => {
      toast.success('User Blocked', 'User account permanently BLOCKED and sessions revoked.');
      setBlockModalUser(null);
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
    onError: (err: any) => {
      toast.error('Action Failed', err.response?.data?.message || 'Failed to block user.');
    },
  });

  // Unblock Mutation
  const unblockMutation = useMutation({
    mutationFn: (userId: string) => AdminUserService.unblockUser(userId),
    onSuccess: () => {
      toast.success('User Unblocked', 'User account unblocked and set to ACTIVE.');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
    onError: (err: any) => {
      toast.error('Action Failed', err.response?.data?.message || 'Failed to unblock user.');
    },
  });

  // Assign/Remove Role Mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      AdminUserService.assignRole(userId, roleName),
    onSuccess: () => {
      toast.success('Role Granted', 'SUPER_ADMIN role assigned successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (err: any) => {
      toast.error('Role Assignment Failed', err.response?.data?.message || 'Failed to assign role.');
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      AdminUserService.removeRole(userId, roleName),
    onSuccess: () => {
      toast.success('Role Revoked', 'SUPER_ADMIN role removed successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (err: any) => {
      toast.error('Role Removal Failed', err.response?.data?.message || 'Failed to remove role.');
    },
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/80">
              <Users className="w-5 h-5" />
            </div>
            User & Super Admin Management
          </h1>
          <p className="text-xs text-indigo-300 font-medium mt-1">
            Governance desk for managing accounts, roles, access statuses, and security enforcement
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-indigo-500/30 text-indigo-200">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh List
        </Button>
      </div>

      {/* Metrics Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 space-y-2 border-indigo-500/20 bg-indigo-950/20">
          <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider block">Total Registered</span>
          <div className="text-2xl font-black text-white">
            {isLoadingStats ? <Skeleton className="h-7 w-16" /> : stats?.totalUsers || 0}
          </div>
        </Card>

        <Card variant="glass" className="p-4 space-y-2 border-emerald-500/20 bg-emerald-950/20">
          <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider block">Active Accounts</span>
          <div className="text-2xl font-black text-emerald-400">
            {isLoadingStats ? <Skeleton className="h-7 w-16" /> : stats?.activeUsers || 0}
          </div>
        </Card>

        <Card variant="glass" className="p-4 space-y-2 border-amber-500/20 bg-amber-950/20">
          <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider block">Suspended</span>
          <div className="text-2xl font-black text-amber-400">
            {isLoadingStats ? <Skeleton className="h-7 w-16" /> : stats?.suspendedUsers || 0}
          </div>
        </Card>

        <Card variant="glass" className="p-4 space-y-2 border-rose-500/20 bg-rose-950/20">
          <span className="text-[11px] font-mono text-rose-300 uppercase tracking-wider block">Blocked</span>
          <div className="text-2xl font-black text-rose-400">
            {isLoadingStats ? <Skeleton className="h-7 w-16" /> : stats?.blockedUsers || 0}
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card-admin p-4 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900/90 border border-indigo-500/20 focus:border-indigo-400 text-xs text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
            <Filter className="w-3.5 h-3.5 text-indigo-400 mr-1 hidden sm:inline" />
            {['ALL', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <Card variant="glass" className="space-y-4 border-indigo-500/15 overflow-hidden">
        {isLoadingUsers && (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {isUsersError && (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h4 className="font-bold text-sm text-slate-200">Failed to Load User List</h4>
            <p className="text-xs text-slate-400">{usersError?.message || 'Error connecting to User API'}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoadingUsers && !isUsersError && userListData?.users.length === 0 && (
          <EmptyState
            title="No Users Found"
            description="No user accounts match your search query or filter criteria."
          />
        )}

        {!isLoadingUsers && !isUsersError && userListData && userListData.users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-indigo-300 uppercase font-mono text-[10px] tracking-wider border-b border-indigo-500/20">
                <tr>
                  <th className="p-4">User Identity</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Roles</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {userListData.users.map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-950/20 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                          {u.fullName ? u.fullName.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100">{u.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono select-all">ID: {u.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3 h-3 text-indigo-400" />
                        <span>{u.email || 'N/A'}</span>
                        {u.emailVerified && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <Badge
                        variant={
                          u.status === 'ACTIVE'
                            ? 'emerald'
                            : u.status === 'SUSPENDED'
                            ? 'amber'
                            : u.status === 'BLOCKED'
                            ? 'rose'
                            : 'neutral'
                        }
                      >
                        {u.status}
                      </Badge>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {u.roles.map((r) => (
                          <Badge key={r} variant={r === 'SUPER_ADMIN' ? 'rose' : 'emerald'}>
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Suspend / Unsuspend */}
                        {u.status === 'SUSPENDED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unsuspendMutation.mutate(u.id)}
                            isLoading={unsuspendMutation.isPending}
                            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-[11px]"
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Unsuspend
                          </Button>
                        ) : u.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSuspendModalUser(u)}
                            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-[11px]"
                          >
                            <UserX className="w-3 h-3 mr-1" /> Suspend
                          </Button>
                        ) : null}

                        {/* Block / Unblock */}
                        {u.status === 'BLOCKED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unblockMutation.mutate(u.id)}
                            isLoading={unblockMutation.isPending}
                            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-[11px]"
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Unblock
                          </Button>
                        ) : u.status !== 'DELETED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBlockModalUser(u)}
                            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-[11px]"
                          >
                            <Ban className="w-3 h-3 mr-1" /> Block
                          </Button>
                        ) : null}

                        {/* Assign / Remove Super Admin */}
                        {u.roles.includes('SUPER_ADMIN') ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRoleMutation.mutate({ userId: u.id, roleName: 'SUPER_ADMIN' })}
                            className="border-rose-500/30 text-rose-300 text-[11px]"
                            title="Remove Super Admin Role"
                          >
                            <Shield className="w-3 h-3 mr-1 text-rose-400" /> Revoke Admin
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => assignRoleMutation.mutate({ userId: u.id, roleName: 'SUPER_ADMIN' })}
                            className="border-indigo-500/40 text-indigo-300 text-[11px]"
                            title="Grant Super Admin Role"
                          >
                            <ShieldCheck className="w-3 h-3 mr-1 text-indigo-400" /> Make Admin
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoadingUsers && userListData && userListData.totalPages > 1 && (
          <div className="p-4 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-3">
            <span className="text-center sm:text-left">
              Showing Page <strong className="text-white">{userListData.page}</strong> of <strong className="text-white">{userListData.totalPages}</strong> ({userListData.total} Total Users)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(userListData.totalPages, p + 1))}
                disabled={page === userListData.totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* SUSPEND USER MODAL */}
      <Modal
        isOpen={!!suspendModalUser}
        onClose={() => setSuspendModalUser(null)}
        title={`Suspend Account: ${suspendModalUser?.fullName}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Suspending this user will restrict their platform access and immediately revoke all active refresh tokens.
          </p>
          <Input
            label="Reason for Suspension"
            placeholder="e.g. Repeated policy violation or spam submission"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSuspendModalUser(null)}>
              Cancel
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={() =>
                suspendModalUser &&
                suspendMutation.mutate({ userId: suspendModalUser.id, reason: actionReason || 'Admin Suspension' })
              }
              isLoading={suspendMutation.isPending}
            >
              Confirm Suspension
            </Button>
          </div>
        </div>
      </Modal>

      {/* BLOCK USER MODAL */}
      <Modal
        isOpen={!!blockModalUser}
        onClose={() => setBlockModalUser(null)}
        title={`Block Account: ${blockModalUser?.fullName}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Blocking is a strict administrative action that revokes sessions and prevents login.
          </p>
          <Input
            label="Reason for Block"
            placeholder="e.g. Severe harassment or fraudulent activity"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setBlockModalUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                blockModalUser &&
                blockMutation.mutate({ userId: blockModalUser.id, reason: actionReason || 'Admin Block' })
              }
              isLoading={blockMutation.isPending}
            >
              Confirm Block
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
