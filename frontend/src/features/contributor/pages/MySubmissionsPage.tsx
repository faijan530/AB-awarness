import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery } from '@tanstack/react-query';
import { ContributorService } from '@/services/api/contributor-service';
import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  FileText,
  Search,
  MapPin,
  Eye,
  Edit3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Filter
} from 'lucide-react';

export const MySubmissionsPage: React.FC = () => {
  useDocumentTitle('My Submissions — Reporter Desk');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-submissions-list', selectedStatus],
    queryFn: () =>
      ContributorService.getMySubmissions({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        limit: 100,
      }),
  });

  const articles = data?.articles || [];

  const filteredArticles = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { key: 'ALL', label: 'All Submissions' },
    { key: 'DRAFT', label: 'Drafts' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'REVISION_REQUIRED', label: 'Revision Required' },
    { key: 'PUBLISHED', label: 'Published' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
              MY SUBMISSIONS DESK
            </span>
            <span className="text-xs text-slate-400 font-medium">Track Editorial Status & Resubmit Stories</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Journalism Submissions Registry
          </h1>
        </div>

        <Link to="/contributor/news/create">
          <Button variant="emerald" leftIcon={<Plus className="w-4 h-4" />}>
            Write New Story
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-card-user rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedStatus === tab.key
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search headline title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        {/* Submissions List */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Submissions Match Filter"
            description="No news stories were found under the selected status filter."
          />
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((art) => {
              const latestAction = (art as any).actions?.[0];
              const isRevisionRequired = art.status === 'REVISION_REQUIRED' || art.status === 'REJECTED';

              return (
                <div
                  key={art.id}
                  className={`p-5 rounded-2xl bg-slate-950/70 border transition-all space-y-3 ${
                    isRevisionRequired
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {art.category?.name || 'GENERAL'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" /> {art.location?.name || 'Jharkhand'}
                      </span>
                    </div>

                    <div>
                      {art.status === 'PUBLISHED' ? (
                        <Badge variant="emerald">PUBLISHED LIVE</Badge>
                      ) : isRevisionRequired ? (
                        <Badge variant="rose" pulse>REVISION REQUIRED</Badge>
                      ) : (
                        <Badge variant="amber" pulse>{art.status}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white font-serif leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {art.summary || art.content}
                    </p>
                  </div>

                  {/* Editor Remarks Box if Revision Requested */}
                  {isRevisionRequired && latestAction?.remarks && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-400" /> Super Admin Editor Remarks:
                      </div>
                      <p className="pl-5 italic text-slate-300">"{latestAction.remarks}"</p>
                    </div>
                  )}

                  {/* Card Action Footer */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="font-mono text-[11px]">
                      Submitted: {new Date(art.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-2">
                      {isRevisionRequired && (
                        <Link to={`/contributor/news/${art.id}/edit`}>
                          <Button variant="emerald" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                            Edit & Resubmit
                          </Button>
                        </Link>
                      )}

                      <Link to={`/contributor/submissions/${art.id}`}>
                        <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          View Timeline & Status
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
