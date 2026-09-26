import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { AssessmentSession, StudentQuestionItem } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  FileCheck,
  CheckCircle,
} from 'lucide-react';

export const AssessmentWizard: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [error, setError] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load or initialize active assessment session
  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await api.sessions.getActive();
      if (res.data.status === 'SUBMITTED') {
        navigate('/student/assessment/feedback');
        return;
      }

      setSession(res.data);

      const initialAnswers: Record<string, string> = {};
      res.data.questions.forEach((q) => {
        initialAnswers[q.id] = q.draftAnswer || '';
      });
      setAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Server-side draft saver
  const saveDraftToServer = useCallback(
    async (questionId: string, text: string) => {
      if (!session) return;
      try {
        setSavingStatus('saving');
        await api.sessions.saveDraft(session.id, questionId, text);
        setSavingStatus('saved');
      } catch (err: any) {
        console.error('Draft auto-save error:', err);
        setSavingStatus('error');
      }
    },
    [session]
  );

  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraftToServer(questionId, text);
    }, 800);
  };

  const goToQuestion = (index: number) => {
    if (!session) return;
    const currentQ = session.questions[currentIndex];
    if (currentQ) {
      saveDraftToServer(currentQ.id, answers[currentQ.id] || '');
    }
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (!session) return;
    const currentQ = session.questions[currentIndex];
    if (currentQ) {
      saveDraftToServer(currentQ.id, answers[currentQ.id] || '');
    }

    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/student/assessment/review');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <LoadingSkeleton rows={3} type="card" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorAlert
          title="Unable to load assessment session"
          message={error || 'No active session found.'}
          onRetry={fetchSession}
        />
      </div>
    );
  }

  const currentQuestion: StudentQuestionItem = session.questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id] || '';
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const answeredTotal = session.questions.filter((q) => (answers[q.id] || '').trim().length > 0).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Top Header & Tab Navigation */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          {session.questions.map((q, idx) => {
            const hasAnswer = (answers[q.id] || '').trim().length > 0;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isCurrent
                    ? 'bg-slate-900 text-white'
                    : hasAnswer
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>Question {idx + 1}</span>
                {hasAnswer && <CheckCircle className={`w-3 h-3 ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`} />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
          <div className="text-slate-500 flex items-center">
            {savingStatus === 'saved' && (
              <span className="flex items-center text-slate-600 gap-1">
                <Save className="w-3.5 h-3.5 text-slate-400" />
                <span>Draft saved</span>
              </span>
            )}
            {savingStatus === 'saving' && (
              <span className="text-slate-500 animate-pulse">Saving draft...</span>
            )}
            {savingStatus === 'error' && (
              <span className="text-amber-700">Auto-save retrying</span>
            )}
          </div>

          <button
            onClick={() => {
              saveDraftToServer(currentQuestion.id, currentAnswer);
              navigate('/student/assessment/review');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition"
          >
            <FileCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Review all ({answeredTotal}/{session.questions.length})</span>
          </button>
        </div>
      </div>

      {/* Main Examination Workspace */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Scenario Header */}
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="text-[11px] font-mono text-slate-500">
            Scenario #{currentIndex + 1} of {session.questions.length} · {currentQuestion.code}
          </div>
          <h2 className="text-base font-semibold text-slate-900 mt-0.5">{currentQuestion.title}</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Factual Scenario */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-md">
            <div className="text-xs font-semibold text-slate-600 mb-2">Factual scenario:</div>
            <p className="text-sm text-slate-800 leading-relaxed font-serif whitespace-pre-wrap">
              {currentQuestion.scenario}
            </p>
          </div>

          {/* Student Essay Writing Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="student-answer-input" className="font-semibold text-slate-800">
                Your written analysis
              </label>
              <div className="text-slate-500">
                Word count: <span className="font-medium text-slate-800">{wordCount}</span>
              </div>
            </div>

            <textarea
              id="student-answer-input"
              rows={15}
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="State your answer categorically, articulate the governing legal provisions and doctrinal principles, apply the facts to each element, and conclude logically..."
              className="w-full p-4 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden leading-relaxed font-serif transition"
            />
            <p className="text-[11px] text-slate-500">
              Format your written analysis using the standard legal sequence (Answer, Rule, Application, Conclusion).
            </p>
          </div>
        </div>

        {/* Wizard Bottom Bar */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              currentIndex === 0
                ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-100'
                : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500">
            Question {currentIndex + 1} of {session.questions.length}
          </span>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition"
          >
            <span>
              {currentIndex === session.questions.length - 1 ? 'Review and submit' : 'Next question'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
