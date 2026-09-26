import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ProgressionAnalytics } from '../../types';
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export const ResearchAnalyticsDashboard: React.FC = () => {
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [thresholdPercent] = useState<number>(10);
  const [analytics, setAnalytics] = useState<ProgressionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [isDemo, thresholdPercent]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.statistics.getProgression({
        isDemo,
        thresholdPercent,
      });
      setAnalytics(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load descriptive statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Iterative refinement (V1 → V2 → V3) · Expert validation
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Research statistics & progression analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Descriptive analysis comparing automated evaluations against expert legal assessments.
          </p>
        </div>

        {/* Data Filter Toggle */}
        <div className="inline-flex rounded-md p-0.5 bg-slate-100 border border-slate-200 text-xs self-start md:self-auto">
          <button
            onClick={() => setIsDemo(false)}
            className={`px-3 py-1 rounded font-medium transition ${
              !isDemo ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Research data (Live)
          </button>
          <button
            onClick={() => setIsDemo(true)}
            className={`px-3 py-1 rounded font-medium transition ${
              isDemo ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Demo simulation
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-2"></div>
          Computing research progression statistics...
        </div>
      ) : !analytics ? (
        <div className="p-12 bg-white rounded-lg border border-slate-200 text-center text-slate-500 text-xs">
          No statistics available.
        </div>
      ) : (
        <div className="space-y-6 text-xs">
          {/* Iterations Progression */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Iterative refinement cycles (V1 → V2 → V3)
              </h2>
              <span className="text-[11px] text-slate-400">
                Threshold: ±{thresholdPercent}% divergence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.iterations.map((iter) => (
                <div
                  key={iter.versionTag}
                  className="bg-white rounded-lg border border-slate-200 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 font-mono font-medium rounded text-[11px]">
                        {iter.versionTag}
                      </span>
                      <h3 className="font-semibold text-slate-900 mt-1">{iter.versionLabel}</h3>
                    </div>
                    <span className="text-[11px] text-slate-500">n = {iter.sampleSize}</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                    <span className="text-[11px] text-slate-500 block">Mean absolute delta |AI - Expert|</span>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">
                      {iter.meanAbsoluteDelta.toFixed(1)} <span className="text-xs text-slate-400 font-normal">pts</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Signed: {iter.meanSignedDelta > 0 ? `+${iter.meanSignedDelta}` : iter.meanSignedDelta}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200/60">
                      <span className="text-slate-500 block">AI Score</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {iter.aiMeanScore} <span className="text-slate-400">± {iter.aiScoreStdDev}</span>
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200/60">
                      <span className="text-slate-500 block">Expert Score</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {iter.expertMeanScore} <span className="text-slate-400">± {iter.expertScoreStdDev}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Agreement rate:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {iter.agreementRate}% ({iter.sampleSize - iter.conflictCount}/{iter.sampleSize})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Criterion Progression Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-xs font-semibold text-slate-900">Criterion-level mean absolute deltas</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Criterion</th>
                    <th className="py-2.5 px-4">Max</th>
                    <th className="py-2.5 px-4">V1 Delta</th>
                    <th className="py-2.5 px-4">V2 Delta</th>
                    <th className="py-2.5 px-4">V3 Delta</th>
                    <th className="py-2.5 px-4 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {analytics.criterionProgression.map((crit, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{crit.criterionName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{crit.maxPoints} pts</td>
                      <td className="py-2.5 px-4 text-slate-700">{crit.v1MeanAbsoluteDelta !== undefined ? `${crit.v1MeanAbsoluteDelta} pts` : '—'}</td>
                      <td className="py-2.5 px-4 text-slate-700">{crit.v2MeanAbsoluteDelta !== undefined ? `${crit.v2MeanAbsoluteDelta} pts` : '—'}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{crit.v3MeanAbsoluteDelta !== undefined ? `${crit.v3MeanAbsoluteDelta} pts` : '—'}</td>
                      <td className="py-2.5 px-4 text-right font-sans">
                        {crit.v1MeanAbsoluteDelta !== undefined && crit.v3MeanAbsoluteDelta !== undefined ? (
                          crit.v3MeanAbsoluteDelta <= crit.v1MeanAbsoluteDelta ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
                              <TrendingDown className="w-3 h-3" /> Improved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 text-[11px] font-medium">
                              <TrendingUp className="w-3 h-3" /> Diverged
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Post-V3 Validation */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-900">Post-V3 final expert validation</h2>
              <span className="text-slate-500 text-[11px]">Total reviews (n = {analytics.postV3Summary.totalReviews})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-[11px] text-slate-500 block">Overall agreement</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                  {analytics.postV3Summary.meanAgreementRating.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 5.00</span>
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-[11px] text-slate-500 block">Legal reasoning (IRAC)</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                  {analytics.postV3Summary.meanReasoningCorrectness.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 5.00</span>
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-[11px] text-slate-500 block">Statutory grounding</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                  {analytics.postV3Summary.meanStatutoryGrounding.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 5.00</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
