import { z } from 'zod';
import { ProviderFactory } from '../providers/provider.factory';
import { ModelConfig } from '../providers/llm-provider.interface';

export const CriterionScoreSchema = z.object({
  criterionName: z.string(),
  score: z.number().min(0),
  maxPoints: z.number().min(0),
  reasoning: z.string(),
});

export const EvaluationOutputSchema = z.object({
  numericalScore: z.number().min(0),
  maxScore: z.number().min(0),
  scoringBasis: z.string(),
  criterionScores: z.array(CriterionScoreSchema),
  strengths: z.array(z.string()),
  missingElements: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1).default(1.0),
  reviewFlags: z.array(z.string()).default([]),
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

export class AiEvaluatorService {
  /**
   * Constructs the grounded evaluation prompt containing the 7 essential components.
   */
  static buildEvaluationPrompt(
    question: any,
    rubricCriteria: any[],
    systemInstructions: string,
    studentAnswer: string
  ): string {
    const totalMaxPoints = rubricCriteria.reduce(
      (sum, c) => sum + (c.maxPoints ?? c.weightPercent ?? 20),
      0
    );

    const rubricDescription = rubricCriteria
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.name} (${c.maxPoints ?? c.weightPercent} pts / ${c.weightPercent}% weight): ${c.description}`
      )
      .join('\n');

    const elementsList = Array.isArray(question.statutoryElements)
      ? question.statutoryElements.join('\n- ')
      : question.statutoryElements;

    const provisionsList = Array.isArray(question.relevantProvisions)
      ? question.relevantProvisions.join('\n- ')
      : question.relevantProvisions;

    const variationsList = Array.isArray(question.conceptVariations)
      ? question.conceptVariations.join('\n- ')
      : question.conceptVariations;

    return `
${systemInstructions}

=== EVALUATION TASK ===
You are an academic legal evaluation AI assessing a law student's written analytical essay in Criminal Law I at FSUU College of Law.
Evaluate the student's answer SEMANTICALLY against the model reference answer, statutory elements, and scoring rubric.

CRITICAL EVALUATION RULES:
1. NON-KEYWORD MATCHING: Evaluate legal concepts, meaning, IRAC reasoning progression, and factual application. Do NOT rely solely on literal keywords. Recognize acceptable legal synonyms and conceptually sound alternative expressions.
2. STRICT ANTI-HALLUCINATION: Do NOT invent Revised Penal Code articles, jurisprudence, cases, legal doctrines, or facts not present in the provided reference materials. If the student answer is unclear or insufficient, reflect this in the score and add a review flag.
3. DYNAMIC SCORING: Calculate criterion scores according to the rubric breakdown. The sum of all criterion maxPoints is exactly ${totalMaxPoints}.

=== GROUND TRUTH REFERENCE MATERIALS ===
[QUESTION CODE & TITLE]: ${question.code} - ${question.title}

[FACTUAL SCENARIO]:
${question.scenario}

[MODEL REFERENCE ANSWER (GROUND TRUTH)]:
${question.modelAnswer}

[REQUIRED STATUTORY LEGAL ELEMENTS]:
- ${elementsList}

[RELEVANT STATUTORY PROVISIONS & JURISPRUDENCE]:
- ${provisionsList}

[ACCEPTABLE CONCEPT / PHRASING VARIATIONS]:
- ${variationsList}

=== SCORING RUBRIC (MAX POINTS: ${totalMaxPoints}) ===
${rubricDescription}

=== STUDENT ESSAY SUBMISSION ===
${studentAnswer}

=== REQUIRED JSON OUTPUT FORMAT ===
You MUST return ONLY a valid JSON object with the following schema:
{
  "numericalScore": number (total sum of criterion scores, 0 to ${totalMaxPoints}),
  "maxScore": ${totalMaxPoints},
  "scoringBasis": "Detailed legal justification explaining how the score was derived from the student's application of statutory elements and IRAC structure.",
  "criterionScores": [
    ${rubricCriteria
      .map(
        (c) =>
          `{ "criterionName": "${c.name}", "score": number (0 to ${c.maxPoints ?? c.weightPercent}), "maxPoints": ${c.maxPoints ?? c.weightPercent}, "reasoning": "Criterion-specific explanation..." }`
      )
      .join(',\n    ')}
  ],
  "strengths": ["Correctly identified unlawful aggression element", "Sound deductive application of RPC Art. 11"],
  "missingElements": ["Omitted discussion on rational necessity of means", "Failed to address lack of provocation"],
  "areasForImprovement": ["Structure answer using explicit IRAC paragraphs", "Cite specific paragraph of Art. 11"],
  "confidenceScore": 0.95 (number between 0.0 and 1.0),
  "reviewFlags": [] (array of strings if low confidence, e.g. ["UNUSUAL_LEGAL_THEORY", "AMBIGUOUS_CONCLUSION"])
}
`.trim();
  }

  /**
   * Executes semantic evaluation using the configured LLM provider and validates output with Zod.
   */
  static async evaluateAnswer(params: EvaluateAnswerParams): Promise<EvaluationOutput> {
    const { questionSnapshot, modelConfigSnapshot, rubricSnapshot, systemInstructions, studentAnswer, isDemo } =
      params;

    const totalMaxPoints = rubricSnapshot.reduce(
      (sum, c) => sum + (c.maxPoints ?? c.weightPercent ?? 20),
      0
    );

    const prompt = this.buildEvaluationPrompt(
      questionSnapshot,
      rubricSnapshot,
      systemInstructions,
      studentAnswer
    );

    // Try executing with LLM Provider
    try {
      const provider = ProviderFactory.getProvider(modelConfigSnapshot.provider);
      const rawResponse = await provider.evaluatePrompt(prompt, modelConfigSnapshot);

      // Clean markdown code fence if present
      const cleanJson = rawResponse.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Ensure maxScore matches dynamic rubric sum
      parsed.maxScore = totalMaxPoints;

      // Validate with Zod
      return EvaluationOutputSchema.parse(parsed);
    } catch (error: any) {
      console.warn(`⚠️ LLM Evaluation execution warning: ${error.message}`);

      // In real research mode, fail safely without score fabrication
      if (!isDemo) {
        throw new Error(
          `AI Evaluation could not be completed by provider "${modelConfigSnapshot.provider}": ${error.message}. Real research mode fails safely without generating fabricated scores.`
        );
      }

      // In demo/test simulation mode, return structured simulation tagged with DEMO_SIMULATION review flag
      console.log('🧪 Executing structured offline demo evaluation simulation...');
      return this.generateDemoSimulation(questionSnapshot, rubricSnapshot, studentAnswer, totalMaxPoints);
    }
  }

  /**
   * Generates a structured simulation for local dev/testing only. Tagged with DEMO_SIMULATION.
   */
  private static generateDemoSimulation(
    question: any,
    rubricCriteria: any[],
    studentAnswer: string,
    totalMaxPoints: number
  ): EvaluationOutput {
    const answerLen = studentAnswer.trim().length;
    // Basic ratio simulation for demo test accounts
    const qualityRatio = Math.min(Math.max(answerLen / 400, 0.5), 0.92);

    let totalScore = 0;
    const criterionScores = rubricCriteria.map((c) => {
      const maxPts = c.maxPoints ?? c.weightPercent ?? 20;
      const score = Math.round(maxPts * qualityRatio * 10) / 10;
      totalScore += score;
      return {
        criterionName: c.name,
        score,
        maxPoints: maxPts,
        reasoning: `Demonstrates satisfactory conceptual understanding of ${c.name.toLowerCase()} in relation to ${question.code}. Evaluated using semantic RPC baseline.`,
      };
    });

    return {
      numericalScore: Math.round(totalScore * 10) / 10,
      maxScore: totalMaxPoints,
      scoringBasis: `The student response provides a substantive legal analysis of ${question.title}. Key statutory concepts were identified and applied to the scenario facts using the Revised Penal Code framework.`,
      criterionScores,
      strengths: [
        'Identified the primary statutory article and legal concept',
        'Recognized factual nuances presented in the scenario',
        'Formulated a clear legal conclusion consistent with Philippine criminal jurisprudence',
      ],
      missingElements: [
        'Could elaborate further on the standard of rational equivalence',
        'Additional analysis on the requisite lack of provocation would strengthen the justification',
      ],
      areasForImprovement: [
        'Adopt a more rigorous IRAC (Issue, Rule, Analysis, Conclusion) paragraph structure',
        'Cite specific Supreme Court jurisprudential doctrines supporting the means employed',
      ],
      confidenceScore: 0.88,
      reviewFlags: ['DEMO_SIMULATION'],
    };
  }
}
