import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuditService, AuditLogItem } from '@/services/api/audit-service';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Activity,
  Search,
  Filter,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  useDocumentTitle('Platform Activity & Audit Trail');

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data: distinctActions = [] } = useQuery({
    queryKey: ['admin-audit-actions-distinct'],
    queryFn: () => AuditService.getDistinctActions(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter],
    queryFn: () =>
      AuditService.getAuditLogs({
        page,
        limit: 25,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
      }),
  });

  const logs: AuditLogItem[] = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entityType.toLowerCase().includes(term) ||
      (log.entityId && log.entityId.toLowerCase().includes(term)) ||
      (log.actor?.fullName && log.actor.fullName.toLowerCase().includes(term))
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('WARN') || action.includes('SUSPEND') || action.includes('BLOCK') || action.includes('REJECT')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {action}
        </span>
      );
    }
    if (action.includes('PUBLISH') || action.includes('APPROVE') || action.includes('VERIFIED') || action.includes('CREATE')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
        {action}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-indigo-400" /> Platform Activity & Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable log of administrative governance, verification decisions, moderation events, and security actions.
        </p>
      </div>

      {/* Filter Bar */}
      <Card variant="glass" className="p-4 border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit logs by actor, action, or entity..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5" /> Action Event:
          </span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500/50 font-medium"
          >
            <option value="ALL">All Actions</option>
            {distinctActions.map((act: string) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table & Modal Container */}
      <Card variant="glass" className="border-slate-800/80 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8 text-indigo-400" />}
            title="No Audit Logs Found"
            description="There are no audit events matching the selected filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Timestamp</th>
                  <th className="py-3.5 px-4 font-bold">Actor</th>
                  <th className="py-3.5 px-4 font-bold">Action Event</th>
                  <th className="py-3.5 px-4 font-bold">Target Entity</th>
                  <th className="py-3.5 px-4 font-bold">IP Address</th>
                  <th className="py-3.5 px-4 font-bold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(log.createdAt).toLocaleTimeString()} ·{' '}
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-black text-[10px] flex items-center justify-center">
                          <User className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-200 block">{log.actor?.fullName || 'System / Admin'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.actor?.email || 'System'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {log.entityType}
                      {log.entityId && <span className="text-slate-500 block truncate max-w-[150px]">{log.entityId}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress || 'Internal'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-500/20 text-[11px] font-bold"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
            <span className="text-slate-400 font-mono">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* JSON Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#090d19] border border-indigo-500/30 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" /> Audit Log JSON Payload
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-3 rounded-xl border border-indigo-500/15">
                <div>
                  <span className="text-slate-500 block">Action:</span>
                  <span className="font-bold text-indigo-300">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Entity:</span>
                  <span className="font-bold text-slate-200">{selectedLog.entityType} ({selectedLog.entityId || 'N/A'})</span>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div>
                  <span className="text-rose-400 font-bold block mb-1">Previous Values (oldValues):</span>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-rose-500/20 text-rose-300 overflow-x-auto text-[11px]">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <span className="text-emerald-400 font-bold block mb-1">Updated Values (newValues):</span>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-emerald-500/20 text-emerald-300 overflow-x-auto text-[11px]">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
