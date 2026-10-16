export interface LexicalMetrics {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  legalTermCount: number;
  uniqueLegalTerms: string[];
  vocabularyRichness: number; // Unique words / total words
}

export interface SemanticMetrics {
  elementsIdentified: string[];
  missingElements: string[];
  hasDirectStance: boolean;
  hasDoctrinalGrounding: boolean;
  hasFactSynthesis: boolean;
  hasExplicitConclusion: boolean;
  syllogismStructureScore: number; // 0 to 10
}

export class TextAnalysisService {
  private static LEGAL_LEXICON = [
    'partnership', 'partner', 'partners', 'common fund', 'contribution',
    'money property or industry', 'profit', 'profits', 'losses', 'profit sharing',
    'division of profits', 'mutual agency', 'juridical personality', 'separate juridical personality',
    'co-ownership', 'co-owners', 'delectus personae', 'partnership interest',
    'immovable property', 'public instrument', 'inventory', 'signed inventory',
    'universal partnership', 'universal partnership of all present property',
    'universal partnership of profits', 'usufruct', 'act of administration',
    'ordinary course of business', 'management authority', 'spouses',
    'prohibition against donations', 'mutuum', 'loan agreement', 'capital contribution',
    'sub-partner', 'assignee', 'transferee', 'de facto partnership', 'de jure partnership',
    'article 1767', 'article 1769', 'article 1771', 'article 1773', 'article 1775',
    'article 1778', 'article 1779', 'article 1780', 'article 1781', 'article 1782',
    'article 1804', 'article 1813', 'article 1818', 'civil code', 'family code',
    'doctrine', 'jurisprudence', 'contract of partnership', 'santiago v. garcia',
    'jarantilla', 'mendoza v. paule'
  ];

  /**
   * Performs lexical analysis on student essay response.
   */
  static analyzeLexical(text: string): LexicalMetrics {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return {
        wordCount: 0,
        characterCount: 0,
        sentenceCount: 0,
        averageSentenceLength: 0,
        legalTermCount: 0,
        uniqueLegalTerms: [],
        vocabularyRichness: 0,
      };
    }

    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const lowerText = trimmed.toLowerCase();

