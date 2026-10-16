import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ComparisonSubNav } from '../../components/admin/ComparisonSubNav';
import {
  Download,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
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
  meanOverallScore50?: number;
  completeSessionsCount?: number;
  incompleteSessionsCount?: number;
  scoreDistribution: Record<number, number>;
}

interface SummativeData {
  filterMeta: {
    selectedTestSet: string;
    selectedAgentVersionTag: string;
    isDemo: boolean;
    matchedOnly: boolean;
  };
  totalEligibleEvaluations: number;
  totalUniqueStudents: number;
  completeSessionsCount: number;
  incompleteSessionsCount: number;
  availableVersions: Array<{ id: string; versionTag: string; label: string; evaluationCount: number }>;
  availableTestSets: string[];
  models: {
    MODEL_A: ModelStats;
    MODEL_B: ModelStats;
    MODEL_C: ModelStats;
  };
  questionPerformance: Array<{
    questionId: string;
    questionCode: string;
    questionTitle: string;
    orderIndex: number;
    testSet: string;
    modelA: { meanRoundedTotal: number; meanRawTotal: number; count: number };
    modelB: { meanRoundedTotal: number; meanRawTotal: number; count: number };
    modelC: { meanRoundedTotal: number; meanRawTotal: number; count: number };
  }>;
  matchedSampleSummary?: {
    matchedSampleSize: number;
    models: {
      MODEL_A: { meanRawTotal: number; meanRoundedTotal: number };
      MODEL_B: { meanRawTotal: number; meanRoundedTotal: number };
      MODEL_C: { meanRawTotal: number; meanRoundedTotal: number };
    };
  };
}

