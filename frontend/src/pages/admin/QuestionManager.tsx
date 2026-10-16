import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Question, SystemSettings } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  Search,
  Layers,
  Check,
} from 'lucide-react';

export const QuestionManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4'>('ALL');
  const [updatingActiveSet, setUpdatingActiveSet] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [testSet, setTestSet] = useState<'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4'>('TEST_1');
  const [scenario, setScenario] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [elementsText, setElementsText] = useState('');
  const [provisionsText, setProvisionsText] = useState('');
  const [variationsText, setVariationsText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState(1);
  const [saving, setSaving] = useState(false);

  const loadQuestionsAndSettings = async () => {
    setLoading(true);
    try {
      // Pass false to include both active and inactive questions for Admin
      const [qRes, sRes] = await Promise.all([
        api.questions.list(false),
        api.models.getSettings(),
      ]);
      setQuestions(qRes.data || []);
      setSettings(sRes.data || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions and settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionsAndSettings();
  }, []);

  const handlePublishTestSet = async (testSetId: 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4') => {
    setUpdatingActiveSet(true);
    setSuccessMessage(null);
    setError(null);
    try {
      const res = await api.models.publishTestSet(testSetId);
      setSettings(res.data);
      const testName = testSetId === 'TEST_1' ? 'Test 1' : testSetId === 'TEST_2' ? 'Test 2' : testSetId === 'TEST_3' ? 'Test 3' : 'Test 4';
      setSuccessMessage(`${testName} published successfully. New student assessments will receive this test set.`);
    } catch (err: any) {
      setError(err.message || 'Failed to publish test');
    } finally {
      setUpdatingActiveSet(false);
    }
  };

  const handleArchiveTestSet = async (testSetId: 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4') => {
    setUpdatingActiveSet(true);
    setSuccessMessage(null);
    setError(null);
    try {
      const res = await api.models.archiveTestSet(testSetId);
      setSettings(res.data);
      const testName = testSetId === 'TEST_1' ? 'Test 1' : testSetId === 'TEST_2' ? 'Test 2' : testSetId === 'TEST_3' ? 'Test 3' : 'Test 4';
      setSuccessMessage(`${testName} archived successfully.`);
    } catch (err: any) {
      setError(err.message || 'Failed to archive test');
    } finally {
      setUpdatingActiveSet(false);
    }
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    const targetSet = selectedTab !== 'ALL' ? selectedTab : 'TEST_1';
    setTestSet(targetSet);
    setCode(`TEST1-Q${String(questions.length + 1).padStart(2, '0')}`);
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
    setTestSet((q.testSet as any) || 'TEST_1');
    setScenario(q.scenario);
    setModelAnswer(q.modelAnswer || '');
    setElementsText((q.statutoryElements || []).join('\n'));
    setProvisionsText((q.relevantProvisions || []).join('\n'));
    setVariationsText((q.conceptVariations || []).join('\n'));
    setIsActive(q.isActive);
    setOrderIndex(q.orderIndex);
    setIsModalOpen(true);
  };

  const openPreview = (q: Question) => {
    setPreviewQuestion(q);
    setIsPreviewOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      testSet,
      scenario: scenario.trim(),
      modelAnswer: modelAnswer.trim(),
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
      await loadQuestionsAndSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, qCode: string) => {
    if (!window.confirm(`Are you sure you want to delete question ${qCode}?`)) {
      return;
    }
    try {
      await api.questions.delete(id);
      await loadQuestionsAndSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete question');
    }
  };

  const test1Count = questions.filter((q) => q.testSet === 'TEST_1' || (!q.testSet && q.orderIndex <= 10)).length;
  const test2Count = questions.filter((q) => q.testSet === 'TEST_2' || (q.orderIndex >= 11 && q.orderIndex <= 20)).length;
  const test3Count = questions.filter((q) => q.testSet === 'TEST_3' || (q.orderIndex >= 21 && q.orderIndex <= 30)).length;
  const test4Count = questions.filter((q) => q.testSet === 'TEST_4' || (q.orderIndex >= 31 && q.orderIndex <= 40)).length;

  const filteredQuestions = questions
    .filter((q) => {
      // Filter by test tab
      if (selectedTab !== 'ALL') {
        const matchSet =
          q.testSet === selectedTab ||
          (selectedTab === 'TEST_1' && !q.testSet && q.orderIndex <= 10) ||
          (selectedTab === 'TEST_2' && !q.testSet && q.orderIndex >= 11 && q.orderIndex <= 20) ||
          (selectedTab === 'TEST_3' && !q.testSet && q.orderIndex >= 21 && q.orderIndex <= 30) ||
          (selectedTab === 'TEST_4' && !q.testSet && q.orderIndex >= 31 && q.orderIndex <= 40);
        if (!matchSet) return false;
      }

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        q.code.toLowerCase().includes(query) ||
        q.title.toLowerCase().includes(query) ||
        q.scenario.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0) || a.code.localeCompare(b.code));

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Question Bank Management · Predetermined Legal Assessments
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Question Bank & Model Reference Answers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage assessment scenarios, statutory elements, and approved model reference answers for legal evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Question</span>
          </button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-xs">
          {error}
        </div>
      )}

      {/* Assessment Test Set Selection Cards */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">Official Assessment Tests</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Publish or archive 10-question assessment sets for student evaluations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'TEST_1' as const, title: 'Test 1', range: 'TEST1-Q01 – TEST1-Q10', count: test1Count, desc: 'Formation, Juridical Personality & Universal Partnerships' },
            { id: 'TEST_2' as const, title: 'Test 2', range: 'TEST2-Q01 – TEST2-Q10', count: test2Count, desc: 'Particular Partnerships, Partner Types & Obligations' },
            { id: 'TEST_3' as const, title: 'Test 3', range: 'TEST3-Q01 – TEST3-Q10', count: test3Count, desc: 'Management, Capital Contributions & Partner Debts' },
            { id: 'TEST_4' as const, title: 'Test 4', range: 'TEST4-Q01 – TEST4-Q10', count: test4Count, desc: 'Dissolution, Winding Up, Creditor Claims & Rights' },
          ].map((t) => {
            const status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' =
              settings?.testSetStatuses?.[t.id] || 'DRAFT';
            const isActive = status === 'ACTIVE';
            const isArchived = status === 'ARCHIVED';

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTab(t.id)}
                className={`p-4 rounded-lg border transition text-left flex flex-col justify-between gap-2 cursor-pointer ${
                  selectedTab === t.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-800'
                    : isArchived
                    ? 'bg-slate-100/70 text-slate-600 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{t.title}</span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : isArchived
                          ? 'bg-slate-200 text-slate-600 border-slate-300'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className={`text-[11px] font-semibold mt-1 font-mono ${isActive && selectedTab === t.id ? 'text-amber-300' : 'text-slate-700'}`}>
                    {t.range}
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isActive && selectedTab === t.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    {t.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Question Bank Table with Test Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Test Set Tabs & Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Questions', count: questions.length },
              { id: 'TEST_1', label: 'Test 1 — 10 Questions', count: test1Count },
              { id: 'TEST_2', label: 'Test 2 — 10 Questions', count: test2Count },
              { id: 'TEST_3', label: 'Test 3 — 10 Questions', count: test3Count },
              { id: 'TEST_4', label: 'Test 4 — 10 Questions', count: test4Count },
            ].map((tab) => {
              const isSelected = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search code, title, or scenario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading question bank...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <p className="font-medium text-slate-700">No questions found matching your filter.</p>
            <p className="text-slate-400 mt-1">Click "Create Question" to add a new scenario to the bank.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4 w-28">Code</th>
                  <th className="py-3 px-3 w-20">Set</th>
                  <th className="py-3 px-4">Title & Problem Scenario</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-6 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 font-medium">
                      {q.orderIndex}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {q.code}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {q.testSet ? q.testSet.replace('_', ' ') : `TEST ${Math.ceil(q.orderIndex / 10)}`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{q.title}</div>
                      <p className="text-slate-500 line-clamp-2 mt-0.5 font-serif leading-relaxed">
                        {q.scenario}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span>Elements: {q.statutoryElements?.length || 0}</span>
                        <span>•</span>
                        <span>Citations: {q.relevantProvisions?.length || 0}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const qSet = q.testSet || (q.orderIndex <= 10 ? 'TEST_1' : q.orderIndex <= 20 ? 'TEST_2' : q.orderIndex <= 30 ? 'TEST_3' : 'TEST_4');
                        const setStatus = settings?.testSetStatuses?.[qSet as keyof typeof settings.testSetStatuses] || 'DRAFT';
                        const isSetArchived = setStatus === 'ARCHIVED';
                        const isSetActive = setStatus === 'ACTIVE';

                        if (isSetArchived) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>ARCHIVED</span>
                            </span>
                          );
                        }
                        if (isSetActive && q.isActive) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>ACTIVE</span>
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>DRAFT</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-6 text-right space-x-1">
                      <button
                        onClick={() => openPreview(q)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                        title="View Details & Model Answer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                        title="Edit Question & Model Answer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id, q.code)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dedicated Test-Level Controls Bar at the bottom of the test */}
        {selectedTab !== 'ALL' && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              disabled={updatingActiveSet}
              onClick={() => handleArchiveTestSet(selectedTab)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              Archive
            </button>

            <button
              type="button"
              disabled={updatingActiveSet}
              onClick={() => handlePublishTestSet(selectedTab)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        )}
      </div>

      {/* Detail / Preview Modal */}
      {isPreviewOpen && previewQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                  {previewQuestion.code}
                </span>
                <h3 className="font-bold text-base text-slate-900">{previewQuestion.title}</h3>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase block mb-1">Factual Scenario</span>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md font-serif text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {previewQuestion.scenario}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block mb-1">
                  Model / Suggested Reference Answer
                </span>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md font-serif text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {previewQuestion.modelAnswer || 'No model answer specified.'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="font-bold text-slate-700 block mb-1.5">Required Statutory Elements</span>
                  {previewQuestion.statutoryElements && previewQuestion.statutoryElements.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside text-slate-600 font-serif">
                      {previewQuestion.statutoryElements.map((elem, i) => (
                        <li key={i}>{elem}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400">None specified</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="font-bold text-slate-700 block mb-1.5">Relevant Legal Provisions</span>
                  {previewQuestion.relevantProvisions && previewQuestion.relevantProvisions.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside text-slate-600 font-serif">
                      {previewQuestion.relevantProvisions.map((prov, i) => (
                        <li key={i}>{prov}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400">None specified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingQuestion ? `Edit Question: ${editingQuestion.code}` : 'Create New Question'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Question Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. TEST1-Q01"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assessment Test Set</label>
                  <select
                    value={testSet}
                    onChange={(e) => setTestSet(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="TEST_1">Test 1 (Q01–Q10)</option>
                    <option value="TEST_2">Test 2 (Q11–Q20)</option>
                    <option value="TEST_3">Test 3 (Q21–Q30)</option>
                    <option value="TEST_4">Test 4 (Q31–Q40)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Order Index</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Question Title / Topic</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Partnership Requisites & Co-Ownership"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Factual Scenario</label>
                <textarea
                  rows={4}
                  required
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Enter the problem scenario facts presented to the student..."
                  className="w-full p-3 border border-slate-300 rounded-md font-serif text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Model / Suggested Reference Answer
                </label>
                <textarea
                  rows={4}
                  required
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  placeholder="Enter the authoritative benchmark answer for AI evaluator semantic grounding..."
                  className="w-full p-3 border border-slate-300 rounded-md font-serif text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Required Statutory Elements (one per line)
                </label>
                <textarea
                  rows={2}
                  value={elementsText}
                  onChange={(e) => setElementsText(e.target.value)}
                  placeholder="e.g. Mutual consent to form partnership&#10;Agreement to contribute money, property, or industry&#10;Intention to divide profits among partners"
                  className="w-full p-2.5 border border-slate-300 rounded-md font-serif text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Relevant Provisions / Citations (one per line)
                </label>
                <textarea
                  rows={2}
                  value={provisionsText}
                  onChange={(e) => setProvisionsText(e.target.value)}
                  placeholder="e.g. Article 1767, Civil Code&#10;Article 1769, Civil Code"
                  className="w-full p-2.5 border border-slate-300 rounded-md font-mono text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <label htmlFor="isActiveCheck" className="text-slate-800 font-semibold cursor-pointer">
                  Active in Student Assessments
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium"
                >
                  {saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
