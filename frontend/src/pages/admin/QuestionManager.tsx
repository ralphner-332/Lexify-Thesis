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
    setCode(`COMM-Q0${questions.length + 1}`);
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
    if (!window.confirm(`Are you sure you want to delete question ${code}?`)) {
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
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Commercial Law Assessment Bank
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Questions & Model Answers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage analytical essay problem scenarios and authoritative model answers.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Question</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Cards List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 text-slate-500 text-xs">
          No questions found. Click "Add Question" to create the first item.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`bg-white rounded-lg p-5 border transition ${
                q.isActive ? 'border-slate-200' : 'border-slate-200/60 bg-slate-50/50 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-mono font-medium">
                    {q.code}
                  </span>
                  <h2 className="font-semibold text-slate-900 text-sm">{q.title}</h2>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                      q.isActive
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    {q.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Edit question"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id, q.code)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Multi-field display */}
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="font-medium text-slate-500 block mb-1">
                    Problem Scenario (Student View)
                  </span>
                  <p className="font-serif text-slate-800 bg-slate-50 p-3.5 rounded-md border border-slate-200/80 leading-relaxed">
                    {q.scenario}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-slate-700 block mb-1">
                    MODEL ANSWER
                  </span>
                  <p className="font-serif text-slate-800 bg-slate-50/60 p-3.5 rounded-md border border-slate-200/80 leading-relaxed whitespace-pre-line">
                    {q.modelAnswer || 'No model answer configured.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 my-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  {editingQuestion ? `Edit Question: ${editingQuestion.code}` : 'New Question'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Question code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. COMM-Q01"
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 font-mono focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-medium text-slate-700 block mb-1">
                    Question title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Commercial Law Analysis"
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Problem Scenario (Shown to Students)
                </label>
                <textarea
                  required
                  rows={4}
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Enter the factual problem scenario..."
                  className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden font-serif"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  MODEL ANSWER
                </label>
                <textarea
                  required
                  rows={5}
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  placeholder="Enter the authoritative model answer..."
                  className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden font-serif"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-slate-400 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Active for student assessments</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Question'}
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