    const matchedTerms: string[] = [];
    for (const term of this.LEGAL_LEXICON) {
      const regex = new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        matchedTerms.push(term);
      }
    }

    const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^\w]/g, '')));

    return {
      wordCount: words.length,
      characterCount: trimmed.length,
      sentenceCount: Math.max(1, sentences.length),
      averageSentenceLength: Math.round((words.length / Math.max(1, sentences.length)) * 10) / 10,
      legalTermCount: matchedTerms.length,
      uniqueLegalTerms: matchedTerms,
      vocabularyRichness: Math.round((uniqueWords.size / Math.max(1, words.length)) * 100) / 100,
    };
  }

  /**
   * Performs semantic feature analysis against question reference elements with calibrated conceptual strictness.
   * - STRICT: High conceptual completeness requiring precise legal meaning and material conditions
   * - STANDARD: Substantially correct legal meaning recognizing reasonable legal paraphrases and synonyms
   * - LENIENT: Broad conceptual understanding recognizing contextually valid legal reasoning
   */
  static analyzeSemantic(
    text: string,
    questionSnapshot: any,
    accuracyLevel: 'STRICT' | 'STANDARD' | 'LENIENT' = 'STANDARD'
  ): SemanticMetrics {
    const lower = (text || '').toLowerCase();
    const rawElements: string[] = Array.isArray(questionSnapshot.statutoryElements)
      ? questionSnapshot.statutoryElements
      : typeof questionSnapshot.statutoryElements === 'string'
      ? safeParseJson(questionSnapshot.statutoryElements, [])
      : [];

    // Semantic Concept Equivalence Mappings for Philippine Commercial Law
    const conceptSemanticMatchers: Array<{
      conceptKey: RegExp;
      equivalentPhrases: RegExp[];
      strictConditions?: RegExp[];
    }> = [
      {
        conceptKey: /consent|delectus\s*personae|admission/i,
        equivalentPhrases: [
          /\b(consent\s+of\s+all|unanimous\s+consent|agreement\s+of\s+(all\s+)?partners|did\s+not\s+agree\s+to\s+(his|her|their)?\s*admission|cannot\s+(automatically\s+)?join\s+without\s+(the\s+)?consent|cannot\s+be\s+admitted\s+without\s+all|delectus\s*personae)\b/i,
          /\b(other\s+partners\s+did\s+not\s+agree|no\s+agreement\s+to\s+admit|partners\s+must\s+all\s+consent)\b/i,
        ],
        strictConditions: [/\b(all\s+partners|unanimous|every\s+partner|consent|agree)\b/i],
      },
      {
        conceptKey: /inventory/i,
        equivalentPhrases: [
          /\b(inventory\s+(of\s+immovables?|is\s+required|was\s+not\s+made)|signed\s+inventory|inventory\s+attached|without\s+an\s+inventory|no\s+inventory\s+was\s+(made|signed|attached))\b/i,
        ],
        strictConditions: [/\b(inventory)\b/i],
      },
      {
        conceptKey: /public\s*instrument|public\s*document|notarized/i,
        equivalentPhrases: [
          /\b(public\s+instrument|public\s+document|notarized\s+contract|before\s+a\s+notary(\s+public)?|executed\s+in\s+a\s+public\s+instrument)\b/i,
        ],
        strictConditions: [/\b(public\s+instrument|notary|notarized)\b/i],
      },
      {
        conceptKey: /loan|lending|mutuum|interest|profit\s*sharing/i,
        equivalentPhrases: [
          /\b(loan\s+(agreement)?|creditor|lender|fixed\s+monthly\s+(interest|return)|not\s+a\s+partner|no\s+intent\s+to\s+form\s+partnership|debtor|mutuum|article\s*1769)\b/i,
          /\b(merely\s+(lent|a\s+loan)|fixed\s+interest\s+payment|share\s+in\s+profits\s+as\s+interest)\b/i,
        ],
      },
      {
        conceptKey: /spouses|prohibition|donation|husband\s+and\s+wife/i,
        equivalentPhrases: [
          /\b(spouses\s+cannot\s+(form|enter)|prohibition\s+against\s+donations|husband\s+and\s+wife|universal\s+partnership\s+is\s+prohibited|article\s*1782|article\s*87|family\s+code)\b/i,
          /\b(married\s+to\s+each\s+other|cannot\s+validly\s+create|indirect\s+donation)\b/i,
        ],
      },
      {
        conceptKey: /mutual\s*agency|ordinary\s*course|authority/i,
        equivalentPhrases: [
          /\b(mutual\s*agency|ordinary\s+course\s+of\s+business|act\s+of\s+administration|bind(ing)?\s+the\s+partnership|authority\s+to\s+act|article\s*1818)\b/i,
          /\b(partner\s+is\s+an\s+agent|carried\s+on\s+in\s+the\s+usual\s+way|apparent\s+authority)\b/i,
        ],
      },
    ];

    const elementsIdentified: string[] = [];
    const missingElements: string[] = [];

    for (const elem of rawElements) {
      const elemLower = elem.toLowerCase();
      
      // 1. Check direct semantic match against known Philippine doctrine equivalences
      let isConceptMatched = false;
      let handledByDomainMatcher = false;

      for (const matcher of conceptSemanticMatchers) {
        if (matcher.conceptKey.test(elemLower)) {
          handledByDomainMatcher = true;
          const phraseMatched = matcher.equivalentPhrases.some((p) => p.test(lower));
          if (phraseMatched) {
            if (accuracyLevel === 'STRICT' && matcher.strictConditions) {
              const strictPass = matcher.strictConditions.every((sc) => sc.test(lower));
              isConceptMatched = strictPass;
            } else {
              isConceptMatched = true;
            }
          }
          break; // Specific domain matcher found for this element; do not fall through to other matchers
        }
      }

      // 2. Generic semantic concept matching using core noun-phrase semantic clusters
      if (!handledByDomainMatcher && !isConceptMatched) {
        const stopWords = new Set([
          'article', 'under', 'philippine', 'civil', 'code', 'law', 'shall', 'must', 'with',
          'from', 'that', 'this', 'these', 'those', 'requirement', 'attached', 'between',
          'against', 'parties', 'party', 'their', 'there'
        ]);
        const conceptWords = elemLower
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 3 && !stopWords.has(w));

        if (conceptWords.length > 0) {
          if (accuracyLevel === 'STRICT') {
            // In STRICT mode, student must articulate all key concept terms of this requirement
            isConceptMatched = conceptWords.every((w) => lower.includes(w));
          } else if (accuracyLevel === 'STANDARD') {
            // In STANDARD mode, student must articulate majority of key concept terms
            const matchedCount = conceptWords.filter((w) => lower.includes(w)).length;
            isConceptMatched = matchedCount >= Math.min(2, conceptWords.length);
          } else {
            // In LENIENT mode, student must articulate at least one core substantive concept
            isConceptMatched = conceptWords.some((w) => lower.includes(w));
          }
        } else {
          isConceptMatched = lower.includes(elemLower);
        }
      }

      if (isConceptMatched) {
        elementsIdentified.push(elem);
      } else {
        missingElements.push(elem);
      }
    }

    const hasDirectStance =
      /\b((a|b|c|d|alyssa|bam|aira|camille|mikee|gretchen|erwan|kiefer|atom|ej|pia|scottie|hidilyn|vico|kathryn|alden|brent|mika|the parties|the partners|the spouses|the heirs|the co-owners)\s+(did not form|formed|did not create|created|cannot validly form|cannot enter into|are partners|are not partners|remain co-owners|remained co-owners|is not a partner|is a partner|had authority|did not have authority|can bind|cannot bind|is void|is valid|is not valid|is correct|is not correct))\b/i.test(lower) ||
      (/^(answer\s*:|\s*)/i.test(text.trim()) && /^(yes|no)\b/i.test(lower.replace(/^answer\s*:\s*/i, '').trim())) ||
      /\b(no partnership was created|a partnership was formed|no partnership was formed|did not become a partner|had authority to bind|is not valid|is void ab initio|created a universal partnership|constitutes a universal partnership|remained co-owners)\b/i.test(lower);

    const hasDoctrinalGrounding = /\b(article\s*\d+|art\.?\s*\d+|civil code|family code|jurisprudence|doctrine|requisites|elements|under\s+philippine\s+law|santiago v\. garcia|jarantilla|mendoza v\. paule|delectus personae)\b/i.test(lower);
    const hasFactSynthesis = /\b(in\s+this\s+case|here|herein|the\s+facts\s+show|because\s+[a-z]+|since\s+[a-z]+|alyssa\s+(was|lent|contributed)|bam\s+(claimed|failed)|aira\s+and\s+camille|erwan\s+transferred|kiefer\s+(demanded|acquired)|atom\s+leased|pia\s+contributed|scottie\s+(argued|contributed)|hidilyn\s+and\s+vico|kathryn\s+and\s+alden|brent\s+and\s+mika|agreed\s+to\s+divide|fixed\s+monthly\s+interest|parking\s+area|secret\s+articles|equipment\s+lease|residential\s+lots|titled\s+parcel)\b/i.test(lower);
    const hasExplicitConclusion = /\b(therefore|in\s+conclusion|consequently|thus|hence|in\s+sum|as\s+a\s+result|accordingly)\b/i.test(lower);

    let syllogismScore = 0;
    if (hasDirectStance) syllogismScore += 2.5;
    if (hasDoctrinalGrounding) syllogismScore += 2.5;
    if (hasFactSynthesis) syllogismScore += 2.5;
    if (hasExplicitConclusion) syllogismScore += 2.5;

    return {
      elementsIdentified,
      missingElements,
      hasDirectStance,
      hasDoctrinalGrounding,
      hasFactSynthesis,
      hasExplicitConclusion,
      syllogismStructureScore: Math.min(10, syllogismScore),
    };
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
