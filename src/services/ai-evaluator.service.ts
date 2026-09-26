import { z } from 'zod';
import { ProviderFactory } from '../providers/provider.factory';
import { ModelConfig } from '../providers/llm-provider.interface';
import { TextAnalysisService } from './text-analysis.service';

/**
 * Attorney Rounding Rule:
 * Decimal portion <= .50: ROUND DOWN (Floor)
 * Decimal portion > .50: ROUND UP (Ceil)
 *
 * Examples:
 * 10.00 -> 10, 9.51 -> 10, 9.50 -> 9, 9.49 -> 9, 8.51 -> 9, 8.50 -> 8, 8.49 -> 8,
 * 7.51 -> 8, 7.50 -> 7, 7.49 -> 7, 6.51 -> 7, 6.50 -> 6, 6.49 -> 6, 0.51 -> 1, 0.50 -> 0, 0.00 -> 0.
 *
 * Precision-guarded against IEEE-754 floating-point noise.
 */
export function attorneyRounding(grade: number): number {
  if (isNaN(grade)) return 0;
  const clamped = Math.max(0, Math.min(10, grade));
  const integerPart = Math.floor(clamped);
  const fractionalPart = clamped - integerPart;

  // Precision-guarded against IEEE-754 floating point noise:
  // Numbers within 1e-12 of 0.50 (e.g. 0.5000000000000002) are treated as <= 0.50 (round down).
  // Numbers strictly greater than 0.50 + 1e-12 (e.g. 0.5000000001, 0.51) round up.
  if (fractionalPart > 0.50 + 1e-12) {
    return Math.min(10, integerPart + 1);
  }
  return integerPart;
}

export const CriterionScoreSchema = z.object({
  criterionName: z.string(),
  score: z.number().min(0),
  rawScore: z.number().optional(),
  maxPoints: z.number().min(0),
  reasoning: z.string(),
  evidence: z.string().optional().default(''),
  rawEvidence: z.string().optional(),
  deficiencies: z.string().optional().default(''),
  isGroundingValid: z.boolean().optional(),
  groundingFailureReason: z.string().optional(),
});

export const EvaluationOutputSchema = z.object({
  numericalScore: z.number().min(0), // Raw percentage 0-100
  maxScore: z.number().min(0),       // 100
  scoringBasis: z.string(),
  criterionScores: z.array(CriterionScoreSchema),
  strengths: z.array(z.string()),
  missingElements: z.array(z.string()),
  areasForImprovement: z.array(z.string()).default([]),
  confidenceScore: z.preprocess((val) => {
    const num = Number(val ?? 0.95);
    if (isNaN(num) || num < 0) return 0.95;
    return num > 1 ? (num <= 100 ? num / 100 : 1.0) : num;
  }, z.number().min(0).max(1)).default(0.95),
  reviewFlags: z.array(z.string()).default([]),
  rawScores: z.object({
    form: z.number().optional(),
    answer: z.number().optional(),
    rule: z.number().optional(),
    application: z.number().optional(),
    conclusion: z.number().optional(),
  }).optional(),
  // Two-Pass Pipeline Provenance Metadata
  pass1RawExtraction: z.any().optional(),
  pass1ValidatedEvidence: z.any().optional(),
  pass1RepairUsed: z.boolean().optional(),
  pass2RawOutput: z.any().optional(),
  evaluationStatus: z.enum(['COMPLETED', 'FAILED']).optional().default('COMPLETED'),
  failureReason: z.string().optional(),
  // SCORING CRITERIA AND INSTRUCTION.pdf explicit grade fields
  formScore: z.number().min(0).max(15).optional(),
  answerScore: z.number().min(0).max(15).optional(),
  ruleScore: z.number().min(0).max(30).optional(),
  applicationScore: z.number().min(0).max(30).optional(),
  conclusionScore: z.number().min(0).max(10).optional(),
  weightedPercentage: z.number().min(0).max(100).optional(),
  finalScore: z.number().min(0).max(5).optional(),
  rawPercentage: z.number().min(0).max(100).optional(),
  rawTenPointGrade: z.number().min(0).max(10).optional(),
  finalRoundedGrade: z.number().optional(),
  lexicalAnalysis: z.any().optional(),
  semanticAnalysis: z.any().optional(),
});

export type EvaluationOutput = z.infer<typeof EvaluationOutputSchema>;

export interface EvaluateAnswerParams {
  questionSnapshot: any;
  modelConfigSnapshot: ModelConfig;
  rubricSnapshot: any[];
  systemInstructions: string;
  studentAnswer: string;
  isDemo?: boolean;
}

// =========================================================================
// STRICT SPAN EXTRACTION & GROUNDING FUNCTIONS
// =========================================================================
export function extractCleanStudentSpan(rawEvidence: string): string {
  if (!rawEvidence) return '';
  let clean = String(rawEvidence).trim();
  if (!clean || clean.toUpperCase() === 'NONE' || clean === '[]') return '';

  const wrappers = [
    /^(the\s+)?student(\s+submission)?(\s+states|\s+explains|\s+indicates|\s+writes|\s+provides|\s+argues|\s+asserts|\s+concludes|\s+correctly\s+quotes|\s+mentions|\s+identifies|\s+cites)?(\s+that\s*:\s*|\s+that\s+|\s*:\s*)/i,
    /^(the\s+)?answer(\s+states|\s+explains|\s+indicates|\s+says|\s+provides|\s*:\s*)/i,
    /^(the\s+)?response(\s+states|\s+explains|\s+indicates|\s+says|\s+provides|\s*:\s*)/i,
    /^(according\s+to\s+the\s+student(\s+submission)?\s*:\s*|according\s+to\s+the\s+student(\s+submission)?\s*,?\s*)/i,
    /^(referring\s+to|quoting\s*:\s*|quote\s*:\s*)/i,
    /^(quoted\s+from\s+student\s*:\s*)/i,
  ];

  for (const pattern of wrappers) {
    clean = clean.replace(pattern, '').trim();
  }

  // Remove leading/trailing quotes, apostrophes, markdown, and brackets
  clean = clean.replace(/^["'“”‘’`*\[\]]+|["'“”‘’`*\[\]]+$/g, '').trim();
  return clean;
}

export function verifyStrictStudentSpan(span: string, studentText: string): boolean {
  if (!span || !studentText) return false;
  const normSpan = span.toLowerCase().replace(/\s+/g, ' ').trim();
  const normStudent = studentText.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normSpan || normSpan === 'none' || normSpan === '[]' || normSpan.length < 3) return false;

  // Strict substring match in student submission
  return normStudent.includes(normSpan);
}

/**
 * Safely deduplicates repetitive sentences / runaway looping text in qualitative explanation fields.
 * Preserves the first occurrence of each unique sentence while removing redundant consecutive or repeated loops.
 * Never alters scores, criteria weights, or evidence quotes.
 */
export function sanitizeExplanationText(text: string, maxChars: number = 2000): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Split on sentence boundaries (. ! ?) or line breaks
  const rawSentences = trimmed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawSentences.length <= 1) {
    return trimmed.length > maxChars ? trimmed.slice(0, maxChars) + '...' : trimmed;
  }

  const seen = new Set<string>();
  const cleanedSentences: string[] = [];

  for (const sentence of rawSentences) {
    // Normalized key for comparison (case-insensitive, non-alphanumeric stripped)
    const normKey = sentence.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normKey || normKey.length < 8) {
      cleanedSentences.push(sentence);
      continue;
    }
    if (!seen.has(normKey)) {
      seen.add(normKey);
      cleanedSentences.push(sentence);
    }
  }

  const result = cleanedSentences.join(' ');
  return result.length > maxChars ? result.slice(0, maxChars) + '...' : result;
}

export class AiEvaluatorService {
  /**
   * Compatibility wrapper for single-prompt inspection.
   */
  static buildEvaluationPrompt(
    question: any,
    rubricCriteria: any[],
    systemInstructions: string,
    studentAnswer: string
  ): string {
    return this.buildPass1ExtractionPrompt(studentAnswer);
  }

