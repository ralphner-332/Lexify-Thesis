import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { SessionReviewChecklist } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Send,
  Lock,
  Edit3,
} from 'lucide-react';

export const ReviewAnswersPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<SessionReviewChecklist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeSession = await api.sessions.getActive();
      if (activeSession.data.status === 'SUBMITTED') {
        navigate('/student/assessment/feedback');
        return;
      }

      const res = await api.sessions.getReview(activeSession.data.id);
      setReviewData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load session review checklist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, []);

  const handleFinalSubmit = async () => {
    if (!reviewData) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.sessions.submit(reviewData.session.id);
      setShowConfirmModal(false);
      navigate(`/student/assessment/feedback?sessionId=${res.sessionId || reviewData.session.id}`);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <LoadingSkeleton rows={3} type="card" />
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorAlert
          title="Error loading review checklist"
          message={error || 'Review data is unavailable.'}
          onRetry={fetchReview}
        />
      </div>
    );
  }

  const { session, totalQuestions, answeredCount, unansweredCount, allAnswered } = reviewData;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-500 font-medium mb-1">Pre-submission verification</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Review your essay answers
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify all assigned Commercial Law questions before final submission.
            </p>
          </div>

          <button
            onClick={() => navigate('/student/assessment')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition self-start sm:self-center"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to editor</span>
          </button>
        </div>

        {/* Compact summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
            <span className="text-slate-500 block">Total questions</span>
            <span className="text-base font-semibold text-slate-900 mt-0.5 block">{totalQuestions}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
            <span className="text-slate-500 block">Completed answers</span>
            <span className="text-base font-semibold text-slate-900 mt-0.5 block">
              {answeredCount} of {totalQuestions}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
            <span className="text-slate-500 block">Pending questions</span>
            <span className={`text-base font-semibold mt-0.5 block ${unansweredCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {unansweredCount === 0 ? 'None (all complete)' : `${unansweredCount} remaining`}
            </span>
          </div>
        </div>

        {!allAnswered && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-md text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Attention required:</strong> You have {unansweredCount} unanswered question(s). All assigned questions must be completed before finalizing submission.
            </span>
          </div>
        )}
      </div>

      {/* Answers Checklist */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-900">Answer completion summary</span>
          <span className="text-slate-500">{answeredCount} of {totalQuestions} completed</span>
        </div>

        <div className="divide-y divide-slate-100">
          {session.questions.map((q, idx) => {
            const wordCount = q.draftAnswer.trim() ? q.draftAnswer.trim().split(/\s+/).length : 0;
            return (
              <div key={q.id} className="p-6 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-500">Scenario #{idx + 1} · {q.code}</span>
                    {q.isAnswered ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Answered ({wordCount} words)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Unanswered
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900">{q.title}</h3>

                  {q.draftAnswer.trim() ? (
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                      <p className="text-xs text-slate-700 font-serif leading-relaxed line-clamp-3">
                        "{q.draftAnswer}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No answer written yet.</p>
                  )}
                </div>

                <button
                  onClick={() => navigate('/student/assessment')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition whitespace-nowrap self-start md:self-center"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{q.isAnswered ? 'Edit' : 'Write'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="p-5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Final submission will record and lock your responses.</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!allAnswered || submitting}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-xs font-medium transition ${
              allAnswered && !submitting
                ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Evaluating responses...' : 'Finalize and submit'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Confirm final submission?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                You are about to submit your written essay responses for all {totalQuestions} questions. Once submitted, your answers will be evaluated and locked.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition inline-flex items-center gap-1.5"
              >
                {submitting ? 'Evaluating answers...' : 'Confirm and submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
