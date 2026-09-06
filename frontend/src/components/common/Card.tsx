import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'bordered' | 'glow-rose' | 'glow-emerald';
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hoverEffect = false, children, ...props }, ref) => {
    const variants = {
      glass: 'glass-panel rounded-2xl border border-slate-800/80 p-4 sm:p-6 shadow-xl',
      solid: 'bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-lg',
      bordered: 'bg-slate-950/40 rounded-2xl border border-slate-800/80 p-4 sm:p-6',
      'glow-rose': 'glass-panel rounded-2xl border-glow-rose p-4 sm:p-6 shadow-2xl',
      'glow-emerald': 'glass-panel rounded-2xl border-glow-emerald p-4 sm:p-6 shadow-2xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          hoverEffect && 'glass-panel-hover',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