export const SummativeComparisonDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const testSetParam = searchParams.get('testSet') || 'ALL';
  const isDemoParam = searchParams.get('isDemo') === 'true' || searchParams.get('version') === 'V2';

  const [selectedTestSet, setSelectedTestSet] = useState<string>(testSetParam);
  const [isDemo, setIsDemo] = useState<boolean>(isDemoParam);
  const selectedVersion = isDemo ? 'V2' : 'V1';

  const [data, setData] = useState<SummativeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  useEffect(() => {
    loadSummativeData();
  }, [selectedTestSet, selectedVersion, isDemo]);

  async function loadSummativeData() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.modelComparisons.getSummative({
        testSet: selectedTestSet,
        agentVersionTag: selectedVersion,
        isDemo,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error('Failed to retrieve summative model comparison data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading summative comparison data');
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadCsv = async (type: string, filenameLabel: string) => {
    try {
      setDownloadingType(type);
      const blob = await api.modelComparisons.downloadCsv(type, {
        testSet: selectedTestSet,
        agentVersionTag: selectedVersion,
        isDemo,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lexify_${filenameLabel.toUpperCase().replace(/\s+/g, '_')}_${selectedTestSet}_${selectedVersion}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed for ${filenameLabel}: ` + (err.message || 'Unknown error'));
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="space-y-6 w-full py-1">
      {/* Shared Comparison Sub-Navigation Header */}
      <ComparisonSubNav currentTestSet={selectedTestSet !== 'ALL' ? selectedTestSet : undefined} />

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
              {['ALL', 'TEST_1', 'TEST_2', 'TEST_3', 'TEST_4'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTestSet(t);
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
                  {t === 'ALL' ? 'All Tests' : t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Badge */}
          {data && (
            <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span>Total Evaluations: <strong className="text-slate-900">{data.totalEligibleEvaluations}</strong></span>
              <span>•</span>
              <span>Students: <strong className="text-slate-900">{data.totalUniqueStudents}</strong></span>
              <span>•</span>
              <span>Complete Sessions (/50): <strong className="text-indigo-700">{data.completeSessionsCount}</strong></span>
            </div>
          )}
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
            <p className="text-sm text-slate-600 font-medium">Computing summative analytics across dataset from SQLite...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <div>
              <div className="font-semibold">Unable to load Summative Model Comparison</div>
              <div className="text-xs text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && data && (
          <>
            {/* Master Summative Comparison Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Master Summative Evaluation Comparison Across Three Independent LLMs
                  </h2>
                  <p className="text-xs text-slate-500">
                    Scope: {selectedTestSet === 'ALL' ? 'All Test Sets' : selectedTestSet} · Agent Version: {selectedVersion} · {isDemo ? 'Demonstration Retest Dataset (V2 Official)' : 'Research Dataset (Demo Excluded)'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-700 text-left font-bold">
                      <th className="py-3 px-4">Rubric Criterion / Metric</th>
                      <th className="py-3 px-4 text-center">Max Scale</th>
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
                    {/* Mean Form */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Mean Form (Clarity & Style)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">15% (15 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanForm.toFixed(2)} / 15
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanForm.toFixed(2)} / 15
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanForm.toFixed(2)} / 15
                      </td>
                    </tr>

                    {/* Mean Answer */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Mean Answer (Direct Legal Stance)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">15% (15 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanAnswer.toFixed(2)} / 15
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanAnswer.toFixed(2)} / 15
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanAnswer.toFixed(2)} / 15
                      </td>
                    </tr>

                    {/* Mean Rule */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Mean Rule (Statutory Articulation)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">30% (30 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanRule.toFixed(2)} / 30
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanRule.toFixed(2)} / 30
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanRule.toFixed(2)} / 30
                      </td>
                    </tr>

                    {/* Mean Application */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Mean Application (Fact-Rule Synthesis)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">30% (30 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanApplication.toFixed(2)} / 30
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanApplication.toFixed(2)} / 30
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanApplication.toFixed(2)} / 30
                      </td>
                    </tr>

                    {/* Mean Conclusion */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Mean Conclusion (Closing Resolution)</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-normal">10% (10 pts)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.meanConclusion.toFixed(2)} / 10
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-emerald-100">
                        {data.models.MODEL_B.meanConclusion.toFixed(2)} / 10
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {data.models.MODEL_C.meanConclusion.toFixed(2)} / 10
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
                    <tr className="bg-slate-200/50 font-bold border-t border-slate-300">
                      <td className="py-3 px-4 text-slate-900">Mean Rounded Total (/5.00)</td>
                      <td className="py-3 px-4 text-center text-slate-600">5.00</td>
                      <td className="py-3 px-4 text-center text-indigo-950 bg-indigo-200/40 border-l border-r border-indigo-200">
                        {data.models.MODEL_A.meanRoundedTotal.toFixed(2)} / 5
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-950 bg-emerald-200/40 border-r border-emerald-200">
                        {data.models.MODEL_B.meanRoundedTotal.toFixed(2)} / 5
                      </td>
                      <td className="py-3 px-4 text-center text-amber-950 bg-amber-200/40">
                        {data.models.MODEL_C.meanRoundedTotal.toFixed(2)} / 5
                      </td>
                    </tr>

                    {/* Mean Overall Score /50 */}
                    <tr className="bg-indigo-50/60 font-extrabold text-sm border-t-2 border-indigo-300">
                      <td className="py-3.5 px-4 text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Mean Overall Score (/50.00)
                      </td>
                      <td className="py-3.5 px-4 text-center text-indigo-900 font-bold">50.00</td>
                      <td className="py-3.5 px-4 text-center text-indigo-950 bg-indigo-200/70 border-l border-r border-indigo-300">
                        {data.models.MODEL_A.meanOverallScore50?.toFixed(2) ?? '0.00'} / 50
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-950 bg-emerald-200/70 border-r border-emerald-300">
                        {data.models.MODEL_B.meanOverallScore50?.toFixed(2) ?? '0.00'} / 50
                      </td>
                      <td className="py-3.5 px-4 text-center text-amber-950 bg-amber-200/70">
                        {data.models.MODEL_C.meanOverallScore50?.toFixed(2) ?? '0.00'} / 50
                      </td>
                    </tr>

                    {/* Evaluation Count */}
                    <tr className="text-slate-500 text-[11px]">
                      <td className="py-2 px-4 font-normal">Evaluation Count (n)</td>
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

                    {/* Unique Student Count */}
                    <tr className="text-slate-500 text-[11px]">
                      <td className="py-2 px-4 font-normal">Unique Students Evaluated</td>
                      <td className="py-2 px-4 text-center">—</td>
                      <td className="py-2 px-4 text-center font-bold text-slate-700 bg-indigo-50/10 border-l border-r border-indigo-100">
                        {data.models.MODEL_A.studentCount} students
                      </td>
                      <td className="py-2 px-4 text-center font-bold text-slate-700 bg-emerald-50/10 border-r border-emerald-100">
                        {data.models.MODEL_B.studentCount} students
                      </td>
                      <td className="py-2 px-4 text-center font-bold text-slate-700 bg-amber-50/10">
                        {data.models.MODEL_C.studentCount} students
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complete Sessions /50 Callout Card */}
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-600 text-white font-bold text-xs">/50</span>
                  <h3 className="text-sm font-bold text-indigo-950">
                    Overall Score (/50.00) Research Rigor Guarantee
                  </h3>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed max-w-3xl">
                  Overall Score /50 is calculated <strong>strictly for completed student assessment sessions</strong> where all 10 questions were evaluated under the same model. The 10 custom-rounded /5 question totals are summed without intermediate rounding. Incomplete sessions are isolated and never averaged into /50 totals.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs bg-white p-3 rounded-lg border border-indigo-200/80 shadow-xs">
                <div className="text-center px-2">
                  <div className="font-extrabold text-indigo-700 text-lg">{data.completeSessionsCount}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Complete Sessions</div>
                </div>
                <div className="border-r border-slate-200 h-8"></div>
                <div className="text-center px-2">
                  <div className="font-bold text-slate-600 text-lg">{data.incompleteSessionsCount}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Incomplete Sessions</div>
                </div>
              </div>
            </div>

            {/* Visualizations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Visualization 1: Grouped Criterion Averages */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">
                  1. Grouped Criterion Averages Across Dataset
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Direct comparison across Form (15), Answer (15), Rule (30), Application (30), and Conclusion (10)
                </p>

                <div className="space-y-4">
                  {[
                    { label: 'Form (/15)', a: data.models.MODEL_A.meanForm, b: data.models.MODEL_B.meanForm, c: data.models.MODEL_C.meanForm, max: 15 },
                    { label: 'Answer (/15)', a: data.models.MODEL_A.meanAnswer, b: data.models.MODEL_B.meanAnswer, c: data.models.MODEL_C.meanAnswer, max: 15 },
                    { label: 'Rule (/30)', a: data.models.MODEL_A.meanRule, b: data.models.MODEL_B.meanRule, c: data.models.MODEL_C.meanRule, max: 30 },
                    { label: 'Application (/30)', a: data.models.MODEL_A.meanApplication, b: data.models.MODEL_B.meanApplication, c: data.models.MODEL_C.meanApplication, max: 30 },
                    { label: 'Conclusion (/10)', a: data.models.MODEL_A.meanConclusion, b: data.models.MODEL_B.meanConclusion, c: data.models.MODEL_C.meanConclusion, max: 10 },
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
                        ></div>
                        <div
                          style={{ width: `${(row.b / row.max) * 100}%` }}
                          className="bg-emerald-500 rounded-full h-full transition-all duration-500"
                        ></div>
                        <div
                          style={{ width: `${(row.c / row.max) * 100}%` }}
                          className="bg-amber-500 rounded-full h-full transition-all duration-500"
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

              {/* Visualization 2: Score Distribution Histogram (0, 1, 2, 3, 4, 5) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">
                  2. Final Rounded Score Distribution (0–5 Scale)
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Frequency histogram of custom-rounded grades across all {data.totalEligibleEvaluations} evaluations
                </p>

                <div className="space-y-2.5">
                  {[0, 1, 2, 3, 4, 5].map((grade) => {
                    const cA = data.models.MODEL_A.scoreDistribution[grade] || 0;
                    const cB = data.models.MODEL_B.scoreDistribution[grade] || 0;
                    const cC = data.models.MODEL_C.scoreDistribution[grade] || 0;
                    const maxVal = Math.max(
                      1,
                      ...Object.values(data.models.MODEL_A.scoreDistribution),
                      ...Object.values(data.models.MODEL_B.scoreDistribution),
                      ...Object.values(data.models.MODEL_C.scoreDistribution)
                    );

                    return (
                      <div key={grade} className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-700 w-12 text-right">Grade {grade}</span>
                        <div className="flex-1 space-y-1">
                          {/* Llama Bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                style={{ width: `${(cA / maxVal) * 100}%` }}
                                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                              ></div>
                            </div>
                            <span className="text-[10px] font-semibold text-indigo-700 w-6 text-right">{cA}</span>
                          </div>

                          {/* Phi Bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                style={{ width: `${(cB / maxVal) * 100}%` }}
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              ></div>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-700 w-6 text-right">{cB}</span>
                          </div>

                          {/* Gemma Bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                style={{ width: `${(cC / maxVal) * 100}%` }}
                                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                              ></div>
                            </div>
                            <span className="text-[10px] font-semibold text-amber-700 w-6 text-right">{cC}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-indigo-600 font-medium">■ Llama 3.2 3B</span>
                  <span className="text-emerald-600 font-medium">■ Phi-4-mini</span>
                  <span className="text-amber-600 font-medium">■ Gemma 2 2B</span>
                </div>
              </div>
            </div>

            {/* Visualization 3 & 4: Question-by-Question Performance Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    3. Question-by-Question Model Performance (Q01–Q10)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Comparing mean custom-rounded grades (/5.00) across individual questions
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-700 text-left font-bold">
                      <th className="py-2.5 px-3">Question</th>
                      <th className="py-2.5 px-3">Title / Topic</th>
                      <th className="py-2.5 px-3 text-center text-indigo-900 bg-indigo-50/40">Llama 3.2 3B (/5)</th>
                      <th className="py-2.5 px-3 text-center text-emerald-900 bg-emerald-50/40">Phi-4-mini (/5)</th>
                      <th className="py-2.5 px-3 text-center text-amber-900 bg-amber-50/40">Gemma 2 2B (/5)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.questionPerformance.map((qp) => (
                      <tr key={qp.questionId} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {qp.questionCode}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                          {qp.questionTitle}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-indigo-700 bg-indigo-50/10">
                          {qp.modelA.meanRoundedTotal.toFixed(2)} / 5
                          <span className="block text-[10px] text-slate-400 font-normal">({qp.modelA.meanRawTotal.toFixed(1)}%)</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700 bg-emerald-50/10">
                          {qp.modelB.meanRoundedTotal.toFixed(2)} / 5
                          <span className="block text-[10px] text-slate-400 font-normal">({qp.modelB.meanRawTotal.toFixed(1)}%)</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-700 bg-amber-50/10">
                          {qp.modelC.meanRoundedTotal.toFixed(2)} / 5
                          <span className="block text-[10px] text-slate-400 font-normal">({qp.modelC.meanRawTotal.toFixed(1)}%)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Research CSV Export Action Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Research-Grade CSV Exports
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Download raw, unrounded statistical datasets preserving full floating-point precision for thesis documentation, SPSS/R analysis, and replication.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    type: 'summative-criteria',
                    label: 'Summative Criteria CSV',
                    desc: 'Five-criterion means, raw %, rounded /5, and session totals',
                  },
                  {
                    type: 'score-distributions',
                    label: 'Score Distributions CSV',
                    desc: 'Counts of grades 0, 1, 2, 3, 4, 5 across models',
                  },
                  {
                    type: 'complete-sessions-50',
                    label: 'Complete Sessions /50 CSV',
                    desc: 'Per-session sum of 10 questions (/50) for eligible sessions',
                  },
                  {
                    type: 'matched-sample',
                    label: 'Matched-Sample CSV',
                    desc: 'Only question submissions evaluated by all 3 models',
                  },
                ].map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => handleDownloadCsv(btn.type, btn.label)}
                    disabled={downloadingType === btn.type}
                    className="p-3 text-left rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-200 transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-900 flex items-center justify-between">
                        <span>{btn.label}</span>
                        <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {btn.desc}
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-2 block">
                      {downloadingType === btn.type ? 'Generating CSV...' : 'Download CSV →'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
