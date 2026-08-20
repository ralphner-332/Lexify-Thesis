import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ProgressionAnalytics } from '../../types';
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Layers,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research Statistics & Progression Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Descriptive analysis of iterative refinement cycles (V1 → V2 → V3) and post-V3 expert validation.
          </p>
        </div>

        {/* Data Filter Toggle */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-500 pl-2">Data Partition:</span>
          <button
            onClick={() => setIsDemo(false)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              !isDemo ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Research Data (Live)
          </button>
          <button
            onClick={() => setIsDemo(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              isDemo ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Demo / Simulation Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          Computing research progression statistics...
        </div>
      ) : !analytics ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
          No statistics available.
        </div>
      ) : (
        <div className="space-y-8">
          {/* V1 -> V2 -> V3 Iteration Progression Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Iterative Refinement Cycles (V1 → V2 → V3)
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Threshold: ±{thresholdPercent}% divergence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analytics.iterations.map((iter) => (
                <div
                  key={iter.versionTag}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-md">
                        {iter.versionTag}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{iter.versionLabel}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      n = {iter.sampleSize}
                    </span>
                  </div>

                  {/* Core Metric: Mean Absolute Delta */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Mean Absolute Delta |AI - Expert|
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold font-mono text-slate-900">
                        {iter.meanAbsoluteDelta.toFixed(1)} <span className="text-sm font-normal text-slate-400">pts</span>
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Signed: {iter.meanSignedDelta > 0 ? `+${iter.meanSignedDelta}` : iter.meanSignedDelta}
                      </span>
                    </div>
                  </div>

                  {/* Distributions */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
                      <span className="text-slate-400 block font-medium">AI Score</span>
                      <span className="font-bold font-mono text-slate-800 text-sm">
                        {iter.aiMeanScore} <span className="text-[10px] text-slate-400">± {iter.aiScoreStdDev}</span>
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
                      <span className="text-slate-400 block font-medium">Expert Score</span>
                      <span className="font-bold font-mono text-slate-800 text-sm">
                        {iter.expertMeanScore} <span className="text-[10px] text-slate-400">± {iter.expertScoreStdDev}</span>
                      </span>
                    </div>
                  </div>

                  {/* Agreement Rate */}
                  <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Agreement Rate:</span>
                    <span
                      className={`font-mono ${
                        iter.agreementRate >= 80 ? 'text-emerald-700 font-bold' : 'text-slate-800'
                      }`}
                    >
                      {iter.agreementRate}% ({iter.sampleSize - iter.conflictCount}/{iter.sampleSize})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Criterion-Level Alignment Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Criterion-Level Mean Absolute Deltas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Progression of mean absolute differences Mean(|AI - Expert|) across rubric criteria
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Rubric Criterion</th>
                    <th className="py-3.5 px-4">Max Points</th>
                    <th className="py-3.5 px-4">V1 Delta</th>
                    <th className="py-3.5 px-4">V2 Delta</th>
                    <th className="py-3.5 px-4">V3 Delta</th>
                    <th className="py-3.5 px-4 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {analytics.criterionProgression.map((crit, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-900 text-sm">
                        {crit.criterionName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{crit.maxPoints} pts</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {crit.v1MeanAbsoluteDelta !== undefined ? `${crit.v1MeanAbsoluteDelta} pts` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {crit.v2MeanAbsoluteDelta !== undefined ? `${crit.v2MeanAbsoluteDelta} pts` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-700">
                        {crit.v3MeanAbsoluteDelta !== undefined ? `${crit.v3MeanAbsoluteDelta} pts` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        {crit.v1MeanAbsoluteDelta !== undefined && crit.v3MeanAbsoluteDelta !== undefined ? (
                          crit.v3MeanAbsoluteDelta <= crit.v1MeanAbsoluteDelta ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                              <TrendingDown className="w-3.5 h-3.5" /> Improved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold">
                              <TrendingUp className="w-3.5 h-3.5" /> Diverged
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

          {/* Post-V3 Final Review Validation Findings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Post-V3 Final Expert Validation Summary</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unblinded evaluation of V3 reasoning correctness, statutory grounding, and verdict outcomes
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Total Reviews (n = {analytics.postV3Summary.totalReviews})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Overall Agreement
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-900">
                  {analytics.postV3Summary.meanAgreementRating.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 5.00</span>
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Legal Reasoning (IRAC)
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-900">
                  {analytics.postV3Summary.meanReasoningCorrectness.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 5.00</span>
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Statutory Grounding
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-900">
                  {analytics.postV3Summary.meanStatutoryGrounding.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 5.00</span>
                </span>
              </div>
            </div>

            {/* Verdict Counts & Error Tag Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Final Expert Verdict Breakdown
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 font-medium">
                    <span>Acceptable (Sound Legal Reasoning)</span>
                    <span className="font-bold font-mono">
                      {analytics.postV3Summary.verdictCounts.ACCEPTABLE}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 font-medium">
                    <span>Acceptable with Minor Issues</span>
                    <span className="font-bold font-mono">
                      {analytics.postV3Summary.verdictCounts.ACCEPTABLE_WITH_MINOR_ISSUES}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-rose-50 text-rose-900 rounded-xl border border-rose-200 font-medium">
                    <span>Requires Improvement</span>
                    <span className="font-bold font-mono">
                      {analytics.postV3Summary.verdictCounts.REQUIRES_IMPROVEMENT}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Identified Error Tag Frequencies
                </h3>
                {Object.keys(analytics.postV3Summary.errorTagCounts).length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {Object.entries(analytics.postV3Summary.errorTagCounts).map(([tag, count]) => (
                      <div
                        key={tag}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <span className="font-mono text-slate-700">{tag}</span>
                        <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic pt-2">No error categories flagged in reviews.</p>
                )}
              </div>
            </div>
          </div>

          {/* Methodological Notes */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider">
              Methodological Standards & Objectivity Notes
            </h4>
            <ul className="space-y-1 list-disc list-inside">
              {analytics.methodologyNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
