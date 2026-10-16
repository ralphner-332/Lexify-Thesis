import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminEvaluation, SystemSettings } from '../../types';
import { percentageToCustomFivePoint } from '../../utils/scoring';
import {
  Search,
  ArrowRight,
  Eye,
  CheckCircle,
  ExternalLink,
  Layers,
  X,
  Sparkles,
  AlertTriangle,
  Loader2,
  Download,
  FileText,
} from 'lucide-react';

interface SubmissionGroup {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  evaluations: AdminEvaluation[];
}

export const SubmissionsExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<AdminEvaluation[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    studentDisplayModel: 'MODEL_A',
    accuracyLevel: 'STANDARD',
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionGroup | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Reuse Answers for V4 state
  const [reusedMap, setReusedMap] = useState<
    Record<
      string,
      {
        targetSessionId: string;
        targetAgentVersion: string;
        createdAt: string;
        evaluationsCount?: number;
        isComplete?: boolean;
      }
    >
  >({});
  const [sessionToReuse, setSessionToReuse] = useState<SubmissionGroup | null>(null);
  const [confirmedMockup, setConfirmedMockup] = useState(false);
  const [reuseModalOpen, setReuseModalOpen] = useState(false);
  const [reusing, setReusing] = useState(false);
  const [reuseElapsedSeconds, setReuseElapsedSeconds] = useState(0);
  const [activeJob, setActiveJob] = useState<{
    jobId?: string;
    targetSessionId?: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    completedEvaluations: number;
    totalEvaluations: number;
    currentModel: string | null;
    currentQuestionCode: string | null;
    errorMessage: string | null;
  } | null>(null);
  const [reuseResult, setReuseResult] = useState<{
    alreadyReused: boolean;
    originalSessionId: string;
    newSessionId: string;
    sourceAgentVersion: string;
    targetAgentVersion: string;
    evaluationsCount: number;
    testSet: string;
    studentName: string;
  } | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const pollIntervalRef = React.useRef<any>(null);

  // Export Student Answers to PDF state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTestSet, setExportTestSet] = useState<'TEST_1' | 'TEST_2'>('TEST_1');
  const [exportScope, setExportScope] = useState<'ALL' | 'SINGLE'>('ALL');
  const [exportStudentId, setExportStudentId] = useState<string>('');
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [evalRes, settingsRes, reusedRes] = await Promise.all([
        api.evaluations.getAdminList({ limit: 2000 }),
        api.models.getSettings(),
        api.sessions.getReusedMap(),
      ]);
      setEvaluations(evalRes.data?.evaluations || []);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (reusedRes?.data) {
        setReusedMap(reusedRes.data);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  }


  // Group by session
  const sessionGroups: SubmissionGroup[] = React.useMemo(() => {
    const map = new Map<string, SubmissionGroup>();

    evaluations.forEach((e) => {
      if (!map.has(e.sessionId)) {
        map.set(e.sessionId, {
          sessionId: e.sessionId,
          studentId: e.studentId,
          studentName: e.studentName || 'Student',
          studentEmail: e.studentEmail || 'student@example.com',
          submittedAt: e.createdAt,
          evaluations: [],
        });
      }
      map.get(e.sessionId)!.evaluations.push(e);
    });

    return Array.from(map.values())
      .filter((group) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          group.studentName.toLowerCase().includes(q) ||
          group.studentEmail.toLowerCase().includes(q) ||
          group.sessionId.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const nameCmp = a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' });
        if (nameCmp !== 0) return nameCmp;
        return a.studentEmail.localeCompare(b.studentEmail, undefined, { sensitivity: 'base' });
      });
  }, [evaluations, searchQuery]);

  // Unique original students for individual export dropdown
  const originalStudents = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    sessionGroups.forEach((g) => {
      if (!map.has(g.studentId)) {
        map.set(g.studentId, { id: g.studentId, name: g.studentName, email: g.studentEmail });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [sessionGroups]);

  const handleDownloadPdf = async (testSet: 'TEST_1' | 'TEST_2', studentId?: string, sessionId?: string) => {
    try {
      setExportingPdf(true);
      const blob = await api.exports.getStudentAnswersPDF({
        testSet,
        studentId: studentId || undefined,
        sessionId: sessionId || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const studentSuffix = studentId
        ? `_STUDENT_${studentId.slice(0, 8)}`
        : sessionId
        ? `_SESSION_${sessionId.slice(0, 8)}`
        : '_ALL_STUDENTS';
      link.download = `Lexify_STUDENT_ANSWERS_${testSet}${studentSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (err: any) {
      alert('Failed to export student answers PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportSingle = async (sub: SubmissionGroup) => {
    const testSet =
      sub.evaluations[0]?.questionSnapshot?.testSet ||
      (sub.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST2')
        ? 'TEST_2'
        : 'TEST_1');
    await handleDownloadPdf(testSet as 'TEST_1' | 'TEST_2', sub.studentId, sub.sessionId);
  };

  const openInspect = (sub: SubmissionGroup) => {
    setSelectedSubmission(sub);
    setInspectModalOpen(true);
  };

  const startPolling = (
    jobIdOrSessionId: string,
    targetStudentName: string,
    targetTestSet: string,
    sourceSessionId: string
  ) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusRes = await api.sessions.getReuseJobStatus(jobIdOrSessionId);
        if (statusRes.data) {
          const job = statusRes.data;
          setActiveJob(job);

          if (job.status === 'COMPLETED' || job.completedEvaluations >= 30) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setReusing(false);
            setReuseModalOpen(false);

            setReuseResult({
              alreadyReused: false,
              originalSessionId: sourceSessionId,
              newSessionId: job.targetSessionId,
              sourceAgentVersion: 'V1',
              targetAgentVersion: 'V2',
              evaluationsCount: job.completedEvaluations || 30,
              testSet: targetTestSet,
              studentName: targetStudentName,
            });
            setResultModalOpen(true);
            await loadData();
          } else if (job.status === 'FAILED' && !job.isRunning) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (pollErr: any) {
        console.error('Error polling evaluation job status:', pollErr);
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const executeReuse = async () => {
    if (!sessionToReuse || !confirmedMockup) return;
    setReusing(true);
    setReuseElapsedSeconds(0);

    const testSet =
      sessionToReuse.evaluations[0]?.questionSnapshot?.testSet ||
      (sessionToReuse.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST2')
        ? 'TEST_2'
        : sessionToReuse.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST3')
        ? 'TEST_3'
        : sessionToReuse.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST4')
        ? 'TEST_4'
        : 'TEST_1');

    const timer = setInterval(() => {
      setReuseElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const res = await api.sessions.reuseAnswersForV2(sessionToReuse.sessionId, {
        confirmedMockupClassification: true,
      });

      // If already complete (30/30)
      if (
        res.isComplete ||
        res.status === 'COMPLETED' ||
        (res.alreadyReused && (res.evaluationsCount ?? 0) >= 30)
      ) {
        clearInterval(timer);
        setReusing(false);
        setReuseModalOpen(false);
        setReuseResult({
          alreadyReused: true,
          originalSessionId: res.originalSessionId,
          newSessionId: res.newSessionId,
          sourceAgentVersion: res.sourceAgentVersion || 'V1',
          targetAgentVersion: res.targetAgentVersion || 'V2',
          evaluationsCount: res.evaluationsCount || 30,
          testSet,
          studentName: sessionToReuse.studentName,
        });
        setResultModalOpen(true);
        await loadData();
        return;
      }

      // If in progress or resuming
      setActiveJob({
        jobId: res.jobId,
        targetSessionId: res.newSessionId,
        status: 'PROCESSING',
        completedEvaluations: res.completedEvaluations || 0,
        totalEvaluations: res.totalEvaluations || 30,
        currentModel: null,
        currentQuestionCode: null,
        errorMessage: null,
      });

      startPolling(
        res.jobId || res.newSessionId,
        sessionToReuse.studentName,
        testSet,
        sessionToReuse.sessionId
      );
    } catch (err: any) {
      clearInterval(timer);
      setReusing(false);
      alert('Failed to initiate V2 Evaluation: ' + (err.message || 'Unknown error'));
    }
  };

  const displaySlot = settings.studentDisplayModel || 'MODEL_A';

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Student Assessment Sessions · Submissions Management
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Student Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review completed student assessment submissions and inspect student-facing evaluation results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search student or session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs"
            title="Export original student answers for TEST 1 and TEST 2 to PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Student Answers to PDF</span>
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900">
            Recorded Submissions ({sessionGroups.length})
          </span>
          <span className="text-slate-500 text-[11px]">
            Student-Facing Display Model: <span className="font-bold text-slate-800">{displaySlot}</span>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading submissions...</div>
        ) : sessionGroups.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <p className="font-medium text-slate-700">No student submissions recorded yet.</p>
            <p className="text-slate-400 mt-1">Submitted student essays will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Session Reference</th>
                  <th className="py-3 px-4">Completion</th>
                  <th className="py-3 px-4">Display Score ({displaySlot})</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessionGroups.map((sub) => {
                  // Get questions evaluated under the student display model slot
                  const displayEvals = sub.evaluations.filter(
                    (e) => e.modelSlot === displaySlot || (!e.modelSlot && displaySlot === 'MODEL_A')
                  );
                  const uniqueQuestionsCount = new Set(sub.evaluations.map((e) => e.questionId)).size;

                  // Overall Assessment Score = SUM of final question grades (whole numbers 0 - 5 each -> total 0 - 50)
                  const totalOverallScore = displayEvals.reduce(
                    (sum, e) =>
                      sum +
                      (e.roundedScore !== undefined
                        ? e.roundedScore
                        : percentageToCustomFivePoint(e.numericalScore ?? 0)),
                    0
                  );

                  return (
                    <tr key={sub.sessionId} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sub.studentName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{sub.studentEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-700 text-[11px] block">
                          {sub.sessionId.slice(0, 13)}...
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-800">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {uniqueQuestionsCount} Questions Evaluated
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          3 Model Evaluations per Q ({sub.evaluations.length} total)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-1 font-mono">
                          <span className="text-base font-bold text-slate-900">
                            {totalOverallScore}
                          </span>
                          <span className="text-xs text-slate-400">/ 50</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Submitted
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2 whitespace-nowrap">
                        {/* Reuse Answers for V4 Button */}
                        {reusedMap[sub.sessionId] ? (
                          reusedMap[sub.sessionId].isComplete ? (
                            <button
                              onClick={() => {
                                const reused = reusedMap[sub.sessionId];
                                const testSet =
                                  sub.evaluations[0]?.questionSnapshot?.testSet ||
                                  (sub.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST2')
                                    ? 'TEST_2'
                                    : sub.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST3')
                                    ? 'TEST_3'
                                    : sub.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST4')
                                    ? 'TEST_4'
                                    : 'TEST_1');

                                setReuseResult({
                                  alreadyReused: true,
                                  originalSessionId: sub.sessionId,
                                  newSessionId: reused.targetSessionId,
                                  sourceAgentVersion: 'V1',
                                  targetAgentVersion: reused.targetAgentVersion || 'V2',
                                  evaluationsCount: reused.evaluationsCount || 30,
                                  testSet,
                                  studentName: sub.studentName,
                                });
                                setResultModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md font-semibold text-[11px] transition shadow-xs"
                              title="Mockup session fully evaluated under V2 Official. Click to view demonstration results."
                            >
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Reused for V2 (30/30)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSessionToReuse(sub);
                                setConfirmedMockup(true);
                                setReuseModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md font-semibold text-[11px] transition shadow-xs animate-pulse"
                              title={`Interrupted evaluation (${reusedMap[sub.sessionId].evaluationsCount || 0}/30 completed). Click to resume missing evaluations.`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>Resume V2 ({reusedMap[sub.sessionId].evaluationsCount || 0}/30)</span>
                            </button>
                          )
                        ) : !sub.evaluations[0]?.isDemo ? (
                          <button
                            onClick={() => {
                              setSessionToReuse(sub);
                              setConfirmedMockup(false);
                              setReuseModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-md font-semibold text-[11px] transition shadow-xs"
                            title="Reuse submitted mockup answers to test active Agent Version V2 Official"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>Reuse Answers for V2 Official</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Demo Session
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleExportSingle(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md font-medium text-[11px] transition shadow-xs"
                          title="Export this student's original submitted answers to PDF"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => openInspect(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md font-medium text-[11px] transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => {
                            const testSet =
                              sub.evaluations[0]?.questionSnapshot?.testSet ||
                              (sub.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST2')
                                ? 'TEST_2'
                                : sub.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST3')
                                ? 'TEST_3'
                                : sub.evaluations[0]?.questionSnapshot?.code?.startsWith('TEST4')
                                ? 'TEST_4'
                                : 'TEST_1');
                            navigate(
                              `/admin/comparisons?studentId=${encodeURIComponent(sub.studentId)}&sessionId=${encodeURIComponent(sub.sessionId)}&testSet=${testSet}`
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-[11px] transition"
                          title="View three-model comparative matrix"
                        >
                          <span>Compare 3 Models</span>
                          <ArrowRight className="w-3 h-3" />
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

      {/* Inspect Submission Modal */}
      {inspectModalOpen && selectedSubmission && (() => {
        const displayEvals = selectedSubmission.evaluations.filter(
          (e) => e.modelSlot === displaySlot || (!e.modelSlot && displaySlot === 'MODEL_A')
        );
        const modalOverallScore = displayEvals.reduce(
          (sum, e) =>
            sum +
            (e.roundedScore !== undefined
              ? e.roundedScore
              : percentageToCustomFivePoint(e.numericalScore ?? 0)),
          0
        );

        // Sort questions deterministically Q01 -> Q10
        const sortedQuestionIds = Array.from(new Set(selectedSubmission.evaluations.map((e) => e.questionId))).sort((a, b) => {
          const evalA = selectedSubmission.evaluations.find((e) => e.questionId === a);
          const evalB = selectedSubmission.evaluations.find((e) => e.questionId === b);
          const codeA = evalA?.questionSnapshot?.code || '';
          const codeB = evalB?.questionSnapshot?.code || '';
          return codeA.localeCompare(codeB, undefined, { numeric: true });
        });

        return (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Submission Details</span>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Session: {selectedSubmission.sessionId.slice(0, 12)}...
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {selectedSubmission.studentName} ({selectedSubmission.studentEmail})
                  </h3>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Overall Score ({displaySlot})
                    </div>
                    <div className="font-mono text-base font-bold text-slate-900">
                      {modalOverallScore} <span className="text-xs font-normal text-slate-400">/ 50</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExportSingle(selectedSubmission)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition shadow-xs"
                    title="Export this student's answers to PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Export PDF</span>
                  </button>

                  <button
                    onClick={() => setInspectModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Questions Evaluated in this Session */}
              <div className="space-y-4">
                {sortedQuestionIds.map((qId, idx) => {
                  const qEvals = selectedSubmission.evaluations.filter((e) => e.questionId === qId);
                  const displayEval = qEvals.find((e) => e.modelSlot === displaySlot) || qEvals[0];
                  const qSnap = displayEval?.questionSnapshot || {};
                  const criteria = displayEval?.criterionScores || [];
                  const questionGrade =
                    displayEval?.roundedScore !== undefined
                      ? displayEval.roundedScore
                      : percentageToCustomFivePoint(displayEval?.numericalScore || 0);

                  return (
                    <div key={qId} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <div>
                          <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded mr-2">
                            {qSnap.code || `Q${idx + 1}`}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {qSnap.title || 'Commercial Law Assessment Scenario'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span>
                            Score ({displaySlot}): <strong className="text-slate-900">{questionGrade} / 5</strong> ({displayEval?.numericalScore || 0}%)
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Student Written Essay:
                        </span>
                        <div className="p-3 bg-white border border-slate-200 rounded-md font-serif text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {displayEval?.studentAnswer || 'No response recorded.'}
                        </div>
                      </div>

                      {/* Criteria breakdown */}
                      {criteria.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 pt-1 text-xs">
                          {criteria.map((c: any, i: number) => (
                            <div key={i} className="p-2 bg-white border border-slate-200 rounded text-center">
                              <div className="text-[10px] text-slate-500 font-bold uppercase">{c.criterionName}</div>
                              <div className="font-mono font-bold text-slate-900 mt-0.5">{c.score} / {c.maxPoints}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Evaluation Rationale ({displaySlot}):
                        </span>
                        <div className="p-3 bg-white border border-slate-200 rounded-md text-xs text-slate-700 leading-relaxed font-serif">
                          {displayEval?.scoringBasis}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    setInspectModalOpen(false);
                    navigate(`/admin/comparisons?sessionId=${selectedSubmission.sessionId}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-medium"
                >
                  <span>Open in Model Comparison</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmation Dialog: Reuse Mockup for V4 Testing */}
      {reuseModalOpen && sessionToReuse && !reusing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reuse Answers for Agent Version V2 Official Testing
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify and clone mockup student answers into an independent demonstration session
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReuseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Traceability Metadata Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200">
                Evaluation Traceability & Provenance
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Original Student:</span>
                  <span className="font-bold text-slate-900">{sessionToReuse.studentName}</span>
                  <span className="text-slate-400 font-mono text-[10px] block">{sessionToReuse.studentEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Original Session Reference:</span>
                  <span className="font-mono font-bold text-indigo-900 break-all text-[11px]">
                    {sessionToReuse.sessionId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Source Agent Version:</span>
                  <span className="font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                    V1 (Historical Baseline)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Target Agent Version:</span>
                  <span className="font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded text-[11px]">
                    V2 (Active & Locked Official)
                  </span>
                </div>
              </div>
            </div>

            {/* Strict Research Safeguards */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Safeguards & Protocol Details:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600">
                <li>
                  A completely separate demonstration session will be created with <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">isDemo: true</code>.
                </li>
                <li>
                  All 10 submitted answers and question snapshots are copied verbatim without alterations.
                </li>
                <li>
                  Local Ollama models (Llama 3.2 3B, Phi-4-mini 3.8B, Gemma 2 2B) will independently evaluate each answer under V2 instructions (producing 30 new evaluations).
                </li>
                <li>
                  <strong className="text-slate-800">Zero-Overwrite Guarantee:</strong> The original session and all historical V1 evaluations remain strictly immutable.
                </li>
              </ul>
            </div>

            {/* Mandatory Explicit Mockup Classification Confirmation */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedMockup}
                  onChange={(e) => setConfirmedMockup(e.target.checked)}
                  className="mt-0.5 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-amber-950 leading-snug">
                  I confirm that this session contains verified mockup student answers eligible for V2 evaluation testing, and authorize creating a demonstration assessment session.
                </span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReuseModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeReuse}
                disabled={!confirmedMockup}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Confirm & Start V2 Evaluation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Progress Evaluation Modal */}
      {reusing && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Independent V2 Evaluation in Progress
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Evaluating student answers across Meta Llama 3.2 3B, Microsoft Phi-4-mini, and Google Gemma 2 2B
              </p>
            </div>

            {/* Live Progress Bar & Counter */}
            <div className="space-y-2 text-left bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>Evaluation Progress:</span>
                <span className="text-indigo-600 font-bold">
                  {activeJob ? activeJob.completedEvaluations : 0} / {activeJob ? activeJob.totalEvaluations : 30} evaluations ({Math.round(((activeJob?.completedEvaluations || 0) / 30) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(((activeJob?.completedEvaluations || 0) / 30) * 100))}%` }}
                ></div>
              </div>

              {/* Current Model and Question Details */}
              <div className="pt-2 flex flex-col gap-1 text-[11px] text-slate-600 border-t border-slate-200/60 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Model:</span>
                  <span className="font-semibold text-slate-800">{activeJob?.currentModel || 'Initializing model pipeline...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Question:</span>
                  <span className="font-semibold text-slate-800">{activeJob?.currentQuestionCode || 'Preparing evaluation...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elapsed Time:</span>
                  <span className="font-mono text-indigo-700 font-bold">{reuseElapsedSeconds}s</span>
                </div>
              </div>
            </div>

            {activeJob?.errorMessage && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 text-left">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Evaluation Interrupted
                </div>
                <div className="mt-1 text-[11px]">{activeJob.errorMessage}</div>
                <button
                  type="button"
                  onClick={executeReuse}
                  className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs"
                >
                  Resume Missing Evaluations Now
                </button>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-400">
                Runs reliably in background
              </span>
              <button
                type="button"
                onClick={() => {
                  setReusing(false);
                  loadData();
                }}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs transition"
              >
                Run in Background & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion & Traceability Result Modal */}
      {resultModalOpen && reuseResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {reuseResult.alreadyReused
                      ? 'Mockup Session Previously Reused for V2'
                      : 'V2 Testing Evaluations Generated Successfully!'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Traceability recorded and demonstration evaluations stored.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResultModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Traceability Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200">
                Session Provenance & Traceability Record
              </div>
              <div className="space-y-2 pt-1 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-sans">Original Session ID:</span>
                  <span className="font-bold text-slate-800 break-all">{reuseResult.originalSessionId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-sans">New Demo Session ID:</span>
                  <span className="font-bold text-indigo-700 break-all">{reuseResult.newSessionId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-sans">Version Progression:</span>
                  <span className="font-bold text-slate-900">
                    Source: <span className="text-slate-600">{reuseResult.sourceAgentVersion}</span> → Target:{' '}
                    <span className="text-indigo-600">{reuseResult.targetAgentVersion}</span>
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-sans">Evaluations Count:</span>
                  <span className="font-bold text-emerald-700">{reuseResult.evaluationsCount} evaluations (10 questions × 3 models)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-sans">Dataset Tag:</span>
                  <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    isDemo: true (Demonstration Test Record)
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Navigation Links to Comparison Dashboards */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Explore V2 Retest Results across Dashboards:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResultModalOpen(false);
                    navigate(
                      `/admin/comparisons?sessionId=${encodeURIComponent(
                        reuseResult.newSessionId
                      )}&testSet=${reuseResult.testSet}&isDemo=true`
                    );
                  }}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-left transition space-y-1 shadow-xs"
                >
                  <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                    <span>Student-Level</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Side-by-side matrix for this demo session
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResultModalOpen(false);
                    navigate(
                      `/admin/comparisons/question?testSet=${reuseResult.testSet}&version=V2&isDemo=true`
                    );
                  }}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-left transition space-y-1 shadow-xs"
                >
                  <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                    <span>Question-Level</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Q01–Q10 breakdown under V2 demo data
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResultModalOpen(false);
                    navigate(
                      `/admin/comparisons/summative?testSet=${reuseResult.testSet}&version=V2&isDemo=true`
                    );
                  }}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-left transition space-y-1 shadow-xs"
                >
                  <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                    <span>Summative</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Overall /50 distribution for V2 demo data
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setResultModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Student Answers to PDF Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Export Student Answers to PDF
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Generate clean, uncorrected student submission records for thesis review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer Callout Box */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <span>MOCKUP / SIMULATED DATA — NOT ACTUAL STUDENT RESEARCH RESPONSES</span>
              </div>
              <p className="text-[11px] text-red-700 leading-relaxed">
                Exports strictly display students' exact submitted answers alongside frozen question snapshots. AI grades, criterion rubric scores, AI feedback, model identities, and reference answers are excluded.
              </p>
            </div>

            {/* Test Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                1. Select Question Test Set
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setExportTestSet('TEST_1')}
                  className={`p-3 rounded-lg border text-left font-medium transition ${
                    exportTestSet === 'TEST_1'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">TEST 1</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Formation & General Provisions</div>
                  <div className="text-[10px] text-indigo-600 font-semibold mt-1">Questions Q01–Q10</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportTestSet('TEST_2')}
                  className={`p-3 rounded-lg border text-left font-medium transition ${
                    exportTestSet === 'TEST_2'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">TEST 2</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Obligations & Relations</div>
                  <div className="text-[10px] text-indigo-600 font-semibold mt-1">Questions Q11–Q20</div>
                </button>
              </div>
            </div>

            {/* Export Scope Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                2. Export Scope
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer transition hover:bg-slate-50">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'ALL'}
                    onChange={() => setExportScope('ALL')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800">All Students (Bulk PDF)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Export all 5 original student submissions in one grouped document, ordered by participant.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer transition hover:bg-slate-50">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'SINGLE'}
                    onChange={() => {
                      setExportScope('SINGLE');
                      if (!exportStudentId && originalStudents.length > 0) {
                        setExportStudentId(originalStudents[0].id);
                      }
                    }}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">Individual Student</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Export an individual student's answers for the selected test.
                    </p>
                    {exportScope === 'SINGLE' && (
                      <div className="mt-2.5">
                        <select
                          value={exportStudentId}
                          onChange={(e) => setExportStudentId(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                          {originalStudents.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                disabled={exportingPdf}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDownloadPdf(
                    exportTestSet,
                    exportScope === 'SINGLE' ? exportStudentId : undefined
                  )
                }
                disabled={exportingPdf || (exportScope === 'SINGLE' && !exportStudentId)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md shadow-xs transition"
              >
                {exportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
