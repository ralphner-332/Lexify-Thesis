import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { HelpCircle, Award, Layers, History, Shield, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    questionsCount: 0,
    rubricsCount: 0,
    activeVersion: 'V1',
    auditLogsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [qRes, rRes, vRes, aRes] = await Promise.all([
          api.questions.list(true),
          api.rubrics.list(),
          api.agentVersions.getActive(),
          api.audit.list({ limit: 1 }),
        ]);

        setStats({
          questionsCount: qRes.data.length,
          rubricsCount: rRes.data.length,
          activeVersion: vRes.data?.versionTag || 'V1',
          auditLogsCount: aRes.data.total || 0,
        });
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Researcher Control Panel
            </span>
            <span className="text-xs text-slate-400">• Study Phase 1 Active</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Research Management Console</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Logged in as <strong>{user?.name}</strong>. Configure research items, scoring rubrics, and Agent version snapshots.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm w-fit">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Active Agent: {stats.activeVersion} Baseline</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Predetermined Questions
          </span>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : stats.questionsCount}
          </div>
          <p className="text-[11px] text-slate-500">Configurable Criminal Law I items</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Scoring Rubrics
          </span>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : stats.rubricsCount}
          </div>
          <p className="text-[11px] text-slate-500">Criteria with 100% weight sum</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Agent Version
          </span>
          <div className="text-2xl font-black text-purple-600">
            {loading ? '...' : stats.activeVersion}
          </div>
          <p className="text-[11px] text-slate-500">Immutable snapshot</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Audit Trail Records
          </span>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : stats.auditLogsCount}
          </div>
          <p className="text-[11px] text-slate-500">Append-only log entries</p>
        </div>
      </div>

      {/* Module Navigation Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/admin/questions"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                Question & Reference Management
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Author and manage predetermined Criminal Law I questions, scenarios, model reference answers, statutory elements, provisions, and concept variations.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
            <span>Manage Question Inventory</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/rubrics"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Configurable Rubric Builder
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Design evaluation rubrics with customized legal criteria (e.g. Accuracy, Legal Elements, IRAC Reasoning, Application, Terminology) and real-time 100% weight validation.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Configure Scoring Criteria</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/agent-versions"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Agent Component Snapshot Console
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Configure AI Agent instructions, skills, evaluation patterns, and model settings (Google, OpenAI, Anthropic, Custom). Lock immutable version snapshots (V1, V2, V3) and inspect diffs.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
            <span>Inspect Agent Snapshots & Diffs</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                Append-Only Audit Trail
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Review immutable research log entries documenting all logins, question revisions, rubric adjustments, and Agent snapshot events for empirical reproducibility.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>View Historical Audit Records</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Research Methodology Reminder */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex items-start gap-4">
        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shrink-0">
          <Shield className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Three-Cycle Iterative Refinement Architecture</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            The study follows a strict progression: <strong>AI Version 1</strong> → Double-Blind Expert Evaluation → Comparison & Gap Documentation → Refinement → <strong>AI Version 2</strong> → Repeat → <strong>AI Version 3</strong> → Post-V3 Final Evaluation & Usability Surveys. All versions and evaluation records remain permanently immutable.
          </p>
        </div>
      </div>
    </div>
  );
};
