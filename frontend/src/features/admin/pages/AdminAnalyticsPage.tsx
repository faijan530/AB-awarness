import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AnalyticsService } from '@/services/api/analytics-service';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Search,
  Eye,
  MessageSquare,
  Bookmark,
  Share2,
  Users,
  Download,
  Flame,
  Layers,
  HelpCircle,
  Megaphone,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  useDocumentTitle('Platform Analytics & Local Journalism Insights');
  const toast = useToast();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LOCAL' | 'CATEGORIES' | 'SEARCH' | 'ENGAGEMENT' | 'ADS'>('OVERVIEW');

  // Queries
  const { data: newsAnalytics, isLoading: isLoadingNews } = useQuery({
    queryKey: ['admin-news-analytics', dateFrom, dateTo],
    queryFn: () => AnalyticsService.getNewsAnalytics({ dateFrom, dateTo }),
  });

  const { data: categoryAnalytics, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['admin-category-analytics'],
    queryFn: () => AnalyticsService.getCategoryAnalytics(),
  });

  const { data: locationAnalytics, isLoading: isLoadingLocation } = useQuery({
    queryKey: ['admin-location-analytics'],
    queryFn: () => AnalyticsService.getLocationAnalytics(),
  });

  const { data: userAnalytics, isLoading: isLoadingUser } = useQuery({
    queryKey: ['admin-user-analytics', dateFrom, dateTo],
    queryFn: () => AnalyticsService.getUserAnalytics({ dateFrom, dateTo }),
  });

  const { data: engagementAnalytics, isLoading: isLoadingEngagement } = useQuery({
    queryKey: ['admin-engagement-analytics'],
    queryFn: () => AnalyticsService.getEngagementAnalytics(),
  });

  const { data: searchAnalytics, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['admin-search-analytics'],
    queryFn: () => AnalyticsService.getSearchAnalytics(),
  });

  const { data: adAnalytics, isLoading: isLoadingAd } = useQuery({
    queryKey: ['admin-ad-analytics'],
    queryFn: () => AnalyticsService.getAdAnalytics(),
  });

  // CSV Export Mutation
  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      const data = await AnalyticsService.exportAnalytics(format, { dateFrom, dateTo });
      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onSuccess: () => {
      toast.success('Analytics Export Complete', 'The data file has been downloaded successfully.');
    },
    onError: () => {
      toast.error('Export Failed', 'Unable to generate analytics export file.');
    },
  });

  const localDashboard = locationAnalytics?.localJournalismDashboard;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
              SUPER ADMIN METRICS
            </span>
            <span className="text-xs text-slate-400 font-medium">Platform Measurement & Reporting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-indigo-400" /> Platform Analytics & Insights
          </h1>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#090d19] border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            isLoading={exportMutation.isPending}
            onClick={() => exportMutation.mutate('csv')}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card variant="glass" className="p-4 space-y-2 border-indigo-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Views</span>
            <Eye className="w-4 h-4 text-indigo-400" />
          </div>
          {isLoadingNews ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-black text-white font-mono">{newsAnalytics?.totalViews || 0}</p>
          )}
          <span className="text-[10px] text-indigo-300 font-medium">Platform-wide Reader Reach</span>
        </Card>

        <Card variant="glass" className="p-4 space-y-2 border-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Published Stories</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          {isLoadingNews ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-black text-white font-mono">{newsAnalytics?.totalPublishedArticles || 0}</p>
          )}
          <span className="text-[10px] text-emerald-400 font-medium">Active Articles</span>
        </Card>

        <Card variant="glass" className="p-4 space-y-2 border-violet-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Registered Citizens</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          {isLoadingUser ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-black text-white font-mono">{userAnalytics?.totalUsers || 0}</p>
          )}
          <span className="text-[10px] text-violet-300 font-medium">{userAnalytics?.activeUsers || 0} Active Status</span>
        </Card>

        <Card variant="glass" className="p-4 space-y-2 border-amber-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Local District Views</span>
            <MapPin className="w-4 h-4 text-amber-400" />
          </div>
          {isLoadingLocation ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-black text-white font-mono">{localDashboard?.totalDistrictViews || 0}</p>
          )}
          <span className="text-[10px] text-amber-400 font-medium">Jharkhand Local Focus</span>
        </Card>

        <Card variant="glass" className="p-4 space-y-2 border-rose-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ad Impressions</span>
            <Megaphone className="w-4 h-4 text-rose-400" />
          </div>
          {isLoadingAd ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-black text-white font-mono">{adAnalytics?.totalImpressions || 0}</p>
          )}
          <span className="text-[10px] text-rose-300 font-medium">CTR: {adAnalytics?.ctr || 0}%</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-indigo-500/15 overflow-x-auto pb-2">
        {[
          { key: 'OVERVIEW', label: 'Top News Stories', icon: <Flame className="w-4 h-4" /> },
          { key: 'LOCAL', label: 'Local Journalism (Palamu)', icon: <MapPin className="w-4 h-4" /> },
          { key: 'CATEGORIES', label: 'Category Metrics', icon: <Layers className="w-4 h-4" /> },
          { key: 'SEARCH', label: 'Search Insights & Opportunities', icon: <Search className="w-4 h-4" /> },
          { key: 'ENGAGEMENT', label: 'Community Engagement', icon: <MessageSquare className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg border border-indigo-400/30'
                : 'text-slate-400 hover:bg-indigo-950/40 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: OVERVIEW / TOP STORIES */}
      {activeTab === 'OVERVIEW' && (
        <Card variant="glass" className="p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> Highest Performing News Stories
          </h3>

          {isLoadingNews ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-indigo-500/15 bg-[#090d19]/80">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-indigo-950/40 text-indigo-200 uppercase font-mono text-[11px] border-b border-indigo-500/15">
                  <tr>
                    <th className="p-3.5">Headline Title</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Total Views</th>
                    <th className="p-3.5">Reactions</th>
                    <th className="p-3.5">Comments</th>
                    <th className="p-3.5">Bookmarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-500/10 font-medium">
                  {newsAnalytics?.topArticles?.map((art: any) => (
                    <tr key={art.id} className="hover:bg-indigo-950/30 transition-colors">
                      <td className="p-3.5 font-bold text-white max-w-sm truncate">{art.title}</td>
                      <td className="p-3.5 text-slate-300">{art.authorName || 'Citizen Author'}</td>
                      <td className="p-3.5 font-mono text-indigo-300 font-bold">{art.views}</td>
                      <td className="p-3.5 text-emerald-400 font-mono">{art.reactions}</td>
                      <td className="p-3.5 text-amber-400 font-mono">{art.comments}</td>
                      <td className="p-3.5 text-purple-400 font-mono">{art.bookmarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT 2: LOCAL JOURNALISM DASHBOARD */}
      {activeTab === 'LOCAL' && (
        <div className="space-y-6">
          <Card variant="glass" className="p-6 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border-indigo-500/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Jharkhand Local District Journalism Engine</h3>
                <p className="text-xs text-slate-400">Palamu, Garhwa, Latehar, and State District Performance Tracking</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {localDashboard?.districts?.map((d: any) => (
                <div key={d.locationId} className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">{d.name}</span>
                    <Badge variant="emerald">{d.type}</Badge>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-mono font-black text-white">{d.views}</span>
                    <span className="text-xs text-slate-400">views</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Articles: {d.articleCount}</span>
                    <span>Engagement: {d.engagement}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 3: CATEGORY PERFORMANCE */}
      {activeTab === 'CATEGORIES' && (
        <Card variant="glass" className="p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Category Breakdown & Readership
          </h3>

          {isLoadingCategory ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categoryAnalytics?.map((cat: any) => (
                <div key={cat.categoryId} className="bg-[#090d19]/90 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{cat.categoryName}</span>
                    <span className="text-xs text-indigo-300 font-mono font-semibold">/{cat.slug}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center bg-indigo-950/30 p-2.5 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Articles</span>
                      <span className="font-bold text-white font-mono">{cat.articleCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Views</span>
                      <span className="font-bold text-indigo-300 font-mono">{cat.views}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Avg Views</span>
                      <span className="font-bold text-emerald-400 font-mono">{cat.averageViews}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT 4: SEARCH INSIGHTS & ZERO-RESULTS */}
      {activeTab === 'SEARCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass" className="p-5 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" /> Top Searched Keywords
            </h3>
            <div className="space-y-2">
              {searchAnalytics?.topSearches?.map((s: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#090d19]/80 border border-indigo-500/15 text-xs">
                  <span className="font-bold text-slate-200">"{s.query}"</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-indigo-300">{s.count} searches</span>
                    <span className="text-emerald-400">{s.clicks} clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="p-5 space-y-4 border-amber-500/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-300 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" /> Zero-Result Searches (Editorial Opportunities)
              </h3>
              <Badge variant="amber">Needs Coverage</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Citizens searched for these topics but found zero articles. Assign reporters to cover these requested local stories!
            </p>

            <div className="space-y-2">
              {searchAnalytics?.zeroResultSearches?.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No zero-result searches reported yet.</div>
              ) : (
                searchAnalytics?.zeroResultSearches?.map((z: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
                    <span className="font-black text-amber-200">"{z.query}"</span>
                    <span className="font-mono font-bold text-amber-400">{z.count} queries missed</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: ENGAGEMENT */}
      {activeTab === 'ENGAGEMENT' && (
        <Card variant="glass" className="p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" /> Community Interaction Signals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20">
              <span className="text-xs text-slate-400 uppercase">Comments Posted</span>
              <p className="text-2xl font-mono font-black text-white mt-1">{engagementAnalytics?.summary?.totalComments || 0}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20">
              <span className="text-xs text-slate-400 uppercase">Reactions Logged</span>
              <p className="text-2xl font-mono font-black text-emerald-400 mt-1">{engagementAnalytics?.summary?.totalReactions || 0}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-violet-500/20">
              <span className="text-xs text-slate-400 uppercase">Bookmarks Saved</span>
              <p className="text-2xl font-mono font-black text-violet-300 mt-1">{engagementAnalytics?.summary?.totalBookmarks || 0}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/20">
              <span className="text-xs text-slate-400 uppercase">Reports Filed</span>
              <p className="text-2xl font-mono font-black text-rose-400 mt-1">{engagementAnalytics?.summary?.totalReports || 0}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
