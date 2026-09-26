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
   * Performs semantic feature analysis against question reference elements.
   */
  static analyzeSemantic(text: string, questionSnapshot: any): SemanticMetrics {
    const lower = (text || '').toLowerCase();
    const rawElements: string[] = Array.isArray(questionSnapshot.statutoryElements)
      ? questionSnapshot.statutoryElements
      : typeof questionSnapshot.statutoryElements === 'string'
      ? safeParseJson(questionSnapshot.statutoryElements, [])
      : [];

    const elementsIdentified: string[] = [];
    const missingElements: string[] = [];

    for (const elem of rawElements) {
      const elemLower = elem.toLowerCase();
      const keywords = elemLower.replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 3);
      const isMatch = keywords.length > 0 && keywords.filter((k) => lower.includes(k)).length / keywords.length >= 0.5;

      if (isMatch) {
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
