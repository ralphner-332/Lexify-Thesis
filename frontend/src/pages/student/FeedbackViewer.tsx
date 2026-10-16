import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { StudentEvaluationFeedback, AssessmentSession } from '../../types';
import { percentageToCustomFivePoint } from '../../utils/scoring';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  CheckCircle,
  Award,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const FeedbackViewer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [feedbacks, setFeedbacks] = useState<StudentEvaluationFeedback[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);
      let sess: AssessmentSession;
      if (querySessionId) {
        const sessionRes = await api.sessions.getById(querySessionId);
        sess = sessionRes.data;
      } else {
        const activeSessionRes = await api.sessions.getActive();
        sess = activeSessionRes.data;
      }
      setSession(sess);

      if (sess.status !== 'SUBMITTED') {
        navigate('/student/assessment');
        return;
      }

      const feedbackRes = await api.evaluations.getSessionFeedback(sess.id);
      setFeedbacks(feedbackRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackData();
  }, [querySessionId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <LoadingSkeleton rows={3} type="card" />
      </div>
    );
  }

  if (error || !session || feedbacks.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          icon={AlertTriangle}
          title="No evaluation available"
          description={error || 'Please submit an assessment to generate evaluation results.'}
          actionText="Return to dashboard"
          onAction={() => navigate('/student')}
        />
      </div>
    );
  }

  // Sort questions deterministically Q01 -> Q10
  const sortedQuestions = [...session.questions].sort((a, b) => {
    const codeA = a.code || '';
    const codeB = b.code || '';
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });

  // Calculate Overall Assessment Metrics (SUM of up to 10 question grades, whole numbers 0-5 each -> total 0 - 50)
  const totalQuestions = sortedQuestions.length;
  const overallGrade = feedbacks.reduce((sum, f) => {
    return (
      sum +
      (f.roundedScore !== undefined
        ? f.roundedScore
        : percentageToCustomFivePoint(f.weightedPercentage ?? f.numericalScore ?? 0))
    );
  }, 0);
  const maxPossibleScore = totalQuestions * 5;

  const currentQuestion = sortedQuestions[selectedQuestionIndex] || sortedQuestions[0];
  const currentFeedback =
    feedbacks.find((f) => f.questionId === currentQuestion?.id) || feedbacks[0];

  const currentScorePercentage = currentFeedback?.weightedPercentage ?? currentFeedback?.numericalScore ?? 0;
  const currentFinalGrade =
    currentFeedback?.roundedScore !== undefined
      ? currentFeedback.roundedScore
      : percentageToCustomFivePoint(currentScorePercentage);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Top Header & Overview */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Assessment Evaluated
              </span>
              <span>
                Submitted {session.submittedAt ? new Date(session.submittedAt).toLocaleDateString() : ''}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Legal Assessment Results & Feedback
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive evaluation and diagnostic feedback by the Lexify Assessment Engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/student')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Overall Score Banner */}
        <div className="mt-5 p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Overall Assessment Score
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-white font-mono">
                {overallGrade}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                / {maxPossibleScore} Maximum
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Evaluated across all {totalQuestions} problem scenarios under the 5-criterion legal rubric.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] text-slate-400">Scenarios Completed</span>
            <span className="text-sm font-semibold font-mono text-emerald-400">
              {totalQuestions} / {session.questions.length}
            </span>
          </div>
        </div>

        {/* Question Selector Tabs with Question Scores */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Select Question to Inspect Diagnostic Feedback:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {sortedQuestions.map((q, idx) => {
              const qFb = feedbacks.find((f) => f.questionId === q.id);
              const qGrade = qFb
                ? (qFb.roundedScore !== undefined
                    ? qFb.roundedScore
                    : percentageToCustomFivePoint(qFb.weightedPercentage ?? qFb.numericalScore ?? 0))
                : '-';
              const isSelected = idx === selectedQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition whitespace-nowrap border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-semibold">{q.code || `Q${idx + 1}`}</span>
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    {qGrade}/5
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Question Header & Score Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-mono text-slate-500">
              Question #{selectedQuestionIndex + 1} of {session.questions.length} · {currentQuestion.code}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              {currentQuestion.title}
            </h2>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-right self-start sm:self-auto">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">
              Question Score
            </span>
            <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-slate-900">
                {currentFinalGrade}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 5</span>
              <span className="text-xs font-medium text-emerald-700 ml-1">
                ({currentScorePercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Problem Scenario */}
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Problem Scenario</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-md">
            <p className="text-xs text-slate-800 leading-relaxed font-serif">
              {currentQuestion.scenario}
            </p>
          </div>
        </div>

        {/* Student Submitted Answer */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
            <span>Your Submitted Written Essay</span>
            <span className="text-slate-400 font-normal">
              {currentQuestion.draftAnswer?.trim().split(/\s+/).length || 0} words
            </span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-md">
            <p className="text-xs text-slate-800 leading-relaxed font-serif whitespace-pre-wrap">
              {currentQuestion.draftAnswer || 'No response recorded.'}
            </p>
          </div>
        </div>
      </div>

      {/* Rubric Criteria Breakdown */}
      {currentFeedback && currentFeedback.criterionScores && currentFeedback.criterionScores.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-600" />
                <span>Criterion Scoring Breakdown</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Independent evaluation across the 5 authoritative criteria (15/15/30/30/10).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {currentFeedback.criterionScores.map((c, idx) => {
              const max = c.maxPoints || 20;
              const ratio = max > 0 ? (c.score / max) * 100 : 0;

              return (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block uppercase">
                      {c.criterionName}
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-bold font-mono text-slate-900">
                        {c.score}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">/ {max}</span>
                    </div>
                  </div>

                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ratio >= 80
                          ? 'bg-emerald-500'
                          : ratio >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lexify Substantive Feedback Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-600" />
              <span>Diagnostic Legal Analysis & Rationale</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluation of legal position, statutory elements, application reasoning, and conclusion.
            </p>
          </div>
        </div>

        {/* Evaluation Basis Body */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-md">
          <p className="text-xs text-slate-800 font-serif leading-relaxed whitespace-pre-line">
            {currentFeedback?.scoringBasis || 'Evaluation rationale recorded.'}
          </p>
        </div>

        {/* Strengths and Points for Improvement */}
        {((currentFeedback?.strengths && currentFeedback.strengths.length > 0) ||
          (currentFeedback?.missingElements && currentFeedback.missingElements.length > 0) ||
          (currentFeedback?.areasForImprovement && currentFeedback.areasForImprovement.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-md">
                <span className="text-xs font-bold text-emerald-900 block mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Identified Legal Strengths
                </span>
                <ul className="space-y-1.5 text-xs text-emerald-950 list-disc list-inside font-serif">
                  {currentFeedback.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {((currentFeedback?.missingElements && currentFeedback.missingElements.length > 0) ||
              (currentFeedback?.areasForImprovement && currentFeedback.areasForImprovement.length > 0)) && (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-md">
                <span className="text-xs font-bold text-amber-900 block mb-2 flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                  Points for Further Refinement
                </span>
                <ul className="space-y-1.5 text-xs text-amber-950 list-disc list-inside font-serif">
                  {(currentFeedback.missingElements?.length
                    ? currentFeedback.missingElements
                    : currentFeedback.areasForImprovement || []
                  ).map((elem, i) => (
                    <li key={i}>{elem}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
