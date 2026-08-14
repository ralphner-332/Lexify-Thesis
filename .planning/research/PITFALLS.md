# Pitfalls Research

**Domain:** Academic Legal Essay Evaluation System & Research Prototype
**Researched:** 2026-08-15
**Confidence:** HIGH

## Domain Pitfalls & Prevention Strategies

### 1. Keyword-Only Matching & Hallucination of Legal Rules
- **Warning Signs:** AI awards points solely for presence of specific words regardless of context, or fabricates non-existent statutory articles/case doctrines.
- **Prevention Strategy:** Ground the prompt strictly against researcher-provided reference answers, statutory elements, and approved rubrics. Explicitly instruct the AI to evaluate legal concepts, completeness, reasoning, and acceptable alternative expressions. Include negative constraints forbidding the invention of legal rules or authorities.
- **Phase Mapping:** Phase 2 (AI Evaluation Service).

### 2. Double-Blind Information Leakage (Iterations 1–3)
- **Warning Signs:** Expert evaluators see or deduce AI scores/reasoning during the independent evaluation phase, compromising experimental objectivity.
- **Prevention Strategy:** Strict backend API isolation. The Expert Evaluation endpoint must never return AI scores, bases, or reasoning in its response payload during blind evaluation iterations.
- **Phase Mapping:** Phase 3 (Expert Portal & API Architecture).

### 3. Destruction or Overwriting of Historical Version Snapshots
- **Warning Signs:** Creating Version 2 or 3 mutates or overwrites past Agent configurations, evaluations, or conflict notes, corrupting research reproducibility.
- **Prevention Strategy:** Enforce append-only database records. Every evaluation record links immutably to a specific `AgentVersion` snapshot and iteration tag.
- **Phase Mapping:** Phase 1 (Schema Design) & Phase 3 (Agent Version Manager).

### 4. Overlooking the 6-Question Refinement Framework
- **Warning Signs:** Prompt updates are made arbitrarily without structured documentation of what was wrong, why conflict occurred, what the expert said, and why specific components were modified.
- **Prevention Strategy:** Integrate a dedicated Refinement Workflow UI requiring the researcher to explicitly answer all 6 questions before committing a new version snapshot.
- **Phase Mapping:** Phase 3 (Comparison & Refinement Dashboard).

### 5. Contamination by Demo Data & Hardcoded Research Decisions
- **Warning Signs:** Test runs mix into research statistical exports, or the codebase assumes hardcoded rubric weights/participant counts that contradict adviser requirements.
- **Prevention Strategy:** Enforce `isDemo: true` database isolation and make rubrics, question sets, questionnaires, and model providers fully configurable via Admin tools.
- **Phase Mapping:** Phase 1 (Core Models) & Phase 4 (Analytics & Exports).

---
*Pitfalls research for: YAWA (Yet Another Written-Answer AI Agent)*
