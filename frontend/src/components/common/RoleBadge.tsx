import React from 'react';
import { UserRole } from '../../types';
import { Shield, GraduationCap, Scale } from 'lucide-react';

interface RoleBadgeProps {
  role?: UserRole | string;
  isDemo?: boolean;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  if (!role) return null;

  const getRoleConfig = () => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Administrator',
          icon: Shield,
          style: 'bg-slate-100 text-slate-800 border-slate-200',
        };
      case 'EXPERT':
        return {
          label: 'Legal Evaluator',
          icon: Scale,
          style: 'bg-slate-100 text-slate-800 border-slate-200',
        };
      case 'STUDENT':
      default:
        return {
          label: 'Student',
          icon: GraduationCap,
          style: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const { label, icon: Icon, style } = getRoleConfig();
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center space-x-1 font-medium rounded border ${style} ${sizeClasses}`}
      >
        <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3 text-slate-500'} />
        <span>{label}</span>
      </span>
    </div>
  );
};
