import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Rubric, RubricCriterion } from '../../types';
import { Plus, Trash2, CheckCircle, AlertTriangle, RotateCcw, Save } from 'lucide-react';

const DEFAULT_PRESET_CRITERIA: RubricCriterion[] = [
  {
    name: 'Form',
    description:
      'Four distinct paragraphs following ARAC sequence (Answer, Rule, Application, Conclusion), coherent presentation, and legal-writing quality.',
    weightPercent: 15.0,
    maxPoints: 15.0,
    orderIndex: 1,
  },
  {
    name: 'Answer',
    description:
      'Direct response to question, definite legal position, and responsiveness to specific legal issue.',
    weightPercent: 15.0,
    maxPoints: 15.0,
    orderIndex: 2,
  },
  {
    name: 'Rule',
    description:
      'Correct governing law, general or specific legal attribution, terminology, accurate doctrinal understanding, and statutory elements.',
    weightPercent: 30.0,
    maxPoints: 30.0,
    orderIndex: 3,
  },
  {
    name: 'Application',
    description:
      'Identification of legally relevant facts, direct application of law to facts, connecting facts to elements, and logical legal reasoning.',
    weightPercent: 30.0,
    maxPoints: 30.0,
    orderIndex: 4,
  },
  {
    name: 'Conclusion',
    description:
      'Conclusion logically supported by Rule + Application, consistency with preceding analysis, full resolution of issue, and absence of contradiction.',
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
        name: `New evaluation criterion ${criteria.length + 1}`,
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
    setName('Attorney Controlling Commercial Law Grading Matrix');
    setDescription(
      'Authoritative 5-criterion grading matrix: Form (15%), Answer (15%), Rule (30%), Application (30%), Conclusion (10%). Total: 100%.'
    );
    setSuccess('Reset criteria to Attorney Controlling Grading Matrix.');
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
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Authoritative evaluation matrix
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Scoring rubric builder
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure legal assessment criteria and weight allocations for automated and expert evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToPreset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to preset</span>
          </button>
          <button
            onClick={handleSaveRubric}
            disabled={saving || !isValidWeight}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save rubric'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Live Weight Validation Bar */}
      <div
        className={`p-4 rounded-lg border flex items-center justify-between text-xs transition ${
          isValidWeight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isValidWeight ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-semibold block">
              {isValidWeight
                ? 'Total weight is valid (100%)'
                : `Total weight is ${totalWeight}% (Must equal 100%)`}
            </span>
            <span className="text-[11px] text-slate-500">
              Form 15% · Answer 15% · Rule 30% · Application 30% · Conclusion 10%
            </span>
          </div>
        </div>

        <span className="text-lg font-bold">{totalWeight}%</span>
      </div>

      {/* Rubric Metadata */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 text-xs">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="font-medium text-slate-700 block mb-1">
              Rubric name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 font-medium focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">
              Description / Research scope
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Criteria breakdown ({criteria.length})</h2>
          <button
            onClick={addCriterion}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add criterion</span>
          </button>
        </div>

        <div className="space-y-3">
          {criteria.map((c, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center shrink-0 border border-slate-200">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleCriterionChange(idx, 'name', e.target.value)}
                    placeholder="Criterion name"
                    className="w-full font-semibold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-400 focus:outline-none px-1 py-0.5"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    <label className="text-slate-500 font-medium">Weight:</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={c.weightPercent}
                      onChange={(e) =>
                        handleCriterionChange(idx, 'weightPercent', parseFloat(e.target.value) || 0)
                      }
                      className="w-12 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 px-1 py-0.5 text-center"
                    />
                    <span className="text-slate-600 font-medium">%</span>
                  </div>

                  <button
                    onClick={() => removeCriterion(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Remove criterion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={c.description}
                  onChange={(e) => handleCriterionChange(idx, 'description', e.target.value)}
                  placeholder="Evaluation guidelines and scoring indicators for this criterion..."
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-md p-2 text-xs text-slate-700 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
