import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { V3ReviewQueueItem } from '../../types';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const PostV3FinalReviewPortal: React.FC = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<V3ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.finalReviews.getQueue();
      setQueue(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load post-V3 review queue.');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = queue.filter((item) => item.reviewStatus === 'PENDING').length;
  const completedCount = queue.filter((item) => item.reviewStatus === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-amber-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider w-fit border border-amber-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Phase 4: Post-V3 Final Expert Evaluation
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            AI Agent Final Validation & Agreement Review
          </h1>
          <p className="text-amber-100/80 text-sm leading-relaxed mb-4">
            In this final phase, double-blind masking is lifted. As a legal expert, you will review the complete V3 AI evaluation output side-by-side with student responses and reference benchmarks to assess legal reasoning correctness, statutory grounding, and overall alignment.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-200/70 pt-2 border-t border-amber-700/40">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Unblinded Review Protocol
            </span>
            <span>•</span>
            <span>Likert 1–5 Scoring & Error Classification</span>
            <span>•</span>
            <span>Append-Only Research Evidence</span>
          </div>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Submissions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{queue.length}</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Completed Reviews</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Post-V3 Evaluation Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an evaluation to review the AI Agent's scoring basis and submit your expert assessment.
            </p>
          </div>
          <button
            onClick={loadQueue}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium self-start md:self-auto"
          >
            Refresh Queue
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="animate-spin w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            Loading post-V3 evaluations...
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            No V3 student evaluations available for final review at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Anonymized Student</th>
                  <th className="py-3.5 px-4">Question</th>
                  <th className="py-3.5 px-4">V3 AI Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Final Verdict</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => (
                  <tr key={item.evaluationId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {item.studentAnonymizedCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{item.questionCode}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{item.questionTitle}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-mono">
                        {item.v3AiScore} / {item.maxScore}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.reviewStatus === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.finalVerdict ? (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            item.finalVerdict === 'ACCEPTABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.finalVerdict === 'ACCEPTABLE_WITH_MINOR_ISSUES'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.finalVerdict.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/expert/post-v3-reviews/${item.evaluationId}`)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-all ${
                          item.reviewStatus === 'COMPLETED'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {item.reviewStatus === 'COMPLETED' ? 'View Review' : 'Start Review'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
