import React from 'react';
import { UserRole } from '../../types';
import { Shield, GraduationCap, Scale, TestTube } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  isDemo?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, isDemo }) => {
  const getBadgeConfig = () => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Researcher / Admin',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Shield className="w-3.5 h-3.5 text-purple-600" />,
        };
      case 'EXPERT':
        return {
          label: 'Legal Expert',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: <Scale className="w-3.5 h-3.5 text-indigo-600" />,
        };
      case 'STUDENT':
      default:
        return {
          label: 'Law Student',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <GraduationCap className="w-3.5 h-3.5 text-blue-600" />,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
      >
        {config.icon}
        {config.label}
      </span>
      {isDemo && (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-900 border border-amber-300">
          <TestTube className="w-3 h-3 text-amber-700" />
          Demo Mode
        </span>
      )}
    </div>
  );
};
