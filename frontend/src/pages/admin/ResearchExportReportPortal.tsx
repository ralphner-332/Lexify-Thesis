import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  Download,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export const ResearchExportReportPortal: React.FC = () => {
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4' | 'ALL'>('TEST_1');
  const [selectedExpertTest, setSelectedExpertTest] = useState<'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4' | 'ALL'>('TEST_1');

  const handleDownloadClassRecordExcel = async () => {
    try {
      setError(null);
      const testLabel = selectedTest === 'ALL' ? 'All Tests' : selectedTest.replace('_', ' ');
      setDownloadStatus(`Generating Class Record Excel export (${testLabel})...`);
      const blob = await api.exports.getClassRecordExcel({ testSet: selectedTest });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lexify_CLASS_RECORD_${selectedTest}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadStatus(`Class Record Excel (${testLabel}) downloaded successfully.`);
      setTimeout(() => setDownloadStatus(null), 3500);
    } catch (err: any) {
      setError('Failed to download Class Record Excel: ' + (err.message || 'Unknown error'));
      setDownloadStatus(null);
    }
  };

  const handleDownloadClassRecordCSV = async () => {
    try {
      setError(null);
      setDownloadStatus('Generating Class Record CSV export...');
      const csvContent = await api.exports.getClassRecordCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lexify_CLASS_RECORD_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadStatus('Class Record CSV downloaded successfully.');
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch (err: any) {
      setError('Failed to download Class Record: ' + (err.message || 'Unknown error'));
      setDownloadStatus(null);
    }
  };

  const handleDownloadExpertQnAPDF = async () => {
    try {
      setError(null);
      const testLabel = selectedExpertTest === 'ALL' ? 'All Tests' : selectedExpertTest.replace('_', ' ');
      setDownloadStatus(`Generating Student Questions, Model Answer & Response PDF (${testLabel})...`);
      const blob = await api.exports.getStudentQnAPDF({ testSet: selectedExpertTest });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lexify_STUDENT_QUESTIONS_AND_ANSWERS_${selectedExpertTest}_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadStatus(`Q&A PDF Packet downloaded successfully (${testLabel}).`);
      setTimeout(() => setDownloadStatus(null), 3500);
    } catch (err: any) {
      setError('Failed to download PDF packet: ' + (err.message || 'Unknown error'));
      setDownloadStatus(null);
    }
  };

  const handleDownloadExpertQnATxt = async () => {
    try {
      setError(null);
      const testLabel = selectedExpertTest === 'ALL' ? 'All Tests' : selectedExpertTest.replace('_', ' ');
      setDownloadStatus(`Generating Student Questions, Model Answer & Response text export (${testLabel})...`);
      const textContent = await api.exports.getStudentQnAExport({ testSet: selectedExpertTest });
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lexify_STUDENT_QUESTIONS_AND_ANSWERS_${selectedExpertTest}_${new Date().toISOString().slice(0, 10)}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadStatus(`Q&A text export downloaded successfully (${testLabel}).`);
      setTimeout(() => setDownloadStatus(null), 3500);
    } catch (err: any) {
      setError('Failed to download export: ' + (err.message || 'Unknown error'));
      setDownloadStatus(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Academic Research & Assessment Exports
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Research Exports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export structured multi-model class records and double-blind expert evaluation packets for empirical legal assessment analysis.
          </p>
        </div>
      </div>

      {downloadStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2 text-emerald-900 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadStatus}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Official Exports Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Class Record Export */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Excel (.xlsx)
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Class Records
              </h2>
            </div>

            {/* Test Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Select Test to Download:
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                {(['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4', 'ALL'] as const).map((tKey) => {
                  const label = tKey === 'ALL' ? 'All' : tKey.replace('TEST_', 'T');
                  const fullLabel = tKey === 'ALL' ? 'All Tests' : tKey.replace('_', ' ');
                  const isSelected = selectedTest === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setSelectedTest(tKey)}
                      className={`py-1.5 px-1 text-center rounded text-[11px] font-bold transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-transparent text-slate-600 hover:bg-slate-200'
                      }`}
                      title={`Download ${fullLabel}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400">
                {selectedTest === 'ALL'
                  ? 'All Tests: Generates a multi-sheet Excel workbook with Test 1, Test 2, Test 3, and Test 4 tabs.'
                  : `Selected: ${selectedTest.replace('_', ' ')}.`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleDownloadClassRecordExcel}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                Export to Excel (.xlsx) {selectedTest === 'ALL' ? '— All Tests' : `— ${selectedTest.replace('_', ' ')}`}
              </span>
            </button>
            <button
              onClick={handleDownloadClassRecordCSV}
              className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 font-medium py-1 transition cursor-pointer"
            >
              Or export raw dataset as CSV
            </button>
          </div>
        </div>

        {/* 2. Student Questions, Model Answer & Answers Export */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                PDF Document (.pdf)
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Student Questions, Model Answer & Responses
              </h2>
            </div>

            {/* Test Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Select Test to Download:
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                {(['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4', 'ALL'] as const).map((tKey) => {
                  const label = tKey === 'ALL' ? 'All' : tKey.replace('TEST_', 'T');
                  const fullLabel = tKey === 'ALL' ? 'All Tests' : tKey.replace('_', ' ');
                  const isSelected = selectedExpertTest === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setSelectedExpertTest(tKey)}
                      className={`py-1.5 px-1 text-center rounded text-[11px] font-bold transition ${
                        isSelected
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-transparent text-slate-600 hover:bg-slate-200'
                      }`}
                      title={`Download ${fullLabel}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400">
                {selectedExpertTest === 'ALL'
                  ? 'All Tests: Generates packet for all 4 test sets (Q01–Q10 for each participating student).'
                  : `Selected: ${selectedExpertTest.replace('_', ' ')} (Q01–Q10 for each participating student).`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleDownloadExpertQnAPDF}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                Export Q&A Packet (.pdf) {selectedExpertTest === 'ALL' ? '— All Tests' : `— ${selectedExpertTest.replace('_', ' ')}`}
              </span>
            </button>
            <button
              onClick={handleDownloadExpertQnATxt}
              className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 font-medium py-1 transition cursor-pointer"
            >
              Or export packet as plain text (.txt)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
