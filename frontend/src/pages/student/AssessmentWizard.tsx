import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { AssessmentSession, StudentQuestionItem } from '../../types';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Save,
  FileCheck,
  Clock,
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
        // If already submitted, route directly to diagnostic feedback
        navigate('/student/assessment/feedback');
        return;
      }

      setSession(res.data);

      // Populate draft answers map
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

  // Handle textarea changes with debounced auto-save
  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraftToServer(questionId, text);
    }, 800);
  };

  // Immediate save on question change
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
    if (currentIndex < session.questions.length - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      // Save last draft and navigate to review screen
      const currentQ = session.questions[currentIndex];
      if (currentQ) {
        saveDraftToServer(currentQ.id, answers[currentQ.id] || '');
      }
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Criminal Law I Assessment Session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-3xl mx-auto mt-8 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-800 mb-2">Unable to Load Assessment</h2>
        <p className="text-red-700 text-sm mb-4">{error || 'No active session found.'}</p>
        <button
          onClick={() => navigate('/student')}
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion: StudentQuestionItem = session.questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id] || '';
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const answeredTotal = session.questions.filter((q) => (answers[q.id] || '').trim().length > 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Session Progress Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                Philippine Criminal Law I
              </span>
              <span className="text-xs text-slate-500 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Single Exam Session
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Written Essay Assessment</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Auto-save Status Indicator */}
            <div className="text-xs flex items-center">
              {savingStatus === 'saved' && (
                <span className="text-emerald-700 flex items-center bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                  <Save className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Draft saved to server
                </span>
              )}
              {savingStatus === 'saving' && (
                <span className="text-indigo-700 flex items-center bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 animate-pulse font-medium">
                  Saving draft...
                </span>
              )}
              {savingStatus === 'error' && (
                <span className="text-amber-700 flex items-center bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                  Save error. Retrying...
                </span>
              )}
            </div>

            <button
              onClick={() => {
                saveDraftToServer(currentQuestion.id, currentAnswer);
                navigate('/student/assessment/review');
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              <span>Review All Answers ({answeredTotal}/{session.questions.length})</span>
            </button>
          </div>
        </div>

        {/* Step Navigation Pills */}
        <div className="mt-4 flex items-center space-x-2 overflow-x-auto pb-1">
          {session.questions.map((q, idx) => {
            const hasAnswer = (answers[q.id] || '').trim().length > 0;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                className={`flex-shrink-0 flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                    : hasAnswer
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>Q{idx + 1}</span>
                {hasAnswer ? (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-indigo-200' : 'text-emerald-600'}`} />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-indigo-200' : 'bg-slate-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question & Essay Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Question Banner */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <span className="text-indigo-400 font-mono text-xs tracking-wider uppercase">
              Question {currentIndex + 1} of {session.questions.length} • Code: {currentQuestion.code}
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5">{currentQuestion.title}</h2>
          </div>
          <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-full">
            Required
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Factual Scenario Box */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-5">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-2">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>Factual Scenario</span>
            </div>
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-serif">
              {currentQuestion.scenario}
            </p>
          </div>

          {/* Student Essay Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="student-answer-input" className="block text-sm font-bold text-slate-800">
                Your Written Legal Analysis (IRAC Format Recommended)
              </label>
              <div className="text-xs text-slate-500 font-medium">
                Word Count: <span className="font-bold text-slate-700">{wordCount}</span> words
              </div>
            </div>

            <textarea
              id="student-answer-input"
              rows={12}
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="State the legal issue, cite the relevant Revised Penal Code article/elements, analyze the facts against statutory requisites, and provide a definitive conclusion..."
              className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition font-serif shadow-inner"
            />
            <p className="text-xs text-slate-500">
              💡 Tip: Address all statutory elements and justify your legal reasoning thoroughly. Your answer is evaluated semantically.
            </p>
          </div>
        </div>

        {/* Wizard Bottom Navigation Bar */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              currentIndex === 0
                ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Question</span>
          </button>

          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Question {currentIndex + 1} of {session.questions.length}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <span>
              {currentIndex === session.questions.length - 1 ? 'Proceed to Review' : 'Next Question'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
