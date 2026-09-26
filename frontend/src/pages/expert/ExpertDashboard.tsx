import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { ExpertQueueItem } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileEdit,
  ArrowRight,
  Eye,
  HelpCircle,
} from 'lucide-react';

export const ExpertDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<ExpertQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.expert.getQueue(user?.isDemo);
      setQueue(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load expert evaluation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [user?.isDemo]);

  const filteredQueue = queue.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const totalItems = queue.length;
  const notStartedCount = queue.filter((q) => q.status === 'NOT_STARTED').length;
  const draftCount = queue.filter((q) => q.status === 'DRAFT').length;
  const submittedCount = queue.filter((q) => q.status === 'SUBMITTED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Double-Blind Legal Expert Portal
            </span>
            {user?.isDemo && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md border border-amber-200">
                Demo Expert Account
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Independent Legal Evaluation Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            FSUU College of Law — Criminal Law I Written Essay Research Protocol
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-600 max-w-md">
          <strong className="text-slate-900 flex items-center mb-1 font-bold">
            <Scale className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Double-Blind Protocol Assurance
          </strong>
          Student identities are strictly anonymized (e.g. <em>Student-01</em>), and AI-generated scores and reasoning are completely hidden to preserve unbiased expert assessment.
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchQueue} />}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Essays"
          value={totalItems}
          subtitle="Total in research queue"
          icon={Scale}
          iconColor="text-slate-700"
        />
        <StatCard
          title="Not Started"
          value={notStartedCount}
          subtitle="Pending evaluation"
          icon={Clock}
          iconColor="text-slate-500"
          badge={notStartedCount > 0 ? 'Pending' : 'Done'}
          badgeType={notStartedCount > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Drafts Saved"
          value={draftCount}
          subtitle="In-progress scoring"
          icon={FileEdit}
          iconColor="text-amber-600"
          badge={draftCount > 0 ? 'In Progress' : 'None'}
          badgeType={draftCount > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          title="Submitted & Locked"
          value={submittedCount}
          subtitle="Immutable evaluations"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          badge={`${submittedCount}/${totalItems}`}
          badgeType="success"
        />
      </div>

      {/* Evaluation Queue Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Student Essay Review Queue</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Grade student submissions using the authoritative 5-criterion rubric (Form 15, Answer 15, Rule 30, Application 30, Conclusion 10).
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-center">
            {['ALL', 'NOT_STARTED', 'DRAFT', 'SUBMITTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterStatus === st
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All Items'
                  : st === 'NOT_STARTED'
                  ? 'Not Started'
                  : st === 'DRAFT'
                  ? 'In Progress'
                  : 'Submitted'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} type="table" />
          </div>
        ) : filteredQueue.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No Submissions Found"
            description="There are currently no student submissions in this queue filter status."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200/80 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Anonymized Student</th>
                  <th className="px-6 py-4">Question Item</th>
                  <th className="px-6 py-4">Evaluation Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item, idx) => {
                  let statusBadge = (
                    <span className="inline-flex items-center text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-bold">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Not Started
                    </span>
                  );
                  if (item.status === 'DRAFT') {
                    statusBadge = (
                      <span className="inline-flex items-center text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
                        <FileEdit className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Draft Saved
                      </span>
                    );
                  } else if (item.status === 'SUBMITTED') {
                    statusBadge = (
                      <span className="inline-flex items-center text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Submitted & Locked
                      </span>
                    );
                  }

                  return (
                    <tr key={`${item.sessionId}_${item.questionId}`} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {item.studentAnonymizedCode}
                        </span>
                        <div className="text-[11px] text-slate-400">Queue #{idx + 1}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-indigo-700">{item.questionCode}</span>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{item.questionTitle}</div>
                      </td>
                      <td className="px-6 py-4">{statusBadge}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            navigate(`/expert/evaluate/${item.sessionId}/${item.questionId}`)
                          }
                          className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                            item.status === 'SUBMITTED'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : item.status === 'DRAFT'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {item.status === 'SUBMITTED' ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Evaluation</span>
                            </>
                          ) : (
                            <>
                              <span>{item.status === 'DRAFT' ? 'Resume Draft' : 'Grade Essay'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
