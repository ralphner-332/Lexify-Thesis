import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ComparisonItem, ComparisonSummary, AgentVersion } from '../../types';
import {
  GitCompare,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  PlusCircle,
  Eye,
  X,
} from 'lucide-react';

export const ComparisonMatrixDashboard: React.FC = () => {
  const [comparisons, setComparisons] = useState<ComparisonItem[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [agentVersions, setAgentVersions] = useState<AgentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [thresholdPercent, setThresholdPercent] = useState<number>(10);
  const [hasConflictOnly, setHasConflictOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inspection Modal State
  const [selectedComparison, setSelectedComparison] = useState<ComparisonItem | null>(null);

  // Quick Refinement Modal State
  const [quickRefineItem, setQuickRefineItem] = useState<ComparisonItem | null>(null);
  const [refineTargetComponent, setRefineTargetComponent] = useState<string>('EVALUATION_PATTERNS');
  const [refineGapCategory, setRefineGapCategory] = useState<string>('REASONING_IRAC_ISSUE');
  const [refineDescription, setRefineDescription] = useState<string>('');
  const [refineRootCause, setRefineRootCause] = useState<string>('');
  const [refineProposed, setRefineProposed] = useState<string>('');
  const [refineSaving, setRefineSaving] = useState<boolean>(false);
  const [refineSuccess, setRefineSuccess] = useState<string | null>(null);

  const fetchVersions = async () => {
    try {
      const res = await api.agentVersions.list();
      setAgentVersions(res.data);
    } catch (err: any) {
      console.error('Failed to load agent versions:', err);
    }
  };

  const fetchComparisons = async () => {
    try {
      setLoading(true);
      const res = await api.comparisons.getList({
        agentVersionId: selectedVersion || undefined,
        thresholdPercent,
        hasConflictOnly,
      });
      setComparisons(res.data.comparisons);
      setSummary(res.data.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load comparison matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  useEffect(() => {
    fetchComparisons();
  }, [selectedVersion, thresholdPercent, hasConflictOnly]);

  const openQuickRefine = (comp: ComparisonItem) => {
    setQuickRefineItem(comp);
    setRefineDescription(
      `Score divergence of ${comp.scoreDelta} pts (${comp.percentageDelta}%) on ${comp.questionCode} (${comp.studentAnonymizedCode}).`
    );
    setRefineRootCause(
      `AI assigned ${comp.aiScore} pts while legal expert assigned ${comp.expertScore} pts. Expert emphasized: "${comp.expertRationale.slice(0, 120)}..."`
    );
    setRefineProposed(
      `Adjust ${refineTargetComponent.toLowerCase()} to align evaluation with expert feedback on ${comp.questionCode}.`
    );
  };

  const handleCreateRefinement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRefineItem) return;

    try {
      setRefineSaving(true);
      setError(null);
      await api.refinements.create({
        questionId: quickRefineItem.questionId,
        sessionId: quickRefineItem.sessionId,
        aiEvaluationId: quickRefineItem.aiEvaluationId,
        expertEvaluationId: quickRefineItem.expertEvaluationId,
        agentVersionId: quickRefineItem.agentVersionId,
        targetComponent: refineTargetComponent,
        gapCategory: refineGapCategory,
        discrepancyDescription: refineDescription,
        aiPosition: quickRefineItem.aiScoringBasis,
        expertPosition: quickRefineItem.expertRationale,
        expertRationale: quickRefineItem.expertRationale,
        rootCauseAnalysis: refineRootCause,
        proposedRefinement: refineProposed,
        status: 'DRAFT',
      });

      setRefineSuccess('Refinement gap log created and linked successfully!');
      setTimeout(() => {
        setRefineSuccess(null);
        setQuickRefineItem(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create refinement log');
    } finally {
      setRefineSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full flex items-center">
              <GitCompare className="w-3.5 h-3.5 mr-1" />
              Comparison Matrix
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
              Post-Expert Submission Review
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            AI vs. Expert Side-by-Side Evaluation Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent empirical analysis comparing AI Agent evaluations against double-blind expert legal assessments.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 max-w-md">
          <strong className="text-slate-800 flex items-center mb-1">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Configurable Conflict Signals
          </strong>
          Score deltas (&Delta; = Expert - AI) and divergence signals provide automated review indicators to guide structured refinement.
        </div>
      </div>

      {/* Filter & Threshold Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Agent Version Filter */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Agent Version:</span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Versions</option>
              {agentVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionTag} — {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conflict Only Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasConflictOnly}
              onChange={(e) => setHasConflictOnly(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-semibold text-slate-700">Show Conflict Flags Only</span>
          </label>
        </div>

        {/* Configurable Conflict Threshold Slider */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
          <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-slate-700 whitespace-nowrap">Conflict Threshold:</span>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={thresholdPercent}
              onChange={(e) => setThresholdPercent(parseInt(e.target.value, 10))}
              className="w-24 sm:w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="font-mono font-bold text-indigo-700 w-8">{thresholdPercent}%</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium uppercase">Compared Items</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{summary.totalCompared}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium uppercase">Mean Absolute Delta</span>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              ±{summary.meanAbsoluteDelta} <span className="text-xs text-slate-400 font-normal">pts</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium uppercase">Mean Signed Delta</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {summary.meanSignedDelta > 0 ? `+${summary.meanSignedDelta}` : summary.meanSignedDelta}{' '}
              <span className="text-xs text-slate-400 font-normal">pts</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium uppercase">Agreement Rate</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {summary.agreementRate}%{' '}
              <span className="text-xs text-slate-400 font-normal font-sans">
                ({summary.flaggedConflictsCount} flagged)
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
          {error}
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-indigo-600" />
            Paired Assessment Matrix
          </h2>
          <span className="text-xs text-slate-400">
            Showing {comparisons.length} paired evaluations
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            Loading paired comparisons...
          </div>
        ) : comparisons.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No paired evaluations found.</p>
            <p className="text-xs text-slate-400 mt-1">
              Paired comparisons appear once independent expert evaluations are submitted for student answers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Student / Question</th>
                  <th className="px-5 py-3.5">Version</th>
                  <th className="px-5 py-3.5 text-center">AI Score</th>
                  <th className="px-5 py-3.5 text-center">Expert Score</th>
                  <th className="px-5 py-3.5 text-center">Score Delta</th>
                  <th className="px-5 py-3.5">Conflict Signals</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisons.map((c) => {
                  let deltaBadge = (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono font-bold">
                      {c.scoreDelta > 0 ? `+${c.scoreDelta}` : c.scoreDelta} pts
                    </span>
                  );
                  if (c.percentageDelta >= thresholdPercent) {
                    deltaBadge = (
                      <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full font-mono font-bold">
                        {c.scoreDelta > 0 ? `+${c.scoreDelta}` : c.scoreDelta} pts ({c.percentageDelta}%)
                      </span>
                    );
                  } else if (c.percentageDelta >= thresholdPercent / 2) {
                    deltaBadge = (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-mono font-bold">
                        {c.scoreDelta > 0 ? `+${c.scoreDelta}` : c.scoreDelta} pts ({c.percentageDelta}%)
                      </span>
                    );
                  }

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-slate-900">{c.studentAnonymizedCode}</div>
                        <div className="font-medium text-slate-600 text-[11px] mt-0.5">
                          <span className="font-mono font-bold text-indigo-700">{c.questionCode}</span>: {c.questionTitle}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-slate-700 rounded text-[11px]">
                          {c.agentVersionTag}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-800 text-sm">
                        {c.aiScore} <span className="text-[10px] text-slate-400 font-normal">/ {c.maxScore}</span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-indigo-900 text-sm">
                        {c.expertScore} <span className="text-[10px] text-slate-400 font-normal">/ {c.maxScore}</span>
                      </td>
                      <td className="px-5 py-4 text-center">{deltaBadge}</td>
                      <td className="px-5 py-4">
                        {c.conflictFlags.length === 0 ? (
                          <span className="text-slate-400 text-[11px] flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                            Aligned
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {c.conflictFlags.map((flag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-semibold flex items-center"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedComparison(c)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => openQuickRefine(c)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Log Refinement</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side Detailed Inspection Modal */}
      {selectedComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                    {selectedComparison.questionCode}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                    {selectedComparison.studentAnonymizedCode}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    Agent {selectedComparison.agentVersionTag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Side-by-Side AI vs. Expert Detailed Comparison
                </h3>
              </div>
              <button
                onClick={() => setSelectedComparison(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Score Header Comparison */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">AI Score</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {selectedComparison.aiScore}{' '}
                    <span className="text-xs text-slate-400 font-normal">/ {selectedComparison.maxScore}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Score Delta (Expert - AI)</span>
                  <div
                    className={`text-2xl font-black mt-0.5 ${
                      selectedComparison.percentageDelta >= thresholdPercent
                        ? 'text-red-600'
                        : 'text-indigo-600'
                    }`}
                  >
                    {selectedComparison.scoreDelta > 0
                      ? `+${selectedComparison.scoreDelta}`
                      : selectedComparison.scoreDelta}{' '}
                    <span className="text-xs text-slate-400 font-normal">
                      ({selectedComparison.percentageDelta}%)
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Expert Score</span>
                  <div className="text-2xl font-black text-indigo-900 mt-0.5">
                    {selectedComparison.expertScore}{' '}
                    <span className="text-xs text-slate-400 font-normal">/ {selectedComparison.maxScore}</span>
                  </div>
                </div>
              </div>

              {/* Criterion-by-Criterion Delta Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs text-slate-800 border-b border-slate-200">
                  Criterion-by-Criterion Score Breakdown
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Criterion</th>
                      <th className="px-4 py-2 text-center">AI</th>
                      <th className="px-4 py-2 text-center">Expert</th>
                      <th className="px-4 py-2 text-center">Delta</th>
                      <th className="px-4 py-2">Reasoning Alignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedComparison.criterionDeltas.map((cd, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-bold text-slate-800">{cd.criterionName}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold">{cd.aiScore}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-indigo-900">
                          {cd.expertScore}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold">
                          <span
                            className={
                              Math.abs(cd.delta) >= cd.maxPoints * 0.25
                                ? 'text-red-600'
                                : 'text-slate-700'
                            }
                          >
                            {cd.delta > 0 ? `+${cd.delta}` : cd.delta}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 text-[11px] leading-relaxed">
                          {cd.reasoningExpert ? (
                            <div>
                              <strong className="text-slate-800">Expert:</strong> {cd.reasoningExpert}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No specific note</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Side-by-Side Comprehensive Reasoning */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-xs text-slate-900 block border-b border-slate-200 pb-1">
                    AI Scoring Basis & Rationale
                  </span>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {selectedComparison.aiScoringBasis}
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <span className="font-bold text-xs text-indigo-950 block border-b border-indigo-100 pb-1">
                    Legal Expert Qualitative Rationale
                  </span>
                  <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                    {selectedComparison.expertRationale}
                  </p>
                  {selectedComparison.expertQualitativeComments && (
                    <div className="mt-2 pt-2 border-t border-indigo-100 text-[11px] text-indigo-900">
                      <strong>Additional Expert Notes:</strong> {selectedComparison.expertQualitativeComments}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedComparison(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Close Inspector
              </button>
              <button
                onClick={() => {
                  const item = selectedComparison;
                  setSelectedComparison(null);
                  openQuickRefine(item);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Structured Refinement Log</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Refinement Log Modal */}
      {quickRefineItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                  Log Conflict / Gap Analysis
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Create Refinement Log from Comparison
                </h3>
              </div>
              <button
                onClick={() => setQuickRefineItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRefinement} className="p-6 space-y-4 overflow-y-auto">
              {refineSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {refineSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-xs text-slate-700 block mb-1">
                    Target Agent Component *
                  </label>
                  <select
                    value={refineTargetComponent}
                    onChange={(e) => setRefineTargetComponent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="SYSTEM_INSTRUCTIONS">System Instructions</option>
                    <option value="EVALUATION_PATTERNS">Evaluation Patterns</option>
                    <option value="CONCEPT_VARIATIONS">Concept Variations</option>
                    <option value="SKILLS_DEFINITION">Skills Definition</option>
                    <option value="RUBRIC_SNAPSHOT">Rubric Snapshot</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-xs text-slate-700 block mb-1">
                    Gap Category *
                  </label>
                  <select
                    value={refineGapCategory}
                    onChange={(e) => setRefineGapCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="REASONING_IRAC_ISSUE">Reasoning / IRAC Issue</option>
                    <option value="LEGAL_CONCEPT_MISUNDERSTANDING">Legal Concept Misunderstanding</option>
                    <option value="STATUTORY_ELEMENT_OMISSION">Statutory Element Omission</option>
                    <option value="ACCEPTABLE_VARIATION_HANDLING">Acceptable Variation Handling</option>
                    <option value="SCORING_RUBRIC_INTERPRETATION">Scoring / Rubric Interpretation</option>
                    <option value="HALLUCINATION_UNSUPPORTED_CLAIM">Hallucination / Unsupported Claim</option>
                    <option value="REFERENCE_MATERIAL_GROUNDING">Reference Material Grounding</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  Discrepancy Summary *
                </label>
                <input
                  type="text"
                  required
                  value={refineDescription}
                  onChange={(e) => setRefineDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  Root Cause Analysis
                </label>
                <textarea
                  rows={3}
                  value={refineRootCause}
                  onChange={(e) => setRefineRootCause(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  Proposed Refinement for Next Version *
                </label>
                <textarea
                  rows={3}
                  required
                  value={refineProposed}
                  onChange={(e) => setRefineProposed(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed"
                />
              </div>

              <div className="p-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setQuickRefineItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refineSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {refineSaving ? 'Logging Gap...' : 'Save Refinement Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
