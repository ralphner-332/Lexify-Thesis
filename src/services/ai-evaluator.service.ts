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
      : question.statutoryElements || 'None specified';

    const provisionsList = Array.isArray(question.relevantProvisions)
      ? question.relevantProvisions.join('\n- ')
      : question.relevantProvisions || 'None specified';

    const variationsList = Array.isArray(question.conceptVariations)
      ? question.conceptVariations.join('\n- ')
      : question.conceptVariations || 'None specified';

    return `
${systemInstructions}

=== EVALUATION TASK ===
You are an academic legal evaluation AI assessing a law student's written analytical essay in Criminal Law I at FSUU College of Law.
Evaluate the student's answer SEMANTICALLY against the model reference answer, statutory elements, and scoring rubric.

CRITICAL EVALUATION RULES:
1. NON-KEYWORD MATCHING: Evaluate legal concepts, meaning, IRAC reasoning progression, and factual application. Do NOT rely solely on literal keywords. Recognize acceptable legal synonyms and conceptually sound alternative expressions.
2. STRICT ANTI-HALLUCINATION & NO FABRICATED PRAISE:
   - Every point awarded MUST be justified by actual text present in the student's response.
   - Do NOT invent Revised Penal Code articles, jurisprudence, cases, legal doctrines, or facts not written by the student.
   - NEVER praise or credit statutory elements, RPC citations, or IRAC reasoning if the student did not articulate them.
3. ZERO-SCORE RULE FOR NONSUBSTANTIVE OR IRRELEVANT SUBMISSIONS:
   - If the student submission is blank, non-substantive (e.g. "I don't know", "idk", "teheee", "no answer", gibberish), or completely irrelevant to Criminal Law I, you MUST award exactly 0 points across all rubric criteria (numericalScore: 0).
   - For 0-point submissions: "strengths" must be empty [], "scoringBasis" must explicitly state that the submission lacked substantive legal analysis, and all statutory elements must be listed in "missingElements".
4. DYNAMIC SCORING: Calculate criterion scores according to the rubric breakdown. The sum of all criterion maxPoints is exactly ${totalMaxPoints}.

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
  "strengths": ["List genuine legal strengths found in student text, or empty [] if none"],
  "missingElements": ["List statutory elements and concepts omitted by student"],
  "areasForImprovement": ["Specific constructive suggestions for legal reasoning and IRAC structure"],
  "confidenceScore": 0.95 (number between 0.0 and 1.0),
  "reviewFlags": [] (array of strings if applicable, e.g. ["NONSUBSTANTIVE_SUBMISSION", "IRRELEVANT_CONTENT", "UNUSUAL_LEGAL_THEORY"])
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

      // In demo/test simulation mode, return structured semantic simulation tagged with DEMO_SIMULATION review flag
      console.log('🧪 Executing structured offline demo evaluation simulation...');
      return this.generateDemoSimulation(questionSnapshot, rubricSnapshot, studentAnswer, totalMaxPoints);
    }
  }

  /**
   * Generates a grounded deterministic semantic evaluation simulation for local dev/testing.
   * Accurately differentiates blank, nonsubstantive, irrelevant, partial, and strong responses.
   * Tagged with DEMO_SIMULATION.
   */
  static generateDemoSimulation(
    question: any,
    rubricCriteria: any[],
    studentAnswer: string,
    totalMaxPoints: number
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

    // --- CASE A: Empty Submission ---
    if (trimmed.length === 0) {
      return {
        numericalScore: 0,
        maxScore: totalMaxPoints,
        scoringBasis: `No answer was submitted for ${question.code} (${question.title}). Zero credit awarded across all evaluation criteria.`,
        criterionScores: rubricCriteria.map((c) => ({
          criterionName: c.name,
          score: 0,
          maxPoints: c.maxPoints ?? c.weightPercent ?? 20,
          reasoning: 'No response provided for this criterion.',
        })),
        strengths: [],
        missingElements: statutoryElements.length > 0 ? statutoryElements : ['All required statutory elements'],
        areasForImprovement: [
          'Provide a substantive analytical essay addressing the question scenario.',
          'Structure your response using the IRAC (Issue, Rule, Analysis, Conclusion) method.',
        ],
        confidenceScore: 1.0,
        reviewFlags: ['DEMO_SIMULATION', 'EMPTY_SUBMISSION'],
      };
    }

    // --- CASE B: Non-Substantive Submission (Casual phrase, "I don't know", gibberish) ---
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

    const isNonsubstantive =
      nonsubstantivePatterns.some((pattern) => pattern.test(lower)) ||
      (words.length < 8 && !hasAnyLegalKeywords(lower));

    if (isNonsubstantive) {
      return {
        numericalScore: 0,
        maxScore: totalMaxPoints,
        scoringBasis: `The submitted response ("${trimmed}") is non-substantive and contains no legal analysis, statutory grounding, or application of the Revised Penal Code.`,
        criterionScores: rubricCriteria.map((c) => ({
          criterionName: c.name,
          score: 0,
          maxPoints: c.maxPoints ?? c.weightPercent ?? 20,
          reasoning: `Non-substantive submission; no demonstration of ${c.name.toLowerCase()}.`,
        })),
        strengths: [],
        missingElements: statutoryElements.length > 0 ? statutoryElements : ['All statutory elements and legal rules'],
        areasForImprovement: [
          'Formulate a substantive legal essay identifying the core legal issue in the scenario.',
          'Cite and explain the applicable Articles of the Revised Penal Code (Book I).',
          'Apply the elements of the crime or justifying/exempting circumstance to the facts.',
        ],
        confidenceScore: 0.99,
        reviewFlags: ['DEMO_SIMULATION', 'NONSUBSTANTIVE_SUBMISSION'],
      };
    }

    // --- CASE C: Completely Irrelevant Content ---
    const legalKeywords = [
      'penal code', 'rpc', 'article', 'art.', 'art ', 'felony', 'crime', 'liability', 'liable',
      'homicide', 'murder', 'intent', 'animus', 'unlawful', 'aggression', 'defense', 'provocation',
      'exempting', 'justifying', 'mitigating', 'aggravating', 'irresistible force', 'uncontrollable fear',
      'guilty', 'culpable', 'culpability', 'mens rea', 'act', 'omission', 'punishable', 'offense',
      'par.', 'paragraph', 'supreme court', 'jurisprudence', 'doctrine', 'weapon', 'chest', 'kill',
      'juan', 'pedro', 'maria', 'threat', 'gun', 'robbery', 'store'
    ];

    const hasLegalRelevance = legalKeywords.some((kw) => lower.includes(kw));
    if (!hasLegalRelevance && words.length >= 8) {
      return {
        numericalScore: 0,
        maxScore: totalMaxPoints,
        scoringBasis: `The submitted essay is completely irrelevant to Philippine Criminal Law I and the presented factual scenario (${question.code}).`,
        criterionScores: rubricCriteria.map((c) => ({
          criterionName: c.name,
          score: 0,
          maxPoints: c.maxPoints ?? c.weightPercent ?? 20,
          reasoning: `The content does not address ${c.name.toLowerCase()} for this Criminal Law scenario.`,
        })),
        strengths: [],
        missingElements: statutoryElements.length > 0 ? statutoryElements : ['All required Criminal Law I statutory elements'],
        areasForImprovement: [
          'Ensure your answer directly analyzes the Criminal Law I scenario and Revised Penal Code principles.',
        ],
        confidenceScore: 0.95,
        reviewFlags: ['DEMO_SIMULATION', 'IRRELEVANT_SUBMISSION'],
      };
    }

    // --- CASE D, E, F, G: Substantive Legal Essay Analysis ---
    // Detect matched statutory elements
    const matchedElements: string[] = [];
    const missingElements: string[] = [];

    for (const elem of statutoryElements) {
      const isMatched = checkElementMatch(elem, lower);
      if (isMatched) {
        matchedElements.push(elem);
      } else {
        missingElements.push(elem);
      }
    }

    // Detect matched provisions (e.g. Art. 11, Art. 12, Art. 249, RPC, etc.)
    const matchedProvisions: string[] = [];
    for (const prov of provisions) {
      const isProvMatched = checkProvisionMatch(prov, lower);
      if (isProvMatched) {
        matchedProvisions.push(prov);
      }
    }

    // Detect IRAC structural markers
    const hasIssue = /\b(issue|whether|liab|charged|offense)\b/i.test(lower);
    const hasRule = /\b(article|art\.?|rpc|penal code|elements?|rule|law|provision)\b/i.test(lower);
    const hasAnalysis = /\b(because|since|applying|in this case|here|fact|shot|shoot|compelled|weapon|direct|consequence)\b/i.test(lower);
    const hasConclusion = /\b(therefore|hence|conclude|conclusion|in conclusion|is liable|not liable|guilty|exempt|responsible)\b/i.test(lower);

    let iracCount = 0;
    if (hasIssue) iracCount++;
    if (hasRule) iracCount++;
    if (hasAnalysis) iracCount++;
    if (hasConclusion) iracCount++;

    const totalElementsCount = Math.max(statutoryElements.length, 1);
    const elementRatio = matchedElements.length / totalElementsCount;
    const provisionRatio = provisions.length > 0 ? (matchedProvisions.length > 0 ? 1.0 : 0.0) : 0.5;
    const iracRatio = iracCount / 4;

    // Length-based substantive depth factor
    let lengthFactor = 0.3;
    if (words.length >= 100) lengthFactor = 1.0;
    else if (words.length >= 60) lengthFactor = 0.85;
    else if (words.length >= 30) lengthFactor = 0.65;
    else if (words.length >= 15) lengthFactor = 0.45;

    // Overall quality percentage calculation
    const rawQuality = (elementRatio * 0.45 + provisionRatio * 0.25 + iracRatio * 0.30) * lengthFactor;
    const qualityRatio = Math.min(Math.max(rawQuality, 0.10), 0.98);

    // Compute criterion-level scores
    let totalScore = 0;
    const criterionScores = rubricCriteria.map((c) => {
      const maxPts = c.maxPoints ?? c.weightPercent ?? 20;
      let cRatio = qualityRatio;

      const cNameLower = c.name.toLowerCase();
      if (cNameLower.includes('element') || cNameLower.includes('issue')) {
        cRatio = (elementRatio * 0.7 + (hasIssue ? 0.3 : 0)) * lengthFactor;
      } else if (cNameLower.includes('statutory') || cNameLower.includes('rule') || cNameLower.includes('legal')) {
        cRatio = (provisionRatio * 0.6 + elementRatio * 0.4) * lengthFactor;
      } else if (cNameLower.includes('analysis') || cNameLower.includes('reasoning') || cNameLower.includes('application')) {
        cRatio = ((hasAnalysis ? 0.5 : 0.1) + elementRatio * 0.5) * lengthFactor;
      } else if (cNameLower.includes('structure') || cNameLower.includes('irac') || cNameLower.includes('clarity')) {
        cRatio = iracRatio * lengthFactor;
      } else if (cNameLower.includes('conclusion')) {
        cRatio = (hasConclusion ? 0.9 : 0.2) * lengthFactor;
      }

      const clampedRatio = Math.min(Math.max(cRatio, 0.05), 1.0);
      const score = Math.round(maxPts * clampedRatio * 10) / 10;
      totalScore += score;

      return {
        criterionName: c.name,
        score,
        maxPoints: maxPts,
        reasoning: `Evaluated against ${question.code}: ${
          score >= maxPts * 0.75
            ? 'Demonstrates proficient legal reasoning with sound statutory grounding.'
            : score >= maxPts * 0.5
            ? 'Demonstrates partial application of relevant legal concepts but omits key statutory elements.'
            : 'Minimal or developing application of required legal principles.'
        }`,
      };
    });

    const strengths: string[] = [];
    if (matchedElements.length > 0) {
      strengths.push(`Identified core statutory elements: ${matchedElements.slice(0, 2).join('; ')}`);
    }
    if (matchedProvisions.length > 0) {
      strengths.push(`Cited relevant statutory framework: ${matchedProvisions.slice(0, 2).join('; ')}`);
    }
    if (hasConclusion && words.length >= 20) {
      strengths.push('Formulated an explicit legal conclusion based on the scenario facts.');
    }
    if (hasAnalysis && words.length >= 40) {
      strengths.push('Demonstrated analytical application connecting facts to legal concepts.');
    }

    const areasForImprovement: string[] = [];
    if (missingElements.length > 0) {
      areasForImprovement.push(
        `Thoroughly analyze omitted statutory elements: ${missingElements.slice(0, 2).join('; ')}`
      );
    }
    if (matchedProvisions.length === 0) {
      areasForImprovement.push('Explicitly cite the specific Article and Paragraph of the Revised Penal Code (Book I).');
    }
    if (iracRatio < 0.75) {
      areasForImprovement.push('Structure the essay rigorously using explicit Issue, Rule, Analysis, and Conclusion paragraphs.');
    }

    const numericalScore = Math.round(totalScore * 10) / 10;
    const scoringBasis = `The student response provides an essay of ${words.length} words for ${question.title}. Identified ${matchedElements.length}/${totalElementsCount} statutory elements and ${matchedProvisions.length} relevant provisions. IRAC reasoning structure was evaluated as ${
      numericalScore >= 75 ? 'proficient' : numericalScore >= 45 ? 'satisfactory with gaps' : 'developing'
    }.`;

    return {
      numericalScore,
      maxScore: totalMaxPoints,
      scoringBasis,
      criterionScores,
      strengths,
      missingElements: missingElements.length > 0 ? missingElements : ['None - all primary elements identified'],
      areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ['Continue practicing precise jurisprudential synthesis'],
      confidenceScore: 0.90,
      reviewFlags: ['DEMO_SIMULATION'],
    };
  }
}

function hasAnyLegalKeywords(text: string): boolean {
  const basicLegal = [
    'homicide', 'murder', 'crime', 'liable', 'liability', 'article', 'art.', 'rpc', 'penal',
    'defense', 'intent', 'exempt', 'justif', 'force', 'fear', 'kill', 'guilty', 'robbery'
  ];
  return basicLegal.some((k) => text.includes(k));
}

function checkElementMatch(elementText: string, studentLower: string): boolean {
  if (!elementText) return false;
  const eLower = elementText.toLowerCase();

  // Distinct element signatures for Criminal Law I
  if (eLower.includes('unlawful aggression')) {
    return studentLower.includes('unlawful aggression') || studentLower.includes('aggression');
  }
  if (eLower.includes('reasonable necessity') || eLower.includes('rational necessity')) {
    return (
      studentLower.includes('reasonable necessity') ||
      studentLower.includes('rational necessity') ||
      studentLower.includes('means employed') ||
      studentLower.includes('rational equivalence')
    );
  }
  if (eLower.includes('provocation')) {
    return studentLower.includes('lack of sufficient provocation') || studentLower.includes('provocation');
  }
  if (eLower.includes('irresistible force')) {
    return (
      studentLower.includes('irresistible force') ||
      studentLower.includes('physical force') ||
      studentLower.includes('compulsion') ||
      studentLower.includes('involuntary')
    );
  }
  if (eLower.includes('uncontrollable fear')) {
    return (
      studentLower.includes('uncontrollable fear') ||
      studentLower.includes('duress') ||
      studentLower.includes('intimidation')
    );
  }
  if (eLower.includes('intent to kill') || eLower.includes('animus necandi')) {
    return (
      studentLower.includes('intent to kill') ||
      studentLower.includes('animus necandi') ||
      studentLower.includes('deadly weapon') ||
      studentLower.includes('vital organ') ||
      studentLower.includes('chest')
    );
  }
  if (eLower.includes('killing') || eLower.includes('death')) {
    return (
      studentLower.includes('killed') ||
      studentLower.includes('died') ||
      studentLower.includes('death') ||
      studentLower.includes('homicide') ||
      studentLower.includes('murder')
    );
  }

  // Fallback: extract terms with >= 2 matching significant words
  const terms = extractKeyTerms(elementText);
  if (terms.length === 0) return false;
  const matchCount = terms.filter((t) => studentLower.includes(t)).length;
  return matchCount >= Math.min(2, terms.length);
}

function checkProvisionMatch(provisionText: string, studentLower: string): boolean {
  if (!provisionText) return false;
  const pLower = provisionText.toLowerCase();

  // Check article numbers (e.g. "11", "12", "249", "248", "6", "14")
  const articleMatch = pLower.match(/art(?:icle|\.)?\s*(\d+)/i);
  if (articleMatch) {
    const artNum = articleMatch[1];
    const regex = new RegExp(`art(?:icle|\\.)?\\s*${artNum}\\b`, 'i');
    if (regex.test(studentLower)) return true;
  }

  if (pLower.includes('revised penal code') && (studentLower.includes('revised penal code') || studentLower.includes('rpc'))) {
    return true;
  }

  const terms = extractKeyTerms(provisionText);
  if (terms.length === 0) return false;
  return terms.some((t) => studentLower.includes(t));
}

function extractKeyTerms(phrase: string): string[] {
  if (!phrase) return [];
  return phrase
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['that', 'with', 'from', 'have', 'were', 'been', 'which', 'their', 'there', 'must', 'under', 'part', 'person'].includes(w));
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
