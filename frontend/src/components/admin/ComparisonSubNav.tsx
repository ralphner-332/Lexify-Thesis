import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, FileText, BarChart3 } from 'lucide-react';

interface ComparisonSubNavProps {
  currentTestSet?: string;
}

export const ComparisonSubNav: React.FC<ComparisonSubNavProps> = ({ currentTestSet }) => {
  const querySuffix = currentTestSet ? `?testSet=${encodeURIComponent(currentTestSet)}` : '';

  const navItems = [
    {
      to: `/admin/comparisons${querySuffix}`,
      label: 'Student-Level Comparison',
      badge: 'Level 1',
      description: 'Single-student Q01–Q10 evaluations & /50 weighted total',
      icon: Users,
      exact: true,
    },
    {
      to: `/admin/comparisons/question${querySuffix}`,
      label: 'Question-Level Comparison',
      badge: 'Level 2',
      description: 'Cross-student criterion breakdown for individual questions',
      icon: FileText,
      exact: false,
    },
    {
      to: `/admin/comparisons/summative${querySuffix}`,
      label: 'Summative Model Comparison',
      badge: 'Level 3',
      description: 'Dataset-wide mean scores, distributions, and /50 session totals',
      icon: BarChart3,
      exact: false,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                <BarChart3 className="w-5 h-5" />
              </span>
              Three-Model Legal Assessment Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical multi-level comparison across Meta Llama 3.2 3B, Microsoft Phi-4-mini 3.8B, and Google Gemma 2 2B
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto py-2" aria-label="Comparison Levels">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.label}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider ${
                            isActive ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-normal hidden md:inline">
                        {item.description}
                      </span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
