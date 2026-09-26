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
  { id: '01_student_submissions.csv', label: 'Student Assessment Submissions', desc: 'Session lifecycle, question counts, and submission timestamps' },
  { id: '02_ai_evaluations.csv', label: 'AI Evaluation Records', desc: 'Scores, legal reasoning basis, and criterion score allocations' },
  { id: '04_paired_comparisons.csv', label: 'Multi-Model Comparative Data', desc: 'Llama 3.2, Phi-4-mini, and Gemma 2 score comparisons and deltas' },
  { id: '03_expert_evaluations.csv', label: 'Independent Expert Evaluations', desc: 'Expert scores, rationales, and rubric points' },
  { id: '06_agent_versions.csv', label: 'System Configuration & Prompt Lineage', desc: 'System prompts, configurations, and version snapshots' },
  { id: '10_research_data_dictionary.csv', label: 'Research Data Dictionary', desc: 'Field names, data types, and operational definitions' },
];

export const ResearchExportReportPortal: React.FC = () => {
  const [reportData, setReportData] = useState<AcademicReportData | null>(null);
  const [csvMap, setCsvMap] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'export_hub' | 'academic_report'>('export_hub');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportRes, csvRes] = await Promise.all([
        api.exports.getAcademicReport({ isDemo: false }),
        api.exports.getDatasetsCSV({ isDemo: false }),
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
    link.download = `Lexify_${filename}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = async () => {
    try {
      const res = await api.exports.getBundleJSON({ isDemo: false });
      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lexify_FULL_BUNDLE.json`;
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
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Header Controls */}
      <div className="print:hidden bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Data Exports & Academic Summary Report
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Research Exports & Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export raw evaluation datasets in CSV/JSON or generate the printable academic summary report.
          </p>
        </div>

        {/* Mode Navigation */}
        <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs self-start md:self-auto">
          <button
            onClick={() => setActiveTab('export_hub')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
              activeTab === 'export_hub'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Dataset Exports</span>
          </button>
          <button
            onClick={() => setActiveTab('academic_report')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
              activeTab === 'academic_report'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Academic Summary Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="print:hidden p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="print:hidden py-16 text-center text-slate-400 text-xs">
          <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-2"></div>
          Compiling export datasets and report structures...
        </div>
      ) : activeTab === 'export_hub' ? (
        /* --- EXPORT HUB VIEW --- */
        <div className="space-y-6">
          {/* JSON Full Bundle Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span>Complete Dataset</span>
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                Complete Research Data Graph (JSON)
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Export all relational research datasets in a single validated JSON file with metadata, question schemas, and audit logs.
              </p>
            </div>
            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition shrink-0 self-start md:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Bundle</span>
            </button>
          </div>

          {/* Individual CSV Datasets */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Individual CSV Datasets</span>
              <span className="text-slate-500">{CSV_DATASETS.length} datasets available</span>
            </div>

            <div className="divide-y divide-slate-100">
              {CSV_DATASETS.map((ds) => (
                <div
                  key={ds.id}
                  className="p-4 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-900">{ds.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{ds.desc}</p>
                    <span className="text-[10px] font-mono text-slate-400 block">{ds.id}</span>
                  </div>

                  <button
                    onClick={() => handleDownloadCSV(ds.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition self-start md:self-auto"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* --- PRINTABLE ACADEMIC REPORT VIEW --- */
        <div className="space-y-6">
          {/* Action Bar (Hidden when printed) */}
          <div className="print:hidden flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-500">
              This academic summary report is formatted for direct printing or export to PDF.
            </div>
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          {/* Academic Report Document Layout */}
          {reportData && (
            <div className="bg-white p-8 md:p-12 rounded-lg border border-slate-200 space-y-8 font-serif print:p-0 print:border-none">
              {/* Report Header */}
              <div className="border-b border-slate-300 pb-6 space-y-2">
                <div className="text-[11px] uppercase font-sans tracking-wider font-semibold text-slate-500">
                  {reportData.institution} · Commercial Law
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                  {reportData.title}
                </h1>
                <p className="text-xs font-sans text-slate-700 leading-relaxed">
                  {reportData.subtitle}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-sans text-slate-500 pt-1">
                  <span>Generated: {new Date(reportData.generatedAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>System: Lexify Legal Assessment System</span>
                </div>
              </div>

              {/* Section 1: Executive Summary */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  1. Executive Summary & Evaluation Cohort
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {reportData.executiveSummary}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans text-xs pt-1">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Submissions</span>
                    <span className="text-base font-bold text-slate-900">{reportData.datasetSummary.totalSubmissions}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">AI Evaluations</span>
                    <span className="text-base font-bold text-slate-900">{reportData.datasetSummary.totalAiEvaluations}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Expert Evaluations</span>
                    <span className="text-base font-bold text-slate-900">{reportData.datasetSummary.totalExpertEvaluations}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Paired Comparisons</span>
                    <span className="text-base font-bold text-slate-900">{reportData.datasetSummary.totalPairedComparisons}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Question Scenarios */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  2. Commercial Law Problem Scenarios
                </h2>
                <div className="space-y-3">
                  {reportData.questionScenarios.map((q) => (
                    <div key={q.code} className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1.5 text-xs">
                      <div className="font-sans font-semibold text-slate-900">
                        {q.code}: {q.title}
                      </div>
                      <p className="text-slate-700 italic font-serif">"{q.scenario}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Progression */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  3. Iterative Progression & Alignment
                </h2>
                <p className="text-xs font-sans text-slate-600 leading-relaxed">
                  {reportData.iterationProgression.progressionNarrative}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border border-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-200">Version</th>
                        <th className="p-2 border border-slate-200">Sample (n)</th>
                        <th className="p-2 border border-slate-200">Mean Abs Delta</th>
                        <th className="p-2 border border-slate-200">AI Score (Mean ± SD)</th>
                        <th className="p-2 border border-slate-200">Expert Score (Mean ± SD)</th>
                        <th className="p-2 border border-slate-200">Agreement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportData.iterationProgression.iterations.map((iter) => (
                        <tr key={iter.versionTag}>
                          <td className="p-2 border border-slate-200 font-semibold">{iter.versionTag}</td>
                          <td className="p-2 border border-slate-200 font-mono">{iter.sampleSize}</td>
                          <td className="p-2 border border-slate-200 font-mono font-semibold">{iter.meanAbsoluteDelta.toFixed(1)} pts</td>
                          <td className="p-2 border border-slate-200 font-mono">{iter.aiMeanScore} ± {iter.aiScoreStdDev}</td>
                          <td className="p-2 border border-slate-200 font-mono">{iter.expertMeanScore} ± {iter.expertScoreStdDev}</td>
                          <td className="p-2 border border-slate-200 font-mono font-semibold">{iter.agreementRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Data Dictionary */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  4. Research Data Dictionary
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border border-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-200">Field Name</th>
                        <th className="p-2 border border-slate-200">Type</th>
                        <th className="p-2 border border-slate-200">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {reportData.dataDictionary.map((f, i) => (
                        <tr key={i}>
                          <td className="p-2 border border-slate-200 font-semibold text-slate-900">{f.field}</td>
                          <td className="p-2 border border-slate-200 text-slate-600">{f.type}</td>
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
