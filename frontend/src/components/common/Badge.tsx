import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'rose' | 'emerald' | 'amber' | 'sky' | 'neutral';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'rose', pulse = false, children, ...props }) => {
  const variants = {
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm shadow-rose-950/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-950/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-950/30',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-sm shadow-sky-950/30',
    neutral: 'bg-slate-900 text-slate-300 border-slate-700/80',
  };

  const dotColors = {
    rose: 'bg-rose-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    sky: 'bg-sky-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full border backdrop-blur-md',
        variants[variant],
        className
      )}
      {...props}
    >
      {pulse && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant])} />}
      {children}
    </span>
  );
};
