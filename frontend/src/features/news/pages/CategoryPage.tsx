import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '@/services/api/category-service';
import { NewsArticle } from '@/services/api/news-service';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Tag,
  ArrowLeft,
  MapPin,
  Eye,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { AdBanner } from '@/components/ads/AdBanner';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const limit = 8;

  const {
    data: categoryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['category-news', slug, page],
    queryFn: () => CategoryService.getNewsByCategorySlug(slug || '', page, limit),
    enabled: !!slug,
  });

  const category = categoryData?.data?.category || categoryData?.category;
  const articles: NewsArticle[] = categoryData?.data?.articles || categoryData?.data || categoryData?.articles || [];
  const meta = categoryData?.meta;

  useDocumentTitle(category ? `${category.name} News — AB Media` : 'Category News');

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !category) {
    return (
      <div className="max-w-3xl mx-auto pt-10 pb-16">
        <Card variant="glass" className="border-rose-500/30 text-rose-300 p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Category Not Found</h3>
          <p className="text-xs text-slate-400">
            {error?.message || 'The requested category section does not exist.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
            <Link to="/">
              <Button variant="primary" size="sm">
                Back to Feed
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to News Portal
        </Link>

        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/20 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-md">
              CATEGORY SECTION
            </span>
            <Badge variant="indigo">
              <Layers className="w-3 h-3 inline mr-1" /> Taxonomy Tagged
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
            {category.name}
          </h1>

          {category.description && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {category.description}
            </p>
          )}

          <div className="pt-2 text-xs font-mono text-slate-400">
            Total Articles in Section: <span className="text-rose-400 font-bold">{meta?.total ?? articles.length}</span>
          </div>
        </div>
      </div>

      {/* Category Section Leaderboard Ad Placement */}
      <AdBanner placementCode="CATEGORY_TOP" category={slug} />

      {/* Article Grid */}
      {articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={`No Published Stories in ${category.name}`}
          description="Be the first citizen reporter to submit news for this category section!"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <div
                key={art.id}
                className="glass-card-user rounded-2xl overflow-hidden space-y-3 p-5 flex flex-col justify-between hover:border-rose-500/40 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {art.category?.name || category.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" /> {art.location?.name || 'Jharkhand'}
                    </span>
                  </div>

                  <Link to={`/news/${art.slug}`}>
                    <h3 className="font-bold text-slate-100 text-base group-hover:text-rose-300 transition-colors leading-snug line-clamp-2 font-serif">
                      {art.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {art.summary || art.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-rose-400" /> {art.viewCount} Views
                  </span>
                  <Link to={`/news/${art.slug}`} className="text-rose-400 font-extrabold hover:underline">
                    Read Story →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4 font-mono text-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-slate-300">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
