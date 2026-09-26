import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { SurveyQuestionnaire } from '../../types';
import {
  CheckCircle,
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

      const initial: Record<string, any> = {};
      res.data.questions.forEach((q) => {
        if (q.questionType === 'LIKERT_5') {
          initial[q.id] = 4;
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
      <div className="py-16 text-center text-slate-400 text-xs">
        <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-2"></div>
        Loading usability survey...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-slate-900">Thank you for your feedback</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your responses have been recorded as research evidence for the empirical study.
          </p>
        </div>
        <button
          onClick={() => navigate('/student')}
          className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error || 'Survey questionnaire is currently unavailable.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="text-xs text-slate-500 font-medium mb-1">
          Student usability & feedback
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {questionnaire.title}
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {questionnaire.description}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-6 text-xs">
        <div className="space-y-6 divide-y divide-slate-100">
          {questionnaire.questions.map((q, idx) => (
            <div key={q.id} className={idx > 0 ? 'pt-6' : ''}>
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-900 flex items-start gap-2">
                  <span className="text-slate-500 font-mono">{idx + 1}.</span>
                  <span>{q.prompt}</span>
                </label>

                {q.questionType === 'LIKERT_5' ? (
                  <div className="space-y-2 pt-1 pl-4">
                    <div className="grid grid-cols-5 gap-2 max-w-sm">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleLikertChange(q.id, val)}
                          className={`py-2 text-xs font-medium rounded-md transition border ${
                            answers[q.id] === val
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 max-w-sm px-0.5">
                      <span>1 - Strongly disagree</span>
                      <span>3 - Neutral</span>
                      <span>5 - Strongly agree</span>
                    </div>
                  </div>
                ) : (
                  <div className="pl-4 pt-1">
                    <textarea
                      rows={3}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      placeholder="Type your response or reflections here..."
                      className="w-full p-2.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* General Qualitative Comments */}
        <div className="pt-6 border-t border-slate-200 space-y-2">
          <label className="text-xs font-semibold text-slate-900 block">
            Additional comments or observations (Optional)
          </label>
          <textarea
            rows={3}
            value={qualitativeNotes}
            onChange={(e) => setQualitativeNotes(e.target.value)}
            placeholder="Share any additional impressions about the assessment experience..."
            className="w-full p-2.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs">
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting responses...' : 'Submit survey'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
