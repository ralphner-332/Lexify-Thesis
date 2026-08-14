import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Rubric } from '../../types';
import { Scale, EyeOff, Award, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ExpertDashboard: React.FC = () => {
  const { user } = useAuth();
  const [defaultRubric, setDefaultRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadRubric() {
      try {
        const res = await api.rubrics.getDefault();
        setDefaultRubric(res.data);
      } catch (err) {
        console.error('Failed to load rubric:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRubric();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expert Evaluator Portal</h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome, <strong>{user?.name}</strong>. You are registered as an independent legal expert for this Criminal Law I AI empirical study.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200 w-fit">
          <Scale className="w-4 h-4" />
          <span>Independent Legal Evaluator</span>
        </div>
      </div>

      {/* Double-Blind Workflow Protocol Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/50 flex items-center justify-center border border-indigo-400/30">
              <EyeOff className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Double-Blind Research Protocol</h2>
              <p className="text-xs text-indigo-200">Strict Independence Requirement</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            During Iterative Cycles (V1 → V2 → V3), experts evaluate student written answers independently. To eliminate confirmation bias, you will evaluate answers using model reference answers and statutory elements <strong>without seeing AI-generated scores or reasoning</strong>.
          </p>
          <div className="pt-2 border-t border-indigo-800/60 flex items-center gap-2 text-xs text-indigo-300">
            <Clock className="w-4 h-4" />
            <span>Independent Grading Workspace activates in <strong>Phase 3</strong></span>
          </div>
        </div>

        {/* Active Rubric Criteria Preview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">Active Scoring Rubric</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              RPC Framework
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Loading rubric criteria...</p>
          ) : defaultRubric ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">{defaultRubric.name}</p>
              <div className="space-y-1.5">
                {defaultRubric.criteria.map((c) => (
                  <div
                    key={c.id || c.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-medium text-slate-700">{c.name}</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {c.weightPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active rubric found.</p>
          )}
        </div>
      </div>

      {/* Reference Materials Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-700">
          <BookOpen className="w-6 h-6 text-brand-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-sm">Statutory Coverage & Legal Doctrines</h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Evaluations ground strictly on the <em>Revised Penal Code of the Philippines (Act No. 3815 as amended)</em>, covering Book I provisions including Felonies, Criminal Liability (Art. 4), Justifying Circumstances (Art. 11), Exempting Circumstances (Art. 12), Mitigating/Aggravating Circumstances, and Philippine Supreme Court jurisprudence.
          </p>
        </div>
      </div>
    </div>
  );
};
