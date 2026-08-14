import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Rubric, RubricCriterion } from '../../types';
import { Plus, Trash2, CheckCircle, AlertTriangle, RotateCcw, Save } from 'lucide-react';

const DEFAULT_PRESET_CRITERIA: RubricCriterion[] = [
  {
    name: 'Legal Accuracy & Rule Formulation',
    description:
      'Correctly cites, identifies, and explains applicable Revised Penal Code articles, legal doctrines, and statutory principles.',
    weightPercent: 25.0,
    maxPoints: 25.0,
    orderIndex: 1,
  },
  {
    name: 'Identification of Statutory Elements',
    description:
      'Comprehensive breakdown and identification of all required elements, qualifying, mitigating, or exempting circumstances.',
    weightPercent: 25.0,
    maxPoints: 25.0,
    orderIndex: 2,
  },
  {
    name: 'Legal Reasoning & IRAC Structure',
    description:
      'Logical progression from Issue and Rule to Analysis and Conclusion; soundness and clarity of deductive legal reasoning.',
    weightPercent: 25.0,
    maxPoints: 25.0,
    orderIndex: 3,
  },
  {
    name: 'Application of Law to Facts',
    description:
      'Synthesizes specific factual scenario nuances directly with statutory elements rather than abstract restatements.',
    weightPercent: 15.0,
    maxPoints: 15.0,
    orderIndex: 4,
  },
  {
    name: 'Legal Terminology & Precision',
    description:
      'Appropriate use of Philippine criminal law terms, Latin maxims, and recognized conceptual equivalents.',
    weightPercent: 10.0,
    maxPoints: 10.0,
    orderIndex: 5,
  },
];

export const RubricBuilder: React.FC = () => {
  const [activeRubric, setActiveRubric] = useState<Rubric | null>(null);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRubrics = async () => {
    try {
      const res = await api.rubrics.list();
      if (res.data.length > 0) {
        const defaultR = res.data.find((r: Rubric) => r.isDefault) || res.data[0];
        selectRubric(defaultR);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rubrics');
    }
  };

  useEffect(() => {
    loadRubrics();
  }, []);

  const selectRubric = (r: Rubric) => {
    setActiveRubric(r);
    setName(r.name);
    setDescription(r.description);
    setCriteria(r.criteria || []);
    setError(null);
    setSuccess(null);
  };

  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weightPercent) || 0), 0);
  const isValidWeight = Math.abs(totalWeight - 100) < 0.1;

  const handleCriterionChange = (index: number, field: keyof RubricCriterion, val: any) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: val };
    setCriteria(updated);
  };

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        name: `New Evaluation Criterion ${criteria.length + 1}`,
        description: 'Describe the specific legal standard to be evaluated...',
        weightPercent: 10,
        maxPoints: 10,
        orderIndex: criteria.length + 1,
      },
    ]);
  };

  const removeCriterion = (index: number) => {
    if (criteria.length <= 1) {
      setError('A rubric must have at least one criterion.');
      return;
    }
    const updated = criteria.filter((_, i) => i !== index);
    setCriteria(updated);
  };

  const resetToPreset = () => {
    setCriteria(DEFAULT_PRESET_CRITERIA);
    setName('Criminal Law I Analytical Essay Rubric');
    setDescription(
      'Standard 5-criterion rubric evaluating legal accuracy, statutory elements, legal reasoning (IRAC), application to facts, and terminology.'
    );
    setSuccess('Reset criteria to standard Criminal Law I preset.');
  };

  const handleSaveRubric = async () => {
    if (!isValidWeight) {
      setError(`Cannot save rubric: Total weight must equal 100%. Currently at ${totalWeight}%.`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name,
      description,
      isDefault: true,
      criteria: criteria.map((c, idx) => ({
        name: c.name,
        description: c.description,
        weightPercent: Number(c.weightPercent),
        maxPoints: Number(c.maxPoints || c.weightPercent),
        orderIndex: idx + 1,
      })),
    };

    try {
      if (activeRubric) {
        await api.rubrics.update(activeRubric.id, payload);
        setSuccess('Scoring rubric successfully updated and saved.');
      } else {
        const res = await api.rubrics.create(payload);
        setActiveRubric(res.data);
        setSuccess('New scoring rubric created successfully.');
      }
      await loadRubrics();
    } catch (err: any) {
      setError(err.message || 'Failed to save rubric');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Scoring Methodology
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Configurable Rubric Builder</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define multi-dimensional legal criteria, descriptions, and weight allocations. The AI evaluation engine and expert grading portals evaluate answers strictly against these criteria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToPreset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to RPC Preset
          </button>
          <button
            onClick={handleSaveRubric}
            disabled={saving || !isValidWeight}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Rubric'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Live Weight Validation Bar */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
          isValidWeight
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-3">
          {isValidWeight ? (
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          )}
          <div>
            <h2 className="font-bold text-sm">
              {isValidWeight
                ? 'Weight Sum Valid (100%)'
                : `Weight Sum Invalid: Total is ${totalWeight}% (Must equal exactly 100%)`}
            </h2>
            <p className="text-xs opacity-80">
              {isValidWeight
                ? 'The sum of all criteria percentage weights equals exactly 100%.'
                : 'Adjust individual criteria weights below until the total equals 100%.'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black">{totalWeight}%</span>
        </div>
      </div>

      {/* Rubric Details Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Rubric Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Description / Research Purpose
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Criteria Breakdown ({criteria.length})</h2>
          <button
            onClick={addCriterion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Criterion
          </button>
        </div>

        <div className="space-y-3">
          {criteria.map((c, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleCriterionChange(idx, 'name', e.target.value)}
                    placeholder="Criterion Name"
                    className="w-full font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1 py-0.5"
                  />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <label className="text-xs font-semibold text-slate-500">Weight:</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={c.weightPercent}
                      onChange={(e) =>
                        handleCriterionChange(idx, 'weightPercent', parseFloat(e.target.value) || 0)
                      }
                      className="w-16 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 px-2 py-1 text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>

                  <button
                    onClick={() => removeCriterion(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={c.description}
                  onChange={(e) => handleCriterionChange(idx, 'description', e.target.value)}
                  placeholder="Evaluation guidelines and scoring indicators for this criterion..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
