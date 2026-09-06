import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Bell,
  Send,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  Users,
  CheckCircle,
  Calendar,
  Layers,
  Link as LinkIcon
} from 'lucide-react';
import { NotificationService } from '@/services/api/notification-service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export const AdminNotificationsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [audience, setAudience] = useState('ALL_USERS');
  const [actionLink, setActionLink] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastDispatchedCount, setLastDispatchedCount] = useState<number | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: () =>
      NotificationService.broadcastNotification({
        type,
        title,
        message,
        entityType: actionLink ? 'LINK' : undefined,
        entityId: actionLink ? actionLink : undefined,
      }),
    onSuccess: (data) => {
      setIsSuccess(true);
      setLastDispatchedCount(data.sentCount);
      setTitle('');
      setMessage('');
      setActionLink('');
      setTimeout(() => setIsSuccess(false), 5000);
    },
  });

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Title and message are required.');
      return;
    }
    if (window.confirm(`Broadcast notification to active users? This cannot be undone.`)) {
      broadcastMutation.mutate();
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
          <Bell className="w-6 h-6 text-indigo-400" /> Platform Notifications & Broadcasts
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Compose platform-wide alerts, system maintenance bulletins, and breaking news dispatches.
        </p>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          Broadcast successfully dispatched to {lastDispatchedCount} user accounts!
        </div>
      )}

      {/* Main Composer Form */}
      <Card variant="glass" className="p-6 sm:p-8 border-slate-800/90 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Create Platform Announcement
          </h2>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase font-bold">
            Live Push Engine
          </span>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-4">
          {/* Row 1: Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Notification Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Infrastructure Maintenance Notice, Urgent Weather Alert"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Alert Category *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
              >
                <option value="SYSTEM">System Bulletin</option>
                <option value="BREAKING_NEWS">Breaking News Alert</option>
                <option value="NEWS_UPDATE">News Update</option>
                <option value="SECURITY">Security Advisory</option>
              </select>
            </div>
          </div>

          {/* Row 2: Message Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Message Body *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter announcement details for subscribers and citizen readers..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 leading-relaxed"
            />
          </div>

          {/* Row 3: Audience & Action Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Audience</label>
              <div className="flex items-center gap-2">
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="ALL_USERS">All Platform Users</option>
                  <option value="CONTRIBUTORS">Approved Reporters Only</option>
                  <option value="SUBSCRIBERS">Subscribers with Breaking News Enabled</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Action Destination URL (Optional)</label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={actionLink}
                  onChange={(e) => setActionLink(e.target.value)}
                  placeholder="/news/palamu-reservoir-update"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-500">
              Dispatches directly to user notification inboxes across web and mobile.
            </p>
            <Button
              type="submit"
              variant="primary"
              disabled={broadcastMutation.isPending || !title.trim() || !message.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              <Send className="w-3.5 h-3.5 mr-2" />
              {broadcastMutation.isPending ? 'Sending Broadcast...' : 'Dispatch Broadcast'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
