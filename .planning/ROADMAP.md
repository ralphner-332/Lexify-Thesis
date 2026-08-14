# Roadmap: YAWA (Yet Another Written-Answer AI Agent)

## Overview

YAWA is an academic research prototype evaluating written essay answers from law students in Criminal Law I. The system proceeds from foundational authentication, RBAC, and rubric setup to Gemini AI evaluation and student test-taking, followed by double-blind expert assessment and side-by-side comparison across 3 iterative agent versions, concluding with post-V3 final evaluation, usability testing, and comprehensive research export.

## Phases

- [ ] **Phase 1: Foundation, RBAC, Question & Rubric Management** - Fullstack foundation, 3-role authentication, disclaimers, Criminal Law I questions, and rubric configuration.
- [ ] **Phase 2: Gemini AI Evaluation Engine & Student Assessment Portal** - Gemini structured evaluation engine, single-session student assessment workflow, and diagnostic feedback.
- [ ] **Phase 3: Double-Blind Expert Evaluation & Comparison Matrix** - Double-blind expert portal, distributed answer assignment, AI-vs-Expert delta matrix, and V1→V2→V3 iteration manager.
- [ ] **Phase 4: Post-V3 Final Evaluation, Usability & Analytics Export** - Post-V3 expert agreement review, student & expert usability surveys (SUS/Likert), and CSV/JSON/PDF research reporting.

## Phase Details

### Phase 1: Foundation, RBAC, Question & Rubric Management
**Goal**: Deliver fullstack architecture with secure 3-role authentication (Student, Expert, Admin), disclaimers, Criminal Law I question/reference management, configurable scoring rubrics, and V1 agent snapshot baseline.
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: [AUTH-01, AUTH-02, CORE-01, CORE-02, QUES-01, RUBR-01, VERS-01]
**Success Criteria**:
  1. Users can register and log in as Student, Expert Evaluator, or Admin with role-specific views and routes protected by server-side RBAC.
  2. Academic and legal research disclaimers are prominently displayed on login, assessment, and grading interfaces.
  3. Researcher can create, edit, and view Criminal Law I questions with model answers, statutory citations, and legal elements.
  4. Researcher can configure multi-criteria rubrics (Legal Accuracy, Legal Elements, Reasoning, Application, Terminology) with custom weights and max scores.
  5. SQLite schema isolates test/demo records via `isDemo` flags and establishes immutable audit tables.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Backend setup (Express, Prisma, SQLite, JWT auth, RBAC middleware, question/rubric models & endpoints)
- [ ] 01-02: Frontend setup (Vite React, Tailwind, auth flows, role-based dashboards, question/rubric management UI, disclaimers)

### Phase 2: Gemini AI Evaluation Engine & Student Assessment Portal
**Goal**: Implement the Google Gemini evaluation engine with strict structured JSON schema, confidence scoring, low-confidence fallback flagging, and the student test-taking portal.
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: [STUD-01, STUD-02, AI-01, AI-02, AI-03, STUD-03]
**Success Criteria**:
  1. Student can enter an active assessment session, view all predetermined Criminal Law I essay questions, and submit written answers in a single session.
  2. Backend triggers Gemini AI evaluation pipeline with Zod-validated structured JSON output (criterion breakdown, total score, IRAC rationale, missing elements, confidence score).
  3. Low-confidence AI evaluations (< threshold) are automatically flagged for mandatory expert review.
  4. Student can review returned evaluation feedback and diagnostic guidance.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Gemini AI service integration (structured output schema, prompt engineering, rubric weighting, confidence checks)
- [ ] 02-02: Student assessment portal (exam session runner, essay submission, evaluation result view)

### Phase 3: Double-Blind Expert Evaluation & Comparison Matrix
**Goal**: Implement the double-blind expert grading workflow, distributed answer assignment, side-by-side AI-vs-Expert comparison dashboard with delta metrics, and V1→V2→V3 iteration management.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: [EXPT-01, EXPT-02, EXPT-03, COMP-01, COMP-02, ITER-01]
**Success Criteria**:
  1. System distributes student essay submissions among expert evaluators (1–2 experts per answer).
  2. Expert evaluator grades student answers against reference answers without seeing AI scores or rationales during iterations 1–3.
  3. Researcher dashboard displays side-by-side AI vs Expert scores, calculates deltas (`AI - Expert`), and logs disagreement categories.
  4. Researcher can snapshot current iteration (V1/V2), update prompt/rubric configurations, and transition to the next version while locking historical data.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Double-blind expert portal (distribution queue, reference answer view, criterion scoring, legal reasoning input)
- [ ] 03-02: Comparison dashboard & iteration transition manager (delta analytics, gap taxonomy tagging, version snapshot locking)

### Phase 4: Post-V3 Final Evaluation, Usability & Analytics Export
**Goal**: Implement post-V3 unblinded expert evaluation, student and expert usability surveys (SUS / Likert) with statistical calculations, and multi-format research dataset export.
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: [FEVL-01, USAB-01, STAT-01, REPO-01]
**Success Criteria**:
  1. Post-V3 final evaluation interface reveals AI scores/rationales to experts for formal agreement/disagreement scoring and qualitative critique.
  2. Standardized usability questionnaires (SUS / Likert) collect student user acceptance and expert capability ratings.
  3. System automatically calculates weighted mean, standard deviation, and inter-rater agreement statistics.
  4. Researcher can export complete research datasets to CSV, JSON, and printable/downloadable PDF reports.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Post-V3 final evaluation module & usability survey engine (questionnaire builder, submission, statistical metrics)
- [ ] 04-02: Research analytics dashboard & export pipeline (CSV/JSON generation, PDF report formatting, demo data filtering)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, RBAC, Question & Rubric Management | 0/2 | Not started | - |
| 2. Gemini AI Evaluation Engine & Student Assessment Portal | 0/2 | Not started | - |
| 3. Double-Blind Expert Evaluation & Comparison Matrix | 0/2 | Not started | - |
| 4. Post-V3 Final Evaluation, Usability & Analytics Export | 0/2 | Not started | - |
