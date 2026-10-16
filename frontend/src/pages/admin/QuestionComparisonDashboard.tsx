import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ComparisonSubNav } from '../../components/admin/ComparisonSubNav';
import {
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';


interface ModelStats {
  modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
  researchName: string;
  exactModelId: string;
  modelFamily: string;
  evaluationsCount: number;
  studentCount: number;
  meanForm: number;
  meanAnswer: number;
  meanRule: number;
  meanApplication: number;
  meanConclusion: number;
  meanRawTotal: number;
  meanRoundedTotal: number;
  scoreDistribution: Record<number, number>;
}

interface QuestionLevelData {
  question: {
    id: string;
    code: string;
    title: string;
    testSet: string;
    orderIndex: number;
    prompt: string;
    modelAnswer: string;
  };
  filterMeta: {
    selectedTestSet: string;
    selectedAgentVersionTag: string;
    isDemo: boolean;
    matchedOnly: boolean;
  };
  sampleSize: number;
  matchedSampleSize: number;
  availableQuestions: Array<{ id: string; code: string; title: string; orderIndex: number; testSet: string }>;
  availableVersions: Array<{ id: string; versionTag: string; label: string; evaluationCount: number }>;
  models: {
    MODEL_A: ModelStats;
    MODEL_B: ModelStats;
    MODEL_C: ModelStats;
  };
  studentBreakdown: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    sessionId: string;
    submittedAt: string;
    studentAnswer: string;
    modelA?: any;
    modelB?: any;
    modelC?: any;
  }>;
}

