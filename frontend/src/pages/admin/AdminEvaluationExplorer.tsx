import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AdminEvaluation, AgentVersion, Question } from '../../types';
import {
  Sparkles,
  Eye,
  CheckCircle,
  Layers,
  Database,
  Cpu,
  BookOpen,
  X,
} from 'lucide-react';

export const AdminEvaluationExplorer: React.FC = () => {
  const [evaluations, setEvaluations] = useState<AdminEvaluation[]>([]);
  const [agentVersions, setAgentVersions] = useState<AgentVersion[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [demoFilter, setDemoFilter] = useState<string>('all');
  const [reviewFlagsOnly, setReviewFlagsOnly] = useState<boolean>(false);

  // Selected Evaluation for Snapshot Inspection Drawer
  const [selectedEval, setSelectedEval] = useState<AdminEvaluation | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evalRes, verRes, qRes] = await Promise.all([
        api.evaluations.getAdminList({
          agentVersionId: selectedVersion || undefined,
          questionId: selectedQuestion || undefined,
          isDemo: demoFilter === 'demo' ? true : demoFilter === 'research' ? false : undefined,
          hasReviewFlags: reviewFlagsOnly,
        }),
        api.agentVersions.getAll(),
        api.questions.getAll(),
      ]);

      setEvaluations(evalRes.data.evaluations);
      setAgentVersions(verRes.data);
      setQuestions(qRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedVersion, selectedQuestion, demoFilter, reviewFlagsOnly]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                AI Research Output Explorer
              </span>
              <span className="text-xs text-slate-500">Immutable Evaluation Evidence</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">AI Evaluations & Snapshot Evidence</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect semantic legal AI evaluations, historical snapshots (Question, ModelConfig, Rubric), and review flags.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Total Records: <strong className="text-slate-800">{evaluations.length}</strong></span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Agent Version Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Agent Version</label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Agent Versions</option>
              {agentVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionTag} — {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Question</label>
            <select
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Questions</option>
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.code}: {q.title}
                </option>
              ))}
            </select>
          </div>

          {/* Data Environment Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Data Mode</label>
            <select
              value={demoFilter}
              onChange={(e) => setDemoFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Records</option>
              <option value="research">Real Research Data Only</option>
              <option value="demo">Demo / Test Data Only</option>
            </select>
          </div>

          {/* Review Flags Toggle */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer w-full">
              <input
                type="checkbox"
                checked={reviewFlagsOnly}
                onChange={(e) => setReviewFlagsOnly(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Flagged / Low Confidence Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            Loading evaluation records...
          </div>
        ) : evaluations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No evaluations found matching the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Student / Session</th>
                  <th className="px-4 py-3.5">Question Snapshot</th>
                  <th className="px-4 py-3.5">Agent Version</th>
                  <th className="px-4 py-3.5">Model Config</th>
                  <th className="px-4 py-3.5">Score / Max</th>
                  <th className="px-4 py-3.5">Review Flags</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evaluations.map((ev) => {
                  const qSnap = ev.questionSnapshot || {};
                  const mSnap = ev.modelConfigSnapshot || {};
                  const isFlagged = ev.reviewFlags && ev.reviewFlags.length > 0;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{ev.studentName || 'Student'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{ev.studentEmail}</div>
                        {ev.isDemo && (
                          <span className="inline-block mt-1 px-2 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                            Demo Mode
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-indigo-700">{qSnap.code || 'Q'}</span>
                        <div className="text-slate-800 font-medium truncate max-w-[200px]">{qSnap.title}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold rounded-md">
                          V1
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] text-slate-800 font-semibold">{mSnap.provider}</div>
                        <div className="text-slate-500 text-[10px]">{mSnap.modelId}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {ev.numericalScore} <span className="text-xs text-slate-400 font-normal">/ {ev.maxScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {isFlagged ? (
                          <div className="flex flex-wrap gap-1">
                            {ev.reviewFlags.map((flag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">
                                {flag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-700 flex items-center text-[11px] font-medium">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Passed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedEval(ev)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs flex items-center space-x-1 ml-auto shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Snapshots</span>
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

      {/* Snapshot Inspection Modal / Drawer */}
      {selectedEval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                    Immutable Evaluation Record
                  </span>
                  <span className="text-xs font-mono text-slate-500">ID: {selectedEval.id}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Evaluation Evidence: {selectedEval.questionSnapshot?.code} — {selectedEval.questionSnapshot?.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEval(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Score & Review Signals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs text-slate-500 uppercase font-bold">Numerical Score</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">
                  {selectedEval.numericalScore} <span className="text-base text-slate-400 font-normal">/ {selectedEval.maxScore}</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs text-slate-500 uppercase font-bold">Confidence Signal</span>
                <div className="text-3xl font-extrabold text-indigo-600 mt-1">
                  {(selectedEval.confidenceScore * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs text-slate-500 uppercase font-bold">Review Flags</span>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {selectedEval.reviewFlags && selectedEval.reviewFlags.length > 0 ? (
                    selectedEval.reviewFlags.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded">
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold">None</span>
                  )}
                </div>
              </div>
            </div>

            {/* Student Answer */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Student Essay Submission
              </span>
              <p className="text-xs text-slate-800 font-serif leading-relaxed whitespace-pre-wrap">
                {selectedEval.studentAnswer}
              </p>
            </div>

            {/* Scoring Basis */}
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block mb-2">
                Semantic Scoring Basis
              </span>
              <p className="text-xs text-slate-800 font-serif leading-relaxed whitespace-pre-wrap">
                {selectedEval.scoringBasis}
              </p>
            </div>

            {/* Snapshot Inspector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Question Snapshot */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Evaluation-Time Question Snapshot</span>
                </span>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selectedEval.questionSnapshot, null, 2)}
                </pre>
              </div>

              {/* Model Config Snapshot */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>Evaluation-Time Model Config Snapshot</span>
                </span>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selectedEval.modelConfigSnapshot, null, 2)}
                </pre>
              </div>
            </div>

            {/* Rubric Snapshot */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Evaluation-Time Rubric Snapshot</span>
              </span>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-36">
                {JSON.stringify(selectedEval.rubricSnapshot, null, 2)}
              </pre>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedEval(null)}
                className="px-5 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
