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
1. NON-KEYWORD MATCHING: Evaluate legal concepts, meaning, IRAC reasoning progression, and factual application. Do NOT rely solely on literal keywords. Recognize acceptable legal synonyms and conceptually sound alternative expressions (e.g. "mistake in the blow" for aberratio ictus, "rational equivalence" for reasonable necessity).
2. STRICT ANTI-HALLUCINATION & NO FABRICATED PRAISE:
   - Every point awarded MUST be justified by actual text present in the student's response.
   - Do NOT invent Revised Penal Code articles, jurisprudence, cases, legal doctrines, or facts not written by the student.
   - NEVER praise or credit statutory elements, RPC citations, or IRAC reasoning if the student did not articulate them.
3. QUESTION-SPECIFIC RELEVANCE:
   - An answer discussing facts, characters, or legal doctrines belonging to an unrelated scenario must receive 0 credit for question-specific factual analysis and statutory grounding.
4. ZERO-SCORE RULE FOR NONSUBSTANTIVE OR IRRELEVANT SUBMISSIONS:
   - If the student submission is blank, non-substantive (e.g. "I don't know", "idk", "teheee", "no answer", gibberish), or completely irrelevant to Criminal Law I, you MUST award exactly 0 points across all rubric criteria (numericalScore: 0).
   - For 0-point submissions: "strengths" must be empty [], "scoringBasis" must explicitly state that the submission lacked substantive legal analysis, and all statutory elements must be listed in "missingElements".
