import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StudentEvaluationFeedback, AssessmentSession } from '../../types';
import { CriterionProgressBar } from '../../components/common/CriterionProgressBar';
import {
  Award,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Sparkles,
  MessageSquareHeart,
} from 'lucide-react';

export const FeedbackViewer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      setFeedbacks(feedbackRes.data);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Retrieving Semantic AI Legal Feedback...</p>
        </div>
      </div>
    );
  }

  if (error || !session || feedbacks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-8 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-800 mb-2">No Diagnostic Feedback Found</h2>
        <p className="text-red-700 text-sm mb-4">{error || 'Please submit an assessment to view feedback.'}</p>
        <button
          onClick={() => navigate('/student')}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Return to Student Dashboard
        </button>
      </div>
    );
  }

  const currentFeedback = feedbacks[selectedQuestionIndex] || feedbacks[0];
  const currentQuestion = session.questions[selectedQuestionIndex] || session.questions[0];

  // Derive score percentage and performance tier
  const scorePercent =
    currentFeedback.maxScore > 0
      ? Math.round((currentFeedback.numericalScore / currentFeedback.maxScore) * 100)
      : 0;

  let performanceTier = 'Superior Legal Analysis';
  let tierBadgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (scorePercent < 60) {
    performanceTier = 'Developing Legal Reasoning';
    tierBadgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (scorePercent < 75) {
    performanceTier = 'Satisfactory Analysis';
    tierBadgeBg = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (scorePercent < 85) {
    performanceTier = 'Proficient Legal Analysis';
    tierBadgeBg = 'bg-indigo-100 text-indigo-800 border-indigo-300';
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Assessment Evaluated
              </span>
              <span className="text-xs text-slate-500">
                Submitted {session.submittedAt ? new Date(session.submittedAt).toLocaleDateString() : ''}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Student Diagnostic Feedback Portal</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Semantic legal evaluation of your written essay responses against Criminal Law I standards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/student/survey')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <MessageSquareHeart className="w-4 h-4 text-indigo-600" />
              <span>Usability Survey</span>
            </button>

            {user?.isDemo && (
              <button
                onClick={async () => {
                  try {
                    await api.sessions.create();
                    navigate('/student/assessment');
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition shadow-sm"
                title="Permitted for demo simulation accounts only"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>New Demo Attempt</span>
              </button>
            )}

            <button
              onClick={() => navigate('/student')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Question Selector Tabs */}
        <div className="mt-4 flex items-center space-x-2 overflow-x-auto pb-1">
          {session.questions.map((q, idx) => {
            const isSelected = idx === selectedQuestionIndex;
            const fb = feedbacks[idx];
            const qScore = fb ? `${fb.numericalScore}/${fb.maxScore}` : '';

            return (
              <button
                key={q.id}
                onClick={() => setSelectedQuestionIndex(idx)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Question {idx + 1} ({q.code})</span>
                {qScore && (
                  <span className={`px-1.5 py-0.2 rounded text-[11px] ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                    {qScore} pts
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Details Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-indigo-400 font-mono text-xs tracking-wider uppercase">
              Question {selectedQuestionIndex + 1} of {session.questions.length} • {currentQuestion.code}
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-1">{currentQuestion.title}</h2>
          </div>
        </div>

        <div className="mt-4 bg-slate-800/80 border border-slate-700 rounded-lg p-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Factual Scenario Evaluated
          </span>
          <p className="text-sm text-slate-200 font-serif leading-relaxed italic">
            "{currentQuestion.scenario}"
          </p>
        </div>
      </div>

      {/* SECTION 1: Overall Score & Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
            <Award className="w-6 h-6" />
          </div>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Score</span>
          <div className="text-4xl font-extrabold text-slate-900 mt-1">
            {currentFeedback.numericalScore}{' '}
            <span className="text-lg font-semibold text-slate-400">/ {currentFeedback.maxScore}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 font-medium">({scorePercent}% Achievement)</span>
          <div className={`mt-3 px-3 py-1 text-xs font-bold rounded-full border ${tierBadgeBg}`}>
            {performanceTier}
          </div>
        </div>

        {/* SECTION 2: Comprehensive Scoring Basis */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm mb-3">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Semantic Evaluation Scoring Basis</span>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-serif">
            {currentFeedback.scoringBasis}
          </p>
        </div>
      </div>

      {/* SECTION 3: Rubric Criterion Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2>Rubric Criteria Breakdown</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Evaluated per Criminal Law I Rubric
          </span>
        </div>

        <div className="space-y-1">
          {currentFeedback.criterionScores.map((criterion, idx) => (
            <CriterionProgressBar
              key={idx}
              name={criterion.criterionName}
              score={criterion.score}
              maxPoints={criterion.maxPoints}
              reasoning={criterion.reasoning}
            />
          ))}
        </div>
      </div>

      {/* SECTIONS 4, 5, 6: Qualitative Diagnostic Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SECTION 4: Strengths */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm pb-2 border-b border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h3>Identified Legal Strengths</h3>
          </div>
          {currentFeedback.strengths.length > 0 ? (
            <ul className="space-y-2 text-xs text-emerald-950">
              {currentFeedback.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No specific strengths highlighted.</p>
          )}
        </div>

        {/* SECTION 5: Missing Elements */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm pb-2 border-b border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3>Missing Legal Elements</h3>
          </div>
          {currentFeedback.missingElements.length > 0 ? (
            <ul className="space-y-2 text-xs text-amber-950">
              {currentFeedback.missingElements.map((mis, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>{mis}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No critical statutory elements were missed.</p>
          )}
        </div>

        {/* SECTION 6: Areas for Improvement */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm pb-2 border-b border-blue-200">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <h3>Actionable Improvement Areas</h3>
          </div>
          {currentFeedback.areasForImprovement.length > 0 ? (
            <ul className="space-y-2 text-xs text-blue-950">
              {currentFeedback.areasForImprovement.map((imp, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No specific improvement areas suggested.</p>
          )}
        </div>
      </div>
    </div>
  );
};