  /**
   * PASS 1 PROMPT: Extracts student-written spans with ZERO reference benchmark.
   */
  static buildPass1ExtractionPrompt(studentAnswer: string): string {
    return `
=== TASK: STUDENT SUBMISSION EVIDENCE EXTRACTION ===
You are an objective legal text extractor. Extract ONLY the exact verbatim text that the student actually wrote for each of the four substantive legal criteria.
DO NOT summarize. DO NOT paraphrase. DO NOT evaluate whether the student's text is correct or complete.

=== CRITERION DEFINITIONS FOR EXTRACTION ===
1. ANSWER EVIDENCE:
Extract only text where the student directly responds to the legal question, takes a definite legal position, or states validity/existence/authority/rights.
Example: "No, a partnership was not created between Alyssa and Bam."
Do NOT classify legal doctrines, factual narrative, or final disposition as Answer evidence.

2. RULE EVIDENCE:
Extract only text where the student states governing statutory law, legal provisions, doctrines, principles, requisites, or elements.
Example: "Under Article 1767 of the Civil Code, a partnership requires an agreement to contribute money, property, or industry to a common fund with the intention of dividing profits."
Do NOT classify factual sentences (e.g. "Bam borrowed ₱1,000,000 from Alyssa.") or conclusion statements as Rule evidence.

3. APPLICATION EVIDENCE:
Extract only text where the student connects relevant facts to a legal rule, doctrine, element, requisite, or legal consequence (fact-rule synthesis or legal reasoning).
Example: "Alyssa was entitled only to fixed monthly interest and had no authority to bind Bam or participate in management, showing an absence of partnership intent."
Do NOT classify bare facts alone (e.g. "Alyssa gave Bam money.") or bare conclusions alone (e.g. "Therefore, they are not partners.") as Application evidence.

4. CONCLUSION EVIDENCE:
Extract only an actual final legal disposition or ultimate resolution.
Example: "Thus, Alyssa and Bam did not form a partnership."
Do NOT classify legal rules or factual application as Conclusion evidence.

=== STUDENT SUBMISSION — EXTRACT ONLY FROM THIS TEXT ===
${studentAnswer}
=== END STUDENT SUBMISSION ===

=== REQUIRED JSON OUTPUT FORMAT ===
Return ONLY a valid JSON object matching this schema:
{
  "answerEvidence": ["exact verbatim quote from student"],
  "ruleEvidence": ["exact verbatim quote from student"],
  "applicationEvidence": ["exact verbatim quote from student"],
  "conclusionEvidence": ["exact verbatim quote from student"]
}
If no qualifying text exists for a criterion in the student submission, use an empty array [].
`.trim();
  }

  /**
   * PASS 1 REPAIR PROMPT: Prompts model to extract exact verbatim quotes without commentary.
   */
  static buildPass1RepairPrompt(studentAnswer: string, rawExtractionJson: string): string {
    return `
=== REPAIR TASK: EXACT VERBATIM EXTRACTION ===
Your previous extraction contained summaries or text not found verbatim in the student submission.
You MUST return ONLY exact verbatim spans copied word-for-word from the STUDENT SUBMISSION.
Do NOT summarize. Do NOT paraphrase. If no text exists for a criterion, return [].

=== STUDENT SUBMISSION ===
${studentAnswer}
=== END STUDENT SUBMISSION ===

=== REQUIRED JSON OUTPUT FORMAT ===
Return ONLY a valid JSON object matching this schema:
{
  "answerEvidence": ["exact verbatim quote from student"],
  "ruleEvidence": ["exact verbatim quote from student"],
  "applicationEvidence": ["exact verbatim quote from student"],
  "conclusionEvidence": ["exact verbatim quote from student"]
}
`.trim();
  }

