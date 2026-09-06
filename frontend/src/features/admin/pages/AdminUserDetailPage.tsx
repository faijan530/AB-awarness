import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  Send,
  FileText
} from 'lucide-react';
import { AdminUserService } from '@/services/api/admin-user-service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [warningMessage, setWarningMessage] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: () => AdminUserService.getUserDetails(id!),
    enabled: Boolean(id),
  });

  const suspendMutation = useMutation({
    mutationFn: () => AdminUserService.suspendUser(id!, 'Administrative suspension'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      alert('User suspended successfully');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => AdminUserService.activateUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      alert('User restored/activated successfully');
    },
  });

  const warnMutation = useMutation({
    mutationFn: (reason: string) => AdminUserService.warnUser(id!, reason),
    onSuccess: () => {
      setShowWarningModal(false);
      setWarningMessage('');
      alert('Official warning issued to user and recorded in security audit.');
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-100">User not found</h2>
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          Return to Users
        </Button>
      </div>
    );
  }

  const isSuspended = user.status === 'SUSPENDED' || user.status === 'BLOCKED';

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back link */}
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users Directory
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <Card variant="glass" className="p-6 sm:p-8 border-slate-800/90 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-950/60 shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                user.fullName?.charAt(0) || 'U'
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">{user.fullName}</h1>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    user.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : user.status === 'SUSPENDED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{user.id}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWarningModal(true)}
              className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Issue Warning
            </Button>

            {isSuspended ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/80"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore / Activate
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to suspend this user account?')) {
                    suspendMutation.mutate();
                  }
                }}
                disabled={suspendMutation.isPending}
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" /> Suspend User
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Grid: Account Details, Roles, Security */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card variant="glass" className="p-6 space-y-4 border-slate-800/80">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
            <UserIcon className="w-4 h-4" /> Identity & Contact
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Email Address</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-200 font-medium">{user.email || 'Not provided'}</span>
                {user.emailVerified && (
                  <span title="Verified">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Phone Number</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-200 font-medium">{user.phone || 'Not provided'}</span>
                {user.phoneVerified && (
                  <span title="Verified">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                )}
              </div>
            </div>

            {user.bio && (
              <div>
                <span className="text-slate-500 block text-[11px]">Biography</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{user.bio}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Roles & Authorization */}
        <Card variant="glass" className="p-6 space-y-4 border-slate-800/80">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Roles & Permissions
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-slate-500 block text-[11px] mb-1.5">Assigned Roles</span>
              <div className="flex flex-wrap gap-1.5">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((r: string) => (
                    <span
                      key={r}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Standard Reader</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] mb-1.5">Permissions</span>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {user.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((p: string) => (
                    <span
                      key={p}
                      className="inline-block mr-1 mb-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Standard permissions</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Activity Timeline */}
        <Card variant="glass" className="p-6 space-y-4 border-slate-800/80">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Activity & Audit
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Member Since</span>
              <div className="flex items-center gap-1.5 text-slate-200 mt-0.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Last Login</span>
              <span className="text-slate-200 font-mono">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never logged in'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Failed Login Attempts</span>
              <span className="text-slate-200 font-mono">{user.failedLoginAttempts || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Issue Formal Warning
              </h3>
              <button onClick={() => setShowWarningModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Issuing a warning notifies the user and creates an auditable security record in the governance logs.
            </p>

            <textarea
              rows={3}
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              placeholder="State the policy violation reason (e.g. repeated unverified submissions, abusive comment language)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowWarningModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!warningMessage.trim() || warnMutation.isPending}
                onClick={() => warnMutation.mutate(warningMessage)}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Issue Warning
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
