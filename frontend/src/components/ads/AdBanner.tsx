import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdvertisingService } from '@/services/api/advertising-service';
import { cn } from '@/utils/cn';

interface AdBannerProps {
  placementCode: 'HOME_TOP' | 'HOME_MIDDLE' | 'NEWS_TOP' | 'NEWS_MIDDLE' | 'NEWS_BOTTOM' | 'CATEGORY_TOP' | 'SIDEBAR';
  location?: string;
  category?: string;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  placementCode,
  location,
  category,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const loggedImpressions = useRef<Set<string>>(new Set());

  const { data: ad, isLoading } = useQuery({
    queryKey: ['ad-serve', placementCode, location, category],
    queryFn: () => AdvertisingService.serveAd(placementCode, location, category),
    staleTime: 0, // Always stay fresh so admin updates show immediately
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const allAds: any[] = React.useMemo(() => {
    if (ad?.allAds && Array.isArray(ad.allAds) && ad.allAds.length > 0) {
      return ad.allAds;
    }
    return ad ? [ad] : [];
  }, [ad]);

  // Auto-rotate every 6 seconds if multiple ads exist
  useEffect(() => {
    if (allAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allAds.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [allAds.length]);

  const activeAd = allAds[currentIndex] || ad;

  // Log impression for current active creative
  useEffect(() => {
    if (activeAd?.creativeId && !loggedImpressions.current.has(activeAd.creativeId)) {
      loggedImpressions.current.add(activeAd.creativeId);
      AdvertisingService.recordImpression(activeAd.creativeId, placementCode).catch((err) => {
        console.debug('Failed to record ad impression:', err);
      });
    }
  }, [activeAd?.creativeId, placementCode]);

  if (isLoading || !activeAd) {
    return null; // Collapse cleanly if no active campaigns
  }

  const backendBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const fullClickUrl = activeAd.clickUrl?.startsWith('http')
    ? activeAd.clickUrl
    : `${backendBaseUrl}${activeAd.clickUrl || ''}`;

  const isSidebar = placementCode === 'SIDEBAR';

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + allAds.length) % allAds.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % allAds.length);
  };

  return (
    <div
      className={cn(
        'w-full mx-auto my-4 transition-all duration-300',
        className
      )}
    >
      <div className="relative group overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900/95 via-indigo-950/50 to-slate-900/95 hover:border-indigo-500/40 transition-all shadow-xl shadow-black/30">
        {/* Top Badges & Indicator */}
        <div className="absolute top-2.5 right-3 z-20 flex items-center gap-2">
          {allAds.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-800 text-[10px] text-slate-400 font-mono">
              <span className="text-indigo-400 font-bold">{currentIndex + 1}</span>/{allAds.length}
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[9px] font-mono uppercase tracking-wider text-slate-400">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>Sponsored</span>
          </div>
        </div>

        {/* Previous / Next Arrows for rotation */}
        {allAds.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
              title="Previous Ad"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
              title="Next Ad"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        <a
          href={fullClickUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-4 p-4 sm:p-5 text-left w-full cursor-pointer relative z-10',
            isSidebar ? 'flex-col items-start' : 'flex-col sm:flex-row'
          )}
        >
          {/* Ad Media / Banner Image */}
          {activeAd.mediaUrl && (
            <div
              className={cn(
                'overflow-hidden rounded-xl bg-slate-950 border border-slate-800 shrink-0 group-hover:scale-102 transition-transform duration-300',
                isSidebar ? 'w-full h-40' : 'w-full sm:w-44 h-24 sm:h-20'
              )}
            >
              <img
                src={activeAd.mediaUrl}
                alt={activeAd.headline}
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
              />
            </div>
          )}

          {/* Ad Copy */}
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
              {activeAd.headline}
            </h4>
            {activeAd.description && (
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {activeAd.description}
              </p>
            )}
          </div>

          {/* Call to action button */}
          <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-colors">
            <span>Learn More</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </a>

        {/* Bottom Pagination Dots */}
        {allAds.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {allAds.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  currentIndex === idx
                    ? 'w-5 bg-indigo-400'
                    : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