  /**
   * PASS 2 PROMPT: Grades strictly grounded in validated Pass 1 evidence under SCORING CRITERIA AND INSTRUCTION.pdf.
   */
  static buildPass2ScoringPrompt(
    question: any,
    rubricCriteria: any[],
    systemInstructions: string,
    validatedEvidence: {
      answerEvidence: string[];
      ruleEvidence: string[];
      applicationEvidence: string[];
      conclusionEvidence: string[];
    },
    structuralFormMetadata: {
      paragraphCount: number;
      nonEmptyParagraphCount: number;
      wordCount: number;
      sentenceCount: number;
      hasDistinctParagraphs: boolean;
    }
  ): string {
    const rubricDescription = rubricCriteria
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.name.toUpperCase()} (${c.maxPoints ?? c.weightPercent} pts / ${c.weightPercent}% weight): ${c.description}`
      )
      .join('\n');

    const elementsList = Array.isArray(question.statutoryElements)
      ? question.statutoryElements.join('\n- ')
      : question.statutoryElements || 'None specified';

    const formatList = (arr: string[]) =>
      arr.length > 0 ? arr.map((s) => `"${s}"`).join('\n') : '[NO VALID EVIDENCE EXTRACTED FROM STUDENT]';

    return `
You are evaluating a student's Commercial Law (Partnership) essay response according to the controlling SCORING CRITERIA AND INSTRUCTION.pdf rubric.

${systemInstructions}

=== QUESTION / SCENARIO ===
[QUESTION CODE & TITLE]: ${question.code} - ${question.title}

[FACTUAL SCENARIO]:
${question.scenario}

=== REFERENCE BENCHMARK — EVALUATOR USE ONLY (DO NOT ATTRIBUTE TO STUDENT) ===
[MODEL REFERENCE ANSWER]:
${question.modelAnswer || 'No model answer specified'}

=== REQUIRED LEGAL ELEMENTS — EVALUATOR USE ONLY (DO NOT ATTRIBUTE TO STUDENT) ===
[STATUTORY ELEMENTS]:
- ${elementsList}

=== CONTROLLING RUBRIC (SCORING CRITERIA AND INSTRUCTION.pdf) ===
${rubricDescription}

=== STUDENT SUBMISSION EVIDENCE (PASS 1 VALIDATED) ===
FORM STRUCTURAL METADATA:
- Total Paragraphs: ${structuralFormMetadata.paragraphCount} (Non-empty: ${structuralFormMetadata.nonEmptyParagraphCount})
- Word Count: ${structuralFormMetadata.wordCount}, Sentence Count: ${structuralFormMetadata.sentenceCount}
- Multi-Paragraph Organization: ${structuralFormMetadata.hasDistinctParagraphs ? 'YES' : 'NO'}

1. ANSWER EVIDENCE:
${formatList(validatedEvidence.answerEvidence)}

2. RULE EVIDENCE:
${formatList(validatedEvidence.ruleEvidence)}

3. APPLICATION EVIDENCE:
${formatList(validatedEvidence.applicationEvidence)}

4. CONCLUSION EVIDENCE:
${formatList(validatedEvidence.conclusionEvidence)}
=== END STUDENT EVIDENCE ===

=== CRITICAL CRITERION ISOLATION & SCORING RULES ===
1. INDEPENDENT EVALUATION: You MUST evaluate each of the 5 criteria independently on its own merits under SCORING CRITERIA AND INSTRUCTION.pdf. The absence of evidence for one criterion MUST NEVER cause you to reduce or zero out another criterion that contains valid evidence.
2. CRITERION-SPECIFIC INSTRUCTIONS:
   - ANSWER (0-15): Grade using ONLY the text in ANSWER EVIDENCE. If a valid legal stance exists, award credit (0 to 15) on its own merits under the PDF, even if Rule, Application, or Conclusion are absent. If [NO VALID EVIDENCE], Answer = 0.
   - RULE (0-30): Grade using ONLY the text in RULE EVIDENCE. If governing law, doctrines, or requisites exist, award credit (0 to 30) based on accuracy and completeness under the PDF, even if Answer, Application, or Conclusion are absent. If [NO VALID EVIDENCE], Rule = 0.
   - APPLICATION (0-30): Grade using ONLY the text in APPLICATION EVIDENCE. Evaluate the quality of the fact-rule synthesis and legal reasoning under the PDF. Do NOT require a statutory citation if the reasoning connects facts to legal consequences. If [NO VALID EVIDENCE], Application = 0.
   - CONCLUSION (0-10): Grade using ONLY the text in CONCLUSION EVIDENCE. If a final resolution is stated, award credit (0 to 10) under the PDF. If [NO VALID EVIDENCE], Conclusion = 0.
   - FORM (0-15): Evaluate the submitted text's organization, clarity, and legal-writing style under the PDF. Do NOT automatically assign 0 solely because the submission has 1 or 2 paragraphs.
3. NEVER BORROW EVIDENCE: Evidence assigned to one criterion cannot be used to justify points for another criterion.
4. NEVER award credit for rules or facts from the Reference Benchmark if they are missing from the student's validated evidence.
5. SCORING FORMULA:
   weightedPercentage = formScore + answerScore + ruleScore + applicationScore + conclusionScore (0 to 100)
   finalScore = weightedPercentage * 0.05 (0.00 to 5.00)

=== REQUIRED JSON OUTPUT FORMAT ===
Return ONLY a valid JSON object matching this schema:
{
  "formScore": number (0 to 15),
  "answerScore": number (0 to 15),
  "ruleScore": number (0 to 30),
  "applicationScore": number (0 to 30),
  "conclusionScore": number (0 to 10),
  "weightedPercentage": number (0 to 100),
  "finalScore": number (0.00 to 5.00),
  "scoringBasis": "Detailed explanation of scores awarded based strictly on the validated evidence.",
  "criterionScores": [
    {
      "criterionName": "Form",
      "score": number (0 to 15),
      "maxPoints": 15,
      "reasoning": "Reasoning for Form score.",
      "evidence": "Structural document organization",
      "deficiencies": "Specific deficiencies noted in form."
    },
    {
      "criterionName": "Answer",
      "score": number (0 to 15),
      "maxPoints": 15,
      "reasoning": "Reasoning for Answer score.",
      "evidence": "Quote from Answer Evidence or 'NONE'",
      "deficiencies": "Specific deficiencies noted in answer."
    },
    {
      "criterionName": "Rule",
      "score": number (0 to 30),
      "maxPoints": 30,
      "reasoning": "Reasoning for Rule score.",
      "evidence": "Quote from Rule Evidence or 'NONE'",
      "deficiencies": "Specific omitted elements or doctrinal errors."
    },
    {
      "criterionName": "Application",
      "score": number (0 to 30),
      "maxPoints": 30,
      "reasoning": "Reasoning for Application score.",
      "evidence": "Quote from Application Evidence or 'NONE'",
      "deficiencies": "Specific gaps in legal reasoning."
    },
    {
      "criterionName": "Conclusion",
      "score": number (0 to 10),
      "maxPoints": 10,
      "reasoning": "Reasoning for Conclusion score.",
      "evidence": "Quote from Conclusion Evidence or 'NONE'",
      "deficiencies": "Specific deficiencies noted in conclusion."
    }
  ],
  "strengths": ["List of strengths present in validated evidence, or [] if none"],
  "missingElements": ["List of omitted statutory elements"],
  "areasForImprovement": ["Suggestions for improvement"],
  "confidenceScore": number,
  "reviewFlags": []
}
`.trim();
  }

  /**
   * Executes semantic evaluation using the TWO-PASS EVIDENCE-FIRST PIPELINE and validates output with Zod.
   */
  static async evaluateAnswer(params: EvaluateAnswerParams): Promise<EvaluationOutput> {
    const { questionSnapshot, modelConfigSnapshot, rubricSnapshot, systemInstructions, studentAnswer, isDemo } =
      params;

    const totalMaxPoints = rubricSnapshot.reduce(
      (sum, c) => sum + (c.maxPoints ?? c.weightPercent ?? 20),
      0
    );

    const trimmed = (studentAnswer || '').trim();
    const lexicalAnalysis = TextAnalysisService.analyzeLexical(studentAnswer);
    const semanticAnalysis = TextAnalysisService.analyzeSemantic(studentAnswer, questionSnapshot);

    // =========================================================================
    // DETERMINISTIC PRE-INFERENCE NON-SUBSTANTIVE SANITY GATE
    // =========================================================================
    const nonsubstantiveCheck = checkIsNonsubstantive(trimmed, questionSnapshot);
    if (nonsubstantiveCheck.isNonsubstantive) {
      const modelPrefix = modelConfigSnapshot?.researchName
        ? `[${modelConfigSnapshot.researchName} (${modelConfigSnapshot.exactModelId || modelConfigSnapshot.modelSlot})] `
        : '';

      const statutoryElements: string[] = Array.isArray(questionSnapshot.statutoryElements)
        ? questionSnapshot.statutoryElements
        : typeof questionSnapshot.statutoryElements === 'string'
        ? safeParseJson(questionSnapshot.statutoryElements, [])
        : [];

      return {
        numericalScore: 0,
        maxScore: totalMaxPoints,
        scoringBasis: `${modelPrefix}The submitted response ("${trimmed || 'EMPTY'}") is non-substantive and contains no legal analysis, statutory grounding, or application of governing legal rules. Zero credit awarded across all 5 evaluation criteria under SCORING CRITERIA AND INSTRUCTION.pdf (Final Score: 0.00/5).`,
        formScore: 0,
        answerScore: 0,
        ruleScore: 0,
        applicationScore: 0,
        conclusionScore: 0,
        weightedPercentage: 0,
        rawPercentage: 0,
        finalScore: 0,
        rawTenPointGrade: 0,
        finalRoundedGrade: 0,
        criterionScores: [
          {
            criterionName: 'Form',
            score: 0,
            maxPoints: 15,
            reasoning: 'Non-substantive submission; no ARAC structure.',
            evidence: trimmed || 'NONE',
            deficiencies: 'Structure your answer into distinct Answer, Rule, Application, and Conclusion paragraphs.',
          },
          {
            criterionName: 'Answer',
            score: 0,
            maxPoints: 15,
            reasoning: 'No responsive legal position stated.',
            evidence: 'NONE',
            deficiencies: 'State a definite legal stance addressing the call of the question.',
          },
          {
            criterionName: 'Rule',
            score: 0,
            maxPoints: 30,
            reasoning: 'No statutory rules or doctrines articulated.',
            evidence: 'NONE',
            deficiencies: statutoryElements.length > 0 ? `Omitted statutory elements: ${statutoryElements.join('; ')}` : 'State governing statutory provisions and doctrines.',
          },
          {
            criterionName: 'Application',
            score: 0,
            maxPoints: 30,
            reasoning: 'No factual application or legal syllogism provided.',
            evidence: 'NONE',
            deficiencies: 'Apply statutory elements to the decisive facts of the scenario.',
          },
          {
            criterionName: 'Conclusion',
            score: 0,
            maxPoints: 10,
            reasoning: 'No legal conclusion reached.',
            evidence: 'NONE',
            deficiencies: 'Provide a clear final conclusion resolving the ultimate question.',
          },
        ],
        strengths: [],
        missingElements: statutoryElements.length > 0 ? statutoryElements : ['All required statutory elements'],
        areasForImprovement: [
          'Formulate a substantive legal essay identifying the core legal issue in the scenario.',
          'Structure your answer into distinct Answer, Rule, Application, and Conclusion paragraphs.',
        ],
        confidenceScore: 1.0,
        reviewFlags: ['NONSUBSTANTIVE_SUBMISSION'],
        evaluationStatus: 'COMPLETED',
        lexicalAnalysis,
        semanticAnalysis,
      };
    }

    // =========================================================================
    // TWO-PASS EVIDENCE-FIRST EVALUATION PIPELINE
    // =========================================================================
    try {
      const provider = ProviderFactory.getProvider(modelConfigSnapshot.provider);

      // --- PASS 1: EVIDENCE EXTRACTION ONLY (ZERO BENCHMARK) ---
      const pass1Prompt = this.buildPass1ExtractionPrompt(trimmed);
      let pass1Raw = await provider.evaluatePrompt(pass1Prompt, modelConfigSnapshot);
      let pass1Parsed: {
        answerEvidence?: string[];
        ruleEvidence?: string[];
        applicationEvidence?: string[];
        conclusionEvidence?: string[];
      } = repairJsonString(pass1Raw);

      // Strict span validator: verifies extracted quotes exist verbatim in student text
      const validateSpans = (input: any): string[] => {
        const arr = Array.isArray(input) ? input : typeof input === 'string' ? [input] : [];
        const valid: string[] = [];
        for (const item of arr) {
          if (typeof item !== 'string') continue;
          const clean = extractCleanStudentSpan(item);
          if (clean && verifyStrictStudentSpan(clean, trimmed)) {
            valid.push(clean);
          }
        }
        return valid;
      };

      let validatedEvidence = {
        answerEvidence: validateSpans(pass1Parsed?.answerEvidence),
        ruleEvidence: validateSpans(pass1Parsed?.ruleEvidence),
        applicationEvidence: validateSpans(pass1Parsed?.applicationEvidence),
        conclusionEvidence: validateSpans(pass1Parsed?.conclusionEvidence),
      };

      let pass1RepairUsed = false;
      const totalExtractedSpans =
        validatedEvidence.answerEvidence.length +
        validatedEvidence.ruleEvidence.length +
        validatedEvidence.applicationEvidence.length +
        validatedEvidence.conclusionEvidence.length;

      // PASS 1 RETRY/REPAIR: If model generated non-verbatim commentary / ungrounded spans
      const hasRawExtractedText =
        (pass1Parsed?.answerEvidence?.length ?? 0) +
        (pass1Parsed?.ruleEvidence?.length ?? 0) +
        (pass1Parsed?.applicationEvidence?.length ?? 0) +
        (pass1Parsed?.conclusionEvidence?.length ?? 0) > 0;

      if (hasRawExtractedText && totalExtractedSpans === 0) {
        pass1RepairUsed = true;
        const repairPrompt = this.buildPass1RepairPrompt(trimmed, pass1Raw);
        const repairRaw = await provider.evaluatePrompt(repairPrompt, modelConfigSnapshot);
        const repairParsed = repairJsonString(repairRaw);

        validatedEvidence = {
          answerEvidence: validateSpans(repairParsed?.answerEvidence),
          ruleEvidence: validateSpans(repairParsed?.ruleEvidence),
          applicationEvidence: validateSpans(repairParsed?.applicationEvidence),
          conclusionEvidence: validateSpans(repairParsed?.conclusionEvidence),
        };
      }

      // Neutral structural Form metadata computed server-side
      const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      const structuralFormMetadata = {
        paragraphCount: paragraphs.length,
        nonEmptyParagraphCount: paragraphs.length,
        wordCount: lexicalAnalysis.wordCount,
        sentenceCount: lexicalAnalysis.sentenceCount,
        hasDistinctParagraphs: paragraphs.length >= 3,
      };

      // --- PASS 2: SCORING (STRICTLY GROUNDED IN VALIDATED EVIDENCE) ---
      const pass2Prompt = this.buildPass2ScoringPrompt(
        questionSnapshot,
        rubricSnapshot,
        systemInstructions,
        validatedEvidence,
        structuralFormMetadata
      );

      const pass2Raw = await provider.evaluatePrompt(pass2Prompt, modelConfigSnapshot);
      const parsed = repairJsonString(pass2Raw);
      parsed.maxScore = totalMaxPoints;

      // Normalize confidenceScore
      let conf = Number(parsed.confidenceScore ?? 0.95);
      if (isNaN(conf) || conf < 0) conf = 0.95;
      if (conf > 1) conf = conf <= 100 ? conf / 100 : 1.0;
      parsed.confidenceScore = conf;

      // Normalize string arrays
      const normalizeStringArray = (val: any, fallback: string[] = []): string[] => {
        if (!val) return fallback;
        const arr = Array.isArray(val) ? val : [val];
        return arr.map((item: any) =>
          typeof item === 'string'
            ? item
            : item?.element || item?.name || item?.description || item?.text || JSON.stringify(item)
        );
      };

      parsed.strengths = normalizeStringArray(parsed.strengths, ['Identified legal elements']);
      parsed.missingElements = normalizeStringArray(parsed.missingElements, []);
      parsed.areasForImprovement = normalizeStringArray(parsed.areasForImprovement, ['Continue refining legal analysis']);

      const modelPrefix = modelConfigSnapshot?.researchName
        ? `[${modelConfigSnapshot.researchName} (${modelConfigSnapshot.exactModelId || modelConfigSnapshot.modelSlot})] `
        : '';

      // Raw model scores before zeroing
      const rawScores = {
        form: Number(parsed.formScore ?? 0),
        answer: Number(parsed.answerScore ?? 0),
        rule: Number(parsed.ruleScore ?? 0),
        application: Number(parsed.applicationScore ?? 0),
        conclusion: Number(parsed.conclusionScore ?? 0),
      };

      // Authoritative Clamping
      parsed.formScore = Math.max(0, Math.min(15, Math.round(Number(parsed.formScore ?? 0) * 10) / 10));
      parsed.answerScore = Math.max(0, Math.min(15, Math.round(Number(parsed.answerScore ?? 0) * 10) / 10));
      parsed.ruleScore = Math.max(0, Math.min(30, Math.round(Number(parsed.ruleScore ?? 0) * 10) / 10));
      parsed.applicationScore = Math.max(0, Math.min(30, Math.round(Number(parsed.applicationScore ?? 0) * 10) / 10));
      parsed.conclusionScore = Math.max(0, Math.min(10, Math.round(Number(parsed.conclusionScore ?? 0) * 10) / 10));

      if (!parsed.reviewFlags || !Array.isArray(parsed.reviewFlags)) {
        parsed.reviewFlags = [];
      }
      if (modelConfigSnapshot.provider === 'ollama') {
        parsed.reviewFlags = Array.from(new Set([...parsed.reviewFlags, 'LIVE_LOCAL_MODEL']));
      }

      // STRICT ZEROING IF PASS 1 VALIDATED EVIDENCE IS EMPTY (No cross-criterion borrowing)
      if (validatedEvidence.answerEvidence.length === 0) {
        if (parsed.answerScore > 0) {
          parsed.reviewFlags.push('EVIDENCE_GROUNDING_FAILURE');
          parsed.reviewFlags.push('EVALUATOR_ANOMALY');
        }
        parsed.answerScore = 0;
      }
      if (validatedEvidence.ruleEvidence.length === 0) {
        if (parsed.ruleScore > 0) {
          parsed.reviewFlags.push('EVIDENCE_GROUNDING_FAILURE');
          parsed.reviewFlags.push('EVALUATOR_ANOMALY');
        }
        parsed.ruleScore = 0;
      }
      if (validatedEvidence.applicationEvidence.length === 0) {
        if (parsed.applicationScore > 0) {
          parsed.reviewFlags.push('EVIDENCE_GROUNDING_FAILURE');
          parsed.reviewFlags.push('EVALUATOR_ANOMALY');
        }
        parsed.applicationScore = 0;
      }
      if (validatedEvidence.conclusionEvidence.length === 0) {
        if (parsed.conclusionScore > 0) {
          parsed.reviewFlags.push('EVIDENCE_GROUNDING_FAILURE');
          parsed.reviewFlags.push('EVALUATOR_ANOMALY');
        }
        parsed.conclusionScore = 0;
      }

      parsed.reviewFlags = Array.from(new Set(parsed.reviewFlags));

      // Recompute weightedPercentage and finalScore
      parsed.weightedPercentage = Number(
        (parsed.formScore + parsed.answerScore + parsed.ruleScore + parsed.applicationScore + parsed.conclusionScore).toFixed(4)
      );
      parsed.rawPercentage = parsed.weightedPercentage;
      parsed.numericalScore = parsed.weightedPercentage;
      parsed.finalScore = Number((parsed.weightedPercentage * 0.05).toFixed(4));
      parsed.rawTenPointGrade = Number((parsed.weightedPercentage / 10).toFixed(4));
      parsed.finalRoundedGrade = Math.round(parsed.weightedPercentage / 10);

      // Ensure criterionScores are structured
      parsed.criterionScores = [
        {
          criterionName: 'Form',
          score: parsed.formScore,
          rawScore: rawScores.form,
          maxPoints: 15,
          reasoning: parsed.criterionScores?.find((c: any) => c.criterionName?.toLowerCase() === 'form')?.reasoning || 'Evaluated document paragraph organization.',
          evidence: `Paragraphs: ${structuralFormMetadata.paragraphCount}, Words: ${structuralFormMetadata.wordCount}`,
          rawEvidence: `Paragraphs: ${structuralFormMetadata.paragraphCount}`,
          deficiencies: parsed.formScore < 15 ? 'Refine 4-paragraph ARAC presentation.' : 'None.',
          isGroundingValid: true,
        },
        {
          criterionName: 'Answer',
          score: parsed.answerScore,
          rawScore: rawScores.answer,
          maxPoints: 15,
          reasoning: parsed.criterionScores?.find((c: any) => c.criterionName?.toLowerCase() === 'answer')?.reasoning || (validatedEvidence.answerEvidence.length > 0 ? 'Evaluated legal stance.' : 'No direct legal stance in student submission.'),
          evidence: validatedEvidence.answerEvidence.join(' | ') || 'NONE',
          rawEvidence: validatedEvidence.answerEvidence.join(' | ') || 'NONE',
          deficiencies: parsed.answerScore < 15 ? (validatedEvidence.answerEvidence.length === 0 ? 'No direct stance found in submission.' : 'Refine legal position.') : 'None.',
          isGroundingValid: validatedEvidence.answerEvidence.length > 0,
        },
        {
          criterionName: 'Rule',
          score: parsed.ruleScore,
          rawScore: rawScores.rule,
          maxPoints: 30,
          reasoning: parsed.criterionScores?.find((c: any) => c.criterionName?.toLowerCase() === 'rule')?.reasoning || (validatedEvidence.ruleEvidence.length > 0 ? 'Evaluated statutory rules.' : 'No statutory provisions/elements found in submission.'),
          evidence: validatedEvidence.ruleEvidence.join(' | ') || 'NONE',
          rawEvidence: validatedEvidence.ruleEvidence.join(' | ') || 'NONE',
          deficiencies: parsed.ruleScore < 30 ? (validatedEvidence.ruleEvidence.length === 0 ? 'No legal rules or elements stated.' : 'Ensure all statutory elements are complete.') : 'None.',
          isGroundingValid: validatedEvidence.ruleEvidence.length > 0,
        },
        {
          criterionName: 'Application',
          score: parsed.applicationScore,
          rawScore: rawScores.application,
          maxPoints: 30,
          reasoning: parsed.criterionScores?.find((c: any) => c.criterionName?.toLowerCase() === 'application')?.reasoning || (validatedEvidence.applicationEvidence.length > 0 ? 'Evaluated fact-rule synthesis.' : 'No fact-rule application reasoning found in submission.'),
          evidence: validatedEvidence.applicationEvidence.join(' | ') || 'NONE',
          rawEvidence: validatedEvidence.applicationEvidence.join(' | ') || 'NONE',
          deficiencies: parsed.applicationScore < 30 ? (validatedEvidence.applicationEvidence.length === 0 ? 'No factual synthesis connecting facts to legal doctrine.' : 'Deepen fact-rule analysis.') : 'None.',
          isGroundingValid: validatedEvidence.applicationEvidence.length > 0,
        },
        {
          criterionName: 'Conclusion',
          score: parsed.conclusionScore,
          rawScore: rawScores.conclusion,
          maxPoints: 10,
          reasoning: parsed.criterionScores?.find((c: any) => c.criterionName?.toLowerCase() === 'conclusion')?.reasoning || (validatedEvidence.conclusionEvidence.length > 0 ? 'Evaluated final resolution.' : 'No final disposition found in submission.'),
          evidence: validatedEvidence.conclusionEvidence.join(' | ') || 'NONE',
          rawEvidence: validatedEvidence.conclusionEvidence.join(' | ') || 'NONE',
          deficiencies: parsed.conclusionScore < 10 ? (validatedEvidence.conclusionEvidence.length === 0 ? 'No concluding disposition stated.' : 'Ensure conclusion fully resolves the issue.') : 'None.',
          isGroundingValid: validatedEvidence.conclusionEvidence.length > 0,
        },
      ];

      // Sanitize qualitative explanation fields to prevent runaway model loops/repetitions
      parsed.scoringBasis = sanitizeExplanationText(
        `${modelPrefix}${parsed.scoringBasis || 'Evaluation completed based on controlling rubric.'}`
      );

      const sanitizeStringArray = (arr: any[]): string[] => {
        const seen = new Set<string>();
        const res: string[] = [];
        for (const item of arr) {
          const str = typeof item === 'string' ? item : JSON.stringify(item);
          const cleaned = sanitizeExplanationText(str, 500);
          const normKey = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normKey && !seen.has(normKey)) {
            seen.add(normKey);
            res.push(cleaned);
          }
        }
        return res;
      };

      parsed.strengths = sanitizeStringArray(normalizeStringArray(parsed.strengths, ['Identified legal elements']));
      parsed.missingElements = sanitizeStringArray(normalizeStringArray(parsed.missingElements, []));
      parsed.areasForImprovement = sanitizeStringArray(
        normalizeStringArray(parsed.areasForImprovement, ['Continue refining legal analysis'])
      );

      for (const crit of parsed.criterionScores) {
        crit.reasoning = sanitizeExplanationText(crit.reasoning || '', 600);
        crit.deficiencies = sanitizeExplanationText(crit.deficiencies || '', 600);
      }

      // Retain full two-pass audit provenance (raw strings unmodified for research audit)
      parsed.rawScores = rawScores;
      parsed.pass1RawExtraction = pass1Parsed;
      parsed.pass1ValidatedEvidence = validatedEvidence;
      parsed.pass1RepairUsed = pass1RepairUsed;
      parsed.pass2RawOutput = pass2Raw;
      parsed.evaluationStatus = 'COMPLETED';

      parsed.lexicalAnalysis = lexicalAnalysis;
      parsed.semanticAnalysis = semanticAnalysis;

      return EvaluationOutputSchema.parse(parsed);
    } catch (error: any) {
      console.warn(`⚠️ LLM Evaluation execution warning: ${error.message}`);

      // In real research mode, fail safely without score fabrication
      if (!isDemo) {
        throw new Error(
          `AI Evaluation could not be completed by provider "${modelConfigSnapshot.provider}": ${error.message}. Real research mode fails safely without generating fabricated scores.`
        );
      }

      // In demo/test simulation mode, return structured semantic simulation tagged with DEMO_SIMULATION
      console.log('🧪 Executing structured offline demo evaluation simulation (SCORING CRITERIA AND INSTRUCTION.pdf)...');
      const simResult = this.generateDemoSimulation(questionSnapshot, rubricSnapshot, studentAnswer, totalMaxPoints, modelConfigSnapshot);
      simResult.lexicalAnalysis = lexicalAnalysis;
      simResult.semanticAnalysis = semanticAnalysis;
      return simResult;
    }
  }

  /**
   * Grounded deterministic semantic evaluation simulation implementing the Attorney Controlling Matrix.
   * Accurately grades FORM (15), ANSWER (15), RULE (30), APPLICATION (30), CONCLUSION (10).
   */
  static generateDemoSimulation(
    question: any,
    rubricCriteria: any[],
    studentAnswer: string,
    totalMaxPoints: number = 100,
    modelConfigSnapshot?: any
  ): EvaluationOutput {
    const trimmed = (studentAnswer || '').trim();
    const lower = trimmed.toLowerCase();
    const words = trimmed ? trimmed.split(/\s+/) : [];

    const statutoryElements: string[] = Array.isArray(question.statutoryElements)
      ? question.statutoryElements
      : typeof question.statutoryElements === 'string'
      ? safeParseJson(question.statutoryElements, [])
      : [];

    const provisions: string[] = Array.isArray(question.relevantProvisions)
      ? question.relevantProvisions
      : typeof question.relevantProvisions === 'string'
      ? safeParseJson(question.relevantProvisions, [])
      : [];

    const variations: string[] = Array.isArray(question.conceptVariations)
      ? question.conceptVariations
      : typeof question.conceptVariations === 'string'
      ? safeParseJson(question.conceptVariations, [])
      : [];

    // Helper: Build standardized criterion output
    const buildResult = (
      form: number,
      ans: number,
      rule: number,
      app: number,
      concl: number,
      basis: string,
      strengths: string[],
      missing: string[],
      improvements: string[],
      flags: string[],
      explanations?: {
        formExp?: string;
        formEv?: string;
        formDef?: string;
        ansExp?: string;
        ansEv?: string;
        ansDef?: string;
        ruleExp?: string;
        ruleEv?: string;
        ruleDef?: string;
        appExp?: string;
        appEv?: string;
        appDef?: string;
        conclExp?: string;
        conclEv?: string;
        conclDef?: string;
      }
    ): EvaluationOutput => {
      const roundedForm = Math.round(form * 10) / 10;
      const roundedAns = Math.round(ans * 10) / 10;
      const roundedRule = Math.round(rule * 10) / 10;
      const roundedApp = Math.round(app * 10) / 10;
      const roundedConcl = Math.round(concl * 10) / 10;

      const rawPct = Math.round((roundedForm + roundedAns + roundedRule + roundedApp + roundedConcl) * 10) / 10;
      const rawTen = Number((rawPct / 10).toFixed(4));
      const roundedGrade = attorneyRounding(rawTen);

      const criteriaBreakdown = [
        {
          criterionName: 'Form',
          score: roundedForm,
          maxPoints: 15,
          reasoning: explanations?.formExp || (roundedForm >= 14 ? 'Follows clear ARAC four-paragraph sequence with sound legal writing style.' : roundedForm >= 10 ? 'Satisfactory structure with minor formatting or transitional imperfections.' : 'Deficient paragraph structure or merged unorganized block.'),
          evidence: explanations?.formEv || (roundedForm >= 12 ? 'Identified distinct ARAC sections/paragraphs.' : 'Text submitted in single/condensed block.'),
          deficiencies: explanations?.formDef || (roundedForm < 15 ? 'Paragraph division or ARAC transitions could be improved.' : 'None.'),
        },
        {
          criterionName: 'Answer',
          score: roundedAns,
          maxPoints: 15,
          reasoning: explanations?.ansExp || (roundedAns >= 14 ? 'Direct, definitive, and responsive legal stance addressing the call of the question.' : roundedAns >= 8 ? 'Definite stance with minor ambiguity or slight qualification.' : 'Evasive, nonresponsive, or missing definite legal stance.'),
          evidence: explanations?.ansEv || (roundedAns >= 10 ? 'Explicit disposition stated in response to issue.' : 'Ambiguous opening statement.'),
          deficiencies: explanations?.ansDef || (roundedAns < 15 ? 'Make legal position more explicit in opening statement.' : 'None.'),
        },
        {
          criterionName: 'Rule',
          score: roundedRule,
          maxPoints: 30,
          reasoning: explanations?.ruleExp || (roundedRule >= 27 ? 'Accurate governing law with statutory elements and proper legal attribution.' : roundedRule >= 20 ? 'Substantively accurate doctrine with general attribution or minor element omission.' : roundedRule >= 10 ? 'Partial legal doctrine with omissions or imprecision.' : 'Material doctrinal error or missing legal rules.'),
          evidence: explanations?.ruleEv || (roundedRule >= 15 ? 'Cited relevant statutory concepts, articles, or doctrines.' : 'Minimal/no statutory grounding.'),
          deficiencies: explanations?.ruleDef || (missing.length > 0 ? `Omitted elements: ${missing.join('; ')}` : 'None.'),
        },
        {
          criterionName: 'Application',
          score: roundedApp,
          maxPoints: 30,
          reasoning: explanations?.appExp || (roundedApp >= 27 ? 'Excellent synthesis of decisive scenario facts with statutory elements, establishing complete legal syllogism.' : roundedApp >= 22 ? 'Strong factual application with clear fact-rule connection.' : roundedApp >= 15 ? 'Adequate application with developing fact-rule linkage.' : roundedApp >= 8 ? 'Weak/superficial linkage between facts and statutory requisites.' : 'Poor or absent factual synthesis.'),
          evidence: explanations?.appEv || (roundedApp >= 15 ? 'Applied specific facts from scenario to statutory requisites.' : 'Superficial factual restatement.'),
          deficiencies: explanations?.appDef || (roundedApp < 27 ? 'Deepen factual synthesis by explaining why the rule produces the consequence.' : 'None.'),
        },
        {
          criterionName: 'Conclusion',
          score: roundedConcl,
          maxPoints: 10,
          reasoning: explanations?.conclExp || (roundedConcl >= 9 ? 'Conclusion logically supported by Rule and Application, completely resolving the legal issue.' : roundedConcl >= 5 ? 'Correct conclusion but partially supported by preceding analysis.' : 'Contradictory or unsupported conclusion.'),
          evidence: explanations?.conclEv || (roundedConcl >= 8 ? 'Sound final disposition harmonized with preceding analysis.' : 'Unsubstantiated or contradictory disposition.'),
          deficiencies: explanations?.conclDef || (roundedConcl < 9 ? 'Ensure final conclusion is directly derived from preceding syllogism.' : 'None.'),
        },
      ];

      const modelPrefix = modelConfigSnapshot?.researchName
        ? `[${modelConfigSnapshot.researchName} (${modelConfigSnapshot.exactModelId || modelConfigSnapshot.modelSlot})] `
        : '';

      const weightedPercentage = rawPct;
      const finalScore = Number((weightedPercentage * 0.05).toFixed(4));

      return {
        numericalScore: rawPct,
        maxScore: totalMaxPoints,
        scoringBasis: `${modelPrefix}${basis}`,
        formScore: Math.round(form * 10) / 10,
        answerScore: Math.round(ans * 10) / 10,
        ruleScore: Math.round(rule * 10) / 10,
        applicationScore: Math.round(app * 10) / 10,
        conclusionScore: Math.round(concl * 10) / 10,
        weightedPercentage,
        rawPercentage: rawPct,
        finalScore,
        rawTenPointGrade: rawTen,
        finalRoundedGrade: roundedGrade,
        criterionScores: criteriaBreakdown,
        strengths,
        missingElements: missing,
        areasForImprovement: improvements,
        confidenceScore: 0.95,
        reviewFlags: flags,
        evaluationStatus: 'COMPLETED',
      };
    };

    // --- CASE 1: Empty Submission ---
    if (trimmed.length === 0) {
      return buildResult(
        0, 0, 0, 0, 0,
        `No answer was submitted for ${question.code} (${question.title}). Zero credit awarded across all 5 evaluation criteria under the Attorney Grading Matrix.`,
        [],
        statutoryElements.length > 0 ? statutoryElements : ['All required statutory elements'],
        ['Submit a complete analytical response formatted in ARAC paragraphs.'],
        ['DEMO_SIMULATION', 'EMPTY_SUBMISSION'],
        {
          formExp: 'No response submitted.',
          ansExp: 'No response submitted.',
          ruleExp: 'No response submitted.',
          appExp: 'No response submitted.',
          conclExp: 'No response submitted.',
        }
      );
    }

    // --- CASE 2: Non-Substantive Submission (Casual phrase, "idk", gibberish) ---
    const nonsubstantivePatterns = [
      /^(i\s+)?(do\s*not|don'?t)\s+know/i,
      /^idk/i,
      /^no\s+idea/i,
      /^no\s+answer/i,
      /^te+he+/i,
      /^haha+/i,
      /^pass$/i,
      /^na$/i,
      /^n\/a$/i,
      /^none$/i,
      /^asdf/i,
      /^qwerty/i,
    ];

    const hasAnyLegalTerms = hasGeneralLegalKeywords(lower) || matchesAnyQuestionTerms(lower, question);
    const isNonsubstantive =
      nonsubstantivePatterns.some((pattern) => pattern.test(lower)) ||
      (words.length < 8 && !hasAnyLegalTerms);

    if (isNonsubstantive) {
      return buildResult(
        0, 0, 0, 0, 0,
        `The submitted response ("${trimmed}") is non-substantive and contains no legal analysis, statutory grounding, or application of the Revised Penal Code.`,
        [],
        statutoryElements.length > 0 ? statutoryElements : ['All statutory elements and legal rules'],
        [
          'Formulate a substantive legal essay identifying the core legal issue in the scenario.',
          'Structure your answer into distinct Answer, Rule, Application, and Conclusion paragraphs.',
        ],
        ['DEMO_SIMULATION', 'NONSUBSTANTIVE_SUBMISSION'],
        {
          formExp: 'Non-substantive submission; no ARAC structure.',
          ansExp: 'No responsive legal position stated.',
          ruleExp: 'No statutory rules or doctrines articulated.',
          appExp: 'No factual application provided.',
          conclExp: 'No legal conclusion reached.',
        }
      );
    }

    // --- CASE 3: Irrelevant Content ---
    const isQuestionRelevant = matchesAnyQuestionTerms(lower, question);
    if (!isQuestionRelevant && words.length >= 8) {
      const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
      const hasAracHeaders = /^(answer|rule|application|conclusion|analysis)\s*:/im.test(trimmed);

      // If text exhibits perfect ARAC 4-paragraph structure despite meaningless/off-topic content
      if (paragraphs.length >= 4 || (hasAracHeaders && paragraphs.length >= 3)) {
        return buildResult(
          15.0, 0, 0, 0, 0,
          `The response follows a 4-paragraph ARAC presentation structure, but contains no relevant legal analysis, statutory grounding, or application to ${question.code} (${question.title}). Form receives credit for formatting structure; substantive criteria receive zero credit.`,
          ['Structured in clear 4-paragraph ARAC format'],
          statutoryElements.length > 0 ? statutoryElements : ['All required Criminal Law I statutory elements for this scenario'],
          [`Ensure your analysis directly addresses the legal questions and facts of ${question.code}.`],
          ['DEMO_SIMULATION', 'OFF_TOPIC_ARAC_FORMAT']
        );
      }

      return buildResult(
        0, 0, 0, 0, 0,
        `The submitted response does not address the factual scenario, legal issues, or statutory principles of ${question.code} (${question.title}).`,
        [],
        statutoryElements.length > 0 ? statutoryElements : ['All required Criminal Law I statutory elements for this scenario'],
        [`Ensure your answer directly analyzes the specific facts and legal questions in ${question.code}.`],
        ['DEMO_SIMULATION', 'IRRELEVANT_SUBMISSION'],
        {
          formExp: 'Content is irrelevant to this scenario.',
          ansExp: 'Does not respond to the call of this question.',
          ruleExp: 'Cites irrelevant or inapplicable legal doctrines.',
          appExp: 'Does not apply law to the facts of this question.',
          conclExp: 'Conclusion is off-topic.',
        }
      );
    }

    // --- DETAILED 5-CRITERION SEMANTIC ANALYSIS ---

    // 1. Matched Elements, Variations, Provisions
    const matchedElements: string[] = [];
    const missingElements: string[] = [];
    for (const elem of statutoryElements) {
      if (checkElementMatch(elem, lower, variations)) {
        matchedElements.push(elem);
      } else {
        missingElements.push(elem);
      }
    }

    const matchedVariations: string[] = [];
    for (const v of variations) {
      if (lower.includes(v.toLowerCase())) matchedVariations.push(v);
    }

    const matchedProvisions: string[] = [];
    for (const prov of provisions) {
      if (checkProvisionMatch(prov, lower)) matchedProvisions.push(prov);
    }

    // 2. Structural ARAC Paragraph Analysis (FORM: 0-15)
    const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const hasExplicitAracHeaders = /^(answer|rule|application|conclusion|analysis)\s*:/im.test(trimmed);

    let formScore = 0.0;
    if (paragraphs.length >= 4 || (hasExplicitAracHeaders && paragraphs.length >= 3)) {
      formScore = 15.0;
    } else if (paragraphs.length === 3) {
      formScore = 11.0;
    } else if (paragraphs.length === 2) {
      formScore = 7.5;
    } else if (words.length >= 40) {
      // Single unbroken essay paragraph containing substantial text
      formScore = 7.5;
    } else if (words.length >= 15) {
      // Single short paragraph
      formScore = 3.75;
    } else {
      // Single sentence or short fragment
      formScore = 2.0;
    }

    // 3. Answer Stance Analysis (ANSWER: 0-15)
    // Requires an actual responsive stance/disposition to the question
    // (Merely mentioning the phrase "self-defense requires" in a rule does NOT constitute an answer stance!)
    let answerScore = 0.0;
    const hasDefiniteStance =
      /\b((a|b|x|y|z|the accused|the defendant|the actor|the person)\s+(can|may|cannot|may not)\s+(validly\s+)?(invoke|claim|avail of|raise)\s+(complete\s+|incomplete\s+)?(self-defense|justifying circumstance|defense)|(a|b|x|y|the accused)\s+(is|is not|may(\s+still)?\s+be|can(\s+still)?\s+be|will\s+be|remains)\s+(justified|exempt|exempted|criminally liable|liable|not liable|not criminally liable|guilty|not guilty|held liable|responsible|entitled to complete justification)|(a|b|x|y|the accused)\s+(acted|validly acted)\s+in\s+(complete\s+|incomplete\s+)?self-defense|can\s+invoke\s+self-defense|cannot\s+invoke\s+self-defense|may\s+invoke\s+self-defense|validly\s+invoke|is\s+entitled\s+to\s+(complete\s+)?(self-defense|justification)|incurs\s+criminal\s+liability|is\s+criminally\s+liable|is\s+liable\s+for|is\s+guilty\s+of|convicted\s+of)\b/i.test(lower) ||
      (/^(answer\s*:|\s*)/i.test(trimmed) && /^(yes|no)\b/i.test(lower.replace(/^answer\s*:\s*/i, '').trim())) ||
      /\b(guilty of (homicide|murder|felony)|liable for (homicide|murder|the death)|committed (the crime of|a felony|homicide)|is criminally liable|can be held liable|remains liable|may still be (criminally )?liable)\b/i.test(lower);

    const isAmbiguousStance = /\b(maybe|perhaps|it depends|possibly|unclear|arguably|might(\s+or\s+might\s+not)?|may\s+or\s+may\s+not)\b/i.test(lower.slice(0, 120));

    if (hasDefiniteStance) {
      answerScore = 15.0;
    } else if (isAmbiguousStance) {
      answerScore = 8.0;
    } else {
      answerScore = 0.0;
    }

    // 4. Rule Doctrine & Attribution Analysis (RULE: 0-30)
    // Requires actual statement of governing legal doctrine, rules, or statutory provisions
    const hasSpecificCitation = matchedProvisions.length > 0 || /\barticle\s+\d+/i.test(lower);
    const hasGeneralAttribution =
      /\bunder the (revised penal code|rpc|law|jurisprudence|rules? of court)\b/i.test(lower) ||
      /\b(under\s+)?philippine\s+(penal\s+law|criminal\s+law|criminal\s+jurisprudence|penal\s+jurisprudence)\b/i.test(lower) ||
      /\b(under\s+)?the\s+law\s+on\s+criminal\s+defenses\b/i.test(lower) ||
      /\bjurisprudence dictates\b/i.test(lower) ||
      /\bthe (law|doctrine|statute|revised penal code) (provides|requires|states|punishes)\b/i.test(lower);

    const hasDoctrinalRuleStatement =
      hasSpecificCitation ||
      hasGeneralAttribution ||
      /\b(requires|requisites|essential elements|under article|under the rpc)\b/i.test(lower);

    const elementRatio = statutoryElements.length > 0 ? matchedElements.length / statutoryElements.length : 0.0;
    const variationRatio = variations.length > 0 ? Math.min(matchedVariations.length / 2, 1.0) : 0.0;

    let ruleScore = 0.0;
    if (hasDoctrinalRuleStatement) {
      if (elementRatio >= 0.9 && (hasSpecificCitation || hasGeneralAttribution)) {
        ruleScore = hasSpecificCitation ? 30.0 : 27.5; // General attribution receives high credit
      } else if (elementRatio >= 0.5) {
        ruleScore = 18.0 + (elementRatio * 8.0) + (hasSpecificCitation ? 4.0 : 2.0);
      } else if (elementRatio >= 0.3 || matchedVariations.length > 0) {
        ruleScore = 10.0 + (elementRatio * 10.0) + (variationRatio * 4.0);
      } else {
        ruleScore = 8.0;
      }
    } else {
      // Zero legal doctrine/statutory rules stated (even if facts happen to use element words)
      ruleScore = 0.0;
    }

    // 5. Application Fact-Rule Synthesis (APPLICATION: 0-30)
    // Evaluates synthesis of decisive scenario facts with statutory elements
    const factualNuanceCount = countFactualNuances(lower, question.code);
    const hasSyllogism = /\b(because|since|applying|considering that|inasmuch as|the facts show|when|caused|resulting|produced|brandished|thrust|thrusting|struck|fired|shot|gunshot|neutralize|proportionate|posed|defensive|momentum|injury|fracture)\b/i.test(lower);

    let applicationScore = 0.0;
    if (factualNuanceCount >= 2 && hasSyllogism && elementRatio >= 0.75) {
      applicationScore = 26.0 + Math.min(elementRatio * 4.0, 4.0); // Excellent/Strong
    } else if (factualNuanceCount >= 2 && hasSyllogism) {
      applicationScore = 22.0 + Math.min(elementRatio * 4.0, 4.0);
    } else if (factualNuanceCount >= 1 && hasSyllogism) {
      applicationScore = 14.0 + Math.min(elementRatio * 4.0, 4.0); // Adequate
    } else if (factualNuanceCount >= 1) {
      applicationScore = 8.0; // Weak
    } else {
      // Zero scenario facts synthesized
      applicationScore = 0.0;
    }

    // Check for fundamentally incorrect legal doctrine
    const isWrongDoctrine =
      (question.code === 'CRIM1-Q01' && /\b(article\s*12|accident|insanity|minority)\b/i.test(lower) && !/\b(self-defense|article\s*11)\b/i.test(lower)) ||
      (question.code === 'CRIM1-Q02' && /\b(self-defense|article\s*11)\b/i.test(lower) && !/\b(article\s*4|article\s*13|aberratio|praeter|homicide)\b/i.test(lower));

    if (isWrongDoctrine) {
      ruleScore = 5.0; // Material doctrinal error
      applicationScore = 8.0; // Applying incorrect doctrine to facts
    }

    // 6. Conclusion Resolution Analysis (CONCLUSION: 0-10)
    // Requires an actual concluding resolution distinct from the opening stance
    const hasExplicitConclusion =
      /\b(therefore|hence|thus|in conclusion|accordingly|wherefore|conclude|consequently)\b/i.test(lower) ||
      (paragraphs.length >= 4 && /conclusion\s*:/i.test(lower));

    const hasContradiction = checkContradiction(lower, question.code);

    let conclusionScore = 0.0;
    if (hasContradiction) {
      conclusionScore = 0.0; // Contradictory conclusion
    } else if (isWrongDoctrine) {
      conclusionScore = 3.0; // Unsupported/wrong doctrine conclusion
    } else if (hasExplicitConclusion && elementRatio >= 0.7 && applicationScore >= 20.0) {
      conclusionScore = 10.0; // Complete logical deductive resolution
    } else if (hasExplicitConclusion) {
      conclusionScore = applicationScore >= 14.0 ? 8.0 : 5.0; // Correct conclusion with partial/underdeveloped reasoning
    } else {
      // No conclusion section / concluding statement
      conclusionScore = 0.0;
    }

    // Anti-Verbosity / Filler check:
    const isPadded = checkRepetitivePadding(lower);
    if (isPadded) {
      formScore = Math.min(formScore, 7.5); // Form penalizes unnecessary padding
      answerScore = Math.min(answerScore, 8.0);
    }

    const strengthsList: string[] = [];
    if (matchedElements.length > 0) strengthsList.push(`Articulated key elements: ${matchedElements.slice(0, 3).join(', ')}`);
    if (matchedProvisions.length > 0) strengthsList.push(`Accurately cited governing statutory authorities: ${matchedProvisions.join(', ')}`);
    if (formScore >= 14) strengthsList.push('Structured in clear ARAC paragraphs (Answer, Rule, Application, Conclusion)');
    if (applicationScore >= 24) strengthsList.push('Synthesized material facts with statutory requisites');

    const basis = `Evaluated under the Attorney Controlling Grading Matrix: Form (${formScore.toFixed(1)}/15), Answer (${answerScore.toFixed(1)}/15), Rule (${ruleScore.toFixed(1)}/30), Application (${applicationScore.toFixed(1)}/30), Conclusion (${conclusionScore.toFixed(1)}/10). Grounded directly in student response.`;

    return buildResult(
      formScore,
      answerScore,
      ruleScore,
      applicationScore,
      conclusionScore,
      basis,
      strengthsList,
      missingElements,
      missingElements.length > 0 ? [`Elaborate on statutory elements: ${missingElements.join('; ')}`] : ['Continue refining deductive syllogistic application.'],
      ['DEMO_SIMULATION']
    );
  }
}

export function repairJsonString(raw: string): any {
  let str = (raw || '').replace(/```(?:json)?\s*|\s*```/g, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(str);
  } catch {}

  // Collapse repetitive hallucination loops (e.g. repeated ", and the specific elements of the crime")
  str = str.replace(/(?:,\s*and the specific elements of the crime)+/gi, '');
  str = str.replace(/([A-Za-z0-9\s,]{8,80}?)\1{3,}/gi, '$1');

  try {
    return JSON.parse(str);
  } catch {}

  // If truncated inside an open string or array, repair closure
  const lastColon = str.lastIndexOf(':');
  const lastQuote = str.lastIndexOf('"');
  if (lastQuote > lastColon && (str.match(/"/g) || []).length % 2 !== 0) {
    str = str + '"';
  }

  const openBrackets = (str.match(/\[/g) || []).length;
  const closeBrackets = (str.match(/\]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) str += ']';

  const openBraces = (str.match(/\{/g) || []).length;
  const closeBraces = (str.match(/\}/g) || []).length;
  for (let i = 0; i < openBraces - closeBraces; i++) str += '}';

  try {
    return JSON.parse(str);
  } catch {
    // If still failing, extract top-level score numbers using regex fallback
    const formMatch = str.match(/"formScore"\s*:\s*(\d+(?:\.\d+)?)/i);
    const ansMatch = str.match(/"answerScore"\s*:\s*(\d+(?:\.\d+)?)/i);
    const ruleMatch = str.match(/"ruleScore"\s*:\s*(\d+(?:\.\d+)?)/i);
    const appMatch = str.match(/"applicationScore"\s*:\s*(\d+(?:\.\d+)?)/i);
    const conclMatch = str.match(/"conclusionScore"\s*:\s*(\d+(?:\.\d+)?)/i);

    if (formMatch || ruleMatch || appMatch || ansMatch || conclMatch) {
      return {
        formScore: formMatch ? parseFloat(formMatch[1]) : 0,
        answerScore: ansMatch ? parseFloat(ansMatch[1]) : 0,
        ruleScore: ruleMatch ? parseFloat(ruleMatch[1]) : 0,
        applicationScore: appMatch ? parseFloat(appMatch[1]) : 0,
        conclusionScore: conclMatch ? parseFloat(conclMatch[1]) : 0,
        strengths: [],
        missingElements: [],
        areasForImprovement: [],
        confidenceScore: 0.8,
        reviewFlags: [],
      };
    }

    throw new Error(`Failed to parse repaired JSON from LLM: ${str.slice(0, 150)}...`);
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

export function checkIsNonsubstantive(
  studentAnswer: string,
  questionSnapshot?: any
): { isNonsubstantive: boolean; reason?: string } {
  const trimmed = (studentAnswer || '').trim();
  if (trimmed.length === 0) {
    return { isNonsubstantive: true, reason: 'Empty submission' };
  }

  const lower = trimmed.toLowerCase();
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);

  // 1. Single tokens, standalone names/letters, question codes (e.g. "A.", "X.", "A", "X", "B", "Q1", "CRIM1")
  if (/^([a-z]|[0-9]|q[0-9]|crim[0-9]?)\.?$/i.test(trimmed)) {
    return { isNonsubstantive: true, reason: 'Isolated single token or letter' };
  }

  // 2. Explicit admissions of ignorance / casual one-liners / filler tokens
  const explicitPhrases = [
    /^(i\s+)?(do\s*not|don'?t)\s+know(\s+the\s+answer)?\.?$/i,
    /^idk\.?$/i,
    /^no\s+idea\.?$/i,
    /^no\s+answer\.?$/i,
    /^none\.?$/i,
    /^n\/?a\.?$/i,
    /^na\.?$/i,
    /^pass\.?$/i,
    /^te+he+\.?$/i,
    /^haha+\.?$/i,
    /^lol\.?$/i,
    /^asdfghjkl?\.?$/i,
    /^qwerty(uiop)?\.?$/i,
    /^test(\s+answer)?\.?$/i,
  ];

  if (explicitPhrases.some((p) => p.test(trimmed))) {
    return { isNonsubstantive: true, reason: 'Non-substantive or placeholder phrase' };
  }

  // 3. Very short responses (< 6 words) with ZERO legal terminology, statutory citations, or scenario concepts
  const hasLegalKeywords = hasGeneralLegalKeywords(lower);
  const hasQuestionConcepts = questionSnapshot ? matchesAnyQuestionTerms(lower, questionSnapshot) : false;

  if (words.length < 6 && !hasLegalKeywords && !hasQuestionConcepts) {
    return { isNonsubstantive: true, reason: 'Short submission without legal content' };
  }

  return { isNonsubstantive: false };
}

function hasGeneralLegalKeywords(text: string): boolean {
  return /\b(article|art\.?|civil code|family code|partnership|partner|partners|common fund|contribution|profit|profits|losses|profit sharing|mutual agency|juridical personality|co-ownership|co-owners|delectus personae|immovable property|public instrument|inventory|universal partnership|usufruct|contract|liability|liable|jurisprudence|doctrine|law)\b/i.test(
    text
  );
}

function matchesAnyQuestionTerms(text: string, question: any): boolean {
  if (!question) return hasGeneralLegalKeywords(text);

  // Check question-specific conceptVariations
  const conceptVariations: string[] = Array.isArray(question.conceptVariations)
    ? question.conceptVariations
    : typeof question.conceptVariations === 'string'
    ? safeParseJson(question.conceptVariations, [])
    : [];

  for (const concept of conceptVariations) {
    if (typeof concept === 'string' && concept.trim().length > 0) {
      if (text.includes(concept.toLowerCase().trim())) {
        return true;
      }
    }
  }

  // Check question statutory elements
  const statutoryElements: string[] = Array.isArray(question.statutoryElements)
    ? question.statutoryElements
    : typeof question.statutoryElements === 'string'
    ? safeParseJson(question.statutoryElements, [])
    : [];

  for (const elem of statutoryElements) {
    if (typeof elem === 'string' && elem.trim().length > 0) {
      const words = elem.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 4);
      if (words.some((w) => text.includes(w))) {
        return true;
      }
    }
  }

  return hasGeneralLegalKeywords(text);
}

function checkElementMatch(element: string, text: string, variations: string[]): boolean {
  const elemLower = element.toLowerCase();

  // Dynamic keyword and phrase matching for statutory elements
  const keywords = elemLower
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (keywords.length > 0) {
    const matchedCount = keywords.filter((k) => text.includes(k)).length;
    if (matchedCount / keywords.length >= 0.5) {
      return true;
    }
  }

  // Check against provided concept variations
  for (const v of variations) {
    if (typeof v === 'string' && text.includes(v.toLowerCase())) return true;
  }

  return false;
}

function checkProvisionMatch(provision: string, text: string): boolean {
  const pLower = provision.toLowerCase();
  const artMatch = pLower.match(/article\s*(\d+)/i);
  if (artMatch) {
    const artNum = artMatch[1];
    const regex = new RegExp(`\\b(article|art\\.?)\\s*${artNum}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(pLower);
}

