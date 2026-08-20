import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { V3EvaluationReviewDetail } from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Sparkles,
  ShieldCheck,
  Scale,
  BookOpen,
} from 'lucide-react';

const ERROR_CATEGORIES = [
  { id: 'STATUTORY_MISINTERPRETATION', label: 'Statutory Misinterpretation' },
  { id: 'MISSING_LEGAL_ELEMENT', label: 'Missing Legal Element' },
  { id: 'MISSING_JURISPRUDENCE', label: 'Missing Jurisprudence / Doctrine' },
  { id: 'INCORRECT_LEGAL_REASONING', label: 'Incorrect Legal Reasoning (IRAC)' },
  { id: 'OVER_PENALIZATION', label: 'Over-Penalization' },
  { id: 'UNDER_PENALIZATION', label: 'Under-Penalization' },
  { id: 'HALLUCINATION_UNSUPPORTED_CLAIM', label: 'Unsupported Claim / Hallucination' },
  { id: 'OTHER', label: 'Other Minor Divergence' },
];

export const PostV3ReviewWorkspace: React.FC = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<V3EvaluationReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'ai_eval' | 'question_ref'>('ai_eval');

  // Form State
  const [agreementRating, setAgreementRating] = useState<number>(4);
  const [reasoningCorrectnessRating, setReasoningCorrectnessRating] = useState<number>(4);
  const [statutoryGroundingRating, setStatutoryGroundingRating] = useState<number>(4);
  const [recommendedScore, setRecommendedScore] = useState<number>(85);
  const [errorTags, setErrorTags] = useState<string[]>([]);
  const [qualitativeComments, setQualitativeComments] = useState<string>('');
  const [improvementSuggestions, setImprovementSuggestions] = useState<string>('');
  const [finalVerdict, setFinalVerdict] = useState<string>('ACCEPTABLE');

  useEffect(() => {
    if (evaluationId) {
      loadEvaluation(evaluationId);
    }
  }, [evaluationId]);

  const loadEvaluation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.finalReviews.getEvaluation(id);
      setDetail(res.data);

      if (res.data.existingReview) {
        const rev = res.data.existingReview;
        setAgreementRating(rev.agreementRating);
        setReasoningCorrectnessRating(rev.reasoningCorrectnessRating);
        setStatutoryGroundingRating(rev.statutoryGroundingRating);
        setRecommendedScore(rev.recommendedScore);
        setErrorTags(rev.errorTags || []);
        setQualitativeComments(rev.qualitativeComments || '');
        setImprovementSuggestions(rev.improvementSuggestions || '');
        setFinalVerdict(rev.finalVerdict || 'ACCEPTABLE');
      } else {
        setRecommendedScore(res.data.v3AiScore);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation details.');
    } finally {
      setLoading(false);
    }
  };

  const toggleErrorTag = (tagId: string) => {
    if (detail?.existingReview) return; // Locked if already submitted
    setErrorTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!evaluationId) return;
    try {
      setSubmitting(true);
      setError(null);

      await api.finalReviews.submitReview(evaluationId, {
        agreementRating,
        reasoningCorrectnessRating,
        statutoryGroundingRating,
        recommendedScore,
        errorTags,
        qualitativeComments,
        improvementSuggestions,
        finalVerdict,
      });

      setShowConfirmModal(false);
      await loadEvaluation(evaluationId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit post-V3 review.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="animate-spin w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        Loading Post-V3 evaluation workspace...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-4">
          <div className="flex items-center gap-3 font-semibold text-base">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            Error Loading Workspace
          </div>
          <p className="text-sm">{error || 'Evaluation not found.'}</p>
          <button
            onClick={() => navigate('/expert/post-v3-reviews')}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  const isSubmitted = !!detail.existingReview;
  const scoreDelta = Math.round((recommendedScore - detail.v3AiScore) * 10) / 10;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/expert/post-v3-reviews')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                {detail.studentAnonymizedCode}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">{detail.question.code}</span>
              {isSubmitted && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  <Lock className="w-3 h-3" /> Locked Review
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">{detail.question.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">V3 AI Score</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {detail.v3AiScore} <span className="text-xs font-normal text-slate-400">/ {detail.v3MaxScore}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Split-Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Student Essay & Unblinded V3 AI Evaluation (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveLeftTab('ai_eval')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                activeLeftTab === 'ai_eval'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" /> V3 AI Evaluation Output
            </button>
            <button
              onClick={() => setActiveLeftTab('question_ref')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                activeLeftTab === 'question_ref'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-600" /> Scenario & Model Benchmark
            </button>
          </div>

          {activeLeftTab === 'ai_eval' ? (
            /* AI Evaluation Details Card */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                    V3
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">AI Scoring Rationale & IRAC Basis</h2>
                    <p className="text-xs text-slate-500">Full output generated by optimized Agent Version 3</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-semibold text-xs">
                    {detail.v3AiScore} / {detail.v3MaxScore} pts
                  </span>
                </div>
              </div>

              {/* Comprehensive Scoring Basis */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Scoring Basis
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {detail.v3ScoringBasis}
                </div>
              </div>

              {/* Criterion Breakdown */}
              {detail.v3CriterionScores && detail.v3CriterionScores.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Criterion-Level Evaluation
                  </h3>
                  <div className="space-y-3">
                    {detail.v3CriterionScores.map((crit, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-900">{crit.criterionName}</span>
                          <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {crit.score} / {crit.maxPoints} pts
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{crit.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Missing Elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Identified Strengths
                  </h4>
                  <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
                    {detail.v3Strengths.length > 0 ? (
                      detail.v3Strengths.map((str, i) => <li key={i}>{str}</li>)
                    ) : (
                      <li className="italic text-emerald-600">None highlighted</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 bg-rose-50/60 border border-rose-200/70 rounded-xl">
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Missing / Deficient Elements
                  </h4>
                  <ul className="text-xs text-rose-800 space-y-1.5 list-disc list-inside">
                    {detail.v3MissingElements.length > 0 ? (
                      detail.v3MissingElements.map((mis, i) => <li key={i}>{mis}</li>)
                    ) : (
                      <li className="italic text-rose-600">None detected</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Question Scenario & Benchmark Card */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Question Scenario
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm leading-relaxed">
                  {detail.question.scenario}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Model Reference Answer
                </h3>
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-slate-800 text-sm leading-relaxed">
                  {detail.question.modelAnswer}
                </div>
              </div>

              {detail.question.statutoryElements && detail.question.statutoryElements.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Required Statutory Elements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.question.statutoryElements.map((elem, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium"
                      >
                        {elem}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Essay Response Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" /> Student's Original Essay Answer
              </h3>
              <span className="text-xs font-mono font-medium text-slate-500">
                {detail.studentAnonymizedCode}
              </span>
            </div>
            <div className="p-4 bg-amber-50/20 border border-amber-200/40 rounded-xl text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-serif">
              {detail.studentAnswer}
            </div>
          </div>
        </div>

        {/* Right Pane: Structured Expert Review Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Post-V3 Final Review Form</h2>
                <p className="text-xs text-slate-500">Rate agreement, legal grounding & classify errors</p>
              </div>
              <Scale className="w-5 h-5 text-amber-600" />
            </div>

            {/* 1. Overall Agreement Rating (1-5) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>1. Overall Agreement with AI Score</span>
                <span className="font-mono text-amber-700 font-bold">{agreementRating} / 5</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => setAgreementRating(val)}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      agreementRating === val
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 px-1">
                <span>Strongly Disagree</span>
                <span>Strongly Agree</span>
              </div>
            </div>

            {/* 2. Legal Reasoning Correctness (1-5) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>2. Legal Reasoning (IRAC) Correctness</span>
                <span className="font-mono text-amber-700 font-bold">{reasoningCorrectnessRating} / 5</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => setReasoningCorrectnessRating(val)}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      reasoningCorrectnessRating === val
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Statutory Grounding (1-5) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>3. Statutory & Doctrine Grounding</span>
                <span className="font-mono text-amber-700 font-bold">{statutoryGroundingRating} / 5</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => setStatutoryGroundingRating(val)}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      statutoryGroundingRating === val
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Expert Recommended Score & Delta */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>4. Expert Recommended Score</span>
                <span className="text-[11px] font-mono text-slate-500">
                  AI: {detail.v3AiScore} | Δ: {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                </span>
              </label>
              <input
                type="number"
                disabled={isSubmitted}
                min={0}
                max={detail.v3MaxScore}
                value={recommendedScore}
                onChange={(e) => setRecommendedScore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 5. Error Category Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                5. Error Category Classification
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ERROR_CATEGORIES.map((cat) => {
                  const isSelected = errorTags.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => toggleErrorTag(cat.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                        isSelected
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Qualitative Expert Comments */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                6. Qualitative Expert Commentary
              </label>
              <textarea
                disabled={isSubmitted}
                rows={3}
                value={qualitativeComments}
                onChange={(e) => setQualitativeComments(e.target.value)}
                placeholder="Enter expert analysis of the AI evaluation's merits or flaws..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 7. Recommended Improvement Suggestions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                7. Refinement Recommendations
              </label>
              <textarea
                disabled={isSubmitted}
                rows={2}
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                placeholder="Suggestions for future agent iterations..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 8. Final Verdict */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">8. Final Assessment Verdict</label>
              <div className="space-y-2">
                {[
                  { id: 'ACCEPTABLE', label: 'Acceptable (Sound Legal Quality)', color: 'text-emerald-700' },
                  {
                    id: 'ACCEPTABLE_WITH_MINOR_ISSUES',
                    label: 'Acceptable with Minor Issues',
                    color: 'text-amber-700',
                  },
                  {
                    id: 'REQUIRES_IMPROVEMENT',
                    label: 'Requires Improvement',
                    color: 'text-rose-700',
                  },
                ].map((verdict) => (
                  <label
                    key={verdict.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                      finalVerdict === verdict.id
                        ? 'border-amber-500 bg-amber-50/50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="finalVerdict"
                      disabled={isSubmitted}
                      value={verdict.id}
                      checked={finalVerdict === verdict.id}
                      onChange={() => setFinalVerdict(verdict.id)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className={verdict.color}>{verdict.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            {!isSubmitted ? (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Submit Final Expert Review
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Final Review Submitted & Locked
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 font-bold text-lg">
              <ShieldCheck className="w-6 h-6" />
              Confirm Post-V3 Final Review
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              You are about to submit your expert validation review for evaluation{' '}
              <strong className="text-slate-900">{detail.question.code}</strong>.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p>• Agreement Rating: <strong>{agreementRating} / 5</strong></p>
              <p>• Recommended Score: <strong>{recommendedScore} pts</strong> (Δ {scoreDelta})</p>
              <p>• Final Verdict: <strong>{finalVerdict.replace(/_/g, ' ')}</strong></p>
            </div>
            <p className="text-xs text-rose-600 font-medium">
              Notice: Once submitted, this review will be saved as immutable research evidence and cannot be edited.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Confirm & Commit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
