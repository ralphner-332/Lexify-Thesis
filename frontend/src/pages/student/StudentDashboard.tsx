import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Question } from '../../types';
import { BookOpen, FileText, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await api.questions.list();
        setQuestions(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch assigned questions');
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Assessment Portal</h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, <strong>{user?.name}</strong>. Review your assigned Criminal Law I analytical essay items below.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 w-fit">
          <BookOpen className="w-4 h-4" />
          <span>FSUU College of Law • Criminal Law I</span>
        </div>
      </div>

      {/* Phase notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-900 text-sm">
        <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-bold text-blue-950">Foundation Phase Active (Phase 1)</h2>
          <p className="text-xs text-blue-800 mt-0.5">
            Predetermined questions and scoring rubrics are configured by researchers. Interactive essay submission and AI evaluation engine will activate in <strong>Phase 2</strong>.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading predetermined questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
          No active questions currently assigned.
        </div>
      ) : (
        <div className="grid gap-6">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold font-mono">
                    {q.code}
                  </span>
                  <h2 className="font-bold text-slate-900 text-lg">
                    Item {idx + 1}: {q.title}
                  </h2>
                </div>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Predetermined Research Item
                </span>
              </div>

              {/* Scenario Only - Reference Answer is stripped by server-side DTO */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Factual Scenario
                </h3>
                <p className="legal-text text-slate-800 text-sm whitespace-pre-wrap">{q.scenario}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  disabled
                  className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed border border-slate-200 flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Essay Response Submission (Unlocks in Phase 2)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