5. DYNAMIC SCORING: Calculate criterion scores according to the rubric breakdown. The sum of all criterion maxPoints is exactly ${totalMaxPoints}.

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
   * Accurately differentiates question-specific relevance, non-keyword concepts, partial credit, and full IRAC.
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

    const hasAnyLegalTerms = hasGeneralLegalKeywords(lower) || matchesAnyQuestionTerms(lower, question);
    const isNonsubstantive =
      nonsubstantivePatterns.some((pattern) => pattern.test(lower)) ||
      (words.length < 8 && !hasAnyLegalTerms);

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

    // --- CASE C: Check Relevance to THIS Question Scenario ---
    const isQuestionRelevant = matchesAnyQuestionTerms(lower, question);
    if (!isQuestionRelevant && words.length >= 8) {
      return {
        numericalScore: 0,
        maxScore: totalMaxPoints,
        scoringBasis: `The submitted response does not address the factual scenario, legal issues, or statutory principles of ${question.code} (${question.title}).`,
        criterionScores: rubricCriteria.map((c) => ({
          criterionName: c.name,
          score: 0,
          maxPoints: c.maxPoints ?? c.weightPercent ?? 20,
          reasoning: `The content does not address ${c.name.toLowerCase()} for ${question.code}.`,
        })),
        strengths: [],
        missingElements: statutoryElements.length > 0 ? statutoryElements : ['All required Criminal Law I statutory elements for this scenario'],
        areasForImprovement: [
          `Ensure your answer directly analyzes the specific facts and legal questions in ${question.code}.`,
        ],
        confidenceScore: 0.95,
        reviewFlags: ['DEMO_SIMULATION', 'IRRELEVANT_SUBMISSION'],
      };
    }

    // --- CASE D, E, F, G, H, I: Substantive Legal Analysis ---
    // 1. Match Statutory Elements (semantic & concept variations)
    const matchedElements: string[] = [];
    const missingElements: string[] = [];

    for (const elem of statutoryElements) {
      const isMatched = checkElementMatch(elem, lower, variations);
      if (isMatched) {
        matchedElements.push(elem);
      } else {
        missingElements.push(elem);
      }
    }

    // 2. Match Concept Variations (e.g. "mistake in the blow", "unintended victim", "accidental", "rational equivalence")
    const matchedVariations: string[] = [];
    for (const v of variations) {
      if (lower.includes(v.toLowerCase())) {
        matchedVariations.push(v);
      }
    }

    // 3. Match Provisions (e.g. Art. 4, Art. 11, Art. 12, Art. 13, Art. 249, RPC)
    const matchedProvisions: string[] = [];
    for (const prov of provisions) {
      const isProvMatched = checkProvisionMatch(prov, lower);
      if (isProvMatched) {
        matchedProvisions.push(prov);
      }
    }

    // 4. Detect IRAC Structural Progression
    const hasIssue = /\b(issue|whether|liab|charged|offense|held liable)\b/i.test(lower);
    const hasRule = /\b(article|art\.?|rpc|penal code|elements?|rule|law|provision|doctrine|statute)\b/i.test(lower);
    const hasAnalysis = /\b(because|since|applying|in this case|here|fact|shot|shoot|compelled|struck|blow|weapon|natural|consequence)\b/i.test(lower);
    const hasConclusion = /\b(therefore|hence|conclude|conclusion|in conclusion|is liable|not liable|guilty|exempt|responsible|mitigated)\b/i.test(lower);

    let iracCount = 0;
    if (hasIssue) iracCount++;
    if (hasRule) iracCount++;
    if (hasAnalysis) iracCount++;
    if (hasConclusion) iracCount++;

    const totalElementsCount = Math.max(statutoryElements.length, 1);
    const elementRatio = Math.min(
      (matchedElements.length + matchedVariations.length * 0.3) / totalElementsCount,
      1.0
    );
    const totalProvisionsCount = Math.max(provisions.length, 1);
    const provisionRatio = Math.min(matchedProvisions.length / totalProvisionsCount, 1.0);
    const iracRatio = iracCount / 4;

    // Check for contradictory / flawed conclusions
    const hasContradictoryConclusion =
      (lower.includes('not guilty') && lower.includes('homicide') && lower.includes('aberratio')) ||
      (lower.includes('exempt') && lower.includes('slap'));

    // Substantive factual depth (measured by concrete factual noun/verb associations, not raw padding)
    const factualNuanceCount = [
      'ducked', 'slap', 'curb', 'fracture', 'skull', 'bystander', 'elderly',
      'knife', 'wallet', 'shot', 'chest', 'street', 'threat', 'brandish'
    ].filter((term) => lower.includes(term)).length;
    const factualRatio = Math.min(factualNuanceCount / 3, 1.0);

    // Compute criterion-level scores directly grounded in each criterion's descriptor
    let totalScore = 0;
    const criterionScores = rubricCriteria.map((c) => {
      const maxPts = c.maxPoints ?? c.weightPercent ?? 20;
      let cRatio = 0.0;

      const cNameLower = c.name.toLowerCase();
      if (cNameLower.includes('rule') || cNameLower.includes('statutory principle') || cNameLower.includes('legal accuracy')) {
        // Criterion 1: Correctly cites, identifies, and explains applicable RPC articles & doctrines (25 pts)
        cRatio = provisionRatio * 0.65 + (matchedVariations.length > 0 ? 0.20 : 0.0) + (hasRule ? 0.15 : 0.0);
      } else if (cNameLower.includes('element')) {
        // Criterion 2: Comprehensive breakdown of all required statutory elements (25 pts)
        cRatio = elementRatio;
      } else if (cNameLower.includes('reasoning') || cNameLower.includes('irac') || cNameLower.includes('logic')) {
        // Criterion 3: Logical progression from Issue & Rule to Analysis & Conclusion (25 pts)
        cRatio = (iracCount / 4) * 0.75 + (hasAnalysis && hasConclusion ? 0.25 : 0.0);
      } else if (cNameLower.includes('fact') || cNameLower.includes('application')) {
        // Criterion 4: Synthesizes specific factual scenario nuances directly with statutory elements (15 pts)
        cRatio = factualRatio * 0.60 + (hasAnalysis ? 0.40 : 0.0);
      } else if (cNameLower.includes('term') || cNameLower.includes('precision') || cNameLower.includes('conclusion')) {
        // Criterion 5: Legal terminology, Latin maxims, and precision of conclusion (10 pts)
        let termRatio = (matchedVariations.length > 0 ? 0.40 : 0.0) +
                        (matchedProvisions.length > 0 ? 0.30 : 0.0) +
                        (hasConclusion ? 0.30 : 0.0);
        if (hasContradictoryConclusion) termRatio = Math.max(termRatio - 0.40, 0.0);
        cRatio = termRatio;
      }

      const clampedRatio = Math.min(Math.max(cRatio, 0.0), 1.0);
      const score = Math.round(maxPts * clampedRatio * 10) / 10;
      totalScore += score;

      return {
        criterionName: c.name,
        score,
        maxPoints: maxPts,
        reasoning: `Evaluated against ${question.code}: ${
          score >= maxPts * 0.90
            ? 'Satisfies all full-credit descriptors with comprehensive statutory grounding and precise legal reasoning.'
            : score >= maxPts * 0.70
            ? 'Demonstrates proficient legal reasoning with sound statutory grounding; minor omissions noted.'
            : score >= maxPts * 0.40
            ? 'Demonstrates partial application of relevant legal concepts but omits key statutory elements.'
            : 'Minimal conceptual recognition with significant gaps in statutory analysis.'
        }`,
      };
    });

    const strengths: string[] = [];
    if (matchedElements.length > 0) {
      strengths.push(`Identified core statutory elements: ${matchedElements.slice(0, 2).join('; ')}`);
    } else if (matchedVariations.length > 0) {
      strengths.push(`Recognized relevant conceptual elements: ${matchedVariations.slice(0, 2).join('; ')}`);
    }
    if (matchedProvisions.length > 0) {
      strengths.push(`Cited relevant statutory framework: ${matchedProvisions.slice(0, 2).join('; ')}`);
    }
    if (hasConclusion && words.length >= 15) {
      strengths.push('Formulated a clear legal conclusion based on scenario facts.');
    }
    if (hasAnalysis && words.length >= 35) {
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
    const scoringBasis = `The student response provides an essay of ${words.length} words for ${question.title}. Identified ${matchedElements.length}/${totalElementsCount} statutory elements, ${matchedVariations.length} concept variations, and ${matchedProvisions.length} relevant provisions. IRAC reasoning structure was evaluated as ${
      numericalScore >= 75 ? 'proficient' : numericalScore >= 40 ? 'satisfactory with gaps' : 'developing / minimal'
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

function hasGeneralLegalKeywords(text: string): boolean {
  const basicLegal = [
    'homicide', 'murder', 'crime', 'liable', 'liability', 'article', 'art.', 'rpc', 'penal',
    'defense', 'intent', 'exempt', 'justif', 'force', 'fear', 'kill', 'guilty', 'robbery',
    'aberratio', 'praeter', 'intentionem', 'ictus', 'proximate', 'consequence', 'unintended'
  ];
  return basicLegal.some((k) => text.includes(k));
}

function matchesAnyQuestionTerms(studentLower: string, question: any): boolean {
  const qCode = (question.code || '').toUpperCase();
  const title = (question.title || '').toLowerCase();
  const scenario = (question.scenario || '').toLowerCase();

  // If question is Q1 (Self-Defense / Knife confrontation)
  if (qCode.includes('Q01') || title.includes('self-defense') || scenario.includes('knife')) {
    const q1Terms = [
      'self-defense', 'self defense', 'unlawful aggression', 'reasonable necessity',
      'provocation', 'article 11', 'art. 11', 'art 11', 'knife', 'wallet', 'chest', 'firearm',
      'licensed firearm', 'brandish', 'thrust'
    ];
    return q1Terms.some((t) => studentLower.includes(t));
  }

  // If question is Q2 (Praeter Intentionem / Aberratio Ictus / Slap / Bystander)
  if (qCode.includes('Q02') || title.includes('praeter') || title.includes('aberratio') || scenario.includes('slap')) {
    const q2Terms = [
      'praeter', 'aberratio', 'ictus', 'slap', 'ducked', 'curb', 'skull fracture',
      'article 4', 'art. 4', 'art 4', 'article 13', 'art. 13', 'art 13',
      'unintended', 'accidental', 'mistake in the blow', 'transferred intent', 'bystander',
      'elderly', 'proximate cause', 'consequence'
    ];

    // Check specific character references to X, Y, or Z (with word boundaries)
    const hasXYZ = /\b[xyz]\b/i.test(studentLower);
    const hasQ2Term = q2Terms.some((t) => studentLower.includes(t));

    return hasXYZ || hasQ2Term;
  }

  // Generic fallback: check concept variations
  const variations: string[] = Array.isArray(question.conceptVariations)
    ? question.conceptVariations
    : typeof question.conceptVariations === 'string'
    ? safeParseJson(question.conceptVariations, [])
    : [];

  return variations.some((v) => studentLower.includes(v.toLowerCase()));
}

function checkElementMatch(elementText: string, studentLower: string, variations: string[] = []): boolean {
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
  if (eLower.includes('initial intentional felony') || eLower.includes('felonious act')) {
    return (
      studentLower.includes('initial') ||
      studentLower.includes('slap') ||
      studentLower.includes('felony') ||
      studentLower.includes('unlawful act') ||
      studentLower.includes('wrongful act') ||
      studentLower.includes('assault')
    );
  }
  if (eLower.includes('proximate cause') || eLower.includes('consequence')) {
    return (
      studentLower.includes('proximate cause') ||
      studentLower.includes('consequence') ||
      studentLower.includes('result') ||
      studentLower.includes('direct result') ||
      studentLower.includes('caused')
    );
  }
  if (eLower.includes('praeter intentionem') || eLower.includes('lack of intention to commit so grave')) {
    return (
      studentLower.includes('praeter intentionem') ||
      studentLower.includes('lack of intention') ||
      studentLower.includes('not intend') ||
      studentLower.includes('did not intend') ||
      studentLower.includes('unintended') ||
      studentLower.includes('accidental')
    );
  }

  // Check variations
  for (const v of variations) {
    if (studentLower.includes(v.toLowerCase())) return true;
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

  // Check article numbers (e.g. "4", "11", "12", "13", "249", "248")
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
