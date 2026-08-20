import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { SurveySummaryMetrics } from '../../types';
import {
  MessageSquareHeart,
  Scale,
  Users,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

export const SurveyManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'EXPERT'>('STUDENT');
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [summary, setSummary] = useState<SurveySummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, isDemo]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const qListRes = await api.surveys.getQuestionnaires(isDemo);
      const currentQnr = qListRes.data.find((q) => q.targetRole === activeTab && q.isActive);
      if (currentQnr) {
        const sumRes = await api.surveys.getSummary(currentQnr.id, isDemo);
        setSummary(sumRes.data);
      } else {
        setSummary(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load survey data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usability & Capability Surveys</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze feedback from law students (usability & feedback clarity) and legal experts (AI assessment capability).
          </p>
        </div>

        {/* Data Filter Toggle */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-500 pl-2">Data Partition:</span>
          <button
            onClick={() => setIsDemo(false)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              !isDemo ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Research Data (Live)
          </button>
          <button
            onClick={() => setIsDemo(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              isDemo ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Demo / Simulation Data
          </button>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 max-w-md">
        <button
          onClick={() => setActiveTab('STUDENT')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'STUDENT'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquareHeart className="w-4 h-4 text-indigo-600" />
          Student Usability (USAB-01)
        </button>
        <button
          onClick={() => setActiveTab('EXPERT')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'EXPERT'
              ? 'bg-white text-amber-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-600" />
          Expert Capability (USAB-02)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          Loading survey summary metrics...
        </div>
      ) : !summary ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
          No active questionnaire found for this role.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Questionnaire</p>
              <p className="text-lg font-bold text-slate-900 mt-1 truncate">{summary.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">Version {summary.version}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Responses</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalResponses}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isDemo ? 'Demo submissions' : 'Research participants'}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualitative Comments</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{summary.openFeedbackNotes.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Open-ended feedback notes</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Question Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Likert Scale Question Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Descriptive Mean Scores (1.00 – 5.00) & Categorical Response Frequencies
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {summary.questionAverages.map((q, idx) => (
                <div key={idx} className="p-5 hover:bg-slate-50/50 transition">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {q.questionCode}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">({q.questionType})</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{q.prompt}</p>
                    </div>

                    {q.meanScore !== undefined ? (
                      <div className="flex items-center gap-3 flex-shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Mean Score</span>
                          <span className="text-xl font-bold font-mono text-indigo-700">
                            {q.meanScore.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-8 w-1 bg-slate-200 rounded-full"></div>
                        <div className="text-xs text-slate-500 font-mono">
                          {[1, 2, 3, 4, 5].map((scale) => (
                            <span key={scale} className="inline-block px-1">
                              {scale}★: {q.responseCounts[String(scale)] || 0}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Open-text item</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative Notes Feed */}
          {summary.openFeedbackNotes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">Qualitative Participant Feedback</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {summary.openFeedbackNotes.map((note, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed italic">
                    "{note}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
