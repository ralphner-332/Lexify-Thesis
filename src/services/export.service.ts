import { prisma } from '../lib/prisma';
import { ResearchExportBundleDTO, AcademicReportDTO } from '../dto/export.dto';
import { StatisticsService } from './statistics.service';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { percentageToCustomFivePoint } from '../utils/scoring';

export class ExportService {
  /**
   * Generates a comprehensive JSON bundle containing all 10 research datasets.
   * Server default: isDemo = false (research data only).
   */
  static async exportResearchBundleJSON(options?: { isDemo?: boolean }): Promise<ResearchExportBundleDTO> {
    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;
    const datasets = await this.fetchAllDatasets(isDemoFilter);

    const recordCounts: Record<string, number> = {};
    Object.keys(datasets).forEach((key) => {
      recordCounts[key] = (datasets as any)[key]?.length || 0;
    });

    return {
      metadata: {
        title: 'Lexify Academic Research Dataset Export Bundle (Multi-LLM Comparative Study)',
        version: '3.0',
        exportedAt: new Date().toISOString(),
        isDemo: isDemoFilter,
        disclaimer:
          'ACADEMIC RESEARCH PROTOTYPE — Evaluates student written essay answers for comparative research on local LLMs (Meta Llama 3.2 3B, Microsoft Phi-4-mini 3.8B, Google Gemma 2 2B). Not an official legal exam, bar review grading system, or legal advice.',
        recordCounts,
      },
      datasets,
    };
  }

  /**
   * Generates a dictionary of CSV strings for all 10 research datasets.
   * Server default: isDemo = false.
   */
  static async exportResearchDatasetsCSV(options?: { isDemo?: boolean }): Promise<Record<string, string>> {
    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;
    const datasets = await this.fetchAllDatasets(isDemoFilter);

    const csvMap: Record<string, string> = {};

    csvMap['01_student_submissions.csv'] = this.arrayToCSV(datasets.submissions);
    csvMap['02_llama_3_2_3b_evaluations.csv'] = this.arrayToCSV(datasets.llamaEvaluations);
    csvMap['03_phi_4_mini_evaluations.csv'] = this.arrayToCSV(datasets.phi4Evaluations);
    csvMap['04_gemma_2_2b_evaluations.csv'] = this.arrayToCSV(datasets.gemma2Evaluations);
    csvMap['05_model_comparative_matrix.csv'] = this.arrayToCSV(datasets.comparativeMatrix);
    csvMap['06_lexical_semantic_analysis.csv'] = this.arrayToCSV(datasets.lexicalSemanticAnalysis);
    csvMap['07_student_usability_surveys.csv'] = this.arrayToCSV(datasets.studentSurveys);
    csvMap['08_model_configurations.csv'] = this.arrayToCSV(datasets.modelConfigs);
    csvMap['09_scoring_rubric.csv'] = this.arrayToCSV(datasets.scoringRubrics);
    csvMap['10_research_data_dictionary.csv'] = this.arrayToCSV(datasets.dataDictionary);

    // Keep model alias keys for backward compatibility
    csvMap['02_llama_3_1_8b_evaluations.csv'] = this.arrayToCSV(datasets.llamaEvaluations);
    csvMap['03_mistral_7b_evaluations.csv'] = this.arrayToCSV(datasets.phi4Evaluations);
    csvMap['04_gemma_2_9b_evaluations.csv'] = this.arrayToCSV(datasets.gemma2Evaluations);
    csvMap['02_ai_evaluations.csv'] = this.arrayToCSV(datasets.allAiEvaluations);
    csvMap['03_expert_evaluations.csv'] = this.arrayToCSV(datasets.expertEvaluations || []);
    csvMap['04_paired_comparisons.csv'] = this.arrayToCSV(datasets.comparisons || []);
    csvMap['05_refinement_logs.csv'] = this.arrayToCSV(datasets.refinementLogs || []);
    csvMap['06_agent_versions.csv'] = this.arrayToCSV(datasets.agentVersions || []);
    csvMap['07_final_v3_expert_reviews.csv'] = this.arrayToCSV(datasets.finalV3Reviews || []);
    csvMap['09_expert_capability_surveys.csv'] = this.arrayToCSV(datasets.expertSurveys || []);

    return csvMap;
  }

