import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AssessmentSession, StudentEvaluationFeedback, SystemSettings } from '../../types';
import { percentageToCustomFivePoint } from '../../utils/scoring';
import {
  FileText,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Layers,
  BookOpen,
} from 'lucide-react';

interface HistoryItem {
  session: AssessmentSession;
  averageScore?: number;
  loadingScore?: boolean;
}

const TEST_DEFINITIONS = [
  {
    id: 'TEST_1' as const,
    title: 'Test 1',
    codePrefix: 'TEST1',
    range: 'TEST1-Q01 – TEST1-Q10',
    topics: 'Formation, Juridical Personality & Universal Partnerships',
  },
  {
    id: 'TEST_2' as const,
    title: 'Test 2',
    codePrefix: 'TEST2',
    range: 'TEST2-Q01 – TEST2-Q10',
    topics: 'Particular Partnerships, Partner Types & Obligations',
  },
  {
    id: 'TEST_3' as const,
    title: 'Test 3',
    codePrefix: 'TEST3',
    range: 'TEST3-Q01 – TEST3-Q10',
    topics: 'Management, Capital Contributions & Partner Debts',
  },
  {
    id: 'TEST_4' as const,
    title: 'Test 4',
    codePrefix: 'TEST4',
    range: 'TEST4-Q01 – TEST4-Q10',
    topics: 'Dissolution, Winding Up, Creditor Claims & Rights',
  },
];

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [allSessions, setAllSessions] = useState<AssessmentSession[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch system publication settings
      let sysSettings: SystemSettings | null = null;
      try {
        const setRes = await api.models.getSettings();
        sysSettings = setRes.data;
        setSettings(sysSettings);
      } catch {
        // Fallback default settings
      }

      // 2. Fetch history sessions
      const historyRes = await api.sessions.getHistory();
      const sessions = historyRes.data || [];
      setAllSessions(sessions);

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
                (sum, f) =>
                  sum +
                  (f.roundedScore !== undefined
                    ? f.roundedScore
                    : percentageToCustomFivePoint(f.weightedPercentage ?? f.numericalScore ?? 0)),
                0
              );
              setHistoryItems((prev) =>
                prev.map((item) =>
                  item.session.id === s.id
                    ? { ...item, averageScore: total, loadingScore: false }
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
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Re-fetch when the window/tab gains focus so changes made in admin are instantly visible
    const onFocus = () => {
      loadDashboardData();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [loadDashboardData, location.key]);

  const handleStartOrResume = async (testSetId: string) => {
    try {
      setStartingTestId(testSetId);
      setError(null);

      // Navigate to assessment with selected test set explicitly
      navigate(`/student/assessment?testSet=${testSetId}`);
    } catch (err: any) {
      setError(err.message || 'Unable to open assessment');
    } finally {
      setStartingTestId(null);
    }
  };

  // Determine which tests are currently ACTIVE (published) strictly from testSetStatuses
  const activePublishedTests = TEST_DEFINITIONS.filter((t) => {
    const status = settings?.testSetStatuses?.[t.id];
    return status === 'ACTIVE';
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Student Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium">Commercial Law I · Legal Assessments</div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Welcome, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your assigned analytical essay assessments and review evaluation results.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 self-start sm:self-auto font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Student Portal Active</span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AVAILABLE ASSESSMENTS SECTION */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Available Assessments
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {activePublishedTests.length} Published {activePublishedTests.length === 1 ? 'Test' : 'Tests'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading available assessments...</div>
        ) : activePublishedTests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <BookOpen className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No active assessments are currently published.</p>
            <p className="text-slate-400 mt-1">
              Please check back when your instructor publishes a test set.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePublishedTests.map((t) => {
              // Find matching session for this test
              const matchingSession = allSessions.find((sess) => {
                if (sess.testSet === t.id) return true;
                const qs = sess.questions || [];
                return qs.some(
                  (q) => q.testSet === t.id || (q.code && q.code.startsWith(t.codePrefix))
                );
              });

              const isInProgress = matchingSession?.status === 'IN_PROGRESS';
              const isSubmitted = matchingSession?.status === 'SUBMITTED';

              return (
                <div
                  key={t.id}
                  className="border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4 bg-slate-50/50 hover:border-slate-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{t.title}</span>
                      {isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>In Progress</span>
                        </span>
                      ) : isSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Submitted</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono font-medium text-slate-600">
                      10 Questions · {t.range}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t.topics}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Standard IRAC Rubric (50 pts)
                    </span>

                    {isSubmitted ? (
                      <button
                        onClick={() => navigate(`/student/assessment/feedback?sessionId=${matchingSession.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium rounded-md text-xs transition"
                      >
                        <span>View Evaluation</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartOrResume(t.id)}
                        disabled={startingTestId === t.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition disabled:opacity-50"
                      >
                        <span>
                          {startingTestId === t.id
                            ? 'Opening...'
                            : isInProgress
                            ? 'Resume Assessment'
                            : 'Start Assessment'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              Start an active Commercial Law Assessment above to compose your essays and view evaluation feedback.
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
                {historyItems.map(({ session, averageScore, loadingScore }) => {
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

                  // Identify test name from session questions
                  const qs = session.questions || [];
                  const testPrefix = qs[0]?.code?.slice(0, 5) || 'TEST1';
                  const testLabel = testPrefix.startsWith('TEST2')
                    ? 'Test 2'
                    : testPrefix.startsWith('TEST3')
                    ? 'Test 3'
                    : testPrefix.startsWith('TEST4')
                    ? 'Test 4'
                    : 'Test 1';

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Commercial Law Assessment ({testLabel})</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{dateStr}</td>
                      <td className="py-3.5 px-4">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Submitted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {loadingScore ? (
                          <span className="text-slate-400 font-normal">Calculating...</span>
                        ) : averageScore !== undefined ? (
                          <span>{averageScore} / 50</span>
                        ) : isSubmitted ? (
                          <span>Evaluated</span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isSubmitted ? (
                          <button
                            onClick={() => navigate(`/student/assessment/feedback?sessionId=${session.id}`)}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium text-xs hover:underline"
                          >
                            <span>View Evaluation</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/student/assessment?sessionId=${session.id}`)}
                            className="inline-flex items-center gap-1 text-slate-900 hover:text-slate-700 font-medium text-xs hover:underline"
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
