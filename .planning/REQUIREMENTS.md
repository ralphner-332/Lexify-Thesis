# Requirements: YAWA (Yet Another Written-Answer AI Agent)

**Defined:** 2026-08-15
**Core Value:** Enable rigorous, reproducible academic research comparing structured AI evaluations against expert legal assessments, iteratively refining evaluation quality across three agent versions while preserving every piece of historical research data as immutable evidence.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation, RBAC & Core Research Entities (CORE / AUTH)

- [ ] **AUTH-01**: User can log in with role-based credentials (Student, Expert Evaluator, Admin/Researcher) with server-enforced RBAC.
- [ ] **CORE-01**: System displays prominent academic and legal disclaimers on all portals stating it is an academic research prototype with no official grading or legal authority.
- [ ] **CORE-02**: Database schema enforces append-only immutability for all historical evaluations, version snapshots, comparison findings, and refinement logs.
- [ ] **CORE-03**: System provides complete separation of demo/test data from research data via `isDemo` flags, preventing demo records from appearing in statistics or exports.

### Question, Reference Materials & Rubric Management (QUES / RUBR / VERS)

- [ ] **QUES-01**: Admin/Researcher can manage predetermined Criminal Law I questions, model reference answers, statutory legal elements, and reference materials (no dynamically AI-generated questions; question count is configurable).
- [ ] **RUBR-01**: Admin/Researcher can configure scoring rubrics with customizable criteria (e.g., Legal Accuracy, Legal Elements, Reasoning, Application, Terminology), weightings, and maximum scores.
- [ ] **VERS-01**: Admin/Researcher can manage Agent components (AI skills, AI instructions, scoring rubrics, evaluation patterns, reference materials/configs) and create immutable version snapshots (V1, V2, V3).
- [ ] **VERS-02**: System ensures Version 1 is not overwritten when Version 2 is created, Version 2 is not overwritten when Version 3 is created, and every AI evaluation explicitly records the Agent Version that produced it.

### Student Assessment & AI Evaluation Engine (STUD / AI)

- [ ] **STUD-01**: Student can view assigned/available assessment, answer predetermined Criminal Law I questions in a single session, and submit written answers.
- [ ] **AI-01**: AI Evaluation Engine evaluates student answers based on meaning, legal concepts, completeness, reasoning, and acceptable alternative expressions according to the approved rubric (not exact keyword matching, and zero invented authorities).
- [ ] **AI-02**: AI Evaluation Engine produces structured output: numerical score, maximum score, scoring basis/reason, criterion-level scores, criterion-level reasoning, strengths, missing elements, areas for improvement, and confidence/review flag where appropriate.
- [ ] **STUD-02**: Student can view returned diagnostic feedback and scores appropriate for student learning.

### Double-Blind Expert Independent Evaluation (EXPT)

- [ ] **EXPT-01**: Expert Evaluator views assigned student answers, question, and reference materials without seeing AI-generated scores or reasoning during iterations 1–3.
- [ ] **EXPT-02**: Expert Evaluator independently evaluates student answers, providing numerical score, scoring basis/reason, criterion-level scores, and qualitative comments.

### AI vs Expert Comparison & Structured Refinement (COMP / ITER)

- [ ] **COMP-01**: Researcher can view side-by-side comparison of AI score vs Expert score AND AI scoring basis vs Expert scoring basis, highlighting score deltas, reasoning differences, missing elements, interpretation gaps, weighting issues, alternative expressions, and partial-credit issues.
- [ ] **COMP-02**: System preserves both AI and Expert evaluations as valid data points (recognizing a score difference does not automatically mean the AI is wrong).
- [ ] **ITER-01**: Researcher can document gap analysis using a structured refinement framework (identifying conflicts, expert rationale, proposed modifications, targeted agent components, and justification).
- [ ] **ITER-02**: Researcher can incorporate approved refinements into the next Agent Version (V1 → V2 → V3) while locking past iteration records.

### Post-V3 Final Evaluation & Usability Assessment (FEVL / USAB / STAT / REPO)

- [ ] **FEVL-01**: Post-V3 Final Evaluation module allows Expert to review Question, Student Answer, AI Score, AI Scoring Basis, and AI Criterion Scores to indicate agreement/disagreement, reasoning correctness, errors, improvement suggestions, and recommended scores (separate from independent scoring).
- [ ] **USAB-01**: Configurable Student Usability/User Acceptance questionnaire collects post-V3 student feedback.
- [ ] **USAB-02**: Configurable Expert Assessment Capability questionnaire collects post-V3 expert evaluation of the AI Agent.
- [ ] **STAT-01**: System supports descriptive statistics (score differences, agreement measures, weighted means, standard deviations) while keeping statistical methodology flexible and unhardcoded.
- [ ] **REPO-01**: Researcher can export complete research datasets (questions, answers, version snapshots, evaluations, comparisons, gap analyses, refinement decisions, survey responses, raw data and summary statistics) to CSV, JSON, and PDF reports.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Real-Time & Advanced Extensions

- **NOTF-01**: Automated email/in-app notifications for assessment schedules and expert evaluation deadlines.
- **ANLT-01**: Multi-semester longitudinal cohort tracking for student legal writing development.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Official Grading / Bar Exam Tool | Research prototype only; not certified for institutional grading or legal certification |
| Automated Answer Rewriting / Ghostwriting | Violates academic integrity; YAWA evaluates and diagnoses rather than rewrites |
| Autonomous Prompt Self-Tuning | Destroys experimental control; agent versions must be explicitly managed snapshots |
| Free-Form Legal Chatbot / Dynamic Question Generation | Distracts from rubric-grounded Criminal Law I evaluation |
| Hardcoded Statistical Analysis Pipeline | Statistical methodology remains subject to adviser/instructor approval; raw data export is prioritized |
| Multi-tenant Cloud SaaS | Out of scope for localized researcher deployment |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| QUES-01 | Phase 1 | Pending |
| RUBR-01 | Phase 1 | Pending |
| VERS-01 | Phase 1 | Pending |
| VERS-02 | Phase 1 | Pending |
| STUD-01 | Phase 2 | Pending |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Pending |
| STUD-02 | Phase 2 | Pending |
| EXPT-01 | Phase 3 | Pending |
| EXPT-02 | Phase 3 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| ITER-01 | Phase 3 | Pending |
| ITER-02 | Phase 3 | Pending |
| FEVL-01 | Phase 4 | Pending |
| USAB-01 | Phase 4 | Pending |
| USAB-02 | Phase 4 | Pending |
| STAT-01 | Phase 4 | Pending |
| REPO-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-15*
*Last updated: 2026-08-15 after research requirements refinement*
