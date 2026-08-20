import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { SurveyQuestionnaire } from '../../types';
import {
  MessageSquareHeart,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';

export const StudentUsabilitySurvey: React.FC = () => {
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<SurveyQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [qualitativeNotes, setQualitativeNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSurvey();
  }, []);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.surveys.getActive('STUDENT');
      setQuestionnaire(res.data);

      // Initialize defaults
      const initial: Record<string, any> = {};
      res.data.questions.forEach((q) => {
        if (q.questionType === 'LIKERT_5') {
          initial[q.id] = 4; // Default to 'Agree'
        } else {
          initial[q.id] = '';
        }
      });
      setAnswers(initial);
    } catch (err: any) {
      setError(err.message || 'Failed to load usability survey.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikertChange = (questionId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: rating }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionnaire) return;

    try {
      setSubmitting(true);
      setError(null);

      await api.surveys.submitResponse({
        questionnaireId: questionnaire.id,
        answers,
        qualitativeNotes,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        Loading Student Usability Survey...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Thank You For Your Feedback!</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your responses have been recorded as immutable academic research evidence to help evaluate and refine the AI Agent.
          </p>
        </div>
        <button
          onClick={() => navigate('/student')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
        >
          Return to Student Portal
        </button>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-4">
          <div className="flex items-center gap-3 font-semibold text-base">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            Unable to Load Survey
          </div>
          <p className="text-sm">{error || 'Survey questionnaire unavailable.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider w-fit border border-indigo-500/30 mb-2">
            <MessageSquareHeart className="w-3.5 h-3.5" />
            Student Feedback & Evaluation
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {questionnaire.title}
          </h1>
          <p className="text-indigo-200/80 text-sm leading-relaxed">
            {questionnaire.description}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8">
        <div className="space-y-6 divide-y divide-slate-100">
          {questionnaire.questions.map((q, idx) => (
            <div key={q.id} className={idx > 0 ? 'pt-6' : ''}>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{q.prompt}</span>
                </label>

                {q.questionType === 'LIKERT_5' ? (
                  <div className="space-y-2 pt-1 pl-8">
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleLikertChange(q.id, val)}
                          className={`py-3 text-xs font-bold rounded-xl transition-all border ${
                            answers[q.id] === val
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-base font-bold">{val}</div>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 px-1 font-medium">
                      <span>1 - Strongly Disagree</span>
                      <span>3 - Neutral</span>
                      <span>5 - Strongly Agree</span>
                    </div>
                  </div>
                ) : (
                  <div className="pl-8 pt-1">
                    <textarea
                      rows={3}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      placeholder="Type your response or reflections here..."
                      className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* General Qualitative Comments */}
        <div className="pt-6 border-t border-slate-200 space-y-2">
          <label className="text-sm font-bold text-slate-900 block">
            Additional Overall Comments or Observations (Optional)
          </label>
          <textarea
            rows={3}
            value={qualitativeNotes}
            onChange={(e) => setQualitativeNotes(e.target.value)}
            placeholder="Share any additional impressions about the assessment experience..."
            className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting Responses...' : 'Submit Survey Responses'}
        </button>
      </form>
    </div>
  );
};
