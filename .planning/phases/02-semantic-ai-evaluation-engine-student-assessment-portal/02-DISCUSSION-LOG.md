# Phase 2: Discussion Log

**Date:** 2026-08-15
**Phase:** 02-semantic-ai-evaluation-engine-student-assessment-portal
**Participants:** Lead Researcher (User) & Antigravity (AI Assistant)

## Topics Discussed & Choices Locked

### 1. Student Assessment Session & Wizard Flow
- **Question Navigation:** Multi-step question wizard (`Question 1 of N`) with Previous / Next navigation. Dynamic item count.
- **Session State:** Server-side draft answer persistence endpoints. Local browser state is ephemeral.
- **Review Screen:** Review Answers screen before final submission displaying completion state and allowing edits.
- **Immutability:** Submissions become immutable research evidence upon confirmation.

### 2. Semantic Evaluation Prompt & Engine Behavior
- **Semantic Evaluation:** Evaluates legal concepts, statutory elements, IRAC reasoning, acceptable variations, and application to facts without keyword-only matching.
- **Grounding Elements:** System instructions, question scenario, reference answer, statutory elements, provisions/citations, variations, and active rubric criteria.
- **Anti-Hallucination:** Explicit prohibition against inventing legal provisions, cases, or facts. Low-confidence situations trigger review flags instead of hallucinations.
- **Provider Configurability:** Reads provider/model from active Agent Version `modelConfig`.
- **Simulation/Demo Policy:** Real research fails safely if LLM is unavailable (no fabricated scores). Offline mock/heuristics permitted exclusively for demo mode (`isDemo: true`).

### 3. Structured Output & Diagnostic Feedback
- **Zod Schema:** `numericalScore`, `maxScore`, `scoringBasis`, `criterionScores` (array of score, maxPoints, reasoning per criterion), `strengths`, `missingElements`, `areasForImprovement`, `confidenceScore`, `reviewFlags`.
- **Student Presentation:** Overall result → Criterion breakdown → Strengths → Missing elements → Actionable advice.
- **Answer Key Security:** Model answers and statutory element checklists are strictly omitted from student view.

### 4. Evaluation Persistence & Version Snapshotting
- **Immutable Table:** `Evaluation` stores student submission, agent version ID ("V1"), model settings, rubric snapshot copy, scores, reasoning, review flags, and demo tag.
- **Historical Evidence:** Past iteration evaluations (V1) are never overwritten by future iterations (V2/V3).
