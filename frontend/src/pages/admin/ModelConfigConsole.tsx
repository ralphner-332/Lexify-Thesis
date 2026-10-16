import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ModelConfigSetting, SystemSettings } from '../../types';
import { CheckCircle, Save, Settings, Cpu } from 'lucide-react';

export const ModelConfigConsole: React.FC = () => {
  const [models, setModels] = useState<ModelConfigSetting[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    studentDisplayModel: 'MODEL_A',
    accuracyLevel: 'STANDARD',
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [modelsRes, settingsRes] = await Promise.all([
        api.models.list(),
        api.models.getSettings(),
      ]);
      setModels(modelsRes.data || []);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load model configurations and settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await api.models.updateSettings(settings);
      setSettings(res.data);
      setSuccessMessage('Assessment settings updated successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update system settings');
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Three-Model Research Environment
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Model & Assessment Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure student-facing evaluation display, legal accuracy calibration, and inspect research model slots.
          </p>
        </div>
      </div>

      {/* Notices */}
      {successMessage && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-xs">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Global Evaluation & Student Display Settings */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Assessment & Display Controls</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control the active student-facing score source and legal grading accuracy calibration.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Display Model Selector */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block">
                Student Display Model
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Select which LLM evaluation is displayed to students. All three models remain stored for research comparison.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['MODEL_A', 'MODEL_B', 'MODEL_C'] as const).map((slot) => {
                const modelInfo = models.find((m) => m.modelSlot === slot);
                const isSelected = settings.studentDisplayModel === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, studentDisplayModel: slot }))}
                    className={`p-3 rounded-md text-left transition border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">{slot}</div>
                    <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {modelInfo?.researchName || (slot === 'MODEL_A' ? 'Llama 3.2 3B' : slot === 'MODEL_B' ? 'Phi-4-mini' : 'Gemma 2 2B')}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              Students see their results labeled purely as "Lexify Assessment" without model identity exposure.
            </p>
          </div>

          {/* Accuracy Level Calibration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block">
                Legal Evaluation Accuracy Level
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Controls semantic tolerance and required statutory precision against the approved Model Answer.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { level: 'STRICT', label: 'Strict', desc: 'High Precision' },
                { level: 'STANDARD', label: 'Standard', desc: 'Balanced' },
                { level: 'LENIENT', label: 'Lenient', desc: 'Substantive Core' },
              ].map(({ level, label, desc }) => {
                const isSelected = settings.accuracyLevel === level;

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, accuracyLevel: level as any }))}
                    className={`p-3 rounded-md text-left transition border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">{label}</div>
                    <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {desc}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              Maintains full compatibility with ARAC analysis, lexical, semantic metrics, and legal syllogisms.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Active Three-Model Research Suite */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-slate-600" />
              <span>Three-Model Research Suite</span>
            </h2>
            <p className="text-slate-500 text-[11px] mt-0.5">
              All 3 models run sequentially on identical prompts and rubrics across all iterations.
            </p>
          </div>
          <span className="text-slate-500 font-medium">3 active models</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading model configurations...</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {models.map((m) => (
              <div key={m.modelSlot} className="p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{m.researchName}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {m.modelSlot}
                      </span>
                      {settings.studentDisplayModel === m.modelSlot && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Student Display Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      {m.modelFamily} · Parameter Class: {m.parameterClass}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Local Ollama Serving
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Provider</span>
                    <span className="font-mono text-slate-800 font-medium mt-0.5 block">{m.provider}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Model Identifier</span>
                    <span className="font-mono text-slate-800 font-medium mt-0.5 block">{m.exactModelId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