export const QuestionComparisonDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const testSetParam = searchParams.get('testSet') || 'TEST_1';
  const qCodeParam = searchParams.get('questionCode') || '';
  const isDemoParam = searchParams.get('isDemo') === 'true' || searchParams.get('version') === 'V2';

  const [selectedTestSet, setSelectedTestSet] = useState<string>(testSetParam);
  const [selectedQuestionCode, setSelectedQuestionCode] = useState<string>(qCodeParam);
  const [isDemo, setIsDemo] = useState<boolean>(isDemoParam);
  const selectedVersion = isDemo ? 'V2' : 'V1';

  const [data, setData] = useState<QuestionLevelData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showScenario, setShowScenario] = useState<boolean>(false);
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);

  useEffect(() => {
    loadQuestionData();
  }, [selectedTestSet, selectedQuestionCode, selectedVersion, isDemo]);

  async function loadQuestionData() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.modelComparisons.getQuestionLevel({
        testSet: selectedTestSet,
        questionCode: selectedQuestionCode || undefined,
        agentVersionTag: selectedVersion,
        isDemo,
      });

      if (res.success && res.data) {
        setData(res.data);
        if (!selectedQuestionCode && res.data.question) {
          setSelectedQuestionCode(res.data.question.code);
        }
      } else {
        throw new Error('Failed to retrieve question-level comparison data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading question data');
    } finally {
      setLoading(false);
    }
  }

  const toggleStudent = (studentId: string) => {
    setExpandedStudents((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleDownloadCsv = async () => {
    try {
      setExportingCsv(true);
      const blob = await api.modelComparisons.downloadCsv('question-level', {
        testSet: selectedTestSet,
        agentVersionTag: selectedVersion,
        isDemo,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lexify_QUESTION_LEVEL_${selectedTestSet}_${selectedQuestionCode || 'ALL'}_${selectedVersion}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('CSV Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingCsv(false);
    }
  };


  return (
    <div className="space-y-6 w-full py-1">
      {/* Shared Comparison Sub-Navigation Header */}
      <ComparisonSubNav currentTestSet={selectedTestSet} />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Controls and Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Dataset Selector: Research vs Demo */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsDemo(false);
                  setSearchParams({
                    testSet: selectedTestSet,
                    questionCode: selectedQuestionCode,
                    version: 'V1',
                    isDemo: 'false',
                  });
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${
                  !isDemo
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Research Study (V1)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDemo(true);
                  setSearchParams({
                    testSet: selectedTestSet,
                    questionCode: selectedQuestionCode,
                    version: 'V2',
                    isDemo: 'true',
                  });
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${
                  isDemo
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Official Retest (V2)
              </button>
            </div>

            {/* Test Set Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTestSet(t);
                    setSelectedQuestionCode('');
                    setSearchParams({
                      testSet: t,
                      version: selectedVersion,
                      isDemo: String(isDemo),
                    });
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    selectedTestSet === t
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              disabled={exportingCsv || !data}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              {exportingCsv ? 'Exporting...' : 'Export Question CSV'}
            </button>
          </div>
        </div>

        {/* Question Selector Pills */}
        {data?.availableQuestions && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-2 px-1 flex items-center justify-between">
              <span>SELECT QUESTION (Q01–Q10):</span>
              <span className="text-[11px] text-slate-400">Total in Test: {data.availableQuestions.length} Questions</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
              {data.availableQuestions.map((q) => {
                const isSelected = data.question.id === q.id || selectedQuestionCode === q.code;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestionCode(q.code);
                      setSearchParams({ testSet: selectedTestSet, questionCode: q.code, version: selectedVersion, isDemo: String(isDemo) });
                    }}
                    title={`${q.code}: ${q.title}`}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                    }`}
                  >
                    <span>{q.code.split('-')[1] || q.code}</span>
                    <span className={`text-[10px] font-normal truncate max-w-full ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {q.title.split(':')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
            <p className="text-sm text-slate-600 font-medium">Aggregating question-level evaluations from SQLite database...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <div>
              <div className="font-semibold">Unable to load Question-Level Comparison</div>
              <div className="text-xs text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && data && (
          <>
            {/* Selected Question Header Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                      {data.question.code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {data.question.testSet}
                    </span>
                    <span className="text-xs text-slate-500">
                      Order: #{data.question.orderIndex}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {data.question.title}
                  </h2>
                </div>

                <div className="flex items-center gap-4 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-center px-2">
                    <div className="font-bold text-slate-900 text-base">{data.sampleSize}</div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Students Evaluated</div>
                  </div>
                  <div className="border-r border-slate-300 h-8"></div>
                  <div className="text-center px-2">
                    <div className="font-bold text-indigo-700 text-base">{data.matchedSampleSize}</div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Matched Submissions</div>
                  </div>
                </div>
              </div>

              {/* Collapsible Legal Scenario & Reference Answer */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowScenario(!showScenario)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {showScenario ? 'Hide Question Scenario & Reference Answer' : 'View Question Scenario & Reference Answer'}
                  {showScenario ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showScenario && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 mb-1">FACTUAL SCENARIO (STUDENT PROMPT):</div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-slate-200">
                        {data.question.prompt}
                      </p>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 mb-1">REFERENCE MODEL ANSWER:</div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-slate-200">
                        {data.question.modelAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Three-Model Metrics Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Three-Model Criterion Scoring Breakdown for {data.question.code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Averaged across {data.sampleSize} student responses under Agent Version {selectedVersion}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-700 text-left font-bold">
                      <th className="py-3 px-4">Evaluation Metric</th>
                      <th className="py-3 px-4 text-center">Max Points / Weight</th>
                      <th className="py-3 px-4 text-center bg-indigo-50/40 text-indigo-900 border-l border-r border-indigo-100">
                        Meta Llama 3.2 3B
                      </th>
                      <th className="py-3 px-4 text-center bg-emerald-50/40 text-emerald-900 border-r border-emerald-100">
                        Microsoft Phi-4-mini
                      </th>
                      <th className="py-3 px-4 text-center bg-amber-50/40 text-amber-900">
                        Google Gemma 2 2B
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {/* Form */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Form (Clarity & Structure)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">15% (15 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanForm.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanForm.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanForm.toFixed(2)}
                      </td>
                    </tr>

                    {/* Answer */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Answer (Direct Legal Stance)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">15% (15 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanAnswer.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanAnswer.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanAnswer.toFixed(2)}
                      </td>
                    </tr>

                    {/* Rule */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Rule (Statutory Articulation)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">30% (30 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanRule.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanRule.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanRule.toFixed(2)}
                      </td>
                    </tr>

                    {/* Application */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Application (Fact-Rule Synthesis)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">30% (30 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanApplication.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanApplication.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanApplication.toFixed(2)}
                      </td>
                    </tr>

                    {/* Conclusion */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Conclusion (Closing Resolution)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">10% (10 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanConclusion.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanConclusion.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanConclusion.toFixed(2)}
                      </td>
                    </tr>

                    {/* Mean Raw Total /100 */}
                    <tr className="bg-slate-100/60 font-bold">
                      <td className="py-3 px-4 text-slate-900">Mean Raw Total (%)</td>
                      <td className="py-3 px-4 text-center text-slate-600">100%</td>
                      <td className="py-3 px-4 text-center text-indigo-900 bg-indigo-100/40 border-l border-r border-indigo-200">
                        {data.models.MODEL_A.meanRawTotal.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-900 bg-emerald-100/40 border-r border-emerald-200">
                        {data.models.MODEL_B.meanRawTotal.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-center text-amber-900 bg-amber-100/40">
                        {data.models.MODEL_C.meanRawTotal.toFixed(2)}%
                      </td>
                    </tr>

                    {/* Mean Rounded Total /5 */}
                    <tr className="bg-slate-200/50 font-extrabold text-sm border-t-2 border-slate-300">
                      <td className="py-3 px-4 text-slate-900">Mean Rounded Total (/5)</td>
                      <td className="py-3 px-4 text-center text-slate-600">5.00</td>
                      <td className="py-3 px-4 text-center text-indigo-950 bg-indigo-200/50 border-l border-r border-indigo-200">
                        {data.models.MODEL_A.meanRoundedTotal.toFixed(2)} / 5
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-950 bg-emerald-200/50 border-r border-emerald-200">
                        {data.models.MODEL_B.meanRoundedTotal.toFixed(2)} / 5
                      </td>
                      <td className="py-3 px-4 text-center text-amber-950 bg-amber-200/50">
                        {data.models.MODEL_C.meanRoundedTotal.toFixed(2)} / 5
                      </td>
                    </tr>

                    {/* Evaluations Count */}
                    <tr className="text-slate-500 text-[11px]">
                      <td className="py-2 px-4 font-normal">Evaluations Count (n)</td>
                      <td className="py-2 px-4 text-center">—</td>
                      <td className="py-2 px-4 text-center font-bold text-slate-700 bg-indigo-50/10 border-l border-r border-indigo-100">
                        n = {data.models.MODEL_A.evaluationsCount}
                      </td>
                      <td className="py-2 px-4 text-center font-bold text-slate-700 bg-emerald-50/10 border-r border-emerald-100">
                        n = {data.models.MODEL_B.evaluationsCount}
                      </td>
                      <td className="py-2 px-4 text-center font-bold text-slate-700 bg-amber-50/10">
                        n = {data.models.MODEL_C.evaluationsCount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Charts Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Criterion Means Comparison Chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">
                  Criterion Averages Comparison
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Scores scaled to rubric weights (Form/15, Answer/15, Rule/30, Application/30, Conclusion/10)
                </p>

                <div className="space-y-4">
                  {[
                    { label: 'Form (max 15)', a: data.models.MODEL_A.meanForm, b: data.models.MODEL_B.meanForm, c: data.models.MODEL_C.meanForm, max: 15 },
                    { label: 'Answer (max 15)', a: data.models.MODEL_A.meanAnswer, b: data.models.MODEL_B.meanAnswer, c: data.models.MODEL_C.meanAnswer, max: 15 },
                    { label: 'Rule (max 30)', a: data.models.MODEL_A.meanRule, b: data.models.MODEL_B.meanRule, c: data.models.MODEL_C.meanRule, max: 30 },
                    { label: 'Application (max 30)', a: data.models.MODEL_A.meanApplication, b: data.models.MODEL_B.meanApplication, c: data.models.MODEL_C.meanApplication, max: 30 },
                    { label: 'Conclusion (max 10)', a: data.models.MODEL_A.meanConclusion, b: data.models.MODEL_B.meanConclusion, c: data.models.MODEL_C.meanConclusion, max: 10 },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>{row.label}</span>
                        <div className="flex gap-3 text-[11px]">
                          <span className="text-indigo-600">Llama: {row.a.toFixed(1)}</span>
                          <span className="text-emerald-600">Phi: {row.b.toFixed(1)}</span>
                          <span className="text-amber-600">Gemma: {row.c.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-1 p-0.5">
                        <div
                          style={{ width: `${(row.a / row.max) * 100}%` }}
                          className="bg-indigo-500 rounded-full h-full transition-all duration-500"
                          title={`Llama: ${row.a}/${row.max}`}
                        ></div>
                        <div
                          style={{ width: `${(row.b / row.max) * 100}%` }}
                          className="bg-emerald-500 rounded-full h-full transition-all duration-500"
                          title={`Phi: ${row.b}/${row.max}`}
                        ></div>
                        <div
                          style={{ width: `${(row.c / row.max) * 100}%` }}
                          className="bg-amber-500 rounded-full h-full transition-all duration-500"
                          title={`Gemma: ${row.c}/${row.max}`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 mt-5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                    <span className="font-medium text-slate-700">Meta Llama 3.2 3B</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="font-medium text-slate-700">Microsoft Phi-4-mini</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="font-medium text-slate-700">Google Gemma 2 2B</span>
                  </div>
                </div>
              </div>

              {/* Mean Rounded Total /5 Bar Chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">
                    Mean Rounded Total (/5.00) Comparison
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-6">
                    Averaged 5-point final grade under custom rounding rule (≤.50 down, &gt;.50 up)
                  </p>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    {/* Model A */}
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">Llama 3.2 3B</span>
                      <div className="my-3">
                        <div className="text-3xl font-extrabold text-indigo-700">
                          {data.models.MODEL_A.meanRoundedTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-indigo-500 font-medium">/ 5.00 points</div>
                      </div>
                      <span className="text-[10px] text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded font-semibold">
                        Raw: {data.models.MODEL_A.meanRawTotal.toFixed(1)}%
                      </span>
                    </div>

                    {/* Model B */}
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">Phi-4-mini</span>
                      <div className="my-3">
                        <div className="text-3xl font-extrabold text-emerald-700">
                          {data.models.MODEL_B.meanRoundedTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-emerald-500 font-medium">/ 5.00 points</div>
                      </div>
                      <span className="text-[10px] text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold">
                        Raw: {data.models.MODEL_B.meanRawTotal.toFixed(1)}%
                      </span>
                    </div>

                    {/* Model C */}
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">Gemma 2 2B</span>
                      <div className="my-3">
                        <div className="text-3xl font-extrabold text-amber-700">
                          {data.models.MODEL_C.meanRoundedTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-amber-500 font-medium">/ 5.00 points</div>
                      </div>
                      <span className="text-[10px] text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded font-semibold">
                        Raw: {data.models.MODEL_C.meanRawTotal.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                  <div className="font-semibold text-slate-700 mb-0.5">Mandatory Custom Rounding Policy:</div>
                  Fractional score ≤ 0.50 rounds down; &gt; 0.50 rounds up. At exactly 0.50, rounds down. Individual rubric criteria maintain decimal precision.
                </div>
              </div>
            </div>

            {/* Individual Student Responses & Evaluations Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Individual Student Evaluations for {data.question.code} ({data.studentBreakdown.length} Students)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspect each student's submitted text and compare the three local models' grading, criteria, and feedback
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {data.studentBreakdown.map((st) => {
                  const isExpanded = !!expandedStudents[st.studentId];
                  return (
                    <div key={st.studentId} className="transition-colors hover:bg-slate-50/50">
                      {/* Summary Row */}
                      <div
                        onClick={() => toggleStudent(st.studentId)}
                        className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {st.studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{st.studentName}</div>
                            <div className="text-xs text-slate-500">{st.studentEmail}</div>
                          </div>
                        </div>

                        {/* Model Scores Badges */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Llama: {st.modelA ? `${st.modelA.roundedScore}/5` : '—'}
                            </span>
                            <span className="px-2.5 py-1 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Phi: {st.modelB ? `${st.modelB.roundedScore}/5` : '—'}
                            </span>
                            <span className="px-2.5 py-1 rounded-md font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Gemma: {st.modelC ? `${st.modelC.roundedScore}/5` : '—'}
                            </span>
                          </div>
                          <div className="text-slate-400 p-1">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Detail Panel */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 bg-slate-50 border-t border-slate-100 space-y-4">
                          {/* Student's Actual Submitted Text */}
                          <div>
                            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                              Student Submitted Answer Text:
                            </div>
                            <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                              {st.studentAnswer || <span className="italic text-slate-400">No answer text recorded</span>}
                            </div>
                          </div>

                          {/* Side-by-Side Model Evaluation Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Model A */}
                            <div className="bg-white p-3.5 rounded-lg border border-indigo-200 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                                <span className="font-bold text-xs text-indigo-900">Meta Llama 3.2 3B</span>
                                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                                  {st.modelA ? `${st.modelA.roundedScore}/5 (${st.modelA.numericalScore}%)` : 'Not Evaluated'}
                                </span>
                              </div>
                              {st.modelA && (
                                <>
                                  <div className="grid grid-cols-5 text-center text-[10px] bg-indigo-50/50 p-1.5 rounded font-semibold text-slate-700">
                                    <div>F: {st.modelA.formScore}</div>
                                    <div>A: {st.modelA.answerScore}</div>
                                    <div>R: {st.modelA.ruleScore}</div>
                                    <div>Ap: {st.modelA.applicationScore}</div>
                                    <div>C: {st.modelA.conclusionScore}</div>
                                  </div>
                                  <p className="text-[11px] text-slate-600 line-clamp-4 leading-relaxed">
                                    {st.modelA.scoringBasis}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Model B */}
                            <div className="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                                <span className="font-bold text-xs text-emerald-900">Microsoft Phi-4-mini</span>
                                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  {st.modelB ? `${st.modelB.roundedScore}/5 (${st.modelB.numericalScore}%)` : 'Not Evaluated'}
                                </span>
                              </div>
                              {st.modelB && (
                                <>
                                  <div className="grid grid-cols-5 text-center text-[10px] bg-emerald-50/50 p-1.5 rounded font-semibold text-slate-700">
                                    <div>F: {st.modelB.formScore}</div>
                                    <div>A: {st.modelB.answerScore}</div>
                                    <div>R: {st.modelB.ruleScore}</div>
                                    <div>Ap: {st.modelB.applicationScore}</div>
                                    <div>C: {st.modelB.conclusionScore}</div>
                                  </div>
                                  <p className="text-[11px] text-slate-600 line-clamp-4 leading-relaxed">
                                    {st.modelB.scoringBasis}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Model C */}
                            <div className="bg-white p-3.5 rounded-lg border border-amber-200 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                                <span className="font-bold text-xs text-amber-900">Google Gemma 2 2B</span>
                                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                  {st.modelC ? `${st.modelC.roundedScore}/5 (${st.modelC.numericalScore}%)` : 'Not Evaluated'}
                                </span>
                              </div>
                              {st.modelC && (
                                <>
                                  <div className="grid grid-cols-5 text-center text-[10px] bg-amber-50/50 p-1.5 rounded font-semibold text-slate-700">
                                    <div>F: {st.modelC.formScore}</div>
                                    <div>A: {st.modelC.answerScore}</div>
                                    <div>R: {st.modelC.ruleScore}</div>
                                    <div>Ap: {st.modelC.applicationScore}</div>
                                    <div>C: {st.modelC.conclusionScore}</div>
                                  </div>
                                  <p className="text-[11px] text-slate-600 line-clamp-4 leading-relaxed">
                                    {st.modelC.scoringBasis}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
