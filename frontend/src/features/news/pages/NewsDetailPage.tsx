import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NewsService } from '@/services/api/news-service';
import { EngagementService } from '@/services/api/engagement-service';
import { AnalyticsService } from '@/services/api/analytics-service';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ReactionsBar } from '@/components/engagement/ReactionsBar';
import { ShareModal } from '@/components/engagement/ShareModal';
import { ReportModal } from '@/components/engagement/ReportModal';
import { CommentSection } from '@/components/engagement/CommentSection';
import {
  ShieldCheck,
  MapPin,
  Clock,
  ArrowLeft,
  Eye,
  Share2,
  Bookmark,
  Calendar,
  AlertCircle,
  RefreshCw,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { AdBanner } from '@/components/ads/AdBanner';

export const NewsDetailPage: React.FC = () => {
  const { id: slug } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const {
    data: article,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['news-detail', slug],
    queryFn: () => NewsService.getArticleBySlug(slug || ''),
    enabled: !!slug,
  });

  // Track NEWS_VIEWED Telemetry Event
  React.useEffect(() => {
    if (article?.id) {
      AnalyticsService.trackEvent({
        event: 'NEWS_VIEWED',
        entityType: 'NEWS',
        entityId: article.id,
      }).catch(() => {});
    }
  }, [article?.id]);

  const { data: relatedStories = [] } = useQuery({
    queryKey: ['related-news', article?.id],
    queryFn: () => NewsService.getRelatedNews(article!.id, 4),
    enabled: !!article?.id,
  });

  // Bookmark status query
  const { data: bookmarkData } = useQuery({
    queryKey: ['news-bookmark-status', article?.id],
    queryFn: () => EngagementService.checkBookmarkStatus(article!.id),
    enabled: !!article?.id && isAuthenticated,
  });

  // Bookmark toggle mutation with 0ms instant optimistic updates
  const bookmarkMutation = useMutation({
    mutationFn: () => EngagementService.toggleBookmark(article!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['news-bookmark-status', article!.id] });
      const previous = queryClient.getQueryData<{ isBookmarked: boolean }>(['news-bookmark-status', article!.id]);
      const nextStatus = !previous?.isBookmarked;
      queryClient.setQueryData(['news-bookmark-status', article!.id], { isBookmarked: nextStatus });
      return { previous };
    },
    onSuccess: (res) => {
      queryClient.setQueryData(['news-bookmark-status', article!.id], { isBookmarked: res.isBookmarked });
      toast.success(res.isBookmarked ? 'Story Bookmarked' : 'Bookmark Removed', res.message);
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
    onError: (_err: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['news-bookmark-status', article!.id], context.previous);
      }
      toast.error('Failed to update bookmark');
    },
  });

  useDocumentTitle(article ? `${article.title} — AB Media` : 'Article Details');

  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      toast.info('Sign In Required', 'Please sign in to bookmark articles and build your personal reading list.');
      return;
    }
    bookmarkMutation.mutate();
  };

  const isBookmarked = bookmarkData?.isBookmarked || false;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Recently published';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'Recently published';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-96 rounded-2xl w-full" />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="max-w-3xl mx-auto pt-10 pb-16">
        <Card variant="glass" className="border-rose-500/30 text-rose-300 p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Article Not Found</h3>
          <p className="text-xs text-slate-400">
            {error?.message || 'The requested article may have been unpublished or removed.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Feed
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Navigation & Reader Actions Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 hover:text-rose-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Newsroom Feed
        </Link>

        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmarkToggle}
            disabled={bookmarkMutation.isPending}
            className={cn(
              'p-2 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95',
              isBookmarked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-800 hover:border-slate-700'
            )}
            title={isBookmarked ? 'Remove from Bookmarks' : 'Save to Bookmarks'}
          >
            <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current text-amber-400')} />
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer select-none active:scale-95"
            title="Share Story"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Report Button */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                toast.info('Sign In Required', 'Please sign in to submit community safety reports.');
                return;
              }
              setIsReportModalOpen(true);
            }}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer select-none active:scale-95"
            title="Report this article"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Article Header Ad Placement */}
      <AdBanner
        placementCode="NEWS_TOP"
        category={article.category?.slug}
        location={article.location?.slug}
      />

      {/* Headline & Editorial Badges */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="rose">{article.category?.name || 'GENERAL NEWS'}</Badge>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Story — Verified according to platform editorial verification workflow</span>
          </div>
          {article.isBreaking && <Badge variant="rose">BREAKING NEWS</Badge>}
          {article.isFeatured && <Badge variant="amber">FEATURED HERO</Badge>}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-base text-slate-300 font-medium leading-relaxed border-l-2 border-rose-500 pl-4 py-1 italic">
            {article.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono border-y border-slate-800/80 py-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> {article.location?.name || 'Jharkhand'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {formatDate(article.publishedAt)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Eye className="w-3.5 h-3.5 text-emerald-400" /> {article.viewCount} Views
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> 4 Min Read
            </span>
          </div>
        </div>

        {/* Top Reactions Bar */}
        <div className="pt-1">
          <ReactionsBar newsId={article.id} />
        </div>
      </div>

      {/* Article Body */}
      <Card variant="glass" className="space-y-6 text-slate-200 text-base leading-relaxed p-6 sm:p-8">
        <div className="prose prose-invert max-w-none space-y-4">
          {article.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-slate-200 leading-relaxed font-sans">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Bottom Engagement Strip */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
              Reader Reactions
            </span>
            <ReactionsBar newsId={article.id} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmarkToggle}
              leftIcon={<Bookmark className={cn('w-3.5 h-3.5', isBookmarked && 'fill-current text-amber-400')} />}
            >
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share
            </Button>
          </div>
        </div>

        {/* Author Bio Box */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-sm shadow-md">
              {article.author?.fullName ? article.author.fullName.substring(0, 2).toUpperCase() : 'ED'}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{article.author?.fullName || 'Senior Editorial Desk'}</h4>
              <p className="text-[11px] text-slate-400 font-mono">Super Admin Verified Journalist</p>
            </div>
          </div>
          <Badge variant="indigo">Verified Desk</Badge>
        </div>
      </Card>

      {/* Module 7: Official Sources & Verified Citations */}
      {(article as any).sources && (article as any).sources.length > 0 && (
        <Card variant="glass" className="p-6 space-y-4 border-emerald-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Official Sources & Verified Citations ({(article as any).sources.length})
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">Journalism Evidence</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(article as any).sources.map((s: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{s.name}</span>
                  <Badge variant="emerald">{s.credibilityStatus}</Badge>
                </div>
                {s.sourceNote && <p className="text-slate-400 italic">"{s.sourceNote}"</p>}
                {s.referenceUrl && (
                  <a
                    href={s.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:underline pt-1 text-[11px]"
                  >
                    View Official Reference ➔
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bottom of Article Ad Placement */}
      <AdBanner
        placementCode="NEWS_BOTTOM"
        category={article?.category?.slug}
        location={article?.location?.slug}
      />

      {/* Module 9: Threaded Comments Discussion Hub */}
      <CommentSection newsId={article.id} initialCommentCount={(article as any).commentCount || 0} />

      {/* Related News Stories Grid */}
      {relatedStories.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-xl font-black text-white font-serif tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" /> Related Stories in {article.category?.name || 'Jharkhand'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedStories.map((rel) => (
              <Link
                key={rel.id}
                to={`/news/${rel.slug}`}
                className="glass-card-user rounded-2xl p-4 space-y-2 hover:border-rose-500/30 transition-all block group"
              >
                <span className="text-[10px] font-extrabold uppercase text-rose-400 font-mono">
                  {rel.category?.name || 'RELATED'}
                </span>
                <h4 className="font-bold text-slate-100 text-sm group-hover:text-rose-300 transition-colors leading-snug line-clamp-2">
                  {rel.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">{rel.summary || rel.content}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        newsId={article.id}
        title={article.title}
      />

      {/* Report Modal Dialog */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="NEWS"
        targetId={article.id}
        targetTitle={article.title}
      />
    </div>
  );
};
