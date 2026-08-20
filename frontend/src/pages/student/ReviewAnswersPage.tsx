import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { SessionReviewChecklist } from '../../types';
import {
  FileCheck2,
  CheckCircle2,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Generating Review Checklist...</p>
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="max-w-3xl mx-auto mt-8 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-800 mb-2">Error Loading Review Checklist</h2>
        <p className="text-red-700 text-sm mb-4">{error || 'Review data is unavailable.'}</p>
        <button
          onClick={() => navigate('/student/assessment')}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Return to Assessment
        </button>
      </div>
    );
  }

  const { session, totalQuestions, answeredCount, unansweredCount, allAnswered } = reviewData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                Pre-Submission Review
              </span>
              <span className="text-xs text-slate-500">
                Session ID: {session.id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Review Your Essay Answers</h1>
          </div>

          <button
            onClick={() => navigate('/student/assessment')}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Questions</span>
          </button>
        </div>

        {/* Completion Summary Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 font-medium">Total Predetermined Questions</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalQuestions}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <span className="text-xs text-emerald-700 font-medium">Answered Questions</span>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{answeredCount}</div>
          </div>
          <div className={`border rounded-lg p-4 ${unansweredCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-xs font-medium ${unansweredCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              Unanswered Questions
            </span>
            <div className={`text-2xl font-bold mt-1 ${unansweredCount > 0 ? 'text-amber-800' : 'text-slate-700'}`}>
              {unansweredCount}
            </div>
          </div>
        </div>

        {/* Unanswered Mandatory Warning */}
        {!allAnswered && (
          <div className="mt-4 bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">All Predetermined Questions Are Required</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                You must provide an essay answer for all {totalQuestions} questions before submitting. Please click "Revise Answer" on unanswered items.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Questions Review Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Question Completion Checklist</h2>
          </div>
          <span className="text-xs text-slate-400">
            {allAnswered ? 'All items complete' : `${unansweredCount} item(s) remaining`}
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {session.questions.map((q, idx) => {
            const wordCount = q.draftAnswer.trim() ? q.draftAnswer.trim().split(/\s+/).length : 0;
            return (
              <div key={q.id} className="p-6 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-mono font-bold rounded">
                      Question {idx + 1}
                    </span>
                    <span className="text-xs font-mono text-indigo-600 font-semibold">{q.code}</span>
                    {q.isAnswered ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Answered ({wordCount} words)
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Unanswered
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 font-serif italic">
                    "{q.scenario}"
                  </p>
                </div>

                <button
                  onClick={() => navigate('/student/assessment')}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{q.isAnswered ? 'Revise Answer' : 'Answer Question'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Final submission permanently locks answers as immutable research evidence.</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!allAnswered || submitting}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold shadow-md transition ${
              allAnswered && !submitting
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting & Evaluating...' : 'Confirm & Finalize Submission'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              Finalize Assessment Submission?
            </h3>

            <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
              You are about to submit your written essay responses for all <span className="font-bold text-slate-800">{totalQuestions} predetermined Criminal Law I questions</span>.
              <br /><br />
              <strong className="text-indigo-900 bg-indigo-50 p-2 rounded block border border-indigo-200 text-xs">
                ⚠️ IMPORTANT RESEARCH NOTICE: Upon confirmation, your submission will be permanently committed as immutable research evidence. Answers cannot be revised or edited afterward.
              </strong>
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
              >
                Cancel & Review Again
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-indigo-200 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Evaluating Answers...</span>
                  </>
                ) : (
                  <span>Yes, Finalize Submission</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
