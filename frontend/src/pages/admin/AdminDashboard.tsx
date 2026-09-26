import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminEvaluation } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  HelpCircle,
  ArrowRight,
  Cpu,
  Download,
  Users,
  Sliders,
  CheckCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    questionsCount: 0,
    rubricsCount: 0,
    submissionsCount: 0,
    modelsCount: 3,
  });
  const [recentEvaluations, setRecentEvaluations] = useState<AdminEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [qRes, rRes, mRes, evalRes] = await Promise.all([
          api.questions.list(true),
          api.rubrics.list(),
          api.models.list(),
          api.evaluations.getAdminList({ limit: 10 }),
        ]);

        const evals: AdminEvaluation[] = evalRes.data?.evaluations || [];
        setRecentEvaluations(evals.slice(0, 5));

        setStats({
          questionsCount: qRes.data?.length || 0,
          rubricsCount: rRes.data?.length || 0,
          submissionsCount: evalRes.data?.total || evals.length,
          modelsCount: mRes.data?.length || 3,
        });
      } catch (err: any) {
        console.error('Failed to load admin overview:', err);
        setError(err.message || 'Failed to load system overview');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Commercial Law Assessment
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Operational status, student submissions, and assessment management.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 self-start md:self-auto font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>System Online · 3 local models active</span>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Operational Summary Row */}
      {loading ? (
        <LoadingSkeleton rows={4} type="card" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500">Student submissions</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{stats.submissionsCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Evaluated by 3 models</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500">Active assessment</span>
            <div className="text-base font-bold text-slate-900 mt-1">Commercial Law</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.questionsCount} active questions</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500">Configured models</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{stats.modelsCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Llama 3.2, Phi-4, Gemma 2</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500">Controlling rubric</span>
            <div className="text-xl font-bold text-slate-900 mt-1">100%</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">15/15/30/30/10 matrix</span>
          </div>
        </div>
      )}

      {/* Recent Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Recent Submissions
          </h2>
          <Link
            to="/admin/submissions"
            className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
          >
            <span>View all submissions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading recent submissions...
          </div>
        ) : recentEvaluations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No submissions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="py-3 px-6">Student</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEvaluations.map((e) => {
                  const scoreVal = (e.finalScore ?? e.numericalScore * 0.05).toFixed(2);
                  const dateStr = new Date(e.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const modelName =
                    e.exactModelId === 'gemma2:2b' || e.modelSlot === 'MODEL_C'
                      ? 'Gemma 2 2B'
                      : e.exactModelId === 'phi4-mini:3.8b' || e.modelSlot === 'MODEL_B'
                      ? 'Phi-4-mini 3.8B'
                      : 'Llama 3.2 3B';

                  const modelTag = e.exactModelId || (e.modelSlot === 'MODEL_C' ? 'gemma2:2b' : e.modelSlot === 'MODEL_B' ? 'phi4-mini:3.8b' : 'llama3.2:3b');
                  const slotTag = e.modelSlot || (e.exactModelId === 'gemma2:2b' ? 'MODEL_C' : e.exactModelId === 'phi4-mini:3.8b' ? 'MODEL_B' : 'MODEL_A');

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-6 font-medium text-slate-900">
                        <div>
                          <span>{e.studentName || 'Student'}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {e.studentEmail}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">
                          {e.questionSnapshot?.code || 'COMM-Q01'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium text-slate-800 text-[11px] block">{modelName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{modelTag}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{dateStr}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {scoreVal} / 5.00
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Evaluated
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Link
                          to={`/admin/submissions?evalId=${e.id}&sessionId=${e.sessionId}&questionId=${e.questionId}&slot=${slotTag}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded text-xs transition shadow-2xs"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Administrative Management Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link
          to="/admin/submissions"
          className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:bg-slate-50/50 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Submissions & Multi-Model Review</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Compare student responses side-by-side with independent evaluations from Llama 3.2, Phi-4, and Gemma 2.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
            <span>View Submissions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/questions"
          className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:bg-slate-50/50 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Questions & Model Answers</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Manage Commercial Law analytical problem scenarios and corresponding authoritative model answers.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
            <span>Manage Questions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/rubrics"
          className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:bg-slate-50/50 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Authoritative Rubric</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review the controlling 5-criterion rubric (Form 15, Answer 15, Rule 30, Application 30, Conclusion 10).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
            <span>View Rubric</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/models"
          className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:bg-slate-50/50 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>Model Configuration</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Check live serving status and execution parameters for local Ollama evaluation models.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
            <span>Configure Models</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/exports"
          className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:bg-slate-50/50 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exports & Reports</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export system assessment records, evaluation datasets in CSV/JSON, and printable summary reports.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
            <span>Export Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
};
