import React from 'react';

interface CriterionProgressBarProps {
  name: string;
  score: number;
  maxPoints: number;
  reasoning?: string;
}

export const CriterionProgressBar: React.FC<CriterionProgressBarProps> = ({
  name,
  score,
  maxPoints,
  reasoning,
}) => {
  const percentage = maxPoints > 0 ? Math.min(Math.round((score / maxPoints) * 100), 100) : 0;

  // Color coding based on achievement percentage
  let barColor = 'bg-emerald-600';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (percentage < 60) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (percentage < 80) {
    barColor = 'bg-blue-600';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-slate-800 text-sm">{name}</span>
        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${badgeColor}`}>
            {score} / {maxPoints} pts ({percentage}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {reasoning && (
        <p className="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded border border-slate-100 italic leading-relaxed">
          <span className="font-medium not-italic text-slate-700">Criterion Analysis: </span>
          {reasoning}
        </p>
      )}
    </div>
  );
};
