import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { StudentEvaluationFeedback, AssessmentSession } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  CheckCircle,
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

  const currentQuestion = session.questions[selectedQuestionIndex] || session.questions[0];
  const questionFeedbacks = feedbacks.filter((f) => f.questionId === currentQuestion.id);

  // Representative substantive diagnostic feedback for the current question
  const currentFeedback = questionFeedbacks[0] || feedbacks[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Evaluation Recorded
              </span>
              <span>
                Submitted {session.submittedAt ? new Date(session.submittedAt).toLocaleDateString() : ''}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Commercial Law Assessment Result
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Substantive essay evaluation report and diagnostic feedback.
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

        {/* Assessment Status Banner */}
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-800 block">
              Assessment Evaluation Complete
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              Your essay responses have been recorded and evaluated across all {session.questions.length} problem scenarios.
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {session.questions.length} / {session.questions.length} Scenarios Completed
          </div>
        </div>

        {/* Question Selector Tabs */}
        {session.questions.length > 1 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            {session.questions.map((q, idx) => {
              const isSelected = idx === selectedQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Question {idx + 1}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scenario & Submitted Answer */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Problem Scenario</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-md">
            <h3 className="text-xs font-bold text-slate-900 mb-1">
              Scenario #{selectedQuestionIndex + 1}: {currentQuestion.title}
            </h3>
            <p className="text-xs text-slate-800 leading-relaxed font-serif">
              {currentQuestion.scenario}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
            <span>Your Submitted Answer</span>
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

      {/* Substantive AI Evaluation Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span>AI Evaluation & Diagnostic Feedback</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Substantive feedback on statutory rule identification, legal reasoning, and factual application.
            </p>
          </div>
        </div>

        {/* Evaluation Basis Body */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-md">
          <p className="text-xs text-slate-800 font-serif leading-relaxed whitespace-pre-line">
            {currentFeedback.scoringBasis || 'Evaluation reasoning recorded.'}
          </p>
        </div>

        {/* Identified Legal Principles & Points for Further Elaboration */}
        {((currentFeedback.strengths && currentFeedback.strengths.length > 0) ||
          (currentFeedback.missingElements && currentFeedback.missingElements.length > 0) ||
          (currentFeedback.areasForImprovement &&
            currentFeedback.areasForImprovement.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                <span className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Identified Legal Principles & Strengths
                </span>
                <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                  {currentFeedback.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {((currentFeedback.missingElements && currentFeedback.missingElements.length > 0) ||
              (currentFeedback.areasForImprovement &&
                currentFeedback.areasForImprovement.length > 0)) && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                <span className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Points for Further Elaboration
                </span>
                <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
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
