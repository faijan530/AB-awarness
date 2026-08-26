import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/common/Button';
import { Newspaper, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  useDocumentTitle('404 Page Not Found');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-slate-800 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
          <Newspaper className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-serif text-white">404</h1>
          <h2 className="text-lg font-bold text-slate-200">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The news page or route you requested does not exist or has been relocated.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-2">
          <Link to="/">
            <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
