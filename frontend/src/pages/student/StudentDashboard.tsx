import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AssessmentSession, StudentEvaluationFeedback } from '../../types';
import {
  FileText,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface HistoryItem {
  session: AssessmentSession;
  averageScore?: number;
  loadingScore?: boolean;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch active session
      let currentActive: AssessmentSession | null = null;
      try {
        const activeRes = await api.sessions.getActive();
        currentActive = activeRes.data;
        setActiveSession(currentActive);
      } catch (err: any) {
        // No active session or error
        setActiveSession(null);
      }

      // 2. Fetch history sessions
      const historyRes = await api.sessions.getHistory();
      const sessions = historyRes.data || [];

      const initialItems: HistoryItem[] = sessions.map((s) => ({
        session: s,
        loadingScore: s.status === 'SUBMITTED',
      }));
      setHistoryItems(initialItems);

      // 3. For submitted sessions, load their scores asynchronously
      sessions.forEach(async (s) => {
        if (s.status === 'SUBMITTED') {
          try {
            const fbRes = await api.evaluations.getSessionFeedback(s.id);
            const feedbacks: StudentEvaluationFeedback[] = fbRes.data || [];
            if (feedbacks.length > 0) {
              const total = feedbacks.reduce(
                (sum, f) => sum + (f.finalScore ?? f.numericalScore * 0.05),
                0
              );
              const avg = total / feedbacks.length;
              setHistoryItems((prev) =>
                prev.map((item) =>
                  item.session.id === s.id
                    ? { ...item, averageScore: avg, loadingScore: false }
                    : item
                )
              );
            } else {
              setHistoryItems((prev) =>
                prev.map((item) =>
                  item.session.id === s.id ? { ...item, loadingScore: false } : item
                )
              );
            }
          } catch {
            setHistoryItems((prev) =>
              prev.map((item) =>
                item.session.id === s.id ? { ...item, loadingScore: false } : item
              )
            );
          }
        }
      });
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load assessment details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrResume = async () => {
    if (activeSession && activeSession.status === 'IN_PROGRESS') {
      navigate('/student/assessment');
      return;
    }

    try {
      setStarting(true);
      setError(null);
      const res = await api.sessions.create();
      setActiveSession(res.data);
      navigate('/student/assessment');
    } catch (err: any) {
      setError(err.message || 'Unable to start assessment');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Student Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium">Commercial Law</div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Welcome, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your assigned analytical essay assessments and review evaluation results.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 self-start sm:self-auto font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Portal Active</span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ACTIVE ACTIVITY SECTION */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Activity
          </div>
          {activeSession?.status === 'IN_PROGRESS' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>In Progress</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>Available</span>
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Commercial Law Assessment
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Read each problem scenario carefully and compose your written legal analysis following standard legal writing principles (Answer, Rule, Application, Conclusion).
            </p>
          </div>

          <button
            onClick={handleStartOrResume}
            disabled={starting || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition shrink-0 disabled:opacity-50"
          >
            <span>
              {starting
                ? 'Opening...'
                : activeSession?.status === 'IN_PROGRESS'
                ? 'Resume Assessment'
                : 'Take Assessment'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ASSESSMENT HISTORY SECTION */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Assessment History
          </h2>
          <span className="text-xs text-slate-500">
            {historyItems.length} {historyItems.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading assessment history...
          </div>
        ) : historyItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <p className="font-medium text-slate-700">No previous assessments completed yet.</p>
            <p className="text-slate-400 mt-1">
              Complete the active Commercial Law Assessment above to view your score and evaluation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="py-3 px-6">Assessment</th>
                  <th className="py-3 px-4">Date submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyItems.map(({ session }) => {
                  const isSubmitted = session.status === 'SUBMITTED';
                  const dateStr = session.submittedAt
                    ? new Date(session.submittedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : new Date(session.startedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      });

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Commercial Law Assessment</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{dateStr}</td>
                      <td className="py-3.5 px-4">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {isSubmitted ? (
                          <span className="text-slate-700">Evaluated</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isSubmitted ? (
                          <button
                            onClick={() =>
                              navigate(`/student/assessment/feedback?sessionId=${session.id}`)
                            }
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded text-xs transition"
                          >
                            <span>View Result</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/student/assessment')}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition"
                          >
                            <span>Resume</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
