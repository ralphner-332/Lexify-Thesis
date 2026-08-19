import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AgentVersion, RefinementLog } from '../../types';
import {
  GitBranch,
  Lock,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  History,
  FileCode,
  X,
} from 'lucide-react';

export const VersionLineageConsole: React.FC = () => {
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [refinements, setRefinements] = useState<RefinementLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Version for Inspection
  const [inspectedVersion, setInspectedVersion] = useState<AgentVersion | null>(null);

  // Branch Modal State
  const [showBranchModal, setShowBranchModal] = useState<boolean>(false);
  const [parentVersionTag, setParentVersionTag] = useState<string>('V1');
  const [newVersionTag, setNewVersionTag] = useState<string>('V2');
  const [branchLabel, setBranchLabel] = useState<string>('Agent Version 2 — First Empirical Refinement');
  const [branchDescription, setBranchDescription] = useState<string>(
    'Refined evaluation patterns based on double-blind expert feedback for Criminal Law I justification elements.'
  );
  const [modifiedInstructions, setModifiedInstructions] = useState<string>('');
  const [changelogComponent, setChangelogComponent] = useState<string>('EVALUATION_PATTERNS');
  const [changelogSummary, setChangelogSummary] = useState<string>('');
  const [changelogRationale, setChangelogRationale] = useState<string>('');
  const [selectedRefinementIds, setSelectedRefinementIds] = useState<string[]>([]);
  const [branching, setBranching] = useState<boolean>(false);

  // Side-by-Side Diff Modal State
  const [diffVersionA, setDiffVersionA] = useState<AgentVersion | null>(null);
  const [diffVersionB, setDiffVersionB] = useState<AgentVersion | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, rRes] = await Promise.all([
        api.agentVersions.list(),
        api.refinements.getList({ status: 'APPROVED' }),
      ]);
      setVersions(vRes.data);
      setRefinements(rRes.data);

      if (vRes.data.length > 0 && !inspectedVersion) {
        setInspectedVersion(vRes.data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load version lineage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openBranchModal = (parentTag: string) => {
    const parent = versions.find((v) => v.versionTag === parentTag);
    setParentVersionTag(parentTag);
    const nextTag = parentTag === 'V1' ? 'V2' : 'V3';
    setNewVersionTag(nextTag);
    setBranchLabel(`Agent Version ${nextTag.slice(1)} — Empirical Refinement Iteration`);
    setModifiedInstructions(parent ? parent.systemInstructions : '');
    setChangelogSummary('Refined evaluation patterns based on approved expert discrepancy logs.');
    setChangelogRationale('Addressed scoring divergence observed in paired comparison matrix.');
    setSelectedRefinementIds(refinements.map((r) => r.gapId));
    setShowBranchModal(true);
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBranching(true);
      setError(null);
      await api.agentVersions.branch({
        parentVersionTag,
        newVersionTag,
        label: branchLabel,
        description: branchDescription,
        systemInstructions: modifiedInstructions,
        changelogEntry: {
          component: changelogComponent,
          changeSummary: changelogSummary,
          rationale: changelogRationale,
          linkedRefinementIds: selectedRefinementIds,
        },
      });

      setSuccessMsg(`Version ${newVersionTag} branched successfully from ${parentVersionTag}.`);
      setShowBranchModal(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to branch agent version');
    } finally {
      setBranching(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      setError(null);
      await api.agentVersions.activate(id);
      setSuccessMsg('Active agent version updated.');
      setTimeout(() => setSuccessMsg(null), 2500);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to activate version');
    }
  };

  const handleLock = async (id: string) => {
    try {
      setError(null);
      await api.agentVersions.lock(id);
      setSuccessMsg('Agent version locked as immutable research snapshot.');
      setTimeout(() => setSuccessMsg(null), 2500);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to lock version');
    }
  };

  const openDiffViewer = (vA: AgentVersion, vB: AgentVersion) => {
    setDiffVersionA(vA);
    setDiffVersionB(vB);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full flex items-center">
              <GitBranch className="w-3.5 h-3.5 mr-1" />
              Iteration Lineage
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
              V1 → V2 → V3 Iterative Refinement
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Agent Version Lineage & Progression Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical evolutionary progression of the Criminal Law I AI Agent across iterative evaluation cycles.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 max-w-md">
          <strong className="text-slate-800 flex items-center mb-1">
            <Lock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Immutable Version Lineage
          </strong>
          Each iterative version preserves its parent lineage and structured changelog. Historical evaluations produced under earlier versions are permanently preserved.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
          {successMsg}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          Loading version lineage...
        </div>
      )}

      {/* Visual Version Lineage Progression Pipeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider text-slate-500">
          Agent Version Progression Tree
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {['V1', 'V2', 'V3'].map((vTag, idx) => {
            const vData = versions.find((v) => v.versionTag === vTag);
            const isCreated = !!vData;

            return (
              <div
                key={vTag}
                className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition ${
                  isCreated
                    ? vData.isActive
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-dashed border-slate-200 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-black text-slate-900">{vTag}</span>
                      {vData?.isActive && (
                        <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active Evaluator
                        </span>
                      )}
                    </div>

                    {isCreated ? (
                      vData.isLocked ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full flex items-center">
                          <Lock className="w-3 h-3 mr-1 text-slate-400" />
                          Locked Snapshot
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                          Draft In Progress
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 text-xs italic">Unbranched</span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-xs mt-2">
                    {isCreated ? vData.label : `Agent Version ${vTag}`}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {isCreated
                      ? vData.description
                      : `Awaiting researcher iteration from ${idx === 1 ? 'V1' : 'V2'} comparison findings.`}
                  </p>
                </div>

                {isCreated ? (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Parent: {vData.parentVersionId ? 'Linked' : 'Root'}</span>
                      <span>Changelogs: {vData.changelog?.length || 0}</span>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => setInspectedVersion(vData)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition text-center"
                      >
                        Inspect
                      </button>

                      {!vData.isActive && (
                        <button
                          onClick={() => handleActivate(vData.id)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition"
                          title="Activate this version for subsequent AI evaluations"
                        >
                          Activate
                        </button>
                      )}

                      {!vData.isLocked && (
                        <button
                          onClick={() => handleLock(vData.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition"
                          title="Lock snapshot"
                        >
                          Lock
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-dashed border-slate-200">
                    {versions.some((v) => v.versionTag === (idx === 1 ? 'V1' : 'V2')) && (
                      <button
                        onClick={() => openBranchModal(idx === 1 ? 'V1' : 'V2')}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Branch {vTag} from {idx === 1 ? 'V1' : 'V2'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Version Detail & Structured Changelog */}
      {inspectedVersion && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-slate-900">
                  {inspectedVersion.versionTag}
                </span>
                <span className="font-semibold text-slate-700 text-sm">
                  — {inspectedVersion.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{inspectedVersion.description}</p>
            </div>

            {/* Compare Action */}
            {versions.length > 1 && (
              <div className="flex items-center space-x-2">
                {versions
                  .filter((v) => v.id !== inspectedVersion.id)
                  .map((otherV) => (
                    <button
                      key={otherV.id}
                      onClick={() => openDiffViewer(otherV, inspectedVersion)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs inline-flex items-center space-x-1"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Compare with {otherV.versionTag}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Structured Changelog Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center">
              <History className="w-4 h-4 mr-1 text-indigo-600" />
              Structured Evolutionary Changelog
            </h3>

            {!inspectedVersion.changelog || inspectedVersion.changelog.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                Baseline research version snapshot (no preceding modifications).
              </div>
            ) : (
              <div className="space-y-3">
                {inspectedVersion.changelog.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-200 rounded font-mono text-[11px]">
                        {entry.component}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Approved by {entry.approverEmail || 'Researcher'} on{' '}
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-800">{entry.changeSummary}</div>
                    <div className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Rationale:</strong> {entry.rationale}
                    </div>

                    {entry.linkedRefinementIds && entry.linkedRefinementIds.length > 0 && (
                      <div className="flex items-center space-x-1 pt-1">
                        <span className="text-[11px] text-slate-500">Linked Gap Analyses:</span>
                        {entry.linkedRefinementIds.map((gapId) => (
                          <span
                            key={gapId}
                            className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold text-[10px]"
                          >
                            {gapId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branch New Version Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                  Branching {newVersionTag} from {parentVersionTag}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Create Next Iteration Agent Snapshot
                </h3>
              </div>
              <button
                onClick={() => setShowBranchModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-xs text-slate-700 block mb-1">
                    New Version Tag
                  </label>
                  <input
                    type="text"
                    disabled
                    value={newVersionTag}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-xs text-slate-700 block mb-1">
                    Component Modified *
                  </label>
                  <select
                    value={changelogComponent}
                    onChange={(e) => setChangelogComponent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="EVALUATION_PATTERNS">Evaluation Patterns</option>
                    <option value="SYSTEM_INSTRUCTIONS">System Instructions</option>
                    <option value="CONCEPT_VARIATIONS">Concept Variations</option>
                    <option value="SKILLS_DEFINITION">Skills Definition</option>
                    <option value="RUBRIC_SNAPSHOT">Rubric Snapshot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  Version Label *
                </label>
                <input
                  type="text"
                  required
                  value={branchLabel}
                  onChange={(e) => setBranchLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  Version Description *
                </label>
                <input
                  type="text"
                  required
                  value={branchDescription}
                  onChange={(e) => setBranchDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  System Instructions (Refined)
                </label>
                <textarea
                  rows={4}
                  value={modifiedInstructions}
                  onChange={(e) => setModifiedInstructions(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  Changelog Summary *
                </label>
                <input
                  type="text"
                  required
                  value={changelogSummary}
                  onChange={(e) => setChangelogSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">
                  Scientific Rationale *
                </label>
                <textarea
                  rows={2}
                  required
                  value={changelogRationale}
                  onChange={(e) => setChangelogRationale(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed"
                />
              </div>

              <div className="p-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={branching}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{branching ? 'Branching Version...' : `Branch ${newVersionTag}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side-by-Side Diff Modal */}
      {diffVersionA && diffVersionB && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                  Side-by-Side Version Diff
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Comparing {diffVersionA.versionTag} vs. {diffVersionB.versionTag}
                </h3>
              </div>
              <button
                onClick={() => {
                  setDiffVersionA(null);
                  setDiffVersionB(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-xs text-slate-900 block border-b border-slate-200 pb-1">
                    {diffVersionA.versionTag}: System Instructions
                  </span>
                  <pre className="text-[11px] text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                    {diffVersionA.systemInstructions}
                  </pre>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <span className="font-bold text-xs text-indigo-950 block border-b border-indigo-100 pb-1">
                    {diffVersionB.versionTag}: System Instructions
                  </span>
                  <pre className="text-[11px] text-slate-800 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                    {diffVersionB.systemInstructions}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setDiffVersionA(null);
                  setDiffVersionB(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Close Diff Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
