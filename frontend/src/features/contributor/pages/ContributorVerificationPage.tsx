import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery } from '@tanstack/react-query';
import { VerificationService } from '@/services/api/verification-service';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Sparkles,
  ArrowRight,
  Edit3,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const ContributorVerificationPage: React.FC = () => {
  useDocumentTitle('My Verification Records — Journalism Desk');

  const {
    data: history = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['contributor-verification-history'],
    queryFn: () => VerificationService.getMyVerificationHistory(),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="emerald"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Verified</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="indigo"><Clock className="w-3 h-3 mr-1 inline" /> In Review</Badge>;
      case 'PARTIALLY_VERIFIED':
        return <Badge variant="amber"><AlertTriangle className="w-3 h-3 mr-1 inline" /> Revision Required</Badge>;
      case 'REJECTED':
        return <Badge variant="rose"><XCircle className="w-3 h-3 mr-1 inline" /> Rejected</Badge>;
      default:
        return <Badge variant="slate"><Clock className="w-3 h-3 mr-1 inline" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Top Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-serif text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Verification Records & Originality Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track algorithmic originality scores, fact validation progress, and editorial review feedback for your articles
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Guidelines Alert Banner */}
      <Card variant="glass" className="p-4 border-indigo-500/30 bg-indigo-950/20 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2 text-indigo-300 font-bold">
          <Sparkles className="w-4 h-4" /> Editorial Credibility & Originality Guidelines
        </div>
        <p className="text-slate-400 leading-relaxed">
          All grassroots reports are cross-checked against registered database stories and official district records.
          Articles with originality scores &gt;75% and verified sources are prioritized for rapid publication across the live citizen news portal.
        </p>
      </Card>

      {/* Verification History Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Article Verification Audits ({history.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 rounded-xl w-full" />
            <Skeleton className="h-16 rounded-xl w-full" />
            <Skeleton className="h-16 rounded-xl w-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={ShieldCheck}
              title="No Verifications Yet"
              description="When you submit stories for editorial review, their originality and factual assertions will be tracked here."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-850/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(item.verificationStatus)}
                    <span className="text-[11px] font-mono text-slate-400">
                      Article Status: <strong className="text-emerald-400">{item.newsStatus}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 font-serif line-clamp-1">
                    {item.title}
                  </h3>

                  {/* Required Changes Banner if Revision Requested */}
                  {item.requiredChanges && (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1 animate-in slide-in-from-top-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase font-mono text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5" /> Required Editorial Changes:
                      </div>
                      <p className="text-slate-300 font-mono">{item.requiredChanges}</p>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 font-mono">
                    Last Checked: {new Date(item.updatedAt).toLocaleString()}
                  </div>
                </div>

                {/* Score Indicators & Action Button */}
                <div className="flex items-center gap-4 shrink-0 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Originality</div>
                    <div className={`text-base font-black font-mono ${
                      item.scores?.originality >= 80 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {item.scores?.originality ?? 100}%
                    </div>
                  </div>

                  <div className="w-px h-8 bg-slate-800" />

                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Fact Support</div>
                    <div className={`text-base font-black font-mono ${
                      item.scores?.factSupport >= 75 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {item.scores?.factSupport ?? 100}%
                    </div>
                  </div>

                  {item.verificationStatus === 'PARTIALLY_VERIFIED' || item.newsStatus === 'DRAFT' ? (
                    <Link to={`/contributor/news/${item.newsId}/edit`}>
                      <Button variant="primary" size="sm" className="whitespace-nowrap">
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Submission
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/contributor/submissions/${item.newsId}`}>
                      <Button variant="secondary" size="sm" className="whitespace-nowrap">
                        View Submission <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
