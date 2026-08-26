import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Flame, ShieldCheck, MapPin, Eye, ThumbsUp, Bookmark, ArrowRight, Sparkles, TrendingUp, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  useDocumentTitle('Home — Jharkhand Digital Journalism Ecosystem');
  const toast = useToast();

  const handleTestToast = () => {
    toast.success('Module 1 Toast System', 'Centralized notification infrastructure is active!');
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Spotlight */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/80 border border-slate-800/80 p-8 md:p-12 shadow-2xl">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl -z-0"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-0"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="emerald" pulse>
              <ShieldCheck className="w-3 h-3 inline mr-1" /> Super Admin Verified
            </Badge>
            <Badge variant="rose">Investigative Report</Badge>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Palamu & Garhwa Corridor
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black font-serif text-white tracking-tight leading-tight">
            Jharkhand Infrastructure Expansion: Key Highway Projects Fast-Tracked Across Palamu Division
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-normal">
            In-depth report on state administrative approvals for major road networks connecting Daltonganj, Garhwa, and Latehar, aiming to boost local trade and rural accessibility.
          </p>

          <div className="flex items-center gap-6 pt-2 text-xs font-semibold text-slate-400 font-mono">
            <span className="text-rose-400 font-bold">Investigative Desk</span>
            <span>5 Min Read</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-slate-500" /> 2,450 Views</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link to="/news/infrastructure-expansion-palamu">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Read Full Story
              </Button>
            </Link>
            <Button variant="outline" size="lg" leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />} onClick={handleTestToast}>
              Test UI Notification
            </Button>
          </div>
        </div>
      </section>

      {/* Grid: Regional News Cards & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xl font-black text-slate-100 flex items-center gap-2 font-serif">
              <Flame className="w-5 h-5 text-rose-500 animate-bounce" /> Regional Spotlights
            </h3>
            <Link to="/search" className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-bold">
              Browse All Stories <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="glass" hoverEffect className="space-y-4">
              <div className="h-48 bg-gradient-to-tr from-slate-950 via-slate-900 to-rose-950/60 rounded-xl p-4 flex flex-col justify-between border border-slate-800">
                <Badge variant="emerald" pulse>Palamu News</Badge>
                <div className="text-slate-300 text-xs font-mono font-bold">Daltonganj Edition</div>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-slate-100 text-base hover:text-rose-400 transition-colors leading-snug">
                  Monsoon Preparedness Drive Launched in Betla National Park Region
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  Forest officials coordinate eco-patrols and wildlife safety initiatives ahead of seasonal rains.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono border-t border-slate-800/60">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> 2 hours ago</span>
                <Link to="/news/betla-monsoon-drive" className="text-rose-400 font-extrabold hover:underline">
                  Read Article →
                </Link>
              </div>
            </Card>

            <Card variant="glass" hoverEffect className="space-y-4">
              <div className="h-48 bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950/60 rounded-xl p-4 flex flex-col justify-between border border-slate-800">
                <Badge variant="amber" pulse>Garhwa Focus</Badge>
                <div className="text-slate-300 text-xs font-mono font-bold">Garhwa Sadar</div>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-slate-100 text-base hover:text-emerald-400 transition-colors leading-snug">
                  New Agricultural Support Scheme Announced for Garhwa Farmers
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  District administration introduces subsidized seed distribution and solar irrigation pumps.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono border-t border-slate-800/60">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> 4 hours ago</span>
                <Link to="/news/garhwa-agri-scheme" className="text-emerald-400 font-extrabold hover:underline">
                  Read Article →
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Premium Sidebar */}
        <aside className="space-y-6">
          <Card variant="glow-emerald" className="space-y-4 bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-100 text-base">Citizen Reporter Desk</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Have local news, evidence, or incident reports from Palamu or Garhwa? Submit photos directly to Super Admin for verification.
            </p>
            <Link to="/profile" className="block">
              <Button variant="emerald" className="w-full">
                Submit Citizen Report
              </Button>
            </Link>
          </Card>

          <Card variant="glass" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h4 className="font-extrabold text-slate-100 text-sm">Fact-Check Corner</h4>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <Badge variant="emerald">Verified True</Badge>
                <p className="text-xs font-semibold text-slate-200 mt-1">
                  Claim regarding rural electrification in Latehar blocks verified against official power department records.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};
