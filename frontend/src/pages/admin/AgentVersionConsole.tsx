import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AgentVersion } from '../../types';
import { Lock, CheckCircle2, Sliders, Cpu, FileCode, CheckSquare, Sparkles, GitCompare, AlertTriangle, Play } from 'lucide-react';

export const AgentVersionConsole: React.FC = () => {
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<AgentVersion | null>(null);
  const [activeTab, setActiveTab] = useState<
    'instructions' | 'skills' | 'rubric' | 'patterns' | 'model' | 'diff'
  >('instructions');
  const [diffVersionB, setDiffVersionB] = useState<string>('');
  const [diffResult, setDiffResult] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editable fields for draft versions
  const [instructions, setInstructions] = useState('');
  const [provider, setProvider] = useState('google');
  const [modelId, setModelId] = useState('gemini-2.0-flash');
  const [temperature, setTemperature] = useState(0.2);
  const [topP, setTopP] = useState(0.95);

  const loadVersions = async () => {
    try {
      const res = await api.agentVersions.list();
      setVersions(res.data);
      if (res.data.length > 0) {
        const current = selectedVersion
          ? res.data.find((v: AgentVersion) => v.id === selectedVersion.id) || res.data[0]
          : res.data.find((v: AgentVersion) => v.isActive) || res.data[0];
        selectVersion(current);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to load agent versions', type: 'error' });
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  const selectVersion = (v: AgentVersion) => {
    setSelectedVersion(v);
    setInstructions(v.systemInstructions || '');
    setProvider(v.modelConfig?.provider || 'google');
    setModelId(v.modelConfig?.modelId || 'gemini-2.0-flash');
    setTemperature(v.modelConfig?.temperature ?? 0.2);
    setTopP(v.modelConfig?.topP ?? 0.95);
    setMessage(null);
  };

  const handleLockSnapshot = async () => {
    if (!selectedVersion) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently lock ${selectedVersion.versionTag}? Locked snapshots cannot be modified and serve as immutable research evidence.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.agentVersions.lock(selectedVersion.id);
      setMessage({ text: res.message, type: 'success' });
      await loadVersions();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to lock agent version', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateVersion = async () => {
    if (!selectedVersion) return;
    setActionLoading(true);
    try {
      const res = await api.agentVersions.activate(selectedVersion.id);
      setMessage({ text: res.message, type: 'success' });
      await loadVersions();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to activate agent version', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunDiff = async () => {
    if (!selectedVersion || !diffVersionB) return;
    try {
      const res = await api.agentVersions.compare(selectedVersion.id, diffVersionB);
      setDiffResult(res.data);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to compare versions', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Agent Architecture & Snapshots
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Component Snapshot Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage system instructions, evaluation skills, active rubric snapshots, evaluation patterns, and configurable LLM settings across iterative cycles (V1 → V2 → V3).
          </p>
        </div>

        {selectedVersion && (
          <div className="flex items-center gap-2">
            {!selectedVersion.isActive && (
              <button
                onClick={handleActivateVersion}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Set as Active Evaluator
              </button>
            )}

            {!selectedVersion.isLocked && (
              <button
                onClick={handleLockSnapshot}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Lock Immutable Snapshot
              </button>
            )}
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Version Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {versions.map((v) => (
          <button
            key={v.id}
            onClick={() => selectVersion(v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedVersion?.id === v.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{v.versionTag}</span>
            {v.isLocked && (
              <span title="Locked Immutable">
                <Lock className="w-3 h-3 text-amber-300" />
              </span>
            )}
            {v.isActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active Evaluator" />
            )}
          </button>
        ))}
      </div>

      {selectedVersion && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Version Metadata Banner */}
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{selectedVersion.label}</h2>
                {selectedVersion.isLocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    <Lock className="w-2.5 h-2.5" /> Immutable Research Snapshot
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                    Draft / Configurable
                  </span>
                )}
                {selectedVersion.isActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active Agent
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedVersion.description}</p>
            </div>

            <div className="text-right text-xs text-slate-500">
              <div>
                Created: {new Date(selectedVersion.createdAt).toLocaleDateString()}
              </div>
              {selectedVersion.lockedAt && (
                <div className="text-amber-700 font-medium">
                  Locked: {new Date(selectedVersion.lockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Component Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('instructions')}
              className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'instructions'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-4 h-4" />
              1. System Instructions
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'skills'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              2. Skills & Capabilities
            </button>

            <button
              onClick={() => setActiveTab('rubric')}
              className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'rubric'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              3. Active Rubric Snapshot
            </button>

            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'patterns'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              4. Evaluation Patterns
            </button>

            <button
              onClick={() => setActiveTab('model')}
              className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'model'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              5. Model Config
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'diff'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              Side-by-Side Diff
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 text-xs">
            {activeTab === 'instructions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-slate-500">
                    System Prompt / Evaluator Core Directives
                  </span>
                  {selectedVersion.isLocked && (
                    <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                      <Lock className="w-3 h-3" /> Read-only snapshot
                    </span>
                  )}
                </div>
                <textarea
                  rows={8}
                  disabled={selectedVersion.isLocked}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600 leading-relaxed"
                />
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-4">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">
                  Configured AI Agent Skills
                </span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                  <pre className="text-xs text-slate-800">
                    {JSON.stringify(selectedVersion.skillsDefinition, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'rubric' && (
              <div className="space-y-4">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">
                  Locked Scoring Rubric Snapshot
                </span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                  <pre className="text-xs text-slate-800">
                    {JSON.stringify(selectedVersion.rubricSnapshot, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'patterns' && (
              <div className="space-y-4">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">
                  Evaluation Patterns & Reasoning Weights
                </span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                  <pre className="text-xs text-slate-800">
                    {JSON.stringify(selectedVersion.evaluationPatterns, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'model' && (
              <div className="space-y-4">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">
                  Configurable AI Model & Provider Settings (Unhardcoded)
                </span>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      AI Provider
                    </label>
                    <select
                      disabled={selectedVersion.isLocked}
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100"
                    >
                      <option value="google">Google Gemini API (Configurable)</option>
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="openai">OpenAI GPT</option>
                      <option value="custom">Custom / Local LLM Endpoint</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Model Identifier
                    </label>
                    <input
                      type="text"
                      disabled={selectedVersion.isLocked}
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Temperature ({temperature})
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.0"
                      max="1.0"
                      disabled={selectedVersion.isLocked}
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Top-P ({topP})
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.0"
                      max="1.0"
                      disabled={selectedVersion.isLocked}
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-purple-950 text-xs">
                  <p className="font-semibold">Research Note on Model Selection:</p>
                  <p className="mt-0.5">
                    The AI provider and model identifier remain flexible and subject to research adviser approval. Evaluation execution connects through these parameters in Phase 2.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'diff' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">Compare {selectedVersion.versionTag} with:</span>
                  <select
                    value={diffVersionB}
                    onChange={(e) => setDiffVersionB(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">Select version...</option>
                    {versions
                      .filter((v) => v.id !== selectedVersion.id)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.versionTag} ({v.label})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleRunDiff}
                    disabled={!diffVersionB}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50"
                  >
                    Compare Snapshots
                  </button>
                </div>

                {diffResult ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono">
                    <h4 className="font-bold text-slate-900 text-xs">Differences Analysis:</h4>
                    <pre className="text-xs text-slate-700">
                      {JSON.stringify(diffResult.differences, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Select a version to compare with {selectedVersion.versionTag}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
