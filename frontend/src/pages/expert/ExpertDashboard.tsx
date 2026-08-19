import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { ExpertQueueItem } from '../../types';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileEdit,
  ArrowRight,
  Eye,
  AlertCircle,
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
      const res = await api.expert.getQueue(user?.isDemo);
      setQueue(res.data);
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Double-Blind Legal Expert Portal
            </span>
            {user?.isDemo && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded">
                Demo Expert Account
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Independent Legal Evaluation Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            FSUU College of Law — Criminal Law I Written Essay Research Protocol
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 max-w-md">
          <strong className="text-slate-800 flex items-center mb-1">
            <Scale className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Double-Blind Protocol Assurance
          </strong>
          Student identities are strictly anonymized (e.g. <em>Student-01</em>), and AI-generated scores and reasoning are completely hidden to preserve unbiased expert assessment.
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium uppercase">Assigned Items</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalItems}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-600 font-medium uppercase">Not Started</span>
          <div className="text-2xl font-black text-slate-700 mt-1">{notStartedCount}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-xs text-amber-700 font-medium uppercase">Drafts Saved</span>
          <div className="text-2xl font-black text-amber-800 mt-1">{draftCount}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <span className="text-xs text-emerald-700 font-medium uppercase">Submitted & Locked</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{submittedCount}</div>
        </div>
      </div>

      {/* Evaluation Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Student Essay Review Queue</h2>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {['ALL', 'NOT_STARTED', 'DRAFT', 'SUBMITTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterStatus === st
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
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
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            Loading evaluation queue...
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700 text-sm">{error}</div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No submissions found in this status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Anonymized Student</th>
                  <th className="px-5 py-3.5">Question Item</th>
                  <th className="px-5 py-3.5">Evaluation Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredQueue.map((item, idx) => {
                  let statusBadge = (
                    <span className="inline-flex items-center text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Not Started
                    </span>
                  );
                  if (item.status === 'DRAFT') {
                    statusBadge = (
                      <span className="inline-flex items-center text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold">
                        <FileEdit className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Draft Saved
                      </span>
                    );
                  } else if (item.status === 'SUBMITTED') {
                    statusBadge = (
                      <span className="inline-flex items-center text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Submitted & Locked
                      </span>
                    );
                  }

                  return (
                    <tr key={`${item.sessionId}_${item.questionId}`} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {item.studentAnonymizedCode}
                        </span>
                        <div className="text-[11px] text-slate-400">Queue #{idx + 1}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-indigo-700">{item.questionCode}</span>
                        <div className="font-semibold text-slate-800 text-sm mt-0.5">{item.questionTitle}</div>
                      </td>
                      <td className="px-5 py-4">{statusBadge}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            navigate(`/expert/evaluate/${item.sessionId}/${item.questionId}`)
                          }
                          className={`inline-flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-semibold transition shadow-xs ${
                            item.status === 'SUBMITTED'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : item.status === 'DRAFT'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {item.status === 'SUBMITTED' ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Evaluation</span>
                            </>
                          ) : (
                            <>
                              <span>{item.status === 'DRAFT' ? 'Resume Draft' : 'Evaluate'}</span>
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