function countFactualNuances(text: string, questionCode: string): number {
  let count = 0;
  if (questionCode === 'CRIM1-Q01') {
    if (/\b(knife|deadly weapon|brandish|thrust)\b/i.test(text)) count++;
    if (/\b(dark alley|dimly lit|street|night|unlit)\b/i.test(text)) count++;
    if (/\b(single shot|chest|licensed firearm|gun|gunshot)\b/i.test(text)) count++;
    if (/\b(merely walking|unprovoked|peacefully|did nothing to incite|no provocation)\b/i.test(text)) count++;
  } else if (questionCode === 'CRIM1-Q02') {
    if (/\b(slap|slapping|intended to slap|heated argument|hit\s+y|blow|assault)\b/i.test(text)) count++;
    if (/\b(duck|ducked|missed|avoided)\b/i.test(text)) count++;
    if (/\b(curb|concrete|fall|fell|head|skull fracture|died|death|injury)\b/i.test(text)) count++;
    if (/\b(bystander|z\b|innocent|hit\s+z|upon\s+z)\b/i.test(text)) count++;
  }
  return count;
}

function checkContradiction(text: string, questionCode: string): boolean {
  if (questionCode === 'CRIM1-Q02') {
    return /\b(completely exempt|no criminal liability whatsoever|acquitted of all charges|no crime was committed|unavoidable accident)\b/i.test(text);
  }
  if (questionCode === 'CRIM1-Q01') {
    return (
      /\b(no unlawful aggression occurred|b was unarmed and walking away)\b/i.test(text) ||
      (/\b(is justified|complete self-defense)\b/i.test(text) && /\b(guilty of murder|cannot claim self-defense)\b/i.test(text))
    );
  }
  return false;
}

function checkRepetitivePadding(text: string): boolean {
  const phrases = ['in my humble opinion', 'as a law student', 'it is submitted that', 'with all due respect'];
  let count = 0;
  for (const p of phrases) {
    const occurrences = text.split(p).length - 1;
    if (occurrences >= 3) count += occurrences;
  }
  return count >= 4;
}
