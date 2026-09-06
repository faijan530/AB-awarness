import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, MessageSquare, AlertCircle, ShieldAlert, Sparkles, X, ChevronRight } from 'lucide-react';
import { NotificationService, NotificationItem } from '@/services/api/notification-service';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/utils/cn';

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Unread Count Query
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => NotificationService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30s
  });

  const unreadCount = unreadData?.unreadCount || 0;

  // Notification List Query
  const { data: listData, isLoading } = useQuery({
    queryKey: ['notifications-list', unreadOnly],
    queryFn: () => NotificationService.getNotifications({ page: 1, limit: 15, unreadOnly }),
    enabled: isAuthenticated && isOpen,
  });

  // Mark as Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => NotificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  // Mark All as Read Mutation
  const markAllMutation = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  if (!isAuthenticated) return null;

  const notifications = listData?.notifications || [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'BREAKING_NEWS':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'COMMENT_REPLY':
      case 'COMMENT_REACTION':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'MODERATION_ACTION':
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-slate-700/60',
          isOpen ? 'bg-slate-800 text-white border-slate-700' : 'hover:bg-slate-850'
        )}
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-rose-950/80 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                  title="Mark all notifications as read"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 border-b border-slate-800/50 bg-slate-950/40 flex items-center gap-2 text-xs">
            <button
              onClick={() => setUnreadOnly(false)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-bold transition-colors',
                !unreadOnly ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              All
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-bold transition-colors',
                unreadOnly ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Unread only
            </button>
          </div>

          {/* Notifications Feed */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/50">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">All caught up</p>
                <p className="text-[11px] text-slate-500">No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((n: NotificationItem) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markReadMutation.mutate(n.id);
                  }}
                  className={cn(
                    'p-3.5 sm:p-4 flex items-start gap-3 hover:bg-slate-800/60 transition-colors cursor-pointer group',
                    !n.isRead && 'bg-indigo-950/20'
                  )}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-800/90 border border-slate-700/60 shrink-0">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
