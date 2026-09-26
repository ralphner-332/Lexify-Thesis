import React from 'react';

interface CriterionProgressBarProps {
  name: string;
  score: number;
  maxPoints: number;
  reasoning?: string;
  weightPercentage?: number;
}

export const CriterionProgressBar: React.FC<CriterionProgressBarProps> = ({
  name,
  score,
  maxPoints,
  reasoning,
  weightPercentage,
}) => {
  const percentage = maxPoints > 0 ? Math.min(Math.round((score / maxPoints) * 100), 100) : 0;

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{name}</span>
          {weightPercentage !== undefined && (
            <span className="text-[11px] text-slate-400 font-normal">({weightPercentage}%)</span>
          )}
        </div>
        <div className="font-medium text-slate-700">
          {score} <span className="text-slate-400">/ {maxPoints} pts</span>
        </div>
      </div>

      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-slate-800 h-full rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {reasoning && (
        <p className="text-xs text-slate-600 leading-relaxed pt-0.5 font-normal">
          {reasoning}
        </p>
      )}
    </div>
  );
};
