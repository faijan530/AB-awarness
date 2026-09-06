import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: any;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No content available',
  description = 'There are currently no items or records to display.',
  icon,
  action,
  className,
}) => {
  const renderIcon = () => {
    if (!icon) return <FolderOpen className="w-7 h-7 text-slate-500" />;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComponent = icon as any;
      return <IconComponent className="w-7 h-7 text-slate-400" />;
    }
    return icon;
  };

  return (
    <div className={cn('glass-panel rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-4 border border-slate-800', className)}>
      <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
        {renderIcon()}
      </div>
      <div className="max-w-md space-y-1">
        <h4 className="font-bold text-slate-200 text-base">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
