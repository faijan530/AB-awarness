import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery } from '@tanstack/react-query';
import { NewsService, NewsArticle } from '@/services/api/news-service';
import { CategoryService } from '@/services/api/category-service';
import { LocationService } from '@/services/api/location-service';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/auth-store';
import { CreateNewsModal } from '../components/CreateNewsModal';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { NewsCard } from '@/components/news/NewsCard';
import { 
  Flame, 
  ShieldCheck, 
  MapPin, 
  Eye, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Clock, 
  Share2, 
  Bookmark, 
  CheckCircle, 
  CloudSun,
  FileText,
  AlertCircle,
  RefreshCw,
  Radio,
  Sparkles,
  Layers
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AdBanner } from '@/components/ads/AdBanner';

export const HomePage: React.FC = () => {
  useDocumentTitle('Abhishek Bhardwaj Media — Digital News & Citizen Journalism');
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeLocation, setActiveLocation] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const limit = 6;

  // 1. Fetch Live Breaking News Alerts
  const { data: breakingAlerts = [] } = useQuery({
    queryKey: ['breaking-news'],
    queryFn: () => NewsService.getBreakingNews(),
    refetchInterval: 15000,
  });

  // 2. Fetch Featured Hero Story
  const { data: featuredStory, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['featured-news'],
    queryFn: () => NewsService.getFeaturedNews(),
  });

  // 3. Fetch Trending Stories
  const { data: trendingStories = [] } = useQuery({
    queryKey: ['trending-news'],
    queryFn: () => NewsService.getTrendingNews(5),
  });

  // 4. Fetch Live Database Categories for Filter Tabs
  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories-home'],
    queryFn: () => CategoryService.getCategories(),
  });

  // 5. Fetch Live Database Locations for Region Filter
  const { data: locations = [] } = useQuery({
    queryKey: ['public-locations-home'],
    queryFn: () => LocationService.getLocations(),
  });

  // 6. Fetch Paginated News Feed based on Category and Location Filter
  const {
    data: newsFeedData,
    isLoading: isLoadingFeed,
    isError: isFeedError,
    error: feedError,
    refetch: refetchFeed,
  } = useQuery({
    queryKey: ['news-feed', page, activeCategory, activeLocation],
    queryFn: () =>
      NewsService.getNewsFeed({
        page,
        limit,
        category: activeCategory === 'all' ? undefined : activeCategory,
        location: activeLocation === 'all' ? undefined : activeLocation,
      }),
  });

  const handleShare = (title: string, slug: string) => {
    const url = `${window.location.origin}/news/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    toast.success('Link Copied!', `Article link for "${title}" copied to clipboard.`);
  };

  const handleBookmark = (title: string) => {
    toast.success('Bookmarked!', `"${title}" saved to your reading list.`);
  };

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      {/* Live Breaking News Ticker Bar */}
      {breakingAlerts.length > 0 && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-rose-950/90 via-[#111827] to-rose-950/90 p-3 px-4 rounded-2xl border border-rose-500/30 shadow-xl backdrop-blur-md">
          <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1.5 shrink-0 shadow-md shadow-rose-950">
            <Radio className="w-3.5 h-3.5 animate-ping" /> BREAKING NEWS
          </span>
          <div className="overflow-hidden whitespace-nowrap text-xs text-rose-100 font-bold truncate">
            {breakingAlerts[0].title} — <span className="text-slate-400 font-normal">{breakingAlerts[0].summary}</span>
          </div>
        </div>
      )}

      {/* Leaderboard Ad Slot */}
      <AdBanner placementCode="HOME_TOP" />

      {/* Top Weather & Quick Regional Telemetry Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-[#090d19] via-[#0d1326] to-[#090d19] p-3.5 px-6 rounded-2xl border border-indigo-500/15 shadow-xl">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
            <CloudSun className="w-4 h-4 text-amber-400" /> 28°C Sunny
          </div>
          <span className="hidden md:inline text-slate-400">Palamu Division Regional News Hub</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry Engine Connected
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Hot Topics:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-bold">
            #PalamuNH75
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
            #GarhwaAgri
          </span>
        </div>
      </div>

      {/* Main Hero Spotlight Showcase */}
      {featuredStory ? (
        <section className="relative overflow-hidden rounded-3xl border border-rose-500/25 shadow-2xl group bg-gradient-to-br from-slate-900 via-[#090e1f] to-slate-950">
          {/* Background Glows */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-4xl space-y-5">
            {isLoadingFeatured ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-16 w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="emerald" pulse>
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> Super Admin Verified
                  </Badge>
                  <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-950">
                    {featuredStory.category?.name || 'FEATURED REPORT'}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold flex items-center gap-1 bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> {featuredStory.location?.name || 'Jharkhand'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-serif text-white tracking-tight leading-tight group-hover:text-rose-100 transition-colors">
                  {featuredStory.title}
                </h2>

                {featuredStory.summary && (
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium line-clamp-3">
                    {featuredStory.summary}
                  </p>
                )}

                <div className="flex items-center gap-6 pt-2 text-xs font-semibold text-slate-400 font-mono">
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Author: {featuredStory.author?.fullName || 'Citizen Reporter'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-rose-400" /> {featuredStory.viewCount} Readers Reached
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-3">
                  <Link to={`/news/${featuredStory.slug || featuredStory.id}`}>
                    <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Read Full Story
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    leftIcon={<Bookmark className="w-4 h-4 text-amber-400" />}
                    onClick={() => handleBookmark(featuredStory.title)}
                  >
                    Bookmark Story
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}

      {/* In-Feed Middle Ad Slot */}
      <AdBanner placementCode="HOME_MIDDLE" />

      {/* Grid: Live Paginated Feed & Trending Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Category Filters & News Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header & Category Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-inner">
                <Flame className="w-5 h-5 text-rose-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white font-serif tracking-tight">
                  Live News Feed & Coverage
                </h3>
                <p className="text-xs text-slate-400 font-medium">Real-time local journalism updates</p>
              </div>
            </div>

            {/* Dynamic Category Filter Tabs from Database */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  activeCategory === 'all'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 border border-rose-400/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                All Stories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.slug);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                    activeCategory === cat.slug
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 border border-rose-400/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Geographic Region Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <span className="text-[11px] font-black uppercase text-slate-400 font-mono flex items-center gap-1 shrink-0 pr-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> District Region:
            </span>
            <button
              onClick={() => {
                setActiveLocation('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeLocation === 'all'
                  ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All Regions
            </button>
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  setActiveLocation(loc.slug);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  activeLocation === loc.slug
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* Loading Feed Skeleton */}
          {isLoadingFeed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-2xl w-full" />
              <Skeleton className="h-64 rounded-2xl w-full" />
            </div>
          )}

          {/* Error Feed Retry State */}
          {isFeedError && (
            <Card variant="glass" className="border-rose-500/30 text-rose-300 p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="font-bold text-sm">Unable to Load News Feed</h4>
              <p className="text-xs text-slate-400">{feedError?.message || 'Failed to communicate with live news service'}</p>
              <Button variant="secondary" size="sm" onClick={() => refetchFeed()}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Connection
              </Button>
            </Card>
          )}

          {/* Empty Feed State */}
          {!isLoadingFeed && !isFeedError && newsFeedData?.articles.length === 0 && (
            <EmptyState
              title="No Stories Available"
              description="No published news stories match the selected category or regional district filter."
            />
          )}

          {/* News Feed Grid Cards */}
          {!isLoadingFeed && !isFeedError && newsFeedData && newsFeedData.articles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsFeedData.articles.map((art: NewsArticle) => (
                <NewsCard
                  key={art.id}
                  article={art}
                  onShare={handleShare}
                  onBookmark={handleBookmark}
                />
              ))}
            </div>
          )}

          {/* Feed Pagination */}
          {newsFeedData && newsFeedData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-indigo-500/15 text-xs text-slate-400">
              <span>
                Page {page} of {newsFeedData.totalPages} ({newsFeedData.total} articles)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= newsFeedData.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next Page
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Trending News & Citizen Desk Widgets */}
        <aside className="space-y-6">
          {/* Trending News Widget */}
          <div className="glass-card-user rounded-2xl p-6 space-y-4 border-slate-800">
            <div className="flex items-center gap-2.5 border-b border-indigo-500/15 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-inner">
                <TrendingUp className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">Trending Headlines</h4>
                <p className="text-[10px] text-slate-400 font-mono">Most read across Jharkhand</p>
              </div>
            </div>

            {trendingStories.length > 0 ? (
              <div className="space-y-3">
                {trendingStories.map((story: NewsArticle, idx: number) => (
                  <Link
                    key={story.id}
                    to={`/news/${story.slug}`}
                    className="block p-3.5 rounded-xl bg-[#0a0e1c]/80 hover:bg-[#0f152b] border border-indigo-500/15 hover:border-amber-500/30 transition-all space-y-1 group transform-gpu active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-black font-mono text-xs">#{idx + 1}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">{story.category?.name || 'NEWS'}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                      {story.title}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No trending stories available yet.</p>
            )}
          </div>

          {/* Citizen Reporter Submission Card */}
          <div className="glass-card-user rounded-2xl p-6 space-y-4 border-l-4 border-l-emerald-500 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">Citizen Reporter Desk</h4>
                <p className="text-[11px] text-emerald-400 font-semibold">Grassroots Journalism</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Have local news, photo evidence, or incident updates from Palamu, Garhwa, or Latehar? Submit reports directly for Super Admin verification.
            </p>
            <Button
              variant="emerald"
              className="w-full shadow-lg shadow-emerald-950/60"
              onClick={() => {
                if (isAuthenticated) {
                  setIsCreateModalOpen(true);
                } else {
                  toast.info('Login Required', 'Please log in to submit a citizen news report.');
                  navigate('/login');
                }
              }}
            >
              Submit Citizen Report
            </Button>
          </div>

          {/* Fact-Check Corner */}
          <div className="glass-card-user rounded-2xl p-6 space-y-4 border-slate-800">
            <div className="flex items-center gap-2.5 border-b border-indigo-500/15 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">Fact-Check Corner</h4>
                <p className="text-[10px] text-slate-400 font-mono">Misinformation Audit</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#090d19] rounded-xl border border-indigo-500/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> VERIFIED TRUE
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Latehar Block</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 leading-snug">
                Claim regarding rural electrification completion in Mahuadanr block verified against state power department audit logs.
              </p>
            </div>
          </div>

          {/* Sidebar Ad Placement */}
          <AdBanner placementCode="SIDEBAR" />
        </aside>
      </div>

      {/* Citizen News Submission Modal */}
      <CreateNewsModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
};
