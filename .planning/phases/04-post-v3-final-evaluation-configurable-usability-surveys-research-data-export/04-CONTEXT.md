# Phase 4: Post-V3 Final Evaluation, Configurable Usability Surveys & Research Data Export — Context

**Phase Status:** Discussed & Decisions Locked
**Requirements:** `FEVL-01, USAB-01, USAB-02, STAT-01, REPO-01`
**Mode:** `mvp`

---

## 1. Locked Decisions

### Area 1: Post-V3 Final Expert Evaluation Workflow (`FEVL-01`)
- **Non-Double-Blind Protocol:** The post-V3 evaluation is open/unblinded. The legal expert reviews:
  - Predetermined Criminal Law I Question & Scenario
  - Student's Written Essay Answer
  - V3 AI Numerical Score & Max Score
  - V3 AI Comprehensive Scoring Basis
  - V3 AI Criterion-Level Scores & Reasoning
  - V3 AI Strengths & Missing Elements
  - Authoritative Benchmark Model Answer & Legal Elements Checklist
  - Active V3 Rubric
- **Structured Review Capture:**
  1. Overall Agreement Rating (Likert 1–5 scale: Strongly Disagree to Strongly Agree)
  2. Legal Reasoning Correctness Rating (1–5 scale)
  3. Statutory/Legal Grounding Rating (1–5 scale)
  4. Expert Recommended Score (Numerical)
  5. Expert vs. V3 Score Delta (`Expert Recommended - V3 AI`)
  6. Error Category Tags (Configurable):
     - `STATUTORY_MISINTERPRETATION`
     - `MISSING_LEGAL_ELEMENT`
     - `MISSING_JURISPRUDENCE`
     - `INCORRECT_LEGAL_REASONING`
     - `OVER_PENALIZATION`
     - `UNDER_PENALIZATION`
     - `HALLUCINATION_UNSUPPORTED_CLAIM`
     - `OTHER`
  7. Qualitative Expert Comments
  8. Recommended Refinement / Suggestion for Future Research
  9. Final Assessment Verdict:
     - `ACCEPTABLE`
     - `ACCEPTABLE_WITH_MINOR_ISSUES`
     - `REQUIRES_IMPROVEMENT`
- **Immutability & Evidence References:**
  - Preserves exact references to `agentVersionId` ("V3"), `questionSnapshot`, student answer, `evaluationId` (V3 AI), expert evaluator ID, and `isDemo`.
  - Append-only and strictly immutable upon submission (no update/delete routes).
  - No automatic modifications are applied to V3 upon review submission; the review serves strictly as final measurement evidence.

### Area 2: Configurable Usability & Capability Surveys (`USAB-01, USAB-02`)
- **Two Separate Questionnaire Tracks:**
  - **A. Student Usability Survey (`USAB-01`):** Evaluates diagnostic feedback clarity, usefulness of feedback, educational value, ease of navigation, ease of understanding results, and overall interface experience.
  - **B. Legal Expert Capability Survey (`USAB-02`):** Evaluates AI evaluation consistency, legal grounding, accuracy of scoring, quality of legal reasoning evaluation, usefulness for formative legal assessment, confidence in output, and overall suitability for educational/research use.
- **Configurable Questionnaire Engine:**
  - Database-persisted survey questions supporting Likert 1–5 scale, multiple choice, and open-ended text questions.
  - Configurable question ordering, active/inactive toggles, questionnaire versioning, and respondent type targeting (`STUDENT` vs. `EXPERT`).
  - Survey responses record exact questionnaire snapshot/version, respondent ID, role, answers JSON, open comments, and `isDemo`.
  - Immutable research records after submission.
  - Scientific integrity note: Surveys are not claimed as validated psychometric instruments unless explicitly established by researchers.

### Area 3: Descriptive Research Statistics & Comparative Analytics (`STAT-01`)
- **Transparent Descriptive Metrics:**
  1. Overall Mean Absolute Delta: $\text{Mean}(|\text{AI} - \text{Expert}|)$ across V1, V2, and V3.
  2. Mean Signed Delta: $\text{Mean}(\text{AI} - \text{Expert})$.
  3. Criterion-level mean absolute deltas.
  4. Score distribution summaries (Mean, Standard Deviation, Min, Max, Median) for both AI and Expert evaluations.
  5. Progression trends across iterations (V1 → V2 → V3 delta reduction).
  6. Final V3 expert agreement summary statistics.
  7. Conflict category frequencies and percentage distributions.
- **Methodological Neutrality:**
  - Exclude `isDemo: true` records by default with explicit sample size ($n$) annotations.
  - Present observed empirical data and descriptive formulas clearly without imposing dogmatic claims (e.g. avoid unsupported claims of statistical significance).
  - Enable researchers to filter metrics by version, question, and criterion.

### Area 4: Research Data Export & Academic Report Generator (`REPO-01`)
- **Multi-Format Raw Data Exports (CSV & JSON):**
  - Exports organized into 10 distinct datasets:
    1. Student Assessment Submissions
    2. AI Evaluations (with question & model snapshots)
    3. Expert Evaluations
    4. AI vs. Expert Paired Comparisons
    5. Refinement / Gap Logs
    6. Agent Version Snapshots & Changelogs
    7. Final V3 Expert Reviews
    8. Student Usability Survey Responses
    9. Expert Capability Survey Responses
    10. Research Metadata / Data Dictionary
  - Default behavior: Strictly **excludes** `isDemo: true` records from the research export (with a separate toggle to export demo data if explicitly requested).
- **Formatted Academic Report Generator:**
  - Downloadable and printable HTML/PDF research summary document formatted for academic thesis/defense presentation:
    - Study Overview & Academic Prototype Disclaimer
    - Evaluation Dataset & Question Scenarios Summary
    - V1 → V2 → V3 Iterative Progression & Delta Reduction Table
    - Criterion-Level Alignment Analysis
    - Final V3 Expert Agreement Findings
    - Refinement Framework Audit Trail
    - Student Usability & Expert Capability Survey Summaries
    - Research Data Limitations & Data Dictionary
