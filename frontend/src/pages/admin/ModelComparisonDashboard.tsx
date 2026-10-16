import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminEvaluation, Question } from '../../types';
import { percentageToCustomFivePoint } from '../../utils/scoring';
import { Search, Users, Sparkles, FileSpreadsheet } from 'lucide-react';
import { ComparisonSubNav } from '../../components/admin/ComparisonSubNav';

interface QuestionRow {
  key: string;
  questionId: string;
  questionCode: string;
  questionTitle: string;
  orderIndex: number;
  modelA?: AdminEvaluation;
  modelB?: AdminEvaluation;
  modelC?: AdminEvaluation;
}

interface StudentGroup {
  key: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  sessionId: string;
  isDemo: boolean;
  agentVersionTag: string;
  questions: QuestionRow[];
  llamaWeightedScore: number;
  phiWeightedScore: number;
  gemmaWeightedScore: number;
}

export const ModelComparisonDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTestSet = (searchParams.get('testSet') as 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4') || 'TEST_1';
  const targetStudentId = searchParams.get('studentId');
  const targetSessionId = searchParams.get('sessionId');
  const isDemoParam = searchParams.get('isDemo');

  const [selectedTestSet, setSelectedTestSet] = useState<'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4'>(
    ['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4'].includes(initialTestSet) ? initialTestSet : 'TEST_1'
  );
  const [selectedDataset, setSelectedDataset] = useState<'ALL' | 'RESEARCH' | 'DEMO'>(
    isDemoParam === 'true' ? 'DEMO' : isDemoParam === 'false' ? 'RESEARCH' : 'ALL'
  );
  const [activeSessionFilter, setActiveSessionFilter] = useState<string | null>(targetSessionId);
  const [evaluations, setEvaluations] = useState<AdminEvaluation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await api.exports.getClassRecordExcel({ testSet: selectedTestSet });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lexify_CLASS_RECORD_${selectedTestSet}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export Excel: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingExcel(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected test set if query param changes
  useEffect(() => {
    const testSetParam = searchParams.get('testSet') as 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4';
    if (testSetParam && ['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4'].includes(testSetParam)) {
      setSelectedTestSet(testSetParam);
    }
    const sessParam = searchParams.get('sessionId');
    if (sessParam) {
      setActiveSessionFilter(sessParam);
    }
  }, [searchParams]);

  async function loadData() {
    setLoading(true);
    try {
      const [evalRes, qRes] = await Promise.all([
        api.evaluations.getAdminList({ limit: 2000 }),
        api.questions.list(false),
      ]);
      setEvaluations(evalRes.data?.evaluations || []);
      setQuestions(qRes.data || []);
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    } finally {
      setLoading(false);
    }
  }

  const extractCriterion = (ev?: AdminEvaluation, name?: string): number => {
    if (!ev || !ev.criterionScores) return 0;
    const item = ev.criterionScores.find((c: any) =>
      c.criterionName?.toLowerCase().includes(name?.toLowerCase() || '')
    );
    return item?.score ?? 0;
  };

  const computeTotal = (ev?: AdminEvaluation): number => {
    if (!ev) return 0;
    if (ev.roundedScore !== undefined) return ev.roundedScore;
    return percentageToCustomFivePoint(ev.numericalScore || 0);
  };

  // Group and sort data: Scoped by Session -> Test Set -> Students A-Z -> Questions (Q01-Q10) -> Weighted Score
  const studentGroups: StudentGroup[] = React.useMemo(() => {
    // 1. Filter evaluations for the selected test set
    const prefix = selectedTestSet.replace('_', ''); // e.g. TEST1, TEST2
    const relevantEvals = evaluations.filter((e) => {
      const q = questions.find((item) => item.id === e.questionId);
      const qSet = q?.testSet || e.questionSnapshot?.testSet;
      const qCode = q?.code || e.questionSnapshot?.code || '';
      return qSet === selectedTestSet || qCode.startsWith(prefix);
    });

    // 2. Group evaluations by exact sessionId (or fallback to studentId if sessionId missing)
    const sessionMap = new Map<string, {
      key: string;
      studentId: string;
      studentName: string;
      studentEmail: string;
      sessionId: string;
      isDemo: boolean;
      agentVersionTag: string;
      questionMap: Map<string, QuestionRow>;
    }>();

    relevantEvals.forEach((e) => {
      const q = questions.find((item) => item.id === e.questionId);
      const qCode = q?.code || e.questionSnapshot?.code || 'Q01';
      const qTitle = q?.title || e.questionSnapshot?.title || '';
      const orderIndex = q?.orderIndex ?? e.questionSnapshot?.orderIndex ?? 0;
      const sessionKey = e.sessionId || e.studentId || 'unknown-session';

      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          key: sessionKey,
          studentId: e.studentId,
          studentName: e.studentName || 'Student',
          studentEmail: e.studentEmail || '',
          sessionId: e.sessionId || '',
          isDemo: Boolean(e.isDemo),
          agentVersionTag: e.agentVersionTag || (e.isDemo ? 'V2' : 'V1'),
          questionMap: new Map<string, QuestionRow>(),
        });
      }

      const st = sessionMap.get(sessionKey)!;
      if (e.isDemo !== undefined) st.isDemo = Boolean(e.isDemo);
      if (e.agentVersionTag) st.agentVersionTag = e.agentVersionTag;

      const qKey = e.questionId || qCode;
      if (!st.questionMap.has(qKey)) {
        st.questionMap.set(qKey, {
          key: `${sessionKey}_${qKey}`,
          questionId: e.questionId,
          questionCode: qCode,
          questionTitle: qTitle,
          orderIndex,
        });
      }

      const qRow = st.questionMap.get(qKey)!;
      if (e.modelSlot === 'MODEL_A' || (!e.modelSlot && !qRow.modelA)) {
        qRow.modelA = e;
      } else if (e.modelSlot === 'MODEL_B') {
        qRow.modelB = e;
      } else if (e.modelSlot === 'MODEL_C') {
        qRow.modelC = e;
      }
    });

    // 3. Transform to array
    let groups: StudentGroup[] = Array.from(sessionMap.values()).map((st) => {
      const questionsList = Array.from(st.questionMap.values());
      // Sort questions: Q01 -> Q10 strictly by orderIndex or numeric natural code sort
      questionsList.sort((a, b) => {
        if (a.orderIndex !== b.orderIndex) {
          return a.orderIndex - b.orderIndex;
        }
        return a.questionCode.localeCompare(b.questionCode, undefined, { numeric: true });
      });

      // Calculate Weighted Scores independently per model (Sum of Q01..Q10 final grades, max 50.00)
      let llamaSum = 0;
      let phiSum = 0;
      let gemmaSum = 0;

      questionsList.forEach((q) => {
        llamaSum += computeTotal(q.modelA);
        phiSum += computeTotal(q.modelB);
        gemmaSum += computeTotal(q.modelC);
      });

      return {
        key: st.key,
        studentId: st.studentId,
        studentName: st.studentName,
        studentEmail: st.studentEmail,
        sessionId: st.sessionId,
        isDemo: st.isDemo,
        agentVersionTag: st.agentVersionTag,
        questions: questionsList,
        llamaWeightedScore: llamaSum,
        phiWeightedScore: phiSum,
        gemmaWeightedScore: gemmaSum,
      };
    });

    // 4. Apply dataset filter (Research vs Demo)
    if (selectedDataset === 'RESEARCH') {
      groups = groups.filter((g) => !g.isDemo);
    } else if (selectedDataset === 'DEMO') {
      groups = groups.filter((g) => g.isDemo);
    }

    // 5. Apply active session filter if specified
    if (activeSessionFilter) {
      const matched = groups.filter((g) => g.sessionId === activeSessionFilter);
      if (matched.length > 0) {
        groups = matched;
      }
    }

    // 6. Sort students alphabetically A-Z
    groups.sort((a, b) =>
      a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' })
    );

    // 7. Apply search filter if query is present
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.studentName.toLowerCase().includes(q) ||
        g.studentEmail.toLowerCase().includes(q) ||
        g.sessionId.toLowerCase().includes(q) ||
        g.questions.some((qRow) => qRow.questionCode.toLowerCase().includes(q))
    );
  }, [evaluations, questions, selectedTestSet, searchQuery, selectedDataset, activeSessionFilter]);

  // Deep link automatic scroll & highlight to target student/session
  useEffect(() => {
    if (!loading && (targetStudentId || targetSessionId) && studentGroups.length > 0) {
      const targetGroup = studentGroups.find(
        (g) =>
          (targetSessionId && g.sessionId === targetSessionId) ||
          (targetStudentId && g.studentId === targetStudentId)
      );

      if (targetGroup) {
        setHighlightedStudentId(targetGroup.sessionId || targetGroup.studentId);

        const scrollTimer = setTimeout(() => {
          const container = containerRef.current;
          const element =
            document.getElementById(`student-group-${targetGroup.sessionId}`) ||
            document.getElementById(`student-group-${targetGroup.studentId}`);

          if (container && element) {
            if (studentGroups[0]?.sessionId === targetGroup.sessionId) {
              container.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              const thead = container.querySelector('thead');
              const theadHeight = thead ? thead.offsetHeight : 72;
              const elementRect = element.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              const relativeTop = elementRect.top - containerRect.top;
              const targetScrollTop = container.scrollTop + relativeTop - theadHeight - 4;

              container.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth',
              });
            }

            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 150);

        const timer = setTimeout(() => {
          setHighlightedStudentId(null);
        }, 4000);

        return () => {
          clearTimeout(scrollTimer);
          clearTimeout(timer);
        };
      }
    }
  }, [loading, targetStudentId, targetSessionId, studentGroups]);

  const testName =
    selectedTestSet === 'TEST_1'
      ? 'Test 1'
      : selectedTestSet === 'TEST_2'
      ? 'Test 2'
      : selectedTestSet === 'TEST_3'
      ? 'Test 3'
      : 'Test 4';

  const totalQuestionsCount = studentGroups.reduce((acc, g) => acc + g.questions.length, 0);

  return (
    <div className="space-y-6 w-full py-1">
      {/* Shared Comparison Sub-Navigation Header */}
      <ComparisonSubNav currentTestSet={selectedTestSet} />

      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Empirical Multi-LLM Evaluation · Research Comparison
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Model Comparison
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Side-by-side legal evaluations across LLAMA 3.2, PHI-4 MINI, and GEMMA 2 with per-student weighted score summaries.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Test Set Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'TEST_1' as const, label: 'Test 1' },
              { id: 'TEST_2' as const, label: 'Test 2' },
              { id: 'TEST_3' as const, label: 'Test 3' },
              { id: 'TEST_4' as const, label: 'Test 4' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTestSet(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedTestSet === t.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Dataset Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'ALL' as const, label: 'All Datasets' },
              { id: 'RESEARCH' as const, label: 'Research (V1)' },
              { id: 'DEMO' as const, label: 'Official Retest (V2)' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDataset(d.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedDataset === d.id
                    ? d.id === 'DEMO'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search student or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Export to Excel button */}
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition shadow-xs cursor-pointer whitespace-nowrap"
            title={`Export ${testName} Evaluation Matrix to Excel spreadsheet (.xlsx)`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{exportingExcel ? 'Exporting...' : 'Export to Excel'}</span>
          </button>
        </div>
      </div>

      {/* Scoped Session Focus Banner */}
      {activeSessionFilter && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between text-xs text-indigo-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px]">
              Scoped Session
            </span>
            <span>
              Showing exact assessment session: <span className="font-mono font-bold">{activeSessionFilter}</span>
            </span>
          </div>
          <button
            onClick={() => {
              setActiveSessionFilter(null);
              setSearchParams({ testSet: selectedTestSet });
            }}
            className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded font-semibold transition"
          >
            Show All Sessions
          </button>
        </div>
      )}

      {/* Main Comparative Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        {/* Table Sub-header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-900">
              {testName} Evaluation Matrix ({studentGroups.length} Students · {totalQuestionsCount} Question Rows)
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">
            Hierarchy: {testName} → Students A–Z → Questions Q01–Q10 → Weighted Score (/50)
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">Loading comparison matrix...</div>
        ) : studentGroups.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <p className="font-medium text-slate-700">No evaluation records found for {testName}.</p>
            <p className="text-slate-400 mt-1">Completed student assessments for {testName} will populate this comparative table.</p>
          </div>
        ) : (
          <div ref={containerRef} className="max-h-[78vh] overflow-y-auto relative w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* HEADER ROW 1: Sticky Top 0 */}
                <tr className="sticky top-0 z-30 bg-slate-100 border-b border-slate-400 text-slate-800 font-bold uppercase tracking-wider text-[11px] shadow-xs">
                  <th className="py-2 px-3 border-r border-slate-300 bg-slate-100 sticky left-0 z-40 w-36 sm:w-44">
                    Student Name
                  </th>
                  <th className="py-2 px-2 border-r-2 border-slate-400 bg-slate-100 text-center w-20">
                    Question
                  </th>
                  <th className="py-1.5 px-1 text-center border-r-2 border-slate-400 bg-blue-100 text-blue-950 font-bold" colSpan={6}>
                    LLAMA 3.2
                  </th>
                  <th className="py-1.5 px-1 text-center border-r-2 border-slate-400 bg-purple-100 text-purple-950 font-bold" colSpan={6}>
                    PHI-4 MINI
                  </th>
                  <th className="py-1.5 px-1 text-center bg-emerald-100 text-emerald-950 font-bold" colSpan={6}>
                    GEMMA 2
                  </th>
                </tr>

                {/* HEADER ROW 2: Sticky Top 32px */}
                <tr className="sticky top-[32px] z-30 bg-slate-100 border-b-2 border-slate-400 text-[10px] font-semibold text-slate-600 text-center shadow-xs">
                  <th className="py-1 px-3 bg-slate-100 border-r border-slate-300 sticky left-0 z-40 text-left font-sans text-slate-600">
                    Question Description
                  </th>
                  <th className="py-1 px-2 bg-slate-100 border-r-2 border-slate-400 text-center text-slate-700 font-bold">
                    Code
                  </th>

                  {/* Llama 3.2 Sub-columns */}
                  <th className="py-1 px-1 bg-blue-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Form</div>
                    <div className="text-[8.5px] font-semibold text-blue-700 leading-tight">15%</div>
                  </th>
                  <th className="py-1 px-1 bg-blue-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Answer</div>
                    <div className="text-[8.5px] font-semibold text-blue-700 leading-tight">15%</div>
                  </th>
                  <th className="py-1 px-1 bg-blue-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Rule</div>
                    <div className="text-[8.5px] font-semibold text-blue-700 leading-tight">30%</div>
                  </th>
                  <th className="py-1 px-1 bg-blue-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Application</div>
                    <div className="text-[8.5px] font-semibold text-blue-700 leading-tight">30%</div>
                  </th>
                  <th className="py-1 px-1 bg-blue-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Conclusion</div>
                    <div className="text-[8.5px] font-semibold text-blue-700 leading-tight">10%</div>
                  </th>
                  <th className="py-1 px-1.5 bg-blue-100 font-bold text-blue-950 border-r-2 border-slate-400 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Total</div>
                    <div className="text-[8.5px] font-semibold text-blue-800 leading-tight">100%</div>
                  </th>

                  {/* Phi-4 Mini Sub-columns */}
                  <th className="py-1 px-1 bg-purple-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Form</div>
                    <div className="text-[8.5px] font-semibold text-purple-700 leading-tight">15%</div>
                  </th>
                  <th className="py-1 px-1 bg-purple-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Answer</div>
                    <div className="text-[8.5px] font-semibold text-purple-700 leading-tight">15%</div>
                  </th>
                  <th className="py-1 px-1 bg-purple-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Rule</div>
                    <div className="text-[8.5px] font-semibold text-purple-700 leading-tight">30%</div>
                  </th>
                  <th className="py-1 px-1 bg-purple-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Application</div>
                    <div className="text-[8.5px] font-semibold text-purple-700 leading-tight">30%</div>
                  </th>
                  <th className="py-1 px-1 bg-purple-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Conclusion</div>
                    <div className="text-[8.5px] font-semibold text-purple-700 leading-tight">10%</div>
                  </th>
                  <th className="py-1 px-1.5 bg-purple-100 font-bold text-purple-950 border-r-2 border-slate-400 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Total</div>
                    <div className="text-[8.5px] font-semibold text-purple-800 leading-tight">100%</div>
                  </th>

                  {/* Gemma 2 Sub-columns */}
                  <th className="py-1 px-1 bg-emerald-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Form</div>
                    <div className="text-[8.5px] font-semibold text-emerald-700 leading-tight">15%</div>
                  </th>
                  <th className="py-1 px-1 bg-emerald-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Answer</div>
                    <div className="text-[8.5px] font-semibold text-emerald-700 leading-tight">15%</div>
                  </th>
                  <th className="py-1 px-1 bg-emerald-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Rule</div>
                    <div className="text-[8.5px] font-semibold text-emerald-700 leading-tight">30%</div>
                  </th>
                  <th className="py-1 px-1 bg-emerald-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Application</div>
                    <div className="text-[8.5px] font-semibold text-emerald-700 leading-tight">30%</div>
                  </th>
                  <th className="py-1 px-1 bg-emerald-50/80 text-slate-800 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Conclusion</div>
                    <div className="text-[8.5px] font-semibold text-emerald-700 leading-tight">10%</div>
                  </th>
                  <th className="py-1 px-1.5 bg-emerald-100 font-bold text-emerald-950 text-center whitespace-nowrap">
                    <div className="font-bold text-[9.5px] leading-tight">Total</div>
                    <div className="text-[8.5px] font-semibold text-emerald-800 leading-tight">100%</div>
                  </th>
                </tr>
              </thead>

              <tbody className="font-mono text-[11px]">
                {studentGroups.map((group) => {
                  const isHighlighted =
                    highlightedStudentId === group.sessionId ||
                    highlightedStudentId === group.studentId;

                  return (
                    <React.Fragment key={group.key || `${group.studentId}_${group.sessionId}`}>
                      {/* Student Section Header */}
                      <tr
                        id={`student-group-${group.sessionId || group.studentId}`}
                        className={`border-t-4 border-t-slate-500 border-b-2 border-b-slate-400 transition-colors duration-500 ${
                          isHighlighted ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-slate-200/90'
                        }`}
                      >
                        <td
                          colSpan={20}
                          className="py-2.5 px-4 font-sans font-bold sticky left-0 z-10 bg-inherit shadow-xs"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-slate-800 text-white px-2 py-0.5 rounded shadow-xs">
                                STUDENT
                              </span>
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                                {group.studentName}
                              </span>
                              <span className="text-xs font-normal text-slate-600 font-mono">
                                ({group.studentEmail})
                              </span>
                              {group.sessionId && (
                                <span className="text-[11px] font-mono text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-300">
                                  Session: {group.sessionId.slice(0, 8)}...
                                </span>
                              )}
                              {group.isDemo ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                  DEMO · Agent Version {group.agentVersionTag}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                                  RESEARCH · Agent Version {group.agentVersionTag}
                                </span>
                              )}
                            </div>
                            {isHighlighted && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded shadow-xs">
                                <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                                <span>Target Focus</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Student's Question Rows (Q01 to Q10) */}
                      {group.questions.map((row) => {
                        const aForm = extractCriterion(row.modelA, 'form');
                        const aAns = extractCriterion(row.modelA, 'answer');
                        const aRule = extractCriterion(row.modelA, 'rule');
                        const aApp = extractCriterion(row.modelA, 'app');
                        const aConc = extractCriterion(row.modelA, 'conc');
                        const aTot = computeTotal(row.modelA);

                        const bForm = extractCriterion(row.modelB, 'form');
                        const bAns = extractCriterion(row.modelB, 'answer');
                        const bRule = extractCriterion(row.modelB, 'rule');
                        const bApp = extractCriterion(row.modelB, 'app');
                        const bConc = extractCriterion(row.modelB, 'conc');
                        const bTot = computeTotal(row.modelB);

                        const cForm = extractCriterion(row.modelC, 'form');
                        const cAns = extractCriterion(row.modelC, 'answer');
                        const cRule = extractCriterion(row.modelC, 'rule');
                        const cApp = extractCriterion(row.modelC, 'app');
                        const cConc = extractCriterion(row.modelC, 'conc');
                        const cTot = computeTotal(row.modelC);

                        return (
                          <tr key={row.key} className="hover:bg-slate-50/80 transition border-b border-slate-200">
                            <td className="py-1.5 px-2.5 font-sans font-normal text-slate-700 border-r border-slate-200 truncate max-w-[150px] sm:max-w-[200px] xl:max-w-[260px] sticky left-0 z-10 bg-white">
                              <span className="text-[11px] text-slate-700" title={row.questionTitle}>
                                {row.questionTitle || group.studentName}
                              </span>
                            </td>
                            <td className="py-1.5 px-1.5 text-center border-r-2 border-slate-400 font-bold text-slate-800 bg-white text-[10.5px]">
                              {row.questionCode}
                            </td>

                            {/* Llama 3.2 */}
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-blue-50/20 text-[10.5px]">{row.modelA ? aForm : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-blue-50/20 text-[10.5px]">{row.modelA ? aAns : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-blue-50/20 text-[10.5px]">{row.modelA ? aRule : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-blue-50/20 text-[10.5px]">{row.modelA ? aApp : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-blue-50/20 text-[10.5px]">{row.modelA ? aConc : '-'}</td>
                            <td className="py-1.5 px-1 text-center font-bold text-blue-950 bg-blue-100/40 border-r-2 border-slate-400 text-[10.5px]">
                              {row.modelA ? aTot : '-'}
                            </td>

                            {/* Phi-4 Mini */}
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-purple-50/20 text-[10.5px]">{row.modelB ? bForm : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-purple-50/20 text-[10.5px]">{row.modelB ? bAns : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-purple-50/20 text-[10.5px]">{row.modelB ? bRule : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-purple-50/20 text-[10.5px]">{row.modelB ? bApp : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-purple-50/20 text-[10.5px]">{row.modelB ? bConc : '-'}</td>
                            <td className="py-1.5 px-1 text-center font-bold text-purple-950 bg-purple-100/40 border-r-2 border-slate-400 text-[10.5px]">
                              {row.modelB ? bTot : '-'}
                            </td>

                            {/* Gemma 2 */}
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-emerald-50/20 text-[10.5px]">{row.modelC ? cForm : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-emerald-50/20 text-[10.5px]">{row.modelC ? cAns : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-emerald-50/20 text-[10.5px]">{row.modelC ? cRule : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-emerald-50/20 text-[10.5px]">{row.modelC ? cApp : '-'}</td>
                            <td className="py-1.5 px-0.5 sm:px-1 text-center text-slate-700 bg-emerald-50/20 text-[10.5px]">{row.modelC ? cConc : '-'}</td>
                            <td className="py-1.5 px-1 text-center font-bold text-emerald-950 bg-emerald-100/40 text-[10.5px]">
                              {row.modelC ? cTot : '-'}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Student's Weighted Score Row (immediately after Q10) */}
                      <tr className="bg-slate-100 font-bold border-t-2 border-t-slate-400 border-b-4 border-b-slate-500 text-[11px]">
                        <td
                          colSpan={2}
                          className="py-2.5 px-3 font-sans uppercase text-slate-900 border-r-2 border-slate-400 sticky left-0 z-10 bg-slate-100 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs tracking-tight text-slate-900">Weighted Score</span>
                            <span className="text-[10px] text-slate-500 font-semibold font-sans">
                              (Sum of Q01–Q10)
                            </span>
                          </div>
                        </td>

                        {/* Llama 3.2 Weighted Score */}
                        <td colSpan={5} className="bg-blue-50/50 border-r border-blue-200"></td>
                        <td className="py-2 px-1 text-center bg-blue-200/80 text-blue-950 font-extrabold border-r-2 border-slate-400 text-xs">
                          {group.llamaWeightedScore}/50
                        </td>

                        {/* Phi-4 Mini Weighted Score */}
                        <td colSpan={5} className="bg-purple-50/50 border-r border-purple-200"></td>
                        <td className="py-2 px-1 text-center bg-purple-200/80 text-purple-950 font-extrabold border-r-2 border-slate-400 text-xs">
                          {group.phiWeightedScore}/50
                        </td>

                        {/* Gemma 2 Weighted Score */}
                        <td colSpan={5} className="bg-emerald-50/50 border-r border-emerald-200"></td>
                        <td className="py-2 px-1 text-center bg-emerald-200/80 text-emerald-950 font-extrabold text-xs">
                          {group.gemmaWeightedScore}/50
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
