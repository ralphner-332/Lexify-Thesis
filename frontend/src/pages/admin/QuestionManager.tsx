import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Question } from '../../types';
import { Plus, Edit2, Trash2, X, AlertCircle, FileText } from 'lucide-react';

export const QuestionManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [scenario, setScenario] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [elementsText, setElementsText] = useState('');
  const [provisionsText, setProvisionsText] = useState('');
  const [variationsText, setVariationsText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState(1);
  const [saving, setSaving] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.questions.list(true);
      setQuestions(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setCode(`CRIM1-Q0${questions.length + 1}`);
    setTitle('');
    setScenario('');
    setModelAnswer('');
    setElementsText('');
    setProvisionsText('');
    setVariationsText('');
    setIsActive(true);
    setOrderIndex(questions.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setCode(q.code);
    setTitle(q.title);
    setScenario(q.scenario);
    setModelAnswer(q.modelAnswer || '');
    setElementsText((q.statutoryElements || []).join('\n'));
    setProvisionsText((q.relevantProvisions || []).join('\n'));
    setVariationsText((q.conceptVariations || []).join('\n'));
    setIsActive(q.isActive);
    setOrderIndex(q.orderIndex);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      code,
      title,
      scenario,
      modelAnswer,
      statutoryElements: elementsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      relevantProvisions: provisionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      conceptVariations: variationsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      isActive,
      orderIndex: Number(orderIndex),
    };

    try {
      if (editingQuestion) {
        await api.questions.update(editingQuestion.id, payload);
      } else {
        await api.questions.create(payload);
      }
      setIsModalOpen(false);
      await loadQuestions();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete research question ${code}?`)) {
      return;
    }
    try {
      await api.questions.delete(id);
      await loadQuestions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete question');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-brand-800 border border-blue-200">
              Predetermined Items
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Question & Reference Answer Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure predetermined Criminal Law I analytical essay items, scenarios, model reference answers, statutory legal elements, and citations.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Question Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Cards List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading questions inventory...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
          No Criminal Law I questions found. Click "Add Question Item" to author the first item.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-6 border transition-all ${
                q.isActive ? 'border-slate-200 shadow-sm' : 'border-slate-200/60 bg-slate-50/50 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold font-mono">
                    {q.code}
                  </span>
                  <h2 className="font-bold text-slate-900 text-base">{q.title}</h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      q.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {q.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {q.isDemo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                      Demo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                    title="Edit Question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id, q.code)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Multi-field display */}
              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Factual Scenario (Student Viewable)
                  </span>
                  <p className="legal-text text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {q.scenario}
                  </p>
                </div>

                <div>
                  <span className="font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                    Model Reference Answer (Researcher & Expert View Only)
                  </span>
                  <p className="legal-text text-slate-800 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    {q.modelAnswer}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Statutory Legal Elements Checklist
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      {(q.statutoryElements || []).map((el, i) => (
                        <li key={i}>{el}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Statutory Provisions / Jurisprudence
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      {(q.relevantProvisions || []).map((prov, i) => (
                        <li key={i}>{prov}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  {editingQuestion ? `Edit Question: ${editingQuestion.code}` : 'New Predetermined Question'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Question Code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CRIM1-Q01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Question Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Justifying Circumstances: Self-Defense Analysis"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Factual Scenario (Shown to Students)
                </label>
                <textarea
                  required
                  rows={4}
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Enter the factual problem and specific legal instruction..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                  Model Reference Answer (Hidden from Students — Ground Truth for AI/Experts)
                </label>
                <textarea
                  required
                  rows={4}
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  placeholder="Enter the comprehensive reference answer applying RPC elements..."
                  className="w-full bg-indigo-50/40 border border-indigo-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Statutory Elements (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={elementsText}
                    onChange={(e) => setElementsText(e.target.value)}
                    placeholder="Unlawful aggression&#10;Reasonable necessity of means&#10;Lack of sufficient provocation"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Provisions / Jurisprudence (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={provisionsText}
                    onChange={(e) => setProvisionsText(e.target.value)}
                    placeholder="Article 11, Par. 1, RPC&#10;People v. Boholst-Caballero"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Acceptable Concept / Phrasing Variations (One per line)
                </label>
                <textarea
                  rows={2}
                  value={variationsText}
                  onChange={(e) => setVariationsText(e.target.value)}
                  placeholder="imminent peril&#10;rational equivalence of weapon"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-700">Active for Student Assessments</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Question Item'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
