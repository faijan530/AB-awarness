import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse bg-slate-800/70 rounded-lg', className)}
      {...props}
    />
  );
};
