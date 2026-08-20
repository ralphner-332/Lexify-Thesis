import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { AcademicReportData } from '../../types';
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  AlertCircle,
} from 'lucide-react';

const CSV_DATASETS = [
  { id: '01_student_submissions.csv', label: '1. Student Assessment Submissions', desc: 'Session lifecycle, question counts, and submission timestamps' },
  { id: '02_ai_evaluations.csv', label: '2. AI Evaluation Records', desc: 'Scores, IRAC scoring basis, criterion breakdown, and snapshots' },
  { id: '03_expert_evaluations.csv', label: '3. Independent Expert Evaluations', desc: 'Double-blind expert scores, rationales, and rubric points' },
  { id: '04_paired_comparisons.csv', label: '4. AI vs Expert Paired Comparisons', desc: 'Signed/absolute deltas, percentage divergence, and conflicts' },
  { id: '05_refinement_logs.csv', label: '5. Structured Refinement Gap Logs', desc: 'Identified gaps, root cause analyses, and approved changes' },
  { id: '06_agent_versions.csv', label: '6. Agent Version Snapshots & Lineage', desc: 'V1 → V2 → V3 system prompts, configurations, and changelogs' },
  { id: '07_final_v3_expert_reviews.csv', label: '7. Post-V3 Final Expert Reviews', desc: 'Likert agreement scores, error tags, and final verdicts' },
  { id: '08_student_usability_surveys.csv', label: '8. Student Usability Survey Responses', desc: 'Student feedback ratings on diagnostic clarity and utility' },
  { id: '09_expert_capability_surveys.csv', label: '9. Expert Capability Survey Responses', desc: 'Expert ratings on AI consistency and formative utility' },
  { id: '10_research_data_dictionary.csv', label: '10. Research Data Dictionary', desc: 'Field names, data types, and operational definitions' },
];

