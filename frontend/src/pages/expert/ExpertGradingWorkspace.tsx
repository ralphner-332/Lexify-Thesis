import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { ExpertSubmissionDetail } from '../../types';
import {
  Scale,
  ShieldCheck,
  BookOpen,
  FileText,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export const ExpertGradingWorkspace: React.FC = () => {
  const { sessionId, questionId } = useParams<{ sessionId: string; questionId: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<ExpertSubmissionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Form State
  const [criterionScores, setCriterionScores] = useState<
    Array<{ criterionName: string; score: number; maxPoints: number; reasoning: string }>
  >([]);
  const [scoringBasis, setScoringBasis] = useState<string>('');
  const [qualitativeComments, setQualitativeComments] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'SCENARIO' | 'REFERENCE' | 'ELEMENTS'>('SCENARIO');

  const fetchSubmission = async () => {
    if (!sessionId || !questionId) return;
    try {
      setLoading(true);
      const res = await api.expert.getSubmission(sessionId, questionId);
      setSubmission(res.data);

      // Initialize form from draft or existing submission
      const criteriaList = res.data.rubricCriteria.map((rc) => {
        const existingDraftCrit = res.data.draft?.criterionScores?.find(
          (dc) => dc.criterionName === rc.name
        );
        return {
          criterionName: rc.name,
          score: existingDraftCrit ? existingDraftCrit.score : Math.round(rc.maxPoints * 0.8),
          maxPoints: rc.maxPoints,
          reasoning: existingDraftCrit?.reasoning || '',
        };
      });

      setCriterionScores(criteriaList);
      setScoringBasis(res.data.draft?.scoringBasis || '');
      setQualitativeComments(res.data.draft?.qualitativeComments || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load submission for evaluation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [sessionId, questionId]);

  const maxTotalScore = submission?.rubricCriteria.reduce((sum, c) => sum + c.maxPoints, 0) || 100;
  const currentTotalScore = Math.round(
    criterionScores.reduce((sum, c) => sum + (Number(c.score) || 0), 0) * 10
  ) / 10;

  const handleCriterionScoreChange = (index: number, newScore: number) => {
    const updated = [...criterionScores];
    const max = updated[index].maxPoints;
    const clamped = Math.max(0, Math.min(max, newScore));
    updated[index].score = clamped;
    setCriterionScores(updated);
  };

  const handleCriterionReasoningChange = (index: number, text: string) => {
    const updated = [...criterionScores];
    updated[index].reasoning = text;
    setCriterionScores(updated);
  };

  const handleSaveDraft = async () => {
    if (!sessionId || !questionId) return;
    try {
      setSavingDraft(true);
      setError(null);
      await api.expert.saveDraft(sessionId, questionId, {
        numericalScore: currentTotalScore,
        scoringBasis,
        criterionScores,
        qualitativeComments,
      });
      setSuccessMsg('Draft evaluation saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!sessionId || !questionId) return;
    if (!scoringBasis.trim()) {
      setError('Please provide an overarching legal scoring basis before submitting.');
      setShowConfirmModal(false);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.expert.submitEvaluation(sessionId, questionId, {
        numericalScore: currentTotalScore,
        scoringBasis,
        criterionScores,
        qualitativeComments,
      });
      setShowConfirmModal(false);
      navigate('/expert');
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 max-w-4xl mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
        Loading evaluation workspace...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 font-semibold">
          {error || 'Submission not found'}
        </div>
        <button
          onClick={() => navigate('/expert')}
          className="text-xs text-indigo-600 font-bold hover:underline inline-flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Queue
        </button>
      </div>
    );
  }

  const isSubmitted = submission.isSubmitted;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/expert')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                {submission.question.code}
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                {submission.studentAnonymizedCode}
              </span>
              {isSubmitted && (
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked Research Evidence
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">
              {submission.question.title}
            </h1>
          </div>
        </div>

        {/* Live Score & Actions */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Score</span>
            <span className="text-xl font-black text-indigo-700">
              {currentTotalScore}{' '}
              <span className="text-xs font-normal text-slate-400">/ {maxTotalScore} pts</span>
            </span>
          </div>

          {!isSubmitted && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submit Evaluation</span>
              </button>
            </div>
          )}
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

      {/* Main Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Materials & Student Answer */}
        <div className="lg:col-span-5 space-y-6">
          {/* Reference Materials Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 flex">
              <button
                onClick={() => setActiveTab('SCENARIO')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 text-center transition ${
                  activeTab === 'SCENARIO'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Factual Scenario
              </button>
              <button
                onClick={() => setActiveTab('REFERENCE')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 text-center transition ${
                  activeTab === 'REFERENCE'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Model Answer
              </button>
              <button
                onClick={() => setActiveTab('ELEMENTS')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 text-center transition ${
                  activeTab === 'ELEMENTS'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Legal Elements
              </button>
            </div>

            <div className="p-4 text-xs text-slate-700 max-h-72 overflow-y-auto leading-relaxed">
              {activeTab === 'SCENARIO' && (
                <div>
                  <p className="whitespace-pre-line text-slate-800 font-serif text-sm">
                    {submission.question.scenario}
                  </p>
                </div>
              )}

              {activeTab === 'REFERENCE' && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                    <strong className="text-indigo-900 block mb-1 font-semibold flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1" />
                      Authoritative Benchmark Model Answer
                    </strong>
                    <p className="whitespace-pre-line text-slate-800 font-serif leading-relaxed">
                      {submission.question.modelAnswer}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'ELEMENTS' && (
                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">
                      Statutory Legal Elements Checklist:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {submission.question.statutoryElements.map((el, i) => (
                        <li key={i}>{el}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block mb-1">
                      Relevant RPC Provisions / Citations:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {submission.question.relevantProvisions.map((prov, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]"
                        >
                          {prov}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Essay Response Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-900 flex items-center">
                <FileText className="w-4 h-4 mr-1 text-indigo-600" />
                Student's Submitted Essay Answer
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {submission.studentAnonymizedCode}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-serif text-sm leading-relaxed max-h-96 overflow-y-auto whitespace-pre-line">
              {submission.studentAnswer || '(No answer text submitted)'}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Expert Grading Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Scale className="w-4 h-4 mr-1.5 text-indigo-600" />
                Rubric-Grounded Independent Evaluation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign criterion points and provide qualitative legal rationales.
              </p>
            </div>

            {/* Criteria Scoring Inputs */}
            <div className="space-y-4 divide-y divide-slate-100">
              {criterionScores.map((crit, idx) => (
                <div key={crit.criterionName} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900">
                        {crit.criterionName}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Max points: {crit.maxPoints} pts
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={crit.maxPoints}
                        step="0.5"
                        disabled={isSubmitted}
                        value={crit.score}
                        onChange={(e) =>
                          handleCriterionScoreChange(idx, parseFloat(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 text-center font-bold text-slate-900 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-500">
                        / {crit.maxPoints}
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={crit.maxPoints}
                    step="0.5"
                    disabled={isSubmitted}
                    value={crit.score}
                    onChange={(e) =>
                      handleCriterionScoreChange(idx, parseFloat(e.target.value) || 0)
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  <div>
                    <input
                      type="text"
                      disabled={isSubmitted}
                      placeholder={`Criterion reasoning for ${crit.criterionName}...`}
                      value={crit.reasoning}
                      onChange={(e) => handleCriterionReasoningChange(idx, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Overarching Legal Scoring Basis */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="font-bold text-xs text-slate-900 block">
                Comprehensive Legal Scoring Rationale *
              </label>
              <textarea
                rows={4}
                disabled={isSubmitted}
                placeholder="Explain legal evaluation reasoning, statutory element analysis, and IRAC adherence..."
                value={scoringBasis}
                onChange={(e) => setScoringBasis(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 leading-relaxed placeholder-slate-400"
              />
            </div>

            {/* Qualitative Legal Comments */}
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-slate-900 block">
                Qualitative Legal Notes & Suggestions (Optional)
              </label>
              <textarea
                rows={2}
                disabled={isSubmitted}
                placeholder="Additional feedback, jurisprudential notes, or observations..."
                value={qualitativeComments}
                onChange={(e) => setQualitativeComments(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-700">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Independent Submission
              </h3>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                You are submitting an independent evaluation score of{' '}
                <strong className="text-indigo-900 font-black text-sm">
                  {currentTotalScore} / {maxTotalScore} pts
                </strong>{' '}
                for <span className="font-mono font-bold text-slate-800">{submission.studentAnonymizedCode}</span> on question{' '}
                <span className="font-mono font-bold text-slate-800">{submission.question.code}</span>.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold">
                ⚠️ Once submitted, this evaluation becomes immutable academic research evidence and cannot be altered or deleted.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEvaluation}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {submitting ? 'Committing...' : 'Confirm & Commit Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
