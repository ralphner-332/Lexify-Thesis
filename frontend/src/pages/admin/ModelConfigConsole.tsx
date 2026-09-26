import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ModelConfigSetting } from '../../types';
import { Lock, Unlock, CheckCircle, Save } from 'lucide-react';

export const ModelConfigConsole: React.FC = () => {
  const [models, setModels] = useState<ModelConfigSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [lockLoading, setLockLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadModelConfigs();
  }, []);

  async function loadModelConfigs() {
    setLoading(true);
    try {
      const res = await api.models.list();
      setModels(res.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load model configurations');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateModel(slot: string, updatedFields: Partial<ModelConfigSetting>) {
    setSavingSlot(slot);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await api.models.update(slot, updatedFields);
      setSuccessMessage(`Updated configuration for ${slot}.`);
      await loadModelConfigs();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to update ${slot}`);
    } finally {
      setSavingSlot(null);
    }
  }

  async function handleToggleGlobalLock(isLocked: boolean) {
    setLockLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await api.models.setLock(isLocked);
      setSuccessMessage(isLocked ? 'Research model configurations locked.' : 'Model configurations unlocked.');
      await loadModelConfigs();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle research lock');
    } finally {
      setLockLoading(false);
    }
  }

  const isGloballyLocked = models.length > 0 && models.every((m) => m.isLocked);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Local Ollama Serving · Sequential Inference
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Model configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Serving endpoints and configuration parameters for experimental evaluation models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleGlobalLock(!isGloballyLocked)}
            disabled={lockLoading || loading}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition ${
              isGloballyLocked
                ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isGloballyLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isGloballyLocked ? 'Unlock configuration' : 'Lock for research'}</span>
          </button>
        </div>
      </div>

      {/* Notices */}
      {successMessage && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Model Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-900">Experimental model set</span>
          <span className="text-slate-500">3 active models</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading model configurations...</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {models.map((m) => (
              <ModelRow
                key={m.modelSlot}
                model={m}
                isGloballyLocked={isGloballyLocked}
                savingSlot={savingSlot}
                onSave={handleUpdateModel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ModelRowProps {
  model: ModelConfigSetting;
  isGloballyLocked: boolean;
  savingSlot: string | null;
  onSave: (slot: string, fields: Partial<ModelConfigSetting>) => Promise<void>;
}

const ModelRow: React.FC<ModelRowProps> = ({ model, isGloballyLocked, savingSlot, onSave }) => {
  const [exactModelId, setExactModelId] = useState(model.exactModelId);
  const [temperature, setTemperature] = useState(model.temperature);
  const [maxTokens, setMaxTokens] = useState(model.maxTokens);

  const isLocked = isGloballyLocked || model.isLocked;
  const isSaving = savingSlot === model.modelSlot;

  const handleSave = () => {
    onSave(model.modelSlot, { exactModelId, temperature, maxTokens });
  };

  return (
    <div className="p-6 space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">{model.researchName}</span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
              {model.modelSlot}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">{model.modelFamily} · {model.parameterClass}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online (Ollama)
          </span>
          {isLocked && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
              Locked
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">Provider</label>
          <input
            type="text"
            disabled
            value={model.provider}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-xs font-mono"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">Exact model identifier</label>
          <input
            type="text"
            disabled={isLocked}
            value={exactModelId}
            onChange={(e) => setExactModelId(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs font-mono disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">Temperature</label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            disabled={isLocked}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">Max tokens</label>
          <input
            type="number"
            step="100"
            disabled={isLocked}
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 1024)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
      </div>

      {!isLocked && (
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              setExactModelId(model.exactModelId);
              setTemperature(model.temperature);
              setMaxTokens(model.maxTokens);
            }}
            className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium inline-flex items-center gap-1"
          >
            <Save className="w-3 h-3" />
            <span>{isSaving ? 'Saving...' : 'Save changes'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
