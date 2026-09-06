import React from 'react';
import { Newspaper, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950 text-slate-400 py-8 sm:py-10 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        <div className="space-y-3 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-100 text-base sm:text-lg">Abhishek Bhardwaj Media</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Independent, human-supervised digital journalism platform dedicated to Jharkhand news, Palamu & Garhwa coverage, investigative reports, and citizen journalism.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-slate-200 text-sm mb-3">Geographic Coverage</h4>
          <ul className="text-xs space-y-2 text-slate-400">
            <li><Link to="/location/palamu" className="hover:text-emerald-400 transition-colors">Palamu District</Link></li>
            <li><Link to="/location/garhwa" className="hover:text-emerald-400 transition-colors">Garhwa District</Link></li>
            <li><Link to="/location/latehar" className="hover:text-emerald-400 transition-colors">Latehar District</Link></li>
            <li><Link to="/location/jharkhand" className="hover:text-emerald-400 transition-colors">All Districts of Jharkhand</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-200 text-sm mb-3">Editorial & Integrity</h4>
          <ul className="text-xs space-y-2 text-slate-400">
            <li className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Super Admin Verification
            </li>
            <li>Fact Checking Workflow</li>
            <li>Originality & Similarity Check</li>
            <li>Citizen Submission Pipeline</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-200 text-sm mb-3">Quick Navigation</h4>
          <ul className="text-xs space-y-2">
            <li><Link to="/profile" className="text-emerald-400 font-semibold hover:underline">Citizen Reporter Profile</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p className="text-center md:text-left">© {new Date().getFullYear()} Abhishek Bhardwaj Media. All Rights Reserved.</p>
        <p className="flex items-center gap-1 mt-2 md:mt-0 text-center md:text-right">
          Crafted for Truth & Civic Engagement in Jharkhand <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
        </p>
      </div>
    </footer>
  );
};
