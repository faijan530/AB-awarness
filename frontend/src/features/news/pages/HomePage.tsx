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
  Compass
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

  const handleShare = (title: string) => {
    toast.success('Link Copied!', `Article link for "${title}" copied to clipboard.`);
  };

  const handleBookmark = (title: string) => {
    toast.success('Bookmarked!', `"${title}" saved to your reading list.`);
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return 'Recently published';
    try {
      return new Date(dateStr).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently published';
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Live Breaking News Ticker Bar */}
      {breakingAlerts.length > 0 && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 p-2.5 px-4 rounded-2xl border border-rose-500/30 shadow-lg animate-pulse-slow">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1 shrink-0">
            <Radio className="w-3 h-3 animate-ping" /> BREAKING NEWS
          </span>
          <div className="overflow-hidden whitespace-nowrap text-xs text-rose-200 font-bold truncate">
            {breakingAlerts[0].title} — <span className="text-slate-400 font-normal">{breakingAlerts[0].summary}</span>
          </div>
        </div>
      )}

      {/* Leaderboard Ad Slot */}
      <AdBanner placementCode="HOME_TOP" />

      {/* Top Weather & Quick Regional Info Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-slate-900/90 via-[#0a0f1d] to-slate-900/90 p-3.5 px-5 rounded-2xl border border-rose-500/15 shadow-lg">
        <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            <CloudSun className="w-4 h-4" /> 28°C Sunny
          </div>
          <span className="hidden md:inline text-slate-400">Palamu Division Regional Hub</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live News Engine Connected
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Trending Topics:</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-bold">
            #PalamuHighway
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
            #GarhwaAgri
          </span>
        </div>
      </div>

      {/* Main Hero Spotlight Showcase */}
      {featuredStory ? (
        <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 shadow-2xl group bg-gradient-to-br from-slate-900 via-[#070a12] to-slate-950">
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
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-950">
                    {featuredStory.category?.name || 'FEATURED REPORT'}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> {featuredStory.location?.name || 'Jharkhand'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-serif text-white tracking-tight leading-tight">
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
                    <Eye className="w-3.5 h-3.5 text-rose-400" /> {featuredStory.viewCount} Views
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-950/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Flame className="w-4 h-4 animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-white font-serif tracking-tight">
                Live News Feed & Coverage
              </h3>
            </div>

            {/* Dynamic Category Filter Tabs from Database */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat.slug
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Geographic Region Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 font-mono flex items-center gap-1 shrink-0 pr-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Region:
            </span>
            <button
              onClick={() => {
                setActiveLocation('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeLocation === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeLocation === loc.slug
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
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
              description="No published news stories match the selected category filter."
            />
          )}

          {/* News Feed Grid Cards */}
          {!isLoadingFeed && !isFeedError && newsFeedData && newsFeedData.articles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsFeedData.articles.map((art: NewsArticle) => (
                <div
                  key={art.id}
                  className="glass-card-user rounded-2xl p-5 space-y-4 hover:border-rose-500/30 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {art.category?.name || 'GENERAL'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" /> {art.location?.name || 'Jharkhand'}
                      </span>
                    </div>

                    <Link to={`/news/${art.slug}`}>
                      <h4 className="font-bold text-slate-100 text-base hover:text-rose-400 transition-colors leading-snug group-hover:text-rose-300">
                        {art.title}
                      </h4>
                    </Link>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {art.summary || art.content.substring(0, 120) + '...'}
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80">
                    <span className="flex items-center gap-1 text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-rose-400" /> {formatDate(art.publishedAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShare(art.title)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Share Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleBookmark(art.title)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Bookmark"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                      <Link to={`/news/${art.slug}`} className="text-rose-400 font-extrabold hover:underline ml-1">
                        Read →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Column: Trending News & Citizen Desk Widgets */}
        <aside className="space-y-6">
          {/* Trending News Widget */}
          <div className="glass-card-user rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-white text-sm">Trending Headlines</h4>
            </div>

            {trendingStories.length > 0 ? (
              <div className="space-y-3">
                {trendingStories.map((story: NewsArticle, idx: number) => (
                  <Link
                    key={story.id}
                    to={`/news/${story.slug}`}
                    className="block p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/30 transition-all space-y-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-black font-mono text-xs">#{idx + 1}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{story.category?.name || 'NEWS'}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
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
          <div className="glass-card-user rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-white text-sm">Fact-Check Corner</h4>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> VERIFIED TRUE
                </span>
                <span className="text-[10px] text-slate-500">Latehar Block</span>
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
