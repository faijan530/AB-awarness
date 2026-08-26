import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ShieldCheck, MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react';

export const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle(`Article — ${id || 'News Detail'}`);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 font-bold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to News Feed
      </Link>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="rose">Investigative Report</Badge>
          <Badge variant="emerald">
            <ShieldCheck className="w-3 h-3 inline mr-1" /> Super Admin Verified
          </Badge>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold font-serif text-white leading-tight">
          Palamu Division Highway Expansion Project: Detailed Technical Overview & Timeline
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono border-y border-slate-800 py-3">
          <span className="flex items-center gap-1 text-slate-300 font-bold">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Daltonganj & Garhwa Corridor
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-rose-400" /> Published: Aug 26, 2026
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> 5 Min Read
          </span>
        </div>
      </div>

      <Card variant="glass" className="space-y-4 text-slate-200 text-sm leading-relaxed">
        <p>
          The state administration has formally approved funding allocations for the two-lane expansion of the highway corridor connecting Daltonganj, Garhwa, and Latehar districts.
        </p>
        <p>
          This project aims to reduce transit times for agricultural products, enhance medical emergency response access, and create local employment during the construction phase.
        </p>
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
          <p className="text-rose-400 font-bold mb-1">Editorial Integrity Note:</p>
          This article was verified by Super Admin against official state public works department records.
        </div>
      </Card>
    </div>
  );
};
