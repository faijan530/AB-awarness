import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { AuthService } from '@/services/api/auth-service';
import { UserSession } from '@/types/common.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  User,
  Shield,
  Key,
  Laptop,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Trash2,
  Info,
  Lock,
  UserCheck,
  MapPin,
  Check,
  Loader2,
} from 'lucide-react';

type TabType = 'overview' | 'security' | 'sessions' | 'verification';

export const ProfilePage: React.FC = () => {
  useDocumentTitle('User Profile & Account Management');

  const { user, logout, logoutAll } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Modal Confirmation States
  const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  // Fetch Active Sessions via React Query
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => AuthService.getSessions(),
    enabled: activeTab === 'sessions',
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: AuthService.changePassword,
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Password Changed Successfully',
        message: 'Your password has been updated. All other active sessions have been revoked.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to change password. Please verify current password.';
      setPasswordError(msg);
      addToast({
        type: 'error',
        title: 'Password Change Failed',
        message: msg,
      });
    },
  });

  // Revoke Session Mutation
  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => AuthService.revokeSession(sessionId),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Session Revoked',
        message: 'The selected active session was successfully terminated.',
      });
      setSessionToRevoke(null);
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to revoke session.';
      addToast({
        type: 'error',
        title: 'Revocation Failed',
        message: msg,
      });
    },
  });

  // Logout All Mutation
  const logoutAllMutation = useMutation({
    mutationFn: () => logoutAll(),
    onSuccess: () => {
      addToast({
        type: 'info',
        title: 'Logged Out From All Devices',
        message: 'All active sessions have been revoked. Please log in again.',
      });
      setIsLogoutAllModalOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to logout all devices.';
      addToast({
        type: 'error',
        title: 'Logout All Failed',
        message: msg,
      });
    },
  });

  // Resend Email Verification Mutation
  const resendVerificationMutation = useMutation({
    mutationFn: () => AuthService.resendVerification(),
    onSuccess: (message) => {
      addToast({
        type: 'success',
        title: 'Verification Link Sent',
        message: message || 'Please check your email inbox for the verification link.',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to send verification email.';
      addToast({
        type: 'error',
        title: 'Verification Request Failed',
        message: msg,
      });
    },
  });

  // Password Policy Checks
  const policyChecks = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isPasswordFormValid =
    currentPassword.trim().length > 0 &&
    policyChecks.minLength &&
    policyChecks.hasUpper &&
    policyChecks.hasLower &&
    policyChecks.hasNumber &&
    policyChecks.hasSpecial &&
    policyChecks.match;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!isPasswordFormValid) {
      setPasswordError('Please meet all password security requirements before submitting.');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header Profile Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-emerald-500/20">
            {getUserInitials(user.fullName)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white">{user.fullName}</h1>
              {user.roles?.map((role) => (
                <Badge key={role} variant={role === 'SUPER_ADMIN' ? 'rose' : 'emerald'}>
                  {role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'CITIZEN REPORTER'}
                </Badge>
              ))}
              <Badge variant={user.status === 'ACTIVE' ? 'emerald' : 'amber'}>
                STATUS: {user.status || 'ACTIVE'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email || 'No email attached'}
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-400 font-medium text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-amber-400 font-medium text-[11px]">
                  <AlertTriangle className="w-3 h-3" /> Unverified
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLogoutAllModalOpen(true)}
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/50"
          >
            <Shield className="w-4 h-4 mr-1.5" /> Logout All Devices
          </Button>
          <Button variant="secondary" size="sm" onClick={() => logout()}>
            <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <User className="w-4 h-4" /> Profile Overview
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Key className="w-4 h-4" /> Password & Security
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Laptop className="w-4 h-4" /> Active Sessions
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'verification'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Shield className="w-4 h-4" /> Account Verification
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="glass" className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <UserCheck className="w-5 h-5 text-emerald-400" /> Account Identity
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-mono">Full Name</span>
                  <span className="text-slate-200 font-semibold text-sm">{user.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-mono">Email Address</span>
                  <span className="text-slate-200 font-semibold">{user.email || 'Not configured'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-mono">Phone Number</span>
                  <span className="text-slate-200 font-semibold">{user.phone || 'Not configured'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-mono">Account ID (UUID)</span>
                  <span className="text-slate-400 font-mono text-[11px] select-all">{user.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-mono">Member Since</span>
                  <span className="text-slate-300 font-mono">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </Card>

            <Card variant="glass" className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Shield className="w-5 h-5 text-emerald-400" /> System Roles & Permissions
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-mono mb-1.5">Assigned Roles</span>
                  <div className="flex gap-2 flex-wrap">
                    {user.roles?.map((r) => (
                      <Badge key={r} variant="emerald">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-mono mb-1.5">Authorized Permissions</span>
                  <div className="flex gap-1.5 flex-wrap max-h-36 overflow-y-auto pr-1">
                    {user.permissions?.map((p) => (
                      <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Honest Informational Banner regarding deferred APIs */}
          <Card variant="glass" className="border-sky-500/30 bg-sky-500/5 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-sky-200">Profile Management & Customization API Notice</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Profile editing (Full Name, Bio, Avatar Photo Upload), Theme Customization, Content Topic Preferences, and District Location Preferences will be enabled when the extended Profile API is deployed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs opacity-60">
                <span className="text-slate-400 font-mono text-[10px] block">NAME / BIO EDIT</span>
                <span className="text-slate-300 font-medium">Disabled (Pending API)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs opacity-60">
                <span className="text-slate-400 font-mono text-[10px] block">AVATAR UPLOAD</span>
                <span className="text-slate-300 font-medium">Disabled (Pending API)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs opacity-60">
                <span className="text-slate-400 font-mono text-[10px] block">UI PREFERENCES</span>
                <span className="text-slate-300 font-medium">Disabled (Pending API)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs opacity-60">
                <span className="text-slate-400 font-mono text-[10px] block">ACCOUNT DELETION</span>
                <span className="text-slate-300 font-medium">Disabled (Pending API)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: PASSWORD & SECURITY */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="glass" className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" /> Change Account Password
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Updating your password will automatically invalidate all other active sessions across devices for security.
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  label="Current Password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-200"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  label="New Password"
                  placeholder="Enter your new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="emerald"
                  type="submit"
                  isLoading={changePasswordMutation.isPending}
                  disabled={!isPasswordFormValid || changePasswordMutation.isPending}
                >
                  <Lock className="w-4 h-4 mr-1.5" /> Update Password
                </Button>
              </div>
            </form>
          </Card>

          {/* Password Policy Requirements Checklist */}
          <Card variant="glass" className="space-y-4">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Password Policy Requirements</h4>
            <ul className="space-y-2 text-xs">
              <li className={`flex items-center gap-2 ${policyChecks.minLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                {policyChecks.minLength ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                Minimum 8 characters
              </li>
              <li className={`flex items-center gap-2 ${policyChecks.hasUpper ? 'text-emerald-400' : 'text-slate-400'}`}>
                {policyChecks.hasUpper ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                At least one uppercase letter (A-Z)
              </li>
              <li className={`flex items-center gap-2 ${policyChecks.hasLower ? 'text-emerald-400' : 'text-slate-400'}`}>
                {policyChecks.hasLower ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                At least one lowercase letter (a-z)
              </li>
              <li className={`flex items-center gap-2 ${policyChecks.hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                {policyChecks.hasNumber ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                At least one number (0-9)
              </li>
              <li className={`flex items-center gap-2 ${policyChecks.hasSpecial ? 'text-emerald-400' : 'text-slate-400'}`}>
                {policyChecks.hasSpecial ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                At least one special character (!@#$%^&*)
              </li>
              <li className={`flex items-center gap-2 ${policyChecks.match ? 'text-emerald-400' : 'text-slate-400'}`}>
                {policyChecks.match ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                Passwords match
              </li>
            </ul>
          </Card>
        </div>
      )}

      {/* TAB 3: ACTIVE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-emerald-400" /> Active Devices & Sessions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                List of currently authorized sessions. You can revoke individual sessions or sign out from all devices.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchSessions()} isLoading={isLoadingSessions}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLogoutAllModalOpen(true)}
                className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
              >
                <Shield className="w-3.5 h-3.5 mr-1" /> Logout All Devices
              </Button>
            </div>
          </div>

          {isLoadingSessions && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {isSessionsError && (
            <Card variant="glass" className="border-rose-500/30 text-rose-300 p-6 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="font-bold text-sm">Unable to Load Active Sessions</h4>
              <p className="text-xs text-slate-400">{sessionsError?.message || 'Failed to communicate with backend session registry.'}</p>
              <Button variant="secondary" size="sm" onClick={() => refetchSessions()}>
                Try Again
              </Button>
            </Card>
          )}

          {!isLoadingSessions && !isSessionsError && sessions.length === 0 && (
            <EmptyState
              title="No Active Sessions Found"
              description="No extra active device sessions recorded for your account."
            />
          )}

          {!isLoadingSessions && !isSessionsError && sessions.length > 0 && (
            <div className="space-y-3">
              {sessions.map((sess: UserSession) => (
                <Card key={sess.id} variant="glass" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {sess.deviceInfo || 'Unknown Device'}
                      </h4>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap font-mono">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-500" /> IP: {sess.ipAddress || '127.0.0.1'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> Active Since: {formatDate(sess.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          Expires: {formatDate(sess.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSessionToRevoke(sess.id)}
                    className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACCOUNT VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="space-y-6 max-w-3xl">
          <Card variant="glass" className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-5 h-5 text-emerald-400" /> Account Verification Status
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Email Address Verification</h4>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>

                {user.emailVerified ? (
                  <Badge variant="emerald">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> VERIFIED
                  </Badge>
                ) : (
                  <div className="flex items-center gap-3">
                    <Badge variant="amber">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> UNVERIFIED
                    </Badge>
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => resendVerificationMutation.mutate()}
                      isLoading={resendVerificationMutation.isPending}
                    >
                      <Mail className="w-3.5 h-3.5 mr-1" /> Resend Verification
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Phone Number Verification</h4>
                    <p className="text-xs text-slate-400">{user.phone || 'Phone number not linked'}</p>
                  </div>
                </div>

                {user.phoneVerified ? (
                  <Badge variant="emerald">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> VERIFIED
                  </Badge>
                ) : (
                  <Badge variant="neutral">NOT CONFIGURED</Badge>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CONFIRM LOGOUT ALL MODAL */}
      <Modal
        isOpen={isLogoutAllModalOpen}
        onClose={() => setIsLogoutAllModalOpen(false)}
        title="Logout From All Devices?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to revoke all active sessions across all devices? This will invalidate your active refresh tokens and sign you out immediately.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsLogoutAllModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutAllMutation.mutate()}
              isLoading={logoutAllMutation.isPending}
              className="border-rose-500/50 text-rose-300 hover:bg-rose-500/20"
            >
              Confirm Logout All
            </Button>
          </div>
        </div>
      </Modal>

      {/* CONFIRM REVOKE SINGLE SESSION MODAL */}
      <Modal
        isOpen={!!sessionToRevoke}
        onClose={() => setSessionToRevoke(null)}
        title="Revoke Active Session?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to revoke this session? The device using this session will be logged out upon its next request.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSessionToRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sessionToRevoke && revokeSessionMutation.mutate(sessionToRevoke)}
              isLoading={revokeSessionMutation.isPending}
              className="border-rose-500/50 text-rose-300 hover:bg-rose-500/20"
            >
              Revoke Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