  /**
   * Generates Class Record Excel (.xlsx) export with side-by-side three-model columns (Llama 3.2, Phi-4 Mini, Gemma 2).
   * Exact layout matching the Model Comparison dashboard:
   * Title row -> Dual headers -> Student section banners -> Q01..Q10 breakdown rows -> Weighted score summary rows.
   * Supports selecting an individual test ('TEST_1'..'TEST_4') or 'ALL' (multi-sheet workbook).
   */
  static async exportClassRecordExcel(options?: { isDemo?: boolean; testSet?: string }): Promise<Buffer> {
    const isDemo = options?.isDemo !== undefined ? options.isDemo : false;
    const requestedTest = (options?.testSet || 'TEST_1').toUpperCase();

    const testSetsToExport: ('TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4')[] =
      requestedTest === 'ALL'
        ? ['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4']
        : [requestedTest as 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4'];

    const [evaluations, questions] = await Promise.all([
      prisma.evaluation.findMany({
        where: options?.isDemo !== undefined ? { isDemo } : {},
        include: {
          student: true,
          session: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.question.findMany({
        where: options?.isDemo !== undefined ? { isDemo } : {},
        orderBy: { orderIndex: 'asc' },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Lexify Academic Research System';
    workbook.created = new Date();

    const parseCriteria = (e: any) => {
      const criteria: any[] = safeParseJson(e?.criterionScores, []);
      const form = criteria.find((c) => c.criterionName?.toLowerCase().includes('form'))?.score ?? 0;
      const answer = criteria.find((c) => c.criterionName?.toLowerCase().includes('answer'))?.score ?? 0;
      const rule = criteria.find((c) => c.criterionName?.toLowerCase().includes('rule'))?.score ?? 0;
      const app = criteria.find((c) => c.criterionName?.toLowerCase().includes('app'))?.score ?? 0;
      const conc = criteria.find((c) => c.criterionName?.toLowerCase().includes('conc'))?.score ?? 0;
      const total = e ? percentageToCustomFivePoint(e.numericalScore ?? (form + answer + rule + app + conc)) : 0;
      return { form, answer, rule, app, conc, total };
    };

    const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    const mediumBorder: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF94A3B8' } };
    const thickBorder: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF64748B' } };
    const doubleBottom: Partial<ExcelJS.Border> = { style: 'double', color: { argb: 'FF475569' } };

    for (const testSetKey of testSetsToExport) {
      const testNum = testSetKey.replace('TEST_', '');
      const sheetName = `Test ${testNum}`;
      const prefix = `TEST${testNum}`;

      // 1. Filter evaluations for this test set
      const relevantEvals = evaluations.filter((e) => {
        const q = questions.find((item) => item.id === e.questionId);
        const qSnap = safeParseJson(e.questionSnapshot, {});
        const qSet = q?.testSet || qSnap?.testSet;
        const qCode = q?.code || qSnap?.code || '';
        return qSet === testSetKey || qCode.startsWith(prefix);
      });

      // 2. Group evaluations by student
      const studentMap = new Map<string, {
        studentId: string;
        studentName: string;
        studentEmail: string;
        questionMap: Map<string, any>;
      }>();

      relevantEvals.forEach((e) => {
        const q = questions.find((item) => item.id === e.questionId);
        const qSnap = safeParseJson(e.questionSnapshot, {});
        const qCode = q?.code || qSnap?.code || 'Q01';
        const qTitle = q?.title || qSnap?.title || '';
        const orderIndex = q?.orderIndex ?? qSnap?.orderIndex ?? 0;
        const studentKey = e.studentId || 'unknown';

        if (!studentMap.has(studentKey)) {
          studentMap.set(studentKey, {
            studentId: e.studentId,
            studentName: e.student?.name || 'Student',
            studentEmail: e.student?.email || '',
            questionMap: new Map(),
          });
        }

        const st = studentMap.get(studentKey)!;
        if (!st.questionMap.has(qCode)) {
          st.questionMap.set(qCode, {
            questionCode: qCode,
            questionTitle: qTitle,
            orderIndex,
            modelA: undefined,
            modelB: undefined,
            modelC: undefined,
          });
        }

        const qRow = st.questionMap.get(qCode)!;
        const scores = parseCriteria(e);
        if (e.modelSlot === 'MODEL_A' || (!e.modelSlot && !qRow.modelA)) {
          qRow.modelA = scores;
        } else if (e.modelSlot === 'MODEL_B') {
          qRow.modelB = scores;
        } else if (e.modelSlot === 'MODEL_C') {
          qRow.modelC = scores;
        }
      });

      // Sort students alphabetically A-Z
      const sortedStudents = Array.from(studentMap.values()).sort((a, b) =>
        a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' })
      );

      const totalStudents = sortedStudents.length;
      const totalQuestionRows = sortedStudents.reduce((acc, s) => acc + s.questionMap.size, 0);

      const ws = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }],
      });

      // Column widths (Col 1 to 20)
      ws.columns = [
        { key: 'c1', width: 44 },  // Question Description
        { key: 'c2', width: 14 },  // Code
        // LLAMA 3.2
        { key: 'c3', width: 10 },
        { key: 'c4', width: 10 },
        { key: 'c5', width: 10 },
        { key: 'c6', width: 10 },
        { key: 'c7', width: 10 },
        { key: 'c8', width: 13 },
        // PHI-4 MINI
        { key: 'c9', width: 10 },
        { key: 'c10', width: 10 },
        { key: 'c11', width: 10 },
        { key: 'c12', width: 10 },
        { key: 'c13', width: 10 },
        { key: 'c14', width: 13 },
        // GEMMA 2
        { key: 'c15', width: 10 },
        { key: 'c16', width: 10 },
        { key: 'c17', width: 10 },
        { key: 'c18', width: 10 },
        { key: 'c19', width: 10 },
        { key: 'c20', width: 13 },
      ];

      // Row 1: Title Banner
      ws.mergeCells('A1:T1');
      const r1 = ws.getCell('A1');
      r1.value = `Test ${testNum} Evaluation Matrix (${totalStudents} Students · ${totalQuestionRows} Question Rows)`;
      r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      r1.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      r1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      ws.getRow(1).height = 28;

      // Row 2: Header 1 (Model Categories)
      ws.mergeCells('A2:B2');
      const r2_ab = ws.getCell('A2');
      r2_ab.value = 'STUDENT NAME / QUESTION';
      r2_ab.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      r2_ab.font = { name: 'Calibri', bold: true, color: { argb: 'FF334155' }, size: 10 };
      r2_ab.alignment = { vertical: 'middle', horizontal: 'center' };

      ws.mergeCells('C2:H2');
      const r2_llama = ws.getCell('C2');
      r2_llama.value = 'LLAMA 3.2';
      r2_llama.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      r2_llama.font = { name: 'Calibri', bold: true, color: { argb: 'FF1E3A8A' }, size: 11 };
      r2_llama.alignment = { vertical: 'middle', horizontal: 'center' };

      ws.mergeCells('I2:N2');
      const r2_phi = ws.getCell('I2');
      r2_phi.value = 'PHI-4 MINI';
      r2_phi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
      r2_phi.font = { name: 'Calibri', bold: true, color: { argb: 'FF581C87' }, size: 11 };
      r2_phi.alignment = { vertical: 'middle', horizontal: 'center' };

      ws.mergeCells('O2:T2');
      const r2_gemma = ws.getCell('O2');
      r2_gemma.value = 'GEMMA 2';
      r2_gemma.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      r2_gemma.font = { name: 'Calibri', bold: true, color: { argb: 'FF064E3B' }, size: 11 };
      r2_gemma.alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getRow(2).height = 24;

      // Apply borders to Row 2
      for (let c = 1; c <= 20; c++) {
        const cell = ws.getRow(2).getCell(c);
        cell.border = {
          top: thinBorder,
          bottom: thinBorder,
          left: (c === 1 || c === 3 || c === 9 || c === 15) ? mediumBorder : thinBorder,
          right: (c === 2 || c === 8 || c === 14 || c === 20) ? mediumBorder : thinBorder,
        };
      }

      // Row 3: Header 2 (Criteria & Weights)
      const r3Values = [
        'Question Description',
        'Code',
        'Form (15%)', 'Answer (15%)', 'Rule (30%)', 'App (30%)', 'Conc (10%)', 'Total (100%)',
        'Form (15%)', 'Answer (15%)', 'Rule (30%)', 'App (30%)', 'Conc (10%)', 'Total (100%)',
        'Form (15%)', 'Answer (15%)', 'Rule (30%)', 'App (30%)', 'Conc (10%)', 'Total (100%)',
      ];
      const r3 = ws.getRow(3);
      r3.values = r3Values;
      r3.height = 26;

      for (let c = 1; c <= 20; c++) {
        const cell = r3.getCell(c);
        let bgColor = 'FFF8FAFC';
        let textColor = 'FF475569';
        let bold = true;

        if (c >= 3 && c <= 7) {
          bgColor = 'FFEFF6FF';
          textColor = 'FF1E40AF';
        } else if (c === 8) {
          bgColor = 'FFBFDBFE';
          textColor = 'FF1E3A8A';
        } else if (c >= 9 && c <= 13) {
          bgColor = 'FFFAF5FF';
          textColor = 'FF6B21A8';
        } else if (c === 14) {
          bgColor = 'FFE9D5FF';
          textColor = 'FF581C87';
        } else if (c >= 15 && c <= 19) {
          bgColor = 'FFECFDF5';
          textColor = 'FF047857';
        } else if (c === 20) {
          bgColor = 'FFA7F3D0';
          textColor = 'FF064E3B';
        }

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = { name: 'Calibri', bold, color: { argb: textColor }, size: (c === 8 || c === 14 || c === 20) ? 9.5 : 8.5 };
        cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
        cell.border = {
          top: thinBorder,
          bottom: mediumBorder,
          left: (c === 1 || c === 3 || c === 9 || c === 15) ? mediumBorder : thinBorder,
          right: (c === 2 || c === 8 || c === 14 || c === 20) ? mediumBorder : thinBorder,
        };
      }

      let currentRow = 4;

      // Populate each Student Block
      for (const student of sortedStudents) {
        // A. Student Section Banner
        ws.mergeCells(`A${currentRow}:T${currentRow}`);
        const studentCell = ws.getCell(`A${currentRow}`);
        studentCell.value = `STUDENT:  ${student.studentName}  (${student.studentEmail})`;
        studentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        studentCell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 10.5 };
        studentCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        ws.getRow(currentRow).height = 24;

        for (let c = 1; c <= 20; c++) {
          ws.getRow(currentRow).getCell(c).border = {
            top: thickBorder,
            bottom: mediumBorder,
            left: c === 1 ? mediumBorder : undefined,
            right: c === 20 ? mediumBorder : undefined,
          };
        }
        currentRow++;

        // B. Questions Q01..Q10
        const sortedQuestions = Array.from(student.questionMap.values()).sort((a, b) => {
          if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
          return a.questionCode.localeCompare(b.questionCode, undefined, { numeric: true });
        });

        let llamaSum = 0;
        let phiSum = 0;
        let gemmaSum = 0;

        for (const q of sortedQuestions) {
          const qRow = ws.getRow(currentRow);
          qRow.height = 21;

          const aTot = q.modelA ? q.modelA.total : 0;
          const bTot = q.modelB ? q.modelB.total : 0;
          const cTot = q.modelC ? q.modelC.total : 0;

          llamaSum += aTot;
          phiSum += bTot;
          gemmaSum += cTot;

          qRow.values = [
            q.questionTitle,
            q.questionCode,
            // Llama
            q.modelA ? q.modelA.form : '-',
            q.modelA ? q.modelA.answer : '-',
            q.modelA ? q.modelA.rule : '-',
            q.modelA ? q.modelA.app : '-',
            q.modelA ? q.modelA.conc : '-',
            q.modelA ? q.modelA.total : '-',
            // Phi-4
            q.modelB ? q.modelB.form : '-',
            q.modelB ? q.modelB.answer : '-',
            q.modelB ? q.modelB.rule : '-',
            q.modelB ? q.modelB.app : '-',
            q.modelB ? q.modelB.conc : '-',
            q.modelB ? q.modelB.total : '-',
            // Gemma
            q.modelC ? q.modelC.form : '-',
            q.modelC ? q.modelC.answer : '-',
            q.modelC ? q.modelC.rule : '-',
            q.modelC ? q.modelC.app : '-',
            q.modelC ? q.modelC.conc : '-',
            q.modelC ? q.modelC.total : '-',
          ];

          // Format cells
          for (let c = 1; c <= 20; c++) {
            const cell = qRow.getCell(c);
            let fillArgb: string | undefined = undefined;
            let fontColor = 'FF334155';
            let bold = false;

            if (c === 2) {
              bold = true;
              fontColor = 'FF0F172A';
            } else if (c === 8) {
              fillArgb = 'FFEFF6FF';
              fontColor = 'FF1E3A8A';
              bold = true;
            } else if (c === 14) {
              fillArgb = 'FFFAF5FF';
              fontColor = 'FF581C87';
              bold = true;
            } else if (c === 20) {
              fillArgb = 'FFECFDF5';
              fontColor = 'FF064E3B';
              bold = true;
            }

            if (fillArgb) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
            }
            cell.font = { name: 'Calibri', size: 9, bold, color: { argb: fontColor } };
            cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
            cell.border = {
              top: thinBorder,
              bottom: thinBorder,
              left: (c === 1 || c === 3 || c === 9 || c === 15) ? mediumBorder : thinBorder,
              right: (c === 2 || c === 8 || c === 14 || c === 20) ? mediumBorder : thinBorder,
            };
          }
          currentRow++;
        }

        // C. Weighted Score Row
        const wsRow = ws.getRow(currentRow);
        wsRow.height = 24;

        ws.mergeCells(`A${currentRow}:B${currentRow}`);
        const wsTitleCell = ws.getCell(`A${currentRow}`);
        wsTitleCell.value = 'WEIGHTED SCORE   [SUM OF Q01–Q10]';
        wsTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        wsTitleCell.font = { name: 'Calibri', bold: true, color: { argb: 'FF0F172A' }, size: 9.5 };
        wsTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        // Llama blank span & score
        ws.mergeCells(`C${currentRow}:G${currentRow}`);
        const llamaBlank = ws.getCell(`C${currentRow}`);
        llamaBlank.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };

        const llamaScoreCell = ws.getCell(`H${currentRow}`);
        llamaScoreCell.value = `${llamaSum}/50`;
        llamaScoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFDBFE' } };
        llamaScoreCell.font = { name: 'Calibri', bold: true, color: { argb: 'FF1E3A8A' }, size: 10 };
        llamaScoreCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Phi blank span & score
        ws.mergeCells(`I${currentRow}:M${currentRow}`);
        const phiBlank = ws.getCell(`I${currentRow}`);
        phiBlank.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF5FF' } };

        const phiScoreCell = ws.getCell(`N${currentRow}`);
        phiScoreCell.value = `${phiSum}/50`;
        phiScoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9D5FF' } };
        phiScoreCell.font = { name: 'Calibri', bold: true, color: { argb: 'FF581C87' }, size: 10 };
        phiScoreCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Gemma blank span & score
        ws.mergeCells(`O${currentRow}:S${currentRow}`);
        const gemmaBlank = ws.getCell(`O${currentRow}`);
        gemmaBlank.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };

        const gemmaScoreCell = ws.getCell(`T${currentRow}`);
        gemmaScoreCell.value = `${gemmaSum}/50`;
        gemmaScoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA7F3D0' } };
        gemmaScoreCell.font = { name: 'Calibri', bold: true, color: { argb: 'FF064E3B' }, size: 10 };
        gemmaScoreCell.alignment = { vertical: 'middle', horizontal: 'center' };

        for (let c = 1; c <= 20; c++) {
          const cell = wsRow.getCell(c);
          cell.border = {
            top: mediumBorder,
            bottom: doubleBottom,
            left: (c === 1 || c === 3 || c === 9 || c === 15) ? mediumBorder : thinBorder,
            right: (c === 2 || c === 8 || c === 14 || c === 20) ? mediumBorder : thinBorder,
          };
        }
        currentRow++;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generates Class Record CSV export with side-by-side three-model columns (Llama 3.2, Phi-4-mini, Gemma 2).
   * Sorted alphabetically by Student Name (A-Z), then question Q01-Q10.
   */
  static async exportClassRecordCSV(options?: { isDemo?: boolean }): Promise<string> {
    const isDemo = options?.isDemo !== undefined ? options.isDemo : true;
    const evaluations = await prisma.evaluation.findMany({
      where: options?.isDemo !== undefined ? { isDemo } : {},
      include: {
        student: true,
        session: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by student + question
    interface AggregatedRow {
      studentName: string;
      studentEmail: string;
      studentId: string;
      sessionId: string;
      questionId: string;
      questionCode: string;
      orderIndex: number;
      evalDate: string;
      modelA?: { form: number; answer: number; rule: number; app: number; conc: number; total: number };
      modelB?: { form: number; answer: number; rule: number; app: number; conc: number; total: number };
      modelC?: { form: number; answer: number; rule: number; app: number; conc: number; total: number };
    }

    const rowMap = new Map<string, AggregatedRow>();

    const parseCriteria = (e: any) => {
      const criteria: any[] = safeParseJson(e.criterionScores, []);
      const form = criteria.find((c) => c.criterionName?.toLowerCase() === 'form')?.score ?? 0;
      const answer = criteria.find((c) => c.criterionName?.toLowerCase() === 'answer')?.score ?? 0;
      const rule = criteria.find((c) => c.criterionName?.toLowerCase() === 'rule')?.score ?? 0;
      const app = criteria.find((c) => c.criterionName?.toLowerCase() === 'application')?.score ?? 0;
      const conc = criteria.find((c) => c.criterionName?.toLowerCase() === 'conclusion')?.score ?? 0;
      const total = e ? percentageToCustomFivePoint(e.numericalScore ?? form + answer + rule + app + conc) : 0;
      return { form, answer, rule, app, conc, total };
    };

    evaluations.forEach((e) => {
      const qSnap = safeParseJson(e.questionSnapshot, {});
      const key = `${e.studentId}_${e.questionId}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          studentName: e.student?.name || 'Student',
          studentEmail: e.student?.email || '',
          studentId: e.studentId,
          sessionId: e.sessionId,
          questionId: e.questionId,
          questionCode: qSnap.code || e.questionId,
          orderIndex: Number(qSnap.orderIndex || 0),
          evalDate: e.createdAt.toISOString().slice(0, 10),
        });
      }

      const row = rowMap.get(key)!;
      const scores = parseCriteria(e);
      if (e.modelSlot === 'MODEL_A' || (!e.modelSlot && !row.modelA)) {
        row.modelA = scores;
      } else if (e.modelSlot === 'MODEL_B') {
        row.modelB = scores;
      } else if (e.modelSlot === 'MODEL_C') {
        row.modelC = scores;
      }
    });

    // Sort students alphabetically A-Z, then questions Q01-Q10
    const sortedRows = Array.from(rowMap.values()).sort((a, b) => {
      const nameCompare = a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' });
      if (nameCompare !== 0) return nameCompare;
      const emailCompare = a.studentEmail.localeCompare(b.studentEmail, undefined, { sensitivity: 'base' });
      if (emailCompare !== 0) return emailCompare;
      return a.orderIndex - b.orderIndex || a.questionCode.localeCompare(b.questionCode);
    });

    const csvDataRows = sortedRows.map((r) => ({
      'Student Name': r.studentName,
      'Student Email': r.studentEmail,
      'Question Code': r.questionCode,
      'LLAMA 3.2 - Form': r.modelA?.form ?? '',
      'LLAMA 3.2 - Answer': r.modelA?.answer ?? '',
      'LLAMA 3.2 - Rule': r.modelA?.rule ?? '',
      'LLAMA 3.2 - Application': r.modelA?.app ?? '',
      'LLAMA 3.2 - Conclusion': r.modelA?.conc ?? '',
      'LLAMA 3.2 - Total': r.modelA?.total ?? '',
      'PHI-4 MINI - Form': r.modelB?.form ?? '',
      'PHI-4 MINI - Answer': r.modelB?.answer ?? '',
      'PHI-4 MINI - Rule': r.modelB?.rule ?? '',
      'PHI-4 MINI - Application': r.modelB?.app ?? '',
      'PHI-4 MINI - Conclusion': r.modelB?.conc ?? '',
      'PHI-4 MINI - Total': r.modelB?.total ?? '',
      'GEMMA 2 - Form': r.modelC?.form ?? '',
      'GEMMA 2 - Answer': r.modelC?.answer ?? '',
      'GEMMA 2 - Rule': r.modelC?.rule ?? '',
      'GEMMA 2 - Application': r.modelC?.app ?? '',
      'GEMMA 2 - Conclusion': r.modelC?.conc ?? '',
      'GEMMA 2 - Total': r.modelC?.total ?? '',
      'Evaluation Date': r.evalDate,
    }));

    if (csvDataRows.length === 0) {
      return this.arrayToCSV([]);
    }

    // Compute summary averages/totals for bottom row
    const count = sortedRows.length;
    const avg = (fn: (r: AggregatedRow) => number | undefined) => {
      const vals = sortedRows.map(fn).filter((v): v is number => typeof v === 'number');
      if (vals.length === 0) return '';
      return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2);
    };

    const summaryRow = {
      'Student Name': 'Weighted Score / Average',
      'Student Email': '',
      'Question Code': `Total Items: ${count}`,
      'LLAMA 3.2 - Form': avg((r) => r.modelA?.form),
      'LLAMA 3.2 - Answer': avg((r) => r.modelA?.answer),
      'LLAMA 3.2 - Rule': avg((r) => r.modelA?.rule),
      'LLAMA 3.2 - Application': avg((r) => r.modelA?.app),
      'LLAMA 3.2 - Conclusion': avg((r) => r.modelA?.conc),
      'LLAMA 3.2 - Total': avg((r) => r.modelA?.total),
      'PHI-4 MINI - Form': avg((r) => r.modelB?.form),
      'PHI-4 MINI - Answer': avg((r) => r.modelB?.answer),
      'PHI-4 MINI - Rule': avg((r) => r.modelB?.rule),
      'PHI-4 MINI - Application': avg((r) => r.modelB?.app),
      'PHI-4 MINI - Conclusion': avg((r) => r.modelB?.conc),
      'PHI-4 MINI - Total': avg((r) => r.modelB?.total),
      'GEMMA 2 - Form': avg((r) => r.modelC?.form),
      'GEMMA 2 - Answer': avg((r) => r.modelC?.answer),
      'GEMMA 2 - Rule': avg((r) => r.modelC?.rule),
      'GEMMA 2 - Application': avg((r) => r.modelC?.app),
      'GEMMA 2 - Conclusion': avg((r) => r.modelC?.conc),
      'GEMMA 2 - Total': avg((r) => r.modelC?.total),
      'Evaluation Date': '',
    };

    return this.arrayToCSV([...csvDataRows, summaryRow]);
  }

  /**
   * Generates Student Questions, Model Answer, and Student Response export (Double-blind).
   * Exact structure requested:
   *
   * EXPORT FOR STUDENT QUESTIONS, MODEL ANSWER AND ANSWER
   *
   * QUESTION SET: ___
   * NAME: KRI...... (anonymized: first 3 letters uppercase + dots)
   *
   * QUESTION 1
   *   (question scenario)
   *
   * Model Answer
   *   (model answer)
   *
   * Response
   *   (student answer)
   *
   * QUESTION 2 ... repeat up to QUESTION 10 per student
   */
  static async exportStudentQnAResponses(options?: {
    isDemo?: boolean;
    testSet?: string;
  }): Promise<string> {
    const isDemo = options?.isDemo !== undefined ? options.isDemo : false;
    const requestedTest = (options?.testSet || 'TEST_1').toUpperCase();

    const testSetsToExport: ('TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4')[] =
      requestedTest === 'ALL'
        ? ['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4']
        : [requestedTest as 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4'];

    const [sessions, allQuestions] = await Promise.all([
      prisma.assessmentSession.findMany({
        where: {
          ...(options?.isDemo !== undefined ? { isDemo } : {}),
          status: 'SUBMITTED',
        },
        include: {
          student: true,
          drafts: true,
          evaluations: true,
        },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.question.findMany({
        where: options?.isDemo !== undefined ? { isDemo } : {},
        orderBy: { orderIndex: 'asc' },
      }),
    ]);

    const anonymizeName = (fullName: string): string => {
      const clean = (fullName || 'STUDENT').replace(/[^a-zA-Z]/g, '').toUpperCase();
      const prefix = clean.slice(0, 3).padEnd(3, 'X');
      return `${prefix}......`;
    };

    const fileLines: string[] = [
      'EXPORT FOR STUDENT QUESTIONS, MODEL ANSWER AND ANSWER',
      '',
    ];

    for (const testSetKey of testSetsToExport) {
      const testNum = testSetKey.replace('TEST_', '');
      const testLabel = `Test ${testNum}`;
      const prefix = `TEST${testNum}`;

      // Get the 10 questions for this test set
      const testQuestions = allQuestions.filter(
        (q) => q.testSet === testSetKey || q.code.startsWith(prefix)
      );
      testQuestions.sort((a, b) => {
        if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });

      if (testQuestions.length === 0) continue;

      // Find submitted sessions that correspond to this test set
      const matchingSessions = sessions.filter((s) => {
        const snap: any[] = safeParseJson(s.questionsSnapshot, []);
        const hasSnapMatch = snap.some((sq) => sq.testSet === testSetKey || sq.code?.startsWith(prefix));
        const hasDraftMatch = s.drafts.some((d) => testQuestions.some((tq) => tq.id === d.questionId));
        return hasSnapMatch || hasDraftMatch;
      });

      // Group by studentId so each student appears once per test set
      const studentMap = new Map<string, typeof matchingSessions[0]>();
      matchingSessions.forEach((s) => {
        if (!studentMap.has(s.studentId)) {
          studentMap.set(s.studentId, s);
        }
      });

      // Sort students alphabetically by student name
      const sortedStudents = Array.from(studentMap.values()).sort((a, b) =>
        (a.student?.name || '').localeCompare(b.student?.name || '', undefined, { sensitivity: 'base' })
      );

      for (let sIdx = 0; sIdx < sortedStudents.length; sIdx++) {
        const session = sortedStudents[sIdx];
        const anonName = anonymizeName(session.student?.name || 'STUDENT');

        fileLines.push(`QUESTION SET: ${testLabel}`);
        fileLines.push(`NAME: ${anonName}`);
        fileLines.push('');

        testQuestions.forEach((q, idx) => {
          const qNum = idx + 1; // 1 to 10
          const draft = session.drafts.find((d) => d.questionId === q.id);
          const evaluation = session.evaluations.find((e) => e.questionId === q.id);
          const studentAnswer = (draft?.answerText || evaluation?.studentAnswer || '').trim();

          fileLines.push(`QUESTION ${qNum}`);
          fileLines.push(q.scenario || q.title || '');
          fileLines.push('');
          fileLines.push('Model Answer');
          fileLines.push(q.modelAnswer || '');
          fileLines.push('');
          fileLines.push('Response');
          fileLines.push(studentAnswer || '(No answer provided)');
          fileLines.push('');

          // Clear separation line between questions
          if (idx < testQuestions.length - 1) {
            fileLines.push('--------------------------------------------------------------------------------');
            fileLines.push('');
          }
        });

        if (sIdx < sortedStudents.length - 1) {
          fileLines.push('================================================================================');
          fileLines.push('');
        }
      }

      if (testSetsToExport.length > 1) {
        fileLines.push('################################################################################');
        fileLines.push('');
      }
    }

    return fileLines.join('\n');
  }

  /**
   * Generates Student Questions, Model Answer, and Student Response export as a styled PDF document (Double-blind).
   * Exact structure matching double-blind faculty review standards:
   *
   * EXPORT FOR STUDENT QUESTIONS, MODEL ANSWER AND ANSWER
   *
   * QUESTION SET: ___
   * NAME: KRI...... (anonymized: first 3 letters uppercase + dots)
   *
   * QUESTION 1
   *   (question scenario)
   *
   * Model Answer
   *   (model answer)
   *
   * Response
   *   (student answer)
   *
   * [Clear separation line]
   *
   * QUESTION 2 ... repeat up to QUESTION 10 per student
   */
  static async exportStudentQnAPDF(options?: {
    isDemo?: boolean;
    testSet?: string;
  }): Promise<Buffer> {
    const isDemo = options?.isDemo !== undefined ? options.isDemo : false;
    const requestedTest = (options?.testSet || 'TEST_1').toUpperCase();

    const testSetsToExport: ('TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4')[] =
      requestedTest === 'ALL'
        ? ['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4']
        : [requestedTest as 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4'];

    const [sessions, allQuestions] = await Promise.all([
      prisma.assessmentSession.findMany({
        where: {
          ...(options?.isDemo !== undefined ? { isDemo } : {}),
          status: 'SUBMITTED',
        },
        include: {
          student: true,
          drafts: true,
          evaluations: true,
        },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.question.findMany({
        where: options?.isDemo !== undefined ? { isDemo } : {},
        orderBy: { orderIndex: 'asc' },
      }),
    ]);

    const anonymizeName = (fullName: string): string => {
      const clean = (fullName || 'STUDENT').replace(/[^a-zA-Z]/g, '').toUpperCase();
      const prefix = clean.slice(0, 3).padEnd(3, 'X');
      return `${prefix}......`;
    };

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 45, bottom: 50, left: 45, right: 45 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      let isFirstPage = true;

      for (const testSetKey of testSetsToExport) {
        const testNum = testSetKey.replace('TEST_', '');
        const testLabel = `Test ${testNum}`;
        const prefix = `TEST${testNum}`;

        const testQuestions = allQuestions.filter(
          (q) => q.testSet === testSetKey || q.code.startsWith(prefix)
        );
        testQuestions.sort((a, b) => {
          if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
          return a.code.localeCompare(b.code, undefined, { numeric: true });
        });

        if (testQuestions.length === 0) continue;

        const matchingSessions = sessions.filter((s) => {
          const snap: any[] = safeParseJson(s.questionsSnapshot, []);
          const hasSnapMatch = snap.some((sq) => sq.testSet === testSetKey || sq.code?.startsWith(prefix));
          const hasDraftMatch = s.drafts.some((d) => testQuestions.some((tq) => tq.id === d.questionId));
          return hasSnapMatch || hasDraftMatch;
        });

        const studentMap = new Map<string, typeof matchingSessions[0]>();
        matchingSessions.forEach((s) => {
          if (!studentMap.has(s.studentId)) {
            studentMap.set(s.studentId, s);
          }
        });

        const sortedStudents = Array.from(studentMap.values()).sort((a, b) =>
          (a.student?.name || '').localeCompare(b.student?.name || '', undefined, { sensitivity: 'base' })
        );

        if (sortedStudents.length === 0) {
          // If exporting ALL, skip test sets that have no submitted student responses
          if (requestedTest === 'ALL') continue;

          // If a single specific test was requested with no submissions, show clean notice on page 1
          doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold')
            .text('EXPORT FOR STUDENT QUESTIONS, MODEL ANSWER AND ANSWER', { align: 'center' });
          doc.moveDown(1);
          doc.fillColor('#64748b').fontSize(11).font('Helvetica')
            .text(`QUESTION SET: ${testLabel}`, { align: 'center' });
          doc.moveDown(1);
          doc.fillColor('#94a3b8').fontSize(10).font('Helvetica-Oblique')
            .text('(No submitted student responses found for this question set)', { align: 'center' });
          continue;
        }

        for (let sIdx = 0; sIdx < sortedStudents.length; sIdx++) {
          const session = sortedStudents[sIdx];
          const anonName = anonymizeName(session.student?.name || 'STUDENT');

          if (!isFirstPage) {
            // Only add a new page if the current page has already had content written to it
            if (doc.y > doc.page.margins.top) {
              doc.addPage();
            }
          }
          isFirstPage = false;

          // Header title
          doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold')
            .text('EXPORT FOR STUDENT QUESTIONS, MODEL ANSWER AND ANSWER', { align: 'center' });
          doc.moveDown(0.6);

          // Student Banner Box
          const bannerY = doc.y;
          doc.roundedRect(45, bannerY, 522, 38, 4)
            .fillAndStroke('#f8fafc', '#cbd5e1');

          doc.fillColor('#0f172a').fontSize(10.5).font('Helvetica-Bold')
            .text(`QUESTION SET: ${testLabel}`, 55, bannerY + 6);
          doc.fillColor('#1e293b').fontSize(10.5).font('Helvetica-Bold')
            .text(`NAME: ${anonName}`, 55, bannerY + 20);

          doc.y = bannerY + 48;

          // Render each question (Q1 - Q10)
          testQuestions.forEach((q, idx) => {
            const qNum = idx + 1;
            const draft = session.drafts.find((d) => d.questionId === q.id);
            const evaluation = session.evaluations.find((e) => e.questionId === q.id);
            const studentAnswer = (draft?.answerText || evaluation?.studentAnswer || '').trim();

            // Check if remaining page height is low
            if (doc.y > 640) {
              doc.addPage();
            }

            // Question header
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
              .text(`QUESTION ${qNum}`);
            doc.moveDown(0.25);

            // Question scenario
            doc.fillColor('#334155').fontSize(9.5).font('Helvetica')
              .text(q.scenario || q.title || '(No scenario provided)', { lineGap: 2.5 });
            doc.moveDown(0.5);

            // Model Answer header
            doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
              .text('Model Answer');
            doc.moveDown(0.2);

            // Model Answer text
            doc.fillColor('#334155').fontSize(9.5).font('Helvetica')
              .text(q.modelAnswer || '(No model answer provided)', { lineGap: 2 });
            doc.moveDown(0.5);

            // Response header
            doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
              .text('Response');
            doc.moveDown(0.2);

            // Student Answer text
            doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica')
              .text(studentAnswer || '(No answer provided)', { lineGap: 2 });
            doc.moveDown(0.6);

            // Clear separation line between questions
            if (idx < testQuestions.length - 1) {
              const sepY = doc.y;
              doc.strokeColor('#cbd5e1').lineWidth(1)
                .moveTo(45, sepY)
                .lineTo(567, sepY)
                .stroke();
              doc.moveDown(0.7);
            }
          });
        }
      }

      // Add page numbers on all buffered pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        // Temporarily reset bottom margin to 0 to prevent automatic page creation in footer
        doc.page.margins.bottom = 0;
        doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text(
          `Lexify • Double-Blind Legal Assessment Research • Page ${i + 1} of ${range.count}`,
          45,
          755,
          { align: 'center', width: 522, lineBreak: false }
        );
      }

      doc.end();
    });
  }

  /**
   * Generates Student Submitted Answers PDF Export for TEST 1 or TEST 2.
   * Admin-only research export for peer review and thesis group evaluation.
   * 
   * Strict requirements:
   * - Test title (TEST 1 or TEST 2).
   * - Anonymized participant identifier (e.g. Participant P01 [GER......]).
   * - All 10 questions in original order using frozen question snapshots.
   * - Each student's exact submitted answer (verbatim, uncorrected).
   * - Submission date & session reference.
   * - Labeled: "MOCKUP / SIMULATED DATA — NOT ACTUAL STUDENT RESEARCH RESPONSES".
   * - Original submissions only (isDemo: false). No duplicates from V2 retest/demo sessions.
   * - Strictly excludes AI grades, criterion scores, AI feedback, reference answers, and model identities.
   */
  static async exportStudentAnswersPDF(options: {
    testSet: 'TEST_1' | 'TEST_2';
    studentId?: string;
    sessionId?: string;
  }): Promise<Buffer> {
    const testSet = (options.testSet || 'TEST_1').toUpperCase() as 'TEST_1' | 'TEST_2';
    const prefix = testSet === 'TEST_1' ? 'TEST1' : 'TEST2';
    const testLabel =
      testSet === 'TEST_1'
        ? 'TEST 1: PHILIPPINE PARTNERSHIP LAW (FORMATION & GENERAL PROVISIONS)'
        : 'TEST 2: PHILIPPINE PARTNERSHIP LAW (OBLIGATIONS & RELATIONS OF PARTNERS)';

    // Fetch original submitted sessions only (isDemo: false, status: SUBMITTED)
    const sessions = await prisma.assessmentSession.findMany({
      where: {
        isDemo: false,
        status: 'SUBMITTED',
        ...(options.sessionId ? { id: options.sessionId } : {}),
        ...(options.studentId ? { studentId: options.studentId } : {}),
      },
      include: {
        student: true,
        drafts: true,
        evaluations: { select: { questionId: true, studentAnswer: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });

    // Filter matching sessions for requested test set
    const matchingSessions = sessions.filter((s) => {
      const snap: any[] = safeParseJson(s.questionsSnapshot, []);
      return snap.some(
        (sq) =>
          sq.testSet === testSet ||
          sq.code?.startsWith(prefix) ||
          (testSet === 'TEST_1' && sq.code?.startsWith('PHASE1-SET1'))
      );
    });

    // De-duplicate per student so each student appears once
    const studentMap = new Map<string, (typeof matchingSessions)[0]>();
    matchingSessions.forEach((s) => {
      if (!studentMap.has(s.studentId)) {
        studentMap.set(s.studentId, s);
      }
    });

    const sortedSessions = Array.from(studentMap.values()).sort((a, b) =>
      (a.student?.name || '').localeCompare(b.student?.name || '', undefined, { sensitivity: 'base' })
    );

    const anonymizeName = (fullName: string): string => {
      const clean = (fullName || 'STUDENT').replace(/[^a-zA-Z]/g, '').toUpperCase();
      const p = clean.slice(0, 3).padEnd(3, 'X');
      return `${p}......`;
    };

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 45, bottom: 50, left: 45, right: 45 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      if (sortedSessions.length === 0) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text('LEXIFY — STUDENT ESSAY ANSWERS EXPORT', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica').fillColor('#64748b').text(testLabel, { align: 'center' });
        doc.moveDown(1);
        doc
          .fontSize(10)
          .font('Helvetica-Oblique')
          .fillColor('#dc2626')
          .text('(No submitted original student answers found for this test set)', { align: 'center' });
        doc.end();
        return;
      }

      let isFirstPage = true;

      sortedSessions.forEach((session, sIdx) => {
        const participantCode = `P${String(sIdx + 1).padStart(2, '0')}`;
        const anonName = anonymizeName(session.student?.name || 'STUDENT');
        const participantLabel = `Participant ${participantCode} [${anonName}]`;

        const snap: any[] = safeParseJson(session.questionsSnapshot, []);
        snap.sort((a, b) => {
          if (a.orderIndex !== undefined && b.orderIndex !== undefined && a.orderIndex !== b.orderIndex) {
            return a.orderIndex - b.orderIndex;
          }
          return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true });
        });

        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        // Top Disclaimer Banner
        const bannerTopY = doc.y;
        doc.rect(45, bannerTopY, 522, 24).fill('#fee2e2');
        doc.rect(45, bannerTopY, 522, 24).stroke('#f87171');
        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor('#991b1b')
          .text('MOCKUP / SIMULATED DATA — NOT ACTUAL STUDENT RESEARCH RESPONSES', 45, bannerTopY + 7, {
            align: 'center',
            width: 522,
          });

        doc.y = bannerTopY + 34;

        // Document Title
        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text('LEXIFY — STUDENT ESSAY SUBMISSION RECORD', { align: 'center' });
        doc.moveDown(0.3);

        doc
          .fontSize(10.5)
          .font('Helvetica-Bold')
          .fillColor('#334155')
          .text(testLabel, { align: 'center' });
        doc.moveDown(0.6);

        // Participant & Session Metadata Card
        const cardY = doc.y;
        doc.roundedRect(45, cardY, 522, 54, 4).fillAndStroke('#f8fafc', '#cbd5e1');

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(`PARTICIPANT:`, 55, cardY + 8)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text(participantLabel, 150, cardY + 8);

        const formattedDate = session.submittedAt
          ? new Date(session.submittedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) +
            ' at ' +
            new Date(session.submittedAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            })
          : 'Date Not Recorded';

        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#475569')
          .text(`SUBMISSION DATE:`, 55, cardY + 23)
          .font('Helvetica')
          .fillColor('#334155')
          .text(formattedDate, 150, cardY + 23);

        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor('#64748b')
          .text(`SESSION REF:`, 55, cardY + 38)
          .font('Courier')
          .fillColor('#64748b')
          .text(`${session.id} (Original Mockup Submission)`, 150, cardY + 38);

        doc.y = cardY + 66;

        // Render all 10 Questions and Student Answers
        snap.forEach((q, qIdx) => {
          const qNum = qIdx + 1;
          const draft = session.drafts.find((d) => d.questionId === q.id);
          const evalMatch = session.evaluations.find((e) => e.questionId === q.id);
          const studentAnswer = (draft?.answerText || evalMatch?.studentAnswer || '').trim();

          // Check if page room is too tight for a new question header
          if (doc.y > 640) {
            doc.addPage();
          }

          // Question Heading Box
          const qHeadY = doc.y;
          doc.roundedRect(45, qHeadY, 522, 22, 3).fill('#f1f5f9');
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#0f172a')
            .text(`QUESTION ${qNum} OF 10: ${q.code} — ${q.title || 'Legal Problem'}`, 53, qHeadY + 5, {
              width: 506,
              lineBreak: false,
            });

          doc.y = qHeadY + 28;

          // Legal Problem / Scenario
          doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text('LEGAL SCENARIO / PROMPT:');
          doc.moveDown(0.25);
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#1e293b')
            .text(q.scenario || q.prompt || '(No scenario provided in snapshot)', {
              lineGap: 2.5,
              align: 'justify',
            });
          doc.moveDown(0.5);

          // Student's Exact Submitted Answer
          doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e40af').text('STUDENT EXACT SUBMITTED ANSWER:');
          doc.moveDown(0.25);

          const answerText = studentAnswer || '[No response text submitted by student]';
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#0f172a')
            .text(answerText, {
              lineGap: 2.5,
              align: 'justify',
            });
          doc.moveDown(0.7);

          // Horizontal Separator Line (except after last question of the student)
          if (qIdx < snap.length - 1) {
            const sepY = doc.y;
            doc
              .strokeColor('#e2e8f0')
              .lineWidth(1)
              .moveTo(45, sepY)
              .lineTo(567, sepY)
              .stroke();
            doc.moveDown(0.7);
          }
        });
      });

      // Add running page numbers and watermark footer across all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;

        // Subtle top header line
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(45, 32)
          .lineTo(567, 32)
          .stroke();

        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text('LEXIFY ACADEMIC RESEARCH PROTOTYPE • FSUU COLLEGE OF LAW', 45, 22, {
            align: 'left',
            width: 300,
          });

        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor('#dc2626')
          .text('SIMULATED DATA / MOCKUP REVIEW', 350, 22, {
            align: 'right',
            width: 217,
          });

        // Bottom footer
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(45, 750)
          .lineTo(567, 750)
          .stroke();

        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor('#dc2626')
          .text('MOCKUP / SIMULATED DATA — NOT ACTUAL STUDENT RESEARCH RESPONSES', 45, 756, {
            align: 'left',
            width: 380,
          });

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`Page ${i + 1} of ${range.count}`, 430, 756, {
            align: 'right',
            width: 137,
          });
      }

      doc.end();
    });
  }

  /**
   * Generates Manual Expert Scoring Sheet (CSV).
   * Double-blind: strictly NO LLM model names or scores exposed.
   * Header: Evaluator, Question Set, Date.
   * Columns: Student Name, Question Code, Form (15%), Answer (15%), Rule (30%), Application (30%), Conclusion (10%), Total (100%).
   */
  static async exportExpertGradingCSV(options?: { isDemo?: boolean; testSet?: string }): Promise<string> {
    const isDemo = options?.isDemo !== undefined ? options.isDemo : true;
    const sessions = await prisma.assessmentSession.findMany({
      where: {
        ...(options?.isDemo !== undefined ? { isDemo } : {}),
        status: 'SUBMITTED',
      },
      include: {
        student: true,
        drafts: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Collect questions per student, sorted A-Z by student name, then Q01-Q10
    const studentEntries: Array<{
      studentName: string;
      studentEmail: string;
      questions: Array<{ code: string; title: string; orderIndex: number }>;
    }> = [];

    for (const session of sessions) {
      const fullQuestions: any[] = safeParseJson(session.questionsSnapshot, []);
      const sortedQuestions = fullQuestions.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      studentEntries.push({
        studentName: session.student?.name || 'Student',
        studentEmail: session.student?.email || '',
        questions: sortedQuestions.map((q) => ({
          code: q.code || '',
          title: q.title || '',
          orderIndex: q.orderIndex || 0,
        })),
      });
    }

    // Sort students alphabetically A-Z
    studentEntries.sort((a, b) => a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' }));

    const headerLines = [
      'Expert Evaluator: ______________________________',
      'Question Set: _________________________________',
      `Date: ______________________`,
      '',
    ];

    const tableRows: any[] = [];
    studentEntries.forEach((entry) => {
      entry.questions.forEach((q) => {
        tableRows.push({
          'Student Name': entry.studentName,
          'Question Code': q.code,
          'EXPERT SCORE - Form': '',
          'EXPERT SCORE - Answer': '',
          'EXPERT SCORE - Rule': '',
          'EXPERT SCORE - Application': '',
          'EXPERT SCORE - Conclusion': '',
          'EXPERT SCORE - Total': '',
        });
      });
    });

    // Add summary row at bottom
    tableRows.push({
      'Student Name': 'Weighted Score',
      'Question Code': '',
      'EXPERT SCORE - Form': '',
      'EXPERT SCORE - Answer': '',
      'EXPERT SCORE - Rule': '',
      'EXPERT SCORE - Application': '',
      'EXPERT SCORE - Conclusion': '',
      'EXPERT SCORE - Total': '',
    });

    const csvTable = this.arrayToCSV(tableRows);
    return `${headerLines.join('\n')}\n${csvTable}`;
  }

  /**
   * Generates Double-Blind Expert Grading Package (JSON) with structured objects.
   */
  static async exportExpertGradingJSON(options?: { isDemo?: boolean }) {
    const isDemo = options?.isDemo !== undefined ? options.isDemo : true;
    const sessions = await prisma.assessmentSession.findMany({
      where: {
        ...(options?.isDemo !== undefined ? { isDemo } : {}),
        status: 'SUBMITTED',
      },
      include: {
        drafts: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    let studentCounter = 1;
    const studentCodeMap = new Map<string, string>();
    const items: any[] = [];

    for (const session of sessions) {
      if (!studentCodeMap.has(session.studentId)) {
        studentCodeMap.set(session.studentId, `STUDENT-${String(studentCounter++).padStart(3, '0')}`);
      }
      const anonymizedCode = studentCodeMap.get(session.studentId)!;
      const fullQuestions: any[] = safeParseJson(session.questionsSnapshot, []);

      for (const draft of session.drafts) {
        const qSnap = fullQuestions.find((q) => q.id === draft.questionId) || {};
        items.push({
          submissionId: `${session.id}_${draft.questionId}`,
          sessionId: session.id,
          blindStudentCode: anonymizedCode,
          questionCode: qSnap.code || draft.questionId,
          questionTitle: qSnap.title || '',
          scenario: qSnap.scenario || '',
          modelAnswer: qSnap.modelAnswer || '',
          statutoryElements: safeParseJson(qSnap.statutoryElements, []),
          relevantProvisions: safeParseJson(qSnap.relevantProvisions, []),
          studentAnswer: draft.answerText || '',
        });
      }
    }

    return {
      metadata: {
        title: 'Lexify Independent Expert Blind Grading Package',
        instruction:
          'Evaluate each student essay independently according to the 5 criteria: Form (15), Answer (15), Rule (30), Application (30), Conclusion (10). AI scores are strictly omitted for double-blind integrity.',
        totalSubmissions: items.length,
        exportedAt: new Date().toISOString(),
      },
      items,
    };
  }

  /**
   * Compiles structured data for the printable/downloadable Thesis-Ready Academic Research Report.
   * Server default: isDemo = false.
   */
  static async generateAcademicReportData(options?: { isDemo?: boolean }): Promise<AcademicReportDTO> {

    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;
    const datasets = await this.fetchAllDatasets(isDemoFilter);
    const multiModelStats = await StatisticsService.getMultiModelAnalytics({ isDemo: isDemoFilter });
    const progressionStats = await StatisticsService.getProgressionAnalytics({ isDemo: isDemoFilter });

    const questions = await prisma.question.findMany({
      where: { isDemo: isDemoFilter },
      orderBy: { orderIndex: 'asc' },
    });

    const questionScenarios = questions.map((q) => ({
      code: q.code,
      title: q.title,
      scenario: q.scenario,
      modelAnswer: q.modelAnswer,
      statutoryElements: safeParseJson(q.statutoryElements, []),
      relevantProvisions: safeParseJson(q.relevantProvisions, []),
    }));

    return {
      title: 'Lexify: AI Legal Essay Assessment & Research Platform',
      subtitle:
        'An Empirical Comparative Study on Meta Llama 3.2 3B, Microsoft Phi-4-mini 3.8B, and Google Gemma 2 2B for Evaluating Written Essay Answers of Law Students in Criminal Law I',
      institution: 'FSUU College of Law / Graduate Legal Studies',
      courseSubject: 'Criminal Law I (Revised Penal Code — Book One)',
      generatedAt: new Date().toISOString(),
      isDemo: isDemoFilter,
      disclaimer:
        'ACADEMIC RESEARCH PROTOTYPE DISCLAIMER: This system is developed strictly as an academic research prototype to investigate comparative evaluation performance across open-weights LLMs under SCORING CRITERIA AND INSTRUCTION.pdf. It is not an official law school grading system, formal examination instrument, or legal advice platform.',
      executiveSummary:
        'This research report compiles empirical comparative results evaluating student legal essay answers in Criminal Law I across three independent experimental models: Model A (Meta Llama 3.2 3B), Model B (Microsoft Phi-4-mini 3.8B), and Model C (Google Gemma 2 2B). Each model independently evaluated identical student submissions using the authoritative grading rubric (Form 15%, Answer 15%, Rule 30%, Application 30%, Conclusion 10%) on a 0.00–5.00 scale.',
      datasetSummary: {
        totalStudents: new Set(datasets.submissions.map((s) => s.studentId)).size,
        totalSubmissions: datasets.submissions.length,
        totalAiEvaluations: datasets.allAiEvaluations.length,
        totalExpertEvaluations: datasets.expertEvaluations?.length || 0,
        totalPairedComparisons: datasets.comparisons?.length || 0,
        totalRefinementLogs: datasets.refinementLogs?.length || 0,
        totalPostV3Reviews: datasets.finalV3Reviews?.length || 0,
        totalStudentSurveys: datasets.studentSurveys.length,
        totalExpertSurveys: datasets.expertSurveys?.length || 0,
      },
      questionScenarios,
      iterationProgression: {
        iterations: progressionStats.iterations,
        criterionProgression: progressionStats.criterionProgression,
        progressionNarrative:
          'Observed descriptive statistics across Meta Llama 3.1 8B, Mistral 7B, and Gemma 2 9B demonstrate distribution patterns and inter-model agreement rates.',
      },
      postV3AgreementFindings: progressionStats.postV3Summary,
      refinementAuditTrail: datasets.refinementLogs || [],
      surveyFindings: {
        studentUsability: datasets.studentSurveys,
        expertCapability: datasets.expertSurveys || [],
      },
      methodologyAndLimitations: [
        'Sample size (n) is determined by participating cohort submissions in Criminal Law I.',
        'Independent model evaluations were conducted in parallel with identical question, student answer, reference grounding, and Attorney Rubric snapshots.',
        'All three experimental models were evaluated at target temperature 0.2 and top-p 0.95.',
        'Legal expert grading was conducted independently outside the AI pipeline.',
        'Descriptive statistics report observed means, standard deviations, and pairwise differences; inferential hypothesis tests should be conducted independently.',
      ],
      dataDictionary: datasets.dataDictionary,
    };
  }

  private static async fetchAllDatasets(isDemo: boolean) {
    const [
      sessions,
      evaluations,
      expertEvaluations,
      refinementLogs,
      agentVersions,
      finalV3Reviews,
      surveyResponses,
      modelConfigSettings,
      rubrics,
    ] = await Promise.all([
      prisma.assessmentSession.findMany({
        where: { isDemo, status: 'SUBMITTED' },
        include: { drafts: true },
      }),
      prisma.evaluation.findMany({
        where: { isDemo },
        include: { agentVersion: true, student: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.expertEvaluation.findMany({
        where: { isDemo },
      }),
      prisma.refinementLog.findMany({
        where: { isDemo },
      }),
      prisma.agentVersion.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.finalEvaluationReview.findMany({
        where: { isDemo },
      }),
      prisma.surveyResponse.findMany({
        where: { isDemo },
        include: { questionnaire: true },
      }),
      prisma.modelConfigSetting.findMany({
        orderBy: { modelSlot: 'asc' },
      }),
      prisma.rubric.findMany({
        include: { criteria: true },
      }),
    ]);

    // 01. Submissions
    const submissions = sessions.map((s, idx) => ({
      sessionId: s.id,
      studentId: s.studentId,
      studentAnonymizedCode: `Student-${String(idx + 1).padStart(2, '0')}`,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      submittedAt: s.submittedAt?.toISOString() || '',
      questionCount: safeParseJson(s.questionsSnapshot, []).length,
      answersSubmittedCount: s.drafts.length,
      isDemo: s.isDemo,
    }));

    // Helper for formatting model evaluations
    const formatModelEval = (e: any) => {
      const criteria: any[] = safeParseJson(e.criterionScores, []);
      const formScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'form')?.score || 0;
      const answerScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'answer')?.score || 0;
      const ruleScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'rule')?.score || 0;
      const applicationScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'application')?.score || 0;
      const conclusionScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'conclusion')?.score || 0;

      const weightedPercentage = e.numericalScore;
      const finalScore = Number((weightedPercentage * 0.05).toFixed(4));
      const roundedScore = percentageToCustomFivePoint(weightedPercentage);
      const rawTenPointGrade = Number((weightedPercentage / 10).toFixed(4));
      const finalRoundedGrade = Math.round(rawTenPointGrade);

      return {
        evaluationId: e.id,
        sessionId: e.sessionId,
        studentId: e.studentId,
        questionId: e.questionId,
        modelSlot: e.modelSlot || 'MODEL_A',
        modelFamily: e.modelFamily || 'Llama 3.2',
        exactModelId: e.exactModelId || 'llama3.2:3b',
        formScore,
        answerScore,
        ruleScore,
        applicationScore,
        conclusionScore,
        weightedPercentage,
        finalScore,
        roundedScore,
        rawPercentage: weightedPercentage,
        rawTenPointGrade,
        finalRoundedGrade,
        scoringBasis: e.scoringBasis,
        confidenceScore: e.confidenceScore,
        isDemo: e.isDemo,
        createdAt: e.createdAt.toISOString(),
      };
    };

    const llama31Evaluations = evaluations
      .filter((e) => e.modelSlot === 'MODEL_A' || (!e.modelSlot && e.agentVersionId))
      .map(formatModelEval);

    const mistral7bEvaluations = evaluations
      .filter((e) => e.modelSlot === 'MODEL_B')
      .map(formatModelEval);

    const gemma2Evaluations = evaluations
      .filter((e) => e.modelSlot === 'MODEL_C')
      .map(formatModelEval);

    const allAiEvaluations = evaluations.map(formatModelEval);

    // 05. Model Comparative Matrix (Llama 3.2 3B vs Phi-4-mini vs Gemma 2 2B)
    const comparativeMatrix: any[] = [];
    sessions.forEach((s) => {
      const qIds = Array.from(new Set(evaluations.filter((e) => e.sessionId === s.id).map((e) => e.questionId)));
      qIds.forEach((qId) => {
        const evalA = evaluations.find((e) => e.sessionId === s.id && e.questionId === qId && (e.modelSlot === 'MODEL_A' || !e.modelSlot));
        const evalB = evaluations.find((e) => e.sessionId === s.id && e.questionId === qId && e.modelSlot === 'MODEL_B');
        const evalC = evaluations.find((e) => e.sessionId === s.id && e.questionId === qId && e.modelSlot === 'MODEL_C');

        const scoreA = evalA ? Number((evalA.numericalScore * 0.05).toFixed(4)) : null;
        const scoreB = evalB ? Number((evalB.numericalScore * 0.05).toFixed(4)) : null;
        const scoreC = evalC ? Number((evalC.numericalScore * 0.05).toFixed(4)) : null;
        const roundedA = evalA ? percentageToCustomFivePoint(evalA.numericalScore) : null;
        const roundedB = evalB ? percentageToCustomFivePoint(evalB.numericalScore) : null;
        const roundedC = evalC ? percentageToCustomFivePoint(evalC.numericalScore) : null;

        const scores = [scoreA, scoreB, scoreC].filter((g) => g !== null) as number[];
        const maxDelta = scores.length >= 2 ? Math.round((Math.max(...scores) - Math.min(...scores)) * 100) / 100 : 0;

        comparativeMatrix.push({
          sessionId: s.id,
          studentId: s.studentId,
          questionId: qId,
          model_a_score: scoreA !== null ? scoreA : 'N/A',
          model_b_score: scoreB !== null ? scoreB : 'N/A',
          model_c_score: scoreC !== null ? scoreC : 'N/A',
          model_a_rounded_score: roundedA !== null ? roundedA : 'N/A',
          model_b_rounded_score: roundedB !== null ? roundedB : 'N/A',
          model_c_rounded_score: roundedC !== null ? roundedC : 'N/A',
          maxDelta,
          delta_A_minus_B: scoreA !== null && scoreB !== null ? Math.round((scoreA - scoreB) * 100) / 100 : 'N/A',
          delta_B_minus_C: scoreB !== null && scoreC !== null ? Math.round((scoreB - scoreC) * 100) / 100 : 'N/A',
          delta_A_minus_C: scoreA !== null && scoreC !== null ? Math.round((scoreA - scoreC) * 100) / 100 : 'N/A',
          isDemo: s.isDemo,
        });
      });
    });

    // 06. Lexical & Semantic Analysis
    const lexicalSemanticAnalysis = evaluations.map((e) => {
      const lex = safeParseJson(e.lexicalAnalysis, {});
      const sem = safeParseJson(e.semanticAnalysis, {});

      return {
        evaluationId: e.id,
        sessionId: e.sessionId,
        studentId: e.studentId,
        questionId: e.questionId,
        modelSlot: e.modelSlot || 'MODEL_A',
        wordCount: lex.wordCount || 0,
        sentenceCount: lex.sentenceCount || 0,
        averageSentenceLength: lex.averageSentenceLength || 0,
        legalTermCount: lex.legalTermCount || 0,
        uniqueLegalTermsCount: (lex.uniqueLegalTerms || []).length,
        elementsIdentifiedCount: (sem.elementsIdentified || []).length,
        missingElementsCount: (sem.missingElements || []).length,
        hasDirectStance: sem.hasDirectStance ?? false,
        hasDoctrinalGrounding: sem.hasDoctrinalGrounding ?? false,
        hasFactSynthesis: sem.hasFactSynthesis ?? false,
        hasExplicitConclusion: sem.hasExplicitConclusion ?? false,
        syllogismStructureScore: sem.syllogismStructureScore || 0,
        isDemo: e.isDemo,
      };
    });

    // 07. Student Usability Surveys
    const studentSurveys = surveyResponses
      .filter((sr) => sr.respondentRole === 'STUDENT')
      .map((sr) => ({
        responseId: sr.id,
        respondentId: sr.respondentId,
        questionnaireTitle: sr.questionnaire?.title || 'Student Usability Questionnaire',
        answers: sr.answers,
        qualitativeNotes: sr.qualitativeNotes,
        isDemo: sr.isDemo,
        createdAt: sr.createdAt.toISOString(),
      }));

    // 08. Model Configurations
    const modelConfigs = modelConfigSettings.map((mc) => ({
      modelSlot: mc.modelSlot,
      researchName: mc.researchName,
      modelFamily: mc.modelFamily,
      parameterClass: mc.parameterClass,
      provider: mc.provider,
      exactModelId: mc.exactModelId,
      temperature: mc.temperature,
      topP: mc.topP,
      maxTokens: mc.maxTokens,
      isLocked: mc.isLocked,
    }));

    // 09. Scoring Rubric
    const scoringRubrics: any[] = [];
    rubrics.forEach((r) => {
      r.criteria.forEach((c) => {
        scoringRubrics.push({
          rubricName: r.name,
          criterionName: c.name,
          description: c.description,
          weightPercent: c.weightPercent,
          maxPoints: c.maxPoints,
          orderIndex: c.orderIndex,
        });
      });
    });

    // 10. Data Dictionary
    const dataDictionary = [
      { dataset: '01_student_submissions.csv', variable: 'studentAnonymizedCode', type: 'String', description: 'De-identified student participant code' },
      { dataset: '02_llama_3_1_8b_evaluations.csv', variable: 'rawPercentage', type: 'Float (0-100)', description: 'Raw sum of 5 Attorney Matrix criterion scores' },
      { dataset: '02_llama_3_1_8b_evaluations.csv', variable: 'finalRoundedGrade', type: 'Integer (0-10)', description: 'Final integer grade computed via custom Attorney Rounding' },
      { dataset: '03_mistral_7b_evaluations.csv', variable: 'rawPercentage', type: 'Float (0-100)', description: 'Mistral 7B raw score under identical rubric' },
      { dataset: '04_gemma_2_9b_evaluations.csv', variable: 'rawPercentage', type: 'Float (0-100)', description: 'Gemma 2 9B raw score under identical rubric' },
      { dataset: '05_model_comparative_matrix.csv', variable: 'maxDelta', type: 'Float', description: 'Maximum absolute grade difference across the 3 models for the same response' },
      { dataset: '06_lexical_semantic_analysis.csv', variable: 'legalTermCount', type: 'Integer', description: 'Frequency of validated criminal law terms' },
      { dataset: '07_student_usability_surveys.csv', variable: 'answers', type: 'JSON String', description: 'Student Likert responses (1-5 scale) on usability' },
      { dataset: '08_model_configurations.csv', variable: 'exactModelId', type: 'String', description: 'Exact API model identifier used during evaluation' },
      { dataset: '09_scoring_rubric.csv', variable: 'weightPercent', type: 'Float', description: 'Controlling percentage weight (Form:15, Answer:15, Rule:30, App:30, Concl:10)' },
    ];

    // Format Expert Evaluations / Refinements / PostV3 reviews for backward compatibility
    const formattedExpertEvals = expertEvaluations.map((e) => ({
      id: e.id,
      expertId: e.expertId,
      sessionId: e.sessionId,
      questionId: e.questionId,
      numericalScore: e.numericalScore,
      maxScore: e.maxScore,
      scoringBasis: e.scoringBasis,
      criterionScores: e.criterionScores,
      qualitativeComments: e.qualitativeComments,
      isDemo: e.isDemo,
      createdAt: e.createdAt.toISOString(),
    }));

    const comparisons: any[] = [];
    expertEvaluations.forEach((ee) => {
      const matchingAi = evaluations.find(
        (ae) => ae.sessionId === ee.sessionId && ae.questionId === ee.questionId
      );
      if (matchingAi) {
        const scoreDelta = Math.round((ee.numericalScore - matchingAi.numericalScore) * 10) / 10;
        const absoluteDelta = Math.round(Math.abs(ee.numericalScore - matchingAi.numericalScore) * 10) / 10;
        comparisons.push({
          aiEvaluationId: matchingAi.id,
          expertEvaluationId: ee.id,
          sessionId: ee.sessionId,
          questionId: ee.questionId,
          aiScore: matchingAi.numericalScore,
          expertScore: ee.numericalScore,
          maxScore: matchingAi.maxScore,
          scoreDelta,
          absoluteDelta,
          percentageDivergence: Math.round((absoluteDelta / (matchingAi.maxScore || 100)) * 100),
          isDemo: ee.isDemo,
        });
      }
    });

    const formattedRefinements = refinementLogs.map((r) => ({
      id: r.id,
      gapId: r.gapId,
      agentVersionId: r.agentVersionId,
      targetComponent: r.targetComponent,
      gapCategory: r.gapCategory,
      discrepancyDescription: r.discrepancyDescription,
      rootCauseAnalysis: r.rootCauseAnalysis,
      proposedRefinement: r.proposedRefinement,
      status: r.status,
      approvedDecision: r.approvedDecision,
      resultingAgentVersionId: r.resultingAgentVersionId,
      researcherNotes: r.researcherNotes,
      isDemo: r.isDemo,
      createdAt: r.createdAt.toISOString(),
    }));

    const formattedVersions = agentVersions.map((v) => ({
      id: v.id,
      versionTag: v.versionTag,
      label: v.label,
      description: v.description,
      parentVersionId: v.parentVersionId || '',
      isLocked: v.isLocked,
      isActive: v.isActive,
      lockedAt: v.lockedAt?.toISOString() || '',
      createdAt: v.createdAt.toISOString(),
    }));

    const formattedFinalReviews = finalV3Reviews.map((fr) => ({
      id: fr.id,
      expertId: fr.expertId,
      evaluationId: fr.evaluationId,
      sessionId: fr.sessionId,
      questionId: fr.questionId,
      agentVersionId: fr.agentVersionId,
      agreementRating: fr.agreementRating,
      reasoningCorrectnessRating: fr.reasoningCorrectnessRating,
      statutoryGroundingRating: fr.statutoryGroundingRating,
      recommendedScore: fr.recommendedScore,
      aiScore: fr.aiScore,
      scoreDelta: fr.scoreDelta,
      finalVerdict: fr.finalVerdict,
      isDemo: fr.isDemo,
      createdAt: fr.createdAt.toISOString(),
    }));

    const expertSurveys = surveyResponses
      .filter((sr) => sr.respondentRole === 'EXPERT')
      .map((sr) => ({
        responseId: sr.id,
        respondentId: sr.respondentId,
        questionnaireTitle: sr.questionnaire?.title || 'Expert Capability Questionnaire',
        answers: sr.answers,
        qualitativeNotes: sr.qualitativeNotes,
        isDemo: sr.isDemo,
        createdAt: sr.createdAt.toISOString(),
      }));

    return {
      submissions,
      llamaEvaluations: llama31Evaluations,
      phi4Evaluations: mistral7bEvaluations,
      llama31Evaluations,
      mistral7bEvaluations,
      gemma2Evaluations,
      aiEvaluations: allAiEvaluations,
      allAiEvaluations,
      comparativeMatrix,
      lexicalSemanticAnalysis,
      studentSurveys,
      modelConfigs,
      scoringRubrics,
      dataDictionary,
      expertEvaluations: formattedExpertEvals,
      comparisons,
      refinementLogs: formattedRefinements,
      agentVersions: formattedVersions,
      finalV3Reviews: formattedFinalReviews,
      expertSurveys,
    };
  }

  private static arrayToCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        let val = row[header];
        if (val === null || val === undefined) {
          return '""';
        }
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        }
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

function safeParseJson(str: any, fallback: any): any {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
