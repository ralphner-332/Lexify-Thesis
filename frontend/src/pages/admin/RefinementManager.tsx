import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { RefinementLog } from '../../types';
import {
  Wrench,
  CheckCircle2,
  Eye,
  AlertTriangle,
  FileText,
  Save,
  Check,
  X,
} from 'lucide-react';

export const RefinementManager: React.FC = () => {
  const [logs, setLogs] = useState<RefinementLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterComponent, setFilterComponent] = useState<string>('ALL');

  // Selected Log for Edit/Approval Modal
  const [selectedLog, setSelectedLog] = useState<RefinementLog | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('DRAFT');
  const [modalApprovedDecision, setModalApprovedDecision] = useState<string>('');
  const [modalProposedRefinement, setModalProposedRefinement] = useState<string>('');
  const [modalRootCause, setModalRootCause] = useState<string>('');
  const [modalResearcherNotes, setModalResearcherNotes] = useState<string>('');
  const [modalResultingVersion, setModalResultingVersion] = useState<string>('V2');
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.refinements.getList({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        targetComponent: filterComponent === 'ALL' ? undefined : filterComponent,
      });
      setLogs(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load refinement logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterStatus, filterComponent]);

  const openLogEditor = (log: RefinementLog) => {
    setSelectedLog(log);
    setModalStatus(log.status);
    setModalApprovedDecision(log.approvedDecision || '');
    setModalProposedRefinement(log.proposedRefinement);
    setModalRootCause(log.rootCauseAnalysis || '');
    setModalResearcherNotes(log.researcherNotes || '');
    setModalResultingVersion(log.resultingAgentVersionId || 'V2');
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;

    try {
      setSaving(true);
      setError(null);
      await api.refinements.update(selectedLog.id, {
        status: modalStatus as any,
        approvedDecision: modalApprovedDecision,
        proposedRefinement: modalProposedRefinement,
        rootCauseAnalysis: modalRootCause,
        researcherNotes: modalResearcherNotes,
        resultingAgentVersionId: modalResultingVersion,
      });

      setSuccessMsg('Refinement decision updated successfully.');
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedLog(null);
      }, 1200);
      fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to update refinement decision');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full flex items-center">
              <Wrench className="w-3.5 h-3.5 mr-1" />
              Refinement Framework
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
              Human-in-the-Loop Governance
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Structured Agent Refinement Log Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Systematic documentation of legal evaluation discrepancies, root cause analyses, and approved component modifications for V1 → V2 → V3.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 max-w-md">
          <strong className="text-slate-800 flex items-center mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Explicit Researcher Approval
          </strong>
          Agent versions are never automatically altered upon conflict detection; every modification requires documented legal rationale and explicit researcher approval.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          {['ALL', 'DRAFT', 'APPROVED', 'APPLIED', 'REJECTED'].map((st) => (
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
                ? 'All Statuses'
                : st === 'DRAFT'
                ? 'Draft Gaps'
                : st === 'APPROVED'
                ? 'Approved'
                : st === 'APPLIED'
                ? 'Applied to Version'
                : 'Rejected'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-700">Component:</span>
          <select
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Components</option>
            <option value="SYSTEM_INSTRUCTIONS">System Instructions</option>
            <option value="EVALUATION_PATTERNS">Evaluation Patterns</option>
            <option value="CONCEPT_VARIATIONS">Concept Variations</option>
            <option value="SKILLS_DEFINITION">Skills Definition</option>
            <option value="RUBRIC_SNAPSHOT">Rubric Snapshot</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
          {error}
        </div>
      )}

      {/* Refinement Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-indigo-600" />
            Gap Analysis & Refinement Evidence Log
          </h2>
          <span className="text-xs text-slate-400">Showing {logs.length} logged records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            Loading refinement logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No refinement logs match current filters.</p>
            <p className="text-xs text-slate-400 mt-1">
              Create logs from the Comparison Matrix or log new gaps during research review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Gap ID</th>
                  <th className="px-5 py-3.5">Target Component</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Discrepancy Summary</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => {
                  let statusBadge = (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold">
                      Draft
                    </span>
                  );
                  if (log.status === 'APPROVED') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                        Approved
                      </span>
                    );
                  } else if (log.status === 'APPLIED') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        Applied ({log.resultingAgentVersionId || 'Next'})
                      </span>
                    );
                  } else if (log.status === 'REJECTED') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full font-bold">
                        Rejected
                      </span>
                    );
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-indigo-700 text-sm">
                          {log.gapId}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[11px] rounded">
                          {log.targetComponent}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-700">
                          {log.gapCategory.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">
                          {log.discrepancyDescription}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {log.proposedRefinement}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">{statusBadge}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openLogEditor(log)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review / Decide</span>
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

      {/* Refinement Editor / Decision Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                  {selectedLog.gapId}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Refinement Analysis & Human Decision Review
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDecision} className="p-6 space-y-5 overflow-y-auto">
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  {successMsg}
                </div>
              )}

              {/* Linked Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">AI Evaluation Stance</span>
                  <p className="text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
                    {selectedLog.aiPosition || 'No direct excerpt captured.'}
                  </p>
                </div>

                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-indigo-900 uppercase">Expert Legal Stance & Rationale</span>
                  <p className="text-xs text-slate-800 leading-relaxed max-h-32 overflow-y-auto">
                    {selectedLog.expertRationale || selectedLog.expertPosition || 'No direct excerpt captured.'}
                  </p>
                </div>
              </div>

              {/* Discrepancy Description */}
              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  Discrepancy Summary
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900">
                  {selectedLog.discrepancyDescription}
                </div>
              </div>

              {/* Root Cause & Proposed Refinement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-xs text-slate-700 block mb-1">
                    Root Cause Analysis
                  </label>
                  <textarea
                    rows={3}
                    value={modalRootCause}
                    onChange={(e) => setModalRootCause(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-bold text-xs text-slate-700 block mb-1">
                    Proposed Component Refinement
                  </label>
                  <textarea
                    rows={3}
                    value={modalProposedRefinement}
                    onChange={(e) => setModalProposedRefinement(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed"
                  />
                </div>
              </div>

              {/* Approval Decision Controls */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-xs text-slate-900 block mb-1">
                      Researcher Decision Status *
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="DRAFT">DRAFT (Under Review)</option>
                      <option value="APPROVED">APPROVED (Include in Next Version)</option>
                      <option value="APPLIED">APPLIED (Integrated into Version)</option>
                      <option value="REJECTED">REJECTED (Do Not Apply)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-xs text-slate-900 block mb-1">
                      Resulting Agent Version
                    </label>
                    <select
                      value={modalResultingVersion}
                      onChange={(e) => setModalResultingVersion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="V2">Agent Version 2 (V2)</option>
                      <option value="V3">Agent Version 3 (V3)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-xs text-slate-900 block mb-1">
                    Approved Decision & Governance Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter researcher decision rationale for the version audit trail..."
                    value={modalApprovedDecision}
                    onChange={(e) => setModalApprovedDecision(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving Decision...' : 'Save Decision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
