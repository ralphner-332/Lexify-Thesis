import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string;
  badgeType?: 'neutral' | 'success' | 'warning' | 'indigo' | 'danger';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-slate-500',
  badge,
  badgeType = 'neutral',
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'danger':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'indigo':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xl font-bold text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};