export const ResearchExportReportPortal: React.FC = () => {
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [reportData, setReportData] = useState<AcademicReportData | null>(null);
  const [csvMap, setCsvMap] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'export_hub' | 'academic_report'>('export_hub');

  useEffect(() => {
    loadData();
  }, [isDemo]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportRes, csvRes] = await Promise.all([
        api.exports.getAcademicReport({ isDemo }),
        api.exports.getDatasetsCSV({ isDemo }),
      ]);

      setReportData(reportRes.data);
      setCsvMap(csvRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to compile research export data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = (filename: string) => {
    if (!csvMap || !csvMap[filename]) return;
    const content = csvMap[filename];
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `YAWA_${isDemo ? 'DEMO_' : 'RESEARCH_'}${filename}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = async () => {
    try {
      const res = await api.exports.getBundleJSON({ isDemo });
      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `YAWA_${isDemo ? 'DEMO_' : 'RESEARCH_'}FULL_BUNDLE.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download JSON bundle: ' + err.message);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls (Hidden during browser print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research Data Export & Academic Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Download raw empirical datasets (CSV / JSON) and view or print the Thesis-Ready Academic Research Summary Report.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Data Filter Toggle */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 pl-2">Data Partition:</span>
            <button
              onClick={() => setIsDemo(false)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                !isDemo ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Research Data (Live)
            </button>
            <button
              onClick={() => setIsDemo(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                isDemo ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Demo Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Mode Tabs (Hidden during print) */}
      <div className="print:hidden flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 max-w-md">
        <button
          onClick={() => setActiveTab('export_hub')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'export_hub'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
          Raw Dataset Exports (CSV/JSON)
        </button>
        <button
          onClick={() => setActiveTab('academic_report')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'academic_report'
              ? 'bg-white text-amber-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Printer className="w-4 h-4 text-amber-600" />
          Thesis Academic Report
        </button>
      </div>

      {error && (
        <div className="print:hidden p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="print:hidden py-24 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          Compiling export datasets and report structures...
        </div>
      ) : activeTab === 'export_hub' ? (
        /* --- EXPORT HUB VIEW --- */
        <div className="space-y-6">
          {/* JSON Full Bundle Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider w-fit border border-indigo-500/30">
                <FileCode className="w-3.5 h-3.5" />
                Comprehensive Research Bundle (JSON)
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Complete YAWA Research Data Graph
              </h2>
              <p className="text-indigo-200/80 text-sm leading-relaxed">
                Export all 10 relational research datasets in a single validated JSON structure with immutable hashes, schema definitions, and prototype disclaimers.
              </p>
            </div>
            <button
              onClick={handleDownloadJSON}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg transition flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Download className="w-4 h-4" /> Download JSON Bundle
            </button>
          </div>

          {/* 10 Individual CSV Datasets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Individual Research Datasets (CSV)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download separated comma-separated values files for statistical analysis in R, SPSS, Stata, or Python.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {CSV_DATASETS.map((ds) => (
                <div
                  key={ds.id}
                  className="p-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-sm">{ds.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{ds.desc}</p>
                    <span className="text-[11px] font-mono text-slate-400 block">{ds.id}</span>
                  </div>

                  <button
                    onClick={() => handleDownloadCSV(ds.id)}
                    className="px-4 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 self-start md:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" /> Download CSV
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* --- PRINTABLE / THESIS ACADEMIC REPORT VIEW --- */
        <div className="space-y-6">
          {/* Action Bar (Hidden when printed) */}
          <div className="print:hidden flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500">
              This report is formatted with <code className="font-mono text-indigo-600">@media print</code> styles for browser printing or direct Save-as-PDF.
            </div>
            <button
              onClick={handlePrintReport}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>

          {/* Academic Report Document Layout */}
          {reportData && (
            <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8 font-serif print:p-0 print:border-none print:shadow-none">
              {/* Report Header */}
              <div className="border-b-2 border-slate-900 pb-6 space-y-2">
                <div className="text-xs uppercase font-sans tracking-widest font-bold text-slate-500">
                  {reportData.institution} • {reportData.courseSubject}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-sans">
                  {reportData.title}
                </h1>
                <p className="text-sm font-sans font-medium text-slate-700 leading-relaxed">
                  {reportData.subtitle}
                </p>
                <div className="flex items-center gap-4 text-xs font-sans text-slate-500 pt-2">
                  <span>Generated: {new Date(reportData.generatedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Data Partition: {reportData.isDemo ? 'Demo Simulation' : 'Live Research Data'}</span>
                </div>
              </div>

              {/* Research Disclaimer */}
              <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl text-xs font-sans text-amber-900 leading-relaxed">
                <strong>{reportData.disclaimer}</strong>
              </div>

              {/* Section 1: Executive Summary & Cohort Overview */}
              <div className="space-y-3">
                <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  1. Executive Summary & Evaluation Cohort Overview
                </h2>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {reportData.executiveSummary}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans text-xs pt-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Submissions</span>
                    <span className="text-base font-bold text-slate-900">
                      {reportData.datasetSummary.totalSubmissions}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">AI Evaluations</span>
                    <span className="text-base font-bold text-slate-900">
                      {reportData.datasetSummary.totalAiEvaluations}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Expert Evaluations</span>
                    <span className="text-base font-bold text-slate-900">
                      {reportData.datasetSummary.totalExpertEvaluations}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Paired Comparisons</span>
                    <span className="text-base font-bold text-slate-900">
                      {reportData.datasetSummary.totalPairedComparisons}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Predetermined Criminal Law I Question Scenarios */}
              <div className="space-y-4">
                <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  2. Predetermined Criminal Law I Question Scenarios
                </h2>
                <div className="space-y-4">
                  {reportData.questionScenarios.map((q) => (
                    <div key={q.code} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between font-sans font-bold text-slate-900 text-sm">
                        <span>{q.code}: {q.title}</span>
                      </div>
                      <p className="text-slate-700 italic">"{q.scenario}"</p>
                      <div className="pt-2 border-t border-slate-200/80 font-sans">
                        <span className="font-bold text-slate-800">Required Statutory Elements: </span>
                        <span className="text-slate-600">{q.statutoryElements.join('; ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: V1 -> V2 -> V3 Iteration Progression & Delta Reduction */}
              <div className="space-y-4">
                <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  3. Iterative Progression & Delta Reduction (V1 → V2 → V3)
                </h2>
                <p className="text-xs font-sans text-slate-600">
                  {reportData.iterationProgression.progressionNarrative}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border border-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-200">Version</th>
                        <th className="p-2 border border-slate-200">Sample Size (n)</th>
                        <th className="p-2 border border-slate-200">Mean Abs Delta |AI - Expert|</th>
                        <th className="p-2 border border-slate-200">Mean Signed Delta</th>
                        <th className="p-2 border border-slate-200">AI Score (Mean ± SD)</th>
                        <th className="p-2 border border-slate-200">Expert Score (Mean ± SD)</th>
                        <th className="p-2 border border-slate-200">Agreement Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportData.iterationProgression.iterations.map((iter) => (
                        <tr key={iter.versionTag}>
                          <td className="p-2 border border-slate-200 font-bold">{iter.versionTag}</td>
                          <td className="p-2 border border-slate-200 font-mono">{iter.sampleSize}</td>
                          <td className="p-2 border border-slate-200 font-mono font-bold">
                            {iter.meanAbsoluteDelta.toFixed(1)} pts
                          </td>
                          <td className="p-2 border border-slate-200 font-mono">
                            {iter.meanSignedDelta > 0 ? `+${iter.meanSignedDelta}` : iter.meanSignedDelta}
                          </td>
                          <td className="p-2 border border-slate-200 font-mono">
                            {iter.aiMeanScore} ± {iter.aiScoreStdDev}
                          </td>
                          <td className="p-2 border border-slate-200 font-mono">
                            {iter.expertMeanScore} ± {iter.expertScoreStdDev}
                          </td>
                          <td className="p-2 border border-slate-200 font-mono font-bold">
                            {iter.agreementRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Post-V3 Final Agreement Findings */}
              <div className="space-y-4">
                <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  4. Post-V3 Final Expert Validation & Error Taxonomy
                </h2>
                <div className="grid grid-cols-3 gap-3 font-sans text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Overall Agreement</span>
                    <span className="text-lg font-bold text-slate-900">
                      {reportData.postV3AgreementFindings.meanAgreementRating.toFixed(2)} / 5.00
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Reasoning Correctness</span>
                    <span className="text-lg font-bold text-slate-900">
                      {reportData.postV3AgreementFindings.meanReasoningCorrectness.toFixed(2)} / 5.00
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Statutory Grounding</span>
                    <span className="text-lg font-bold text-slate-900">
                      {reportData.postV3AgreementFindings.meanStatutoryGrounding.toFixed(2)} / 5.00
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs space-y-2">
                  <div className="font-bold text-slate-800">Final Assessment Verdicts:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      Acceptable: <strong>{reportData.postV3AgreementFindings.verdictCounts.ACCEPTABLE}</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      Minor Issues: <strong>{reportData.postV3AgreementFindings.verdictCounts.ACCEPTABLE_WITH_MINOR_ISSUES}</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      Requires Improvement: <strong>{reportData.postV3AgreementFindings.verdictCounts.REQUIRES_IMPROVEMENT}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Methodological Notes & Limitations */}
              <div className="space-y-3">
                <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  5. Methodological Notes & Limitations
                </h2>
                <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside font-sans leading-relaxed">
                  {reportData.methodologyAndLimitations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Section 6: Research Data Dictionary */}
              <div className="space-y-3">
                <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  6. Research Data Dictionary
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border border-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-200">Field Name</th>
                        <th className="p-2 border border-slate-200">Type</th>
                        <th className="p-2 border border-slate-200">Operational Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {reportData.dataDictionary.map((f, i) => (
                        <tr key={i}>
                          <td className="p-2 border border-slate-200 font-bold text-slate-900">{f.field}</td>
                          <td className="p-2 border border-slate-200 text-indigo-700">{f.type}</td>
                          <td className="p-2 border border-slate-200 font-sans text-slate-700">{f.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
