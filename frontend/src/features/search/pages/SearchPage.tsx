import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery } from '@tanstack/react-query';
import { NewsService, NewsArticle } from '@/services/api/news-service';
import { CategoryService } from '@/services/api/category-service';
import { LocationService } from '@/services/api/location-service';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Search as SearchIcon,
  X,
  MapPin,
  Calendar,
  User,
  ArrowRight,
  Flame,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export const SearchPage: React.FC = () => {
  useDocumentTitle('Search News & Fact-Checks — AB Media');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 250);
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Sync URL params
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setSearchParams({ q: debouncedQuery.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery, setSearchParams]);

  // Fetch Taxonomy for Quick Filters
  const { data: categories = [] } = useQuery({
    queryKey: ['search-categories'],
    queryFn: () => CategoryService.getCategories(),
    staleTime: 60000,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['search-locations'],
    queryFn: () => LocationService.getLocations(),
    staleTime: 60000,
  });

  // Main Search Query
  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['public-search', debouncedQuery, selectedCategory, selectedLocation, page],
    queryFn: () =>
      NewsService.getNewsFeed({
        search: debouncedQuery.trim() || undefined,
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        location: selectedLocation === 'ALL' ? undefined : selectedLocation,
        page,
        limit: 9,
      }),
    enabled: true,
    placeholderData: (prev) => prev,
    staleTime: 15000,
  });

  const articles = searchResults?.articles || [];
  const total = searchResults?.total || 0;

  const popularSearches = ['Palamu', 'Garhwa', 'Latehar', 'Jharkhand', 'Collectorate', 'Transmission'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
            LIVE SEARCH DESK
          </span>
          <span className="text-xs text-slate-400 font-medium">Instant Full-Text Journalism Query</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Search News & Fact-Checks
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Search verified reports across Palamu, Garhwa, Latehar, and statewide Jharkhand coverage.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="space-y-3">
        <div className="relative flex items-center">
          <SearchIcon className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search headline title, incident context, or keyword..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-rose-500/80 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-xl shadow-black/40"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setPage(1);
              }}
              className="absolute right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> POPULAR:
          </span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQuery(term);
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition-all font-medium text-[11px]"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs: District Locations & Categories */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        {/* District Location Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedLocation('ALL');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedLocation === 'ALL'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            All Districts
          </button>
          {locations.slice(0, 4).map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => {
                setSelectedLocation(loc.slug);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedLocation === loc.slug
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>

        {/* Results Counter & Search Indicator */}
        <div className="text-xs text-slate-400 font-mono flex items-center gap-2 shrink-0">
          {isFetching && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
          <span>{total} {total === 1 ? 'story found' : 'stories found'}</span>
        </div>
      </div>

      {/* Search Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="glass" className="p-5 space-y-3">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title={query ? `No matching stories for "${query}"` : 'No stories found'}
          description="Try searching with a broader keyword, district name, or clear active filters."
          icon={<SearchIcon className="w-8 h-8 text-rose-500/80" />}
          action={
            query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedLocation('ALL');
                  setSelectedCategory('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors"
              >
                Reset Search Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article: NewsArticle) => (
            <Link
              key={article.id}
              to={`/news/${article.slug}`}
              className="glass-card-user rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-rose-500/40 hover:scale-[1.01] transition-all duration-200 group shadow-lg shadow-black/30"
            >
              <div className="space-y-3">
                {/* Badges Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 truncate">
                    {article.category?.name || 'Local News'}
                  </span>
                  {article.location && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                      <MapPin className="w-3 h-3" /> {article.location.name}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-white text-base leading-snug group-hover:text-rose-300 transition-colors line-clamp-2">
                  {article.title}
                </h3>

                {/* Excerpt */}
                {article.summary && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                )}
              </div>

              {/* Card Meta Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="truncate">
                  {article.author?.fullName || 'Citizen Reporter'}
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-bold group-hover:translate-x-1 transition-transform shrink-0">
                  Read <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
