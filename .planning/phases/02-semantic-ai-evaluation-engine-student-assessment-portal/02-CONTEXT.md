# Phase 2: Semantic AI Evaluation Engine & Student Assessment Portal — Context

**Phase Status:** Discussed & Decisions Locked
**Requirements:** `STUD-01, AI-01, AI-02, STUD-02`
**Mode:** `mvp`

---

## 1. Locked Decisions

### Area 1: Student Assessment Session & Submission Experience
- **Multi-Step Question Wizard:** Questions are presented in a structured wizard (`Question 1 of N`) with Previous / Next navigation. The total number of items is dynamically rendered from active database records and never hardcoded.
- **Server-Side Draft/Session Persistence:** Draft answers and session progress are persisted to the backend via session draft endpoints. Browser state is strictly ephemeral UI state; the server is the single source of truth for session integrity.
- **Review Answers Page:** Before final submission, the wizard routes to a comprehensive review screen showing each question and its completion status, allowing students to jump back and revise answers before locking.
- **Immutable Submission Evidence:** Once a student confirms submission, the record is immediately committed as immutable research evidence. Answers can never be edited or silently overwritten post-submission.

### Area 2: Semantic AI Evaluation Engine & Prompt Architecture
- **Semantic (Non-Keyword) Grounding:** Evaluator prompt assesses conceptual understanding, statutory elements, IRAC reasoning progression, acceptable phrasing variations, and factual application. Keyword-only matching is strictly rejected.
- **Full Context Grounding:** Every prompt dynamically injects:
  1. Active Agent Version's System Instructions
  2. Question Scenario Text
  3. Model Reference Answer
  4. Statutory Legal Elements Checklist
  5. Relevant RPC Provisions & Approved Citations
  6. Acceptable Concept & Phrasing Variations
  7. Active Scoring Rubric (criteria definitions, descriptions, weights, max points)
- **Strict Anti-Hallucination Policy:** Explicit directives forbid inventing RPC articles, case citations, statutory elements, or facts not in the reference prompt. If information is insufficient, the system flags the evaluation for human review rather than fabricating a conclusion.
- **Unhardcoded Provider & Model:** Reads provider (`google`, `anthropic`, `openai`, `custom`) and model identifier (`gemini-2.0-flash`, etc.) from the active `AgentVersion.modelConfig`.
- **Fail-Safe & Demo Simulation Rules:**
  - Real research evaluations never fall back to heuristic scoring. If the LLM provider fails or is unreachable in research mode, the engine fails safely and reports evaluation failure without fabricating scores.
  - Offline/mock/heuristic simulation is permitted ONLY for development/demo testing (`isDemo: true`). Simulated results are clearly tagged in the UI and database, and never mixed into research datasets.

### Area 3: Structured Evaluation Schema & Diagnostic Feedback
- **Zod-Validated Structured Output:**
  ```typescript
  {
    numericalScore: number;
    maxScore: number; // Derived from rubric criteria max points sum
    scoringBasis: string; // Detailed legal justification
    criterionScores: Array<{
      criterionId?: string;
      criterionName: string;
      score: number;
      maxPoints: number;
      reasoning: string;
    }>;
    strengths: string[];
    missingElements: string[];
    areasForImprovement: string[];
    confidenceScore: number; // Internal review signal (0.0 - 1.0)
    reviewFlags: string[]; // Flags for low confidence or human review
  }
  ```
- **Student Diagnostic Feedback Layout:**
  1. Overall Result (`numericalScore` / `maxScore` with descriptive tier)
  2. Criterion Breakdown (Score, Max, and Criterion Reasoning per rubric item)
  3. Strengths (Identified elements & sound legal arguments)
  4. Missing Elements (Overlooked statutory requisites)
  5. Actionable Areas for Improvement (Constructive legal reasoning guidance)
- **Student Privacy & Key Security:** Students NEVER see model reference answers, statutory element grading keys, system instructions, or internal Agent configurations.
- **Review Signals:** `confidenceScore` and `reviewFlags` serve as internal triage signals for researchers/experts to identify evaluations needing human inspection.

### Area 4: Evaluation Persistence & Research Traceability
- **Immutable Evaluation Table:** Appends all completed evaluations with:
  - `studentId`, `questionId`, `studentAnswer`
  - `agentVersionId` (e.g. "V1")
  - `provider`, `modelId`
  - `rubricSnapshot` (JSON copy of the exact criteria and weights used)
  - `numericalScore`, `maxScore`, `scoringBasis`
  - `criterionScores` (JSON), `strengths` (JSON), `missingElements` (JSON), `areasForImprovement` (JSON)
  - `confidenceScore`, `reviewFlags` (JSON)
  - `isDemo: boolean`
  - `createdAt` timestamp
- **Version Isolation:** V1 evaluation records remain permanently intact and are never overwritten when V2 or V3 are later developed.

---

## 2. Downstream Directives for Researcher & Planner

- **Backend (02-01):**
  - Implement LLM evaluation service with Gemini API / Configurable Provider client.
  - Implement Zod output parser with structured error handling and strict anti-hallucination prompt.
  - Implement server-side assessment session & draft management endpoints.
  - Implement immutable `Evaluation` Prisma model linking submission, agent version snapshot, and rubric snapshot.
- **Frontend (02-02):**
  - Implement multi-step Assessment Session Wizard (`Question 1 of N`, Progress bar, Previous/Next).
  - Implement Review & Confirmation Screen before final submission.
  - Implement Diagnostic Feedback Viewer (Overall score, criteria breakdown, strengths, missing elements, actionable advice) with strict exclusion of reference keys.
