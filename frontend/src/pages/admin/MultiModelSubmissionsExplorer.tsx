import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminEvaluation, Question } from '../../types';
import { percentageToCustomFivePoint } from '../../utils/scoring';
import {
  FileText,
  Cpu,
  ChevronDown,
  ChevronUp,
  Sliders,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface GroupedSubmission {
  sessionId: string;
  studentName: string;
  studentEmail: string;
  questionId: string;
  questionCode: string;
  questionTitle?: string;
  studentAnswer: string;
  createdAt: string;
  modelA?: AdminEvaluation;
  modelB?: AdminEvaluation;
  modelC?: AdminEvaluation;
}

export const MultiModelSubmissionsExplorer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { evaluationId: routeEvalId } = useParams<{ evaluationId?: string }>();
  const targetEvalId = searchParams.get('evalId') || routeEvalId;
  const targetSessionId = searchParams.get('sessionId');
  const targetQuestionId = searchParams.get('questionId');
  const targetSlot = searchParams.get('slot') as 'MODEL_A' | 'MODEL_B' | 'MODEL_C' | null;

  const [evaluations, setEvaluations] = useState<AdminEvaluation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionCode, setSelectedQuestionCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Detail Modal State
  const [inspectItem, setInspectItem] = useState<{
    submission: GroupedSubmission;
    initialModelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
    selectedEvalId?: string;
  } | null>(null);
  const [selectedModalSlot, setSelectedModalSlot] = useState<'MODEL_A' | 'MODEL_B' | 'MODEL_C'>('MODEL_A');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [evalRes, qRes] = await Promise.all([
        api.evaluations.getAdminList({}),
        api.questions.list(true),
      ]);
      setEvaluations(evalRes.data?.evaluations || []);
      setQuestions(qRes.data || []);
    } catch (err) {
      console.error('Failed to load evaluations:', err);
    } finally {
      setLoading(false);
    }
  }

  // Group evaluations by session & question
  const groupedSubmissions: GroupedSubmission[] = React.useMemo(() => {
    const map = new Map<string, GroupedSubmission>();

    evaluations.forEach((e) => {
      const q = questions.find((item) => item.id === e.questionId);
      const qCode = q?.code || e.questionSnapshot?.code || 'COMM-Q01';
      const qTitle = q?.title || e.questionSnapshot?.title || '';
      const key = `${e.sessionId}_${e.questionId}`;

      if (!map.has(key)) {
        map.set(key, {
          sessionId: e.sessionId,
          studentName: e.studentName || 'Student',
          studentEmail: e.studentEmail || 'student@example.com',
          questionId: e.questionId,
          questionCode: qCode,
          questionTitle: qTitle,
          studentAnswer: e.studentAnswer,
          createdAt: String(e.createdAt),
        });
      }

      const entry = map.get(key)!;
      if (e.modelSlot === 'MODEL_A' || (!e.modelSlot && !entry.modelA)) {
        entry.modelA = e;
      } else if (e.modelSlot === 'MODEL_B') {
        entry.modelB = e;
      } else if (e.modelSlot === 'MODEL_C') {
        entry.modelC = e;
      }
    });

    return Array.from(map.values()).filter((item) => {
      if (selectedQuestionCode !== 'ALL' && item.questionCode !== selectedQuestionCode) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.studentName.toLowerCase().includes(q);
        const matchEmail = item.studentEmail.toLowerCase().includes(q);
        const matchAnswer = item.studentAnswer.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchAnswer) return false;
      }
      return true;
    });
  }, [evaluations, questions, selectedQuestionCode, searchQuery]);

  // Deep-link auto-open when evalId, sessionId, or questionId is passed
  useEffect(() => {
    if (!loading && groupedSubmissions.length > 0) {
      if (targetEvalId) {
        const found = groupedSubmissions.find(
          (sub) =>
            sub.modelA?.id === targetEvalId ||
            sub.modelB?.id === targetEvalId ||
            sub.modelC?.id === targetEvalId
        );
        if (found) {
          const slot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C' =
            found.modelA?.id === targetEvalId
              ? 'MODEL_A'
              : found.modelB?.id === targetEvalId
              ? 'MODEL_B'
              : found.modelC?.id === targetEvalId
              ? 'MODEL_C'
              : targetSlot || 'MODEL_A';

          setInspectItem({ submission: found, initialModelSlot: slot, selectedEvalId: targetEvalId });
          setSelectedModalSlot(slot);
          setExpandedRow(`${found.sessionId}_${found.questionId}`);
        }
      } else if (targetSessionId && targetQuestionId) {
        const found = groupedSubmissions.find(
          (sub) => sub.sessionId === targetSessionId && sub.questionId === targetQuestionId
        );
        if (found) {
          const slot = targetSlot || 'MODEL_A';
          setInspectItem({ submission: found, initialModelSlot: slot });
          setSelectedModalSlot(slot);
          setExpandedRow(`${found.sessionId}_${found.questionId}`);
        }
      }
    }
  }, [loading, groupedSubmissions, targetEvalId, targetSessionId, targetQuestionId, targetSlot]);

  const openInspector = (sub: GroupedSubmission, slot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C') => {
    const selectedEval = slot === 'MODEL_A' ? sub.modelA : slot === 'MODEL_B' ? sub.modelB : sub.modelC;
    setInspectItem({ submission: sub, initialModelSlot: slot, selectedEvalId: selectedEval?.id });
    setSelectedModalSlot(slot);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Commercial Law Research Evaluation
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Three-Model Submissions & Comparison Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Side-by-side independent evaluations across Meta Llama 3.2 3B, Microsoft Phi-4-mini, and Google Gemma 2 2B.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <input
            type="text"
            placeholder="Search student or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium placeholder:text-slate-400"
          />

          <select
            value={selectedQuestionCode}
            onChange={(e) => setSelectedQuestionCode(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All questions</option>
            {questions.map((q) => (
              <option key={q.id} value={q.code}>
                {q.code}: {q.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Submissions Comparative Table */}
      {loading ? (
        <div className="bg-white rounded-lg p-12 text-center border border-slate-200 text-slate-500 text-xs">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2"></div>
          Loading submissions and model evaluations...
        </div>
      ) : groupedSubmissions.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-slate-200 text-slate-500 text-xs">
          <p className="font-medium text-slate-700">No submissions found matching filter.</p>
          <p className="text-slate-400 mt-1">Submitted student assessments will appear here for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedSubmissions.map((sub) => {
            const key = `${sub.sessionId}_${sub.questionId}`;
            const isExpanded = expandedRow === key;

            const modelScores = [
              sub.modelA
                ? (sub.modelA.roundedScore ?? percentageToCustomFivePoint(sub.modelA.numericalScore))
                : null,
              sub.modelB
                ? (sub.modelB.roundedScore ?? percentageToCustomFivePoint(sub.modelB.numericalScore))
                : null,
              sub.modelC
                ? (sub.modelC.roundedScore ?? percentageToCustomFivePoint(sub.modelC.numericalScore))
                : null,
            ].filter((g) => g !== null) as number[];

            const maxDelta =
              modelScores.length >= 2
                ? Math.round((Math.max(...modelScores) - Math.min(...modelScores)) * 100) / 100
                : 0;

            return (
              <div
                key={key}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden"
              >
                {/* Row Header */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-medium bg-slate-200 text-slate-800">
                        {sub.questionCode}
                      </span>
                      <span className="font-semibold text-slate-900">{sub.studentName}</span>
                      <span className="text-slate-400 font-mono">{sub.studentEmail}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Session: <span className="font-mono">{sub.sessionId.slice(0, 8)}...</span> · Submitted: {new Date(sub.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Model delta</span>
                      <span className={`font-mono font-semibold ${maxDelta > 0.75 ? 'text-amber-700' : 'text-slate-700'}`}>
                        {maxDelta.toFixed(2)} pts
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedRow(isExpanded ? null : key)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <span>{isExpanded ? 'Hide response' : 'View response'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Student Answer */}
                {isExpanded && (
                  <div className="p-4 bg-white border-b border-slate-200 text-xs">
                    <div className="text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Student submitted response</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md font-serif text-slate-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {sub.studentAnswer}
                    </div>
                  </div>
                )}

                {/* Triple-Model Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
                  <ModelColumn
                    researchName="Llama 3.2 3B"
                    exactModel="llama3.2:3b"
                    evalRecord={sub.modelA}
                    onInspect={() => openInspector(sub, 'MODEL_A')}
                  />
                  <ModelColumn
                    researchName="Phi-4-mini 3.8B"
                    exactModel="phi4-mini:3.8b"
                    evalRecord={sub.modelB}
                    onInspect={() => openInspector(sub, 'MODEL_B')}
                  />
                  <ModelColumn
                    researchName="Gemma 2 2B"
                    exactModel="gemma2:2b"
                    evalRecord={sub.modelC}
                    onInspect={() => openInspector(sub, 'MODEL_C')}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Evaluation Inspection Modal */}
      {inspectItem && (
        <DetailedEvaluationModal
          inspectItem={inspectItem}
          selectedSlot={selectedModalSlot}
          onSelectSlot={setSelectedModalSlot}
          onClose={() => setInspectItem(null)}
        />
      )}
    </div>
  );
};

interface ModelColumnProps {
  researchName: string;
  exactModel: string;
  evalRecord?: AdminEvaluation;
  onInspect: () => void;
}

const ModelColumn: React.FC<ModelColumnProps> = ({
  researchName,
  exactModel,
  evalRecord,
  onInspect,
}) => {
  if (!evalRecord) {
    return (
      <div className="p-4 text-center text-slate-400 text-xs space-y-1">
        <Cpu className="w-5 h-5 mx-auto text-slate-300" />
        <div className="font-medium text-slate-600">{researchName}</div>
        <p className="text-[11px]">Evaluation pending</p>
      </div>
    );
  }

  const criteria = evalRecord.criterionScores || [];
  const formScore = evalRecord.formScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'form')?.score ?? 0;
  const answerScore = evalRecord.answerScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'answer')?.score ?? 0;
  const ruleScore = evalRecord.ruleScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'rule')?.score ?? 0;
  const applicationScore = evalRecord.applicationScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'application')?.score ?? 0;
  const conclusionScore = evalRecord.conclusionScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'conclusion')?.score ?? 0;

  const rawScore = evalRecord.numericalScore;
  const finalScore =
    evalRecord.roundedScore !== undefined
      ? evalRecord.roundedScore
      : percentageToCustomFivePoint(rawScore);

  return (
    <div className="p-4 space-y-3 text-xs flex flex-col justify-between">
      <div className="space-y-3">
        {/* Model Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-900">{researchName}</span>
            <span className="text-[10px] text-slate-400 font-mono block">{exactModel}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-slate-900">{finalScore}</span>
            <span className="text-[10px] text-slate-400 block">/ 5 ({rawScore}%)</span>
          </div>
        </div>

        {/* Criteria Breakdown Table */}
        <div className="border border-slate-200 rounded-md overflow-hidden text-[11px]">
          <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-200 p-1.5 text-center text-slate-500 font-medium">
            <span>Form</span>
            <span>Ans</span>
            <span>Rule</span>
            <span>App</span>
            <span>Conc</span>
          </div>
          <div className="grid grid-cols-5 p-1.5 text-center font-medium text-slate-800">
            <span>{formScore}<span className="text-slate-400 text-[10px]">/15</span></span>
            <span>{answerScore}<span className="text-slate-400 text-[10px]">/15</span></span>
            <span>{ruleScore}<span className="text-slate-400 text-[10px]">/30</span></span>
            <span>{applicationScore}<span className="text-slate-400 text-[10px]">/30</span></span>
            <span>{conclusionScore}<span className="text-slate-400 text-[10px]">/10</span></span>
          </div>
        </div>

        {/* Qualitative Basis Snippet */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-medium block mb-1">Evaluation basis:</span>
          <p className="text-[11px] text-slate-600 font-serif leading-relaxed line-clamp-3">
            "{evalRecord.scoringBasis}"
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex justify-end">
        <button
          onClick={onInspect}
          className="text-[11px] font-medium text-slate-700 hover:text-slate-900 underline"
        >
          Inspect full analysis →
        </button>
      </div>
    </div>
  );
};

interface DetailedModalProps {
  inspectItem: {
    submission: GroupedSubmission;
    initialModelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
    selectedEvalId?: string;
  };
  selectedSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
  onSelectSlot: (slot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C') => void;
  onClose: () => void;
}

const DetailedEvaluationModal: React.FC<DetailedModalProps> = ({
  inspectItem,
  selectedSlot,
  onSelectSlot,
  onClose,
}) => {
  const { submission, initialModelSlot, selectedEvalId } = inspectItem;
  const currentEval =
    selectedSlot === 'MODEL_A'
      ? submission.modelA
      : selectedSlot === 'MODEL_B'
      ? submission.modelB
      : submission.modelC;

  const isInitiallySelected = selectedSlot === initialModelSlot || (selectedEvalId && currentEval?.id === selectedEvalId);

  const modelMeta = {
    MODEL_A: { name: 'Meta Llama 3.2 3B', tag: 'llama3.2:3b' },
    MODEL_B: { name: 'Microsoft Phi-4-mini', tag: 'phi4-mini:3.8b' },
    MODEL_C: { name: 'Google Gemma 2 2B', tag: 'gemma2:2b' },
  }[selectedSlot];

  const criteria = currentEval?.criterionScores || [];
  const formScore = currentEval?.formScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'form')?.score ?? 0;
  const answerScore = currentEval?.answerScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'answer')?.score ?? 0;
  const ruleScore = currentEval?.ruleScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'rule')?.score ?? 0;
  const applicationScore = currentEval?.applicationScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'application')?.score ?? 0;
  const conclusionScore = currentEval?.conclusionScore ?? criteria.find((c) => c.criterionName?.toLowerCase() === 'conclusion')?.score ?? 0;

  const rawWeightedPct = currentEval ? currentEval.numericalScore : 0;
  const calculatedFinal = currentEval
    ? (currentEval.roundedScore ?? percentageToCustomFivePoint(rawWeightedPct))
    : 0;

  const lexical = currentEval?.lexicalAnalysis || {};
  const semantic = currentEval?.semanticAnalysis || {};

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8 border border-slate-200 shadow-xl overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                {submission.questionCode}
              </span>
              <span className="font-bold text-slate-900 text-sm">{submission.studentName}</span>
              <span className="text-slate-400 font-mono text-[11px]">({submission.studentEmail})</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Session: <span className="font-mono">{submission.sessionId}</span> · Submitted: {new Date(submission.createdAt).toLocaleString()}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Evaluation Identification Box */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white font-mono text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                MODEL EVALUATION
              </span>
              {isInitiallySelected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  SELECTED EVALUATION
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 mr-2">Stored Score:</span>
              <span className="font-mono font-bold text-base text-slate-900">
                {calculatedFinal} / 5
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-lg p-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Student</span>
              <span className="font-semibold text-slate-900 block">{submission.studentName}</span>
              <span className="text-[10px] font-mono text-slate-400 truncate block">{submission.studentEmail}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Question</span>
              <span className="font-mono font-semibold text-slate-900 block">{submission.questionCode}</span>
              <span className="text-[10px] text-slate-500 block truncate">{submission.questionTitle || 'Partnership Scenario'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Model</span>
              <span className="font-semibold text-slate-900 block">{modelMeta.name}</span>
              <span className="text-[10px] font-mono text-slate-400 block">{modelMeta.tag}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Evaluation ID</span>
              <span className="font-mono text-[10px] text-slate-700 block truncate" title={currentEval?.id || 'N/A'}>
                {currentEval?.id ? `${currentEval.id.slice(0, 14)}...` : 'Pending'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Slot: <span className="font-mono font-semibold">{selectedSlot}</span>
              </span>
            </div>
          </div>

          {/* Criterion Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="px-3.5 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Criterion Breakdown (SCORING CRITERIA AND INSTRUCTION.pdf)</span>
              <span className="text-[11px] font-mono text-slate-600 font-normal">
                Weighted: <strong className="text-slate-900">{rawWeightedPct}%</strong> · Final: <strong className="text-slate-900">{calculatedFinal} / 5</strong>
              </span>
            </div>
            <div className="grid grid-cols-5 divide-x divide-slate-200 text-center text-xs">
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Form</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{formScore}</span>
                <span className="text-[10px] text-slate-400">/15</span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Answer</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{answerScore}</span>
                <span className="text-[10px] text-slate-400">/15</span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Rule</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{ruleScore}</span>
                <span className="text-[10px] text-slate-400">/30</span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Application</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{applicationScore}</span>
                <span className="text-[10px] text-slate-400">/30</span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Conclusion</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{conclusionScore}</span>
                <span className="text-[10px] text-slate-400">/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Comparison Selector Tabs */}
        <div className="px-5 pt-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-2">Compare all models:</span>
            {(['MODEL_A', 'MODEL_B', 'MODEL_C'] as const).map((slot) => {
              const isSelected = selectedSlot === slot;
              const evalForSlot =
                slot === 'MODEL_A' ? submission.modelA : slot === 'MODEL_B' ? submission.modelB : submission.modelC;
              const slotName = slot === 'MODEL_A' ? 'Llama 3.2 3B' : slot === 'MODEL_B' ? 'Phi-4-mini 3.8B' : 'Gemma 2 2B';
              const isOrig = slot === initialModelSlot;

              return (
                <button
                  key={slot}
                  onClick={() => onSelectSlot(slot)}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-md border-t border-x transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white border-slate-200 text-slate-900 -mb-[1px]'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{slotName}</span>
                  <span className="font-mono text-[11px]">
                    {evalForSlot
                      ? `(${evalForSlot.roundedScore ?? percentageToCustomFivePoint(evalForSlot.numericalScore)})`
                      : '(N/A)'}
                  </span>
                  {isOrig && (
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded uppercase">
                      Origin
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto">
          {/* Verbatim Student Answer */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-700 block">Student Submitted Response:</span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-serif text-slate-800 whitespace-pre-wrap leading-relaxed">
              {submission.studentAnswer}
            </div>
          </div>

          {currentEval ? (
            <div className="space-y-4">
              {/* Score & Rubric Breakdown */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-slate-500 block">Model & Score:</span>
                  <span className="text-base font-bold text-slate-900">{modelMeta.name}</span>
                  <span className="text-[11px] font-mono text-slate-400 block">{modelMeta.tag}</span>
                </div>

                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    {currentEval.roundedScore ?? percentageToCustomFivePoint(currentEval.numericalScore)}{' '}
                    <span className="text-xs text-slate-500 font-normal">/ 5 ({currentEval.numericalScore}%)</span>
                  </span>
                </div>
              </div>

              {/* Rubric Breakdown */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <div className="grid grid-cols-5 bg-slate-100 p-2 text-center font-semibold text-slate-700 border-b border-slate-200">
                  <span>Form (/15)</span>
                  <span>Answer (/15)</span>
                  <span>Rule (/30)</span>
                  <span>Application (/30)</span>
                  <span>Conclusion (/10)</span>
                </div>
                <div className="grid grid-cols-5 p-2.5 text-center font-mono font-bold text-slate-900 bg-white">
                  <span>{formScore}</span>
                  <span>{answerScore}</span>
                  <span>{ruleScore}</span>
                  <span>{applicationScore}</span>
                  <span>{conclusionScore}</span>
                </div>
              </div>

              {/* Lexical Analysis */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  Lexical Analysis Findings
                </span>
                <div className="text-slate-700 leading-relaxed space-y-1">
                  <div>
                    Word Count: <span className="font-mono font-medium">{lexical.wordCount ?? submission.studentAnswer.split(/\s+/).length}</span> words · Sentences: <span className="font-mono font-medium">{lexical.sentenceCount ?? 3}</span>
                  </div>
                  {lexical.recognizedConcepts && (
                    <div>
                      Recognized Concepts: <span className="font-medium text-slate-900">{JSON.stringify(lexical.recognizedConcepts)}</span>
                    </div>
                  )}
                  {lexical.missingConcepts && (
                    <div>
                      Missing Concepts: <span className="font-medium text-slate-900">{JSON.stringify(lexical.missingConcepts)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Semantic Analysis & Evaluation Basis */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  Semantic Evaluation Basis ({modelMeta.name})
                </span>
                {semantic && Object.keys(semantic).length > 0 && (
                  <div className="text-[11px] text-slate-600 mb-2 font-sans">
                    Legal Reasoning & Doctrinal Alignment: <span className="font-medium text-slate-800">{semantic.legalReasoning || semantic.reasoning || 'Evaluated'}</span>
                  </div>
                )}
                <p className="text-slate-800 font-serif leading-relaxed whitespace-pre-line">
                  {currentEval.scoringBasis}
                </p>
              </div>

              {/* Points for Further Elaboration & Strengths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentEval.strengths && currentEval.strengths.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <span className="font-semibold text-slate-800 block mb-1">Identified Legal Principles:</span>
                    <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                      {currentEval.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentEval.missingElements && currentEval.missingElements.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <span className="font-semibold text-slate-800 block mb-1">Points for Further Elaboration:</span>
                    <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                      {currentEval.missingElements.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Provenance Footer */}
              <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-md text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                <div>
                  Skill: <span className="font-medium text-slate-700">Commercial Law Evaluation Skill V1.0</span> · Prompt: <span className="font-medium text-slate-700">Two-Pass Evidence Grounding v2.0</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{new Date(currentEval.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              Evaluation record unavailable for {modelMeta.name}.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
