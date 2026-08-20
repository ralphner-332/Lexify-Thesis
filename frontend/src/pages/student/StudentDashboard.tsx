import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Question, AssessmentSession } from '../../types';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [qRes, sessRes] = await Promise.all([
          api.questions.getAll(),
          api.sessions.getActive().catch(() => ({ data: null })),
        ]);
        setQuestions(qRes.data);
        if (sessRes && sessRes.data) {
          setActiveSession(sessRes.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleStartNewDemoSession = async () => {
    try {
      setLoading(true);
      await api.sessions.create();
      navigate('/student/assessment');
    } catch (err: any) {
      setError(err.message || 'Failed to start new demo assessment');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitted = activeSession?.status === 'SUBMITTED';

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
              Student Assessment Portal
            </span>
            {user?.isDemo && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded">
                Demo Student Account
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome, {user?.name || 'Law Student'}
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            FSUU College of Law — Criminal Law I Written Essay Assessment
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {isSubmitted ? (
            <>
              <button
                onClick={() => navigate('/student/assessment/feedback')}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>View Diagnostic Feedback</span>
              </button>

              {user?.isDemo && (
                <button
                  onClick={handleStartNewDemoSession}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-semibold text-xs transition shadow-sm"
                  title="Permitted for demo simulation accounts only"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Start New Demo Attempt</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate('/student/assessment')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition"
            >
              <Sparkles className="w-5 h-5" />
              <span>{activeSession ? 'Resume Assessment Session' : 'Start Assessment Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Assessment Overview */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Assessment Information & Instructions</span>
        </div>
        <h2 className="text-lg font-bold text-slate-100 mb-2">
          Philippine Criminal Law I Analytical Essay Exam
        </h2>
        <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
          This single-session exam evaluates your written legal reasoning, statutory element identification, and application of the Revised Penal Code (Book I) using the IRAC (Issue, Rule, Analysis, Conclusion) method. Your responses are evaluated semantically by the AI Agent.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block mb-0.5">Exam Format</span>
            <strong className="text-slate-100">Multi-Step Question Wizard</strong>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block mb-0.5">Evaluation Method</span>
            <strong className="text-slate-100">Semantic Legal Reasoning</strong>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block mb-0.5">Session Status</span>
            <strong className={isSubmitted ? 'text-emerald-400' : 'text-amber-400'}>
              {isSubmitted ? 'Submitted & Evaluated' : activeSession ? 'In Progress' : 'Not Started'}
            </strong>
          </div>
        </div>
      </div>

      {/* Assigned Questions Scenarios List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Assigned Predetermined Scenarios ({questions.length})
          </h2>
          <span className="text-xs text-slate-500">
            All questions are mandatory
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            Loading assigned questions...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        ) : questions.length === 0 ? (
          <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-500">
            No active questions currently assigned.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-200 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded">
                    Question {idx + 1} • {q.code}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                    Required
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{q.title}</h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-serif italic">
                  "{q.scenario}"
                </p>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>Criminal Law I</span>
                  <button
                    onClick={() => navigate('/student/assessment')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                  >
                    <span>{isSubmitted ? 'View Feedback' : 'Answer in Wizard'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
