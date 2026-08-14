# Pitfalls Research

**Domain:** Academic Legal Essay Evaluation System & Research Prototype
**Researched:** 2026-08-15
**Confidence:** HIGH

## Domain Pitfalls & Prevention Strategies

### 1. LLM Hallucination of Legal Provisions & Penal Code Numbers
- **Warning Signs:** AI cites nonexistent Revised Penal Code articles, invents Supreme Court doctrines, or misattributes legal principles.
- **Prevention Strategy:** Ground the prompt strictly against researcher-provided reference answers, statutory elements, and approved legal keywords. Include explicit negative constraints ("Do not cite external articles unless verified in the reference answer") and calculate a confidence score.
- **Phase Mapping:** Phase 2 (AI Engine Prompt Engineering & Validation).

### 2. Double-Blind Leakage During Iterations 1–3
- **Warning Signs:** Expert evaluators inadvertently view AI scores or rationale before submitting their independent evaluation.
- **Prevention Strategy:** Strict backend RBAC and API endpoint separation. Ensure the Expert Evaluation API query completely omits `aiEvaluation` fields from the response payload during blind evaluation phases.
- **Phase Mapping:** Phase 3 (Expert Portal & Comparison Security).

### 3. Destruction of Historical Research Data Between Agent Versions
- **Warning Signs:** Updating an agent prompt overwrites previous evaluation results, corrupting V1/V2 research baselines.
- **Prevention Strategy:** Implement strict append-only immutable database records. Every evaluation record links to a specific `AgentVersion` record with full prompt snapshot, rubric weights, and timestamp.
- **Phase Mapping:** Phase 1 (Database Schema Design) & Phase 3 (Iteration Manager).

### 4. Flaky JSON Parsing from LLM Responses
- **Warning Signs:** Runtime crashes when Gemini returns malformed markdown code blocks or truncated JSON.
- **Prevention Strategy:** Use Gemini's native `responseMimeType: "application/json"` with `responseSchema` (structured outputs) backed by Zod parsing and automated retry with fallback flagging.
- **Phase Mapping:** Phase 2 (AI Integration Service).

### 5. Skewed Usability Statistics & Demo Data Contamination
- **Warning Signs:** Developer test runs and demo submissions getting mixed into research export metrics and Likert calculations.
- **Prevention Strategy:** Explicit `isDemo` flag on all user accounts and submission records. Research queries strictly filter `WHERE isDemo = false`. Provide a dedicated "Reset Demo Data" tool that never touches production research records.
- **Phase Mapping:** Phase 1 (Schema Design) & Phase 4 (Analytics and Export).

---
*Pitfalls research for: YAWA (Yet Another Written-Answer AI Agent)*
*Researched: 2026-08-15*
