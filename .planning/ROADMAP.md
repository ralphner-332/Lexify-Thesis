# Roadmap: YAWA (Yet Another Written-Answer AI Agent)

## Overview

YAWA is an academic research prototype evaluating written essay answers from law students in Criminal Law I. The system proceeds from foundational architecture, authentication, questions, rubrics, and component version management (Phase 1), through AI non-keyword evaluation and student assessment (Phase 2), to double-blind expert scoring, side-by-side comparison, and structured iterative refinement (Phase 3), concluding with post-V3 final expert agreement evaluation, configurable usability surveys, and research data export (Phase 4).

## Phases

- [ ] **Phase 1: Foundation, RBAC, Question/Rubric Management & Agent Component Snapshots** - Core architecture, 3-role authentication, disclaimers, predetermined Criminal Law I question management, configurable rubrics, and V1/V2/V3 agent component snapshot infrastructure.
- [ ] **Phase 2: Semantic AI Evaluation Engine & Student Assessment Portal** - Non-keyword AI evaluation engine (meaning, legal concepts, completeness, reasoning, alternative expressions), structured output schema, confidence flags, and student test-taking portal.
- [ ] **Phase 3: Double-Blind Expert Evaluation, Comparison Matrix & Iterative Refinement Workflow** - Double-blind expert scoring (no AI score visibility), side-by-side AI vs Expert comparison, conflict/gap documentation, and structured refinement into V2/V3.
- [ ] **Phase 4: Post-V3 Final Evaluation, Configurable Usability Surveys & Research Data Export** - Post-V3 unblinded expert agreement review, configurable student usability and expert capability questionnaires, configurable statistical metrics, and comprehensive CSV/JSON/PDF exports.

## Phase Details

### Phase 1: Foundation, RBAC, Question/Rubric Management & Agent Component Snapshots
**Goal**: Establish fullstack foundation with secure 3-role RBAC (Student, Expert, Admin/Researcher), disclaimers, predetermined Criminal Law I question & model reference answer management (configurable question count), configurable scoring rubrics, demo data isolation, and multi-version Agent component snapshot architecture (V1, V2, V3).
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: [AUTH-01, CORE-01, CORE-02, CORE-03, QUES-01, RUBR-01, VERS-01, VERS-02]
**Success Criteria**:
  1. Users can log in under dedicated roles (Student, Expert Evaluator, Admin/Researcher) with server-enforced RBAC protecting API routes and views.
  2. Prominent academic research and legal disclaimers appear on all portal headers and exam/grading interfaces.
  3. Researcher can create, edit, and manage predetermined Criminal Law I questions (configurable item count), model reference answers, statutory elements, and reference materials.
  4. Researcher can configure scoring rubrics (criteria, weightings, max scores).
  5. Researcher can manage and snapshot Agent components (skills, instructions, rubrics, evaluation patterns, reference materials/configs) for V1 baseline, ensuring V1/V2/V3 data is never overwritten and all AI evaluations record their exact producing version.
  6. SQLite schema isolates demo records (`isDemo: true`) from real research data.
**Plans**: 2 plans

Plans:
- [x] 01-01: Backend architecture (Express, TypeScript, Prisma SQLite schema with immutable audit records, JWT auth, RBAC middleware, question/rubric/agent-version CRUD APIs)
- [x] 01-02: Frontend architecture (React Vite, Tailwind CSS, role-based dashboards, question/reference answer manager, rubric builder, agent component snapshot UI, disclaimers)

### Phase 2: Semantic AI Evaluation Engine & Student Assessment Portal
**Goal**: Deliver the AI evaluation engine evaluating meaning, legal concepts, completeness, reasoning, and acceptable alternative expressions according to approved rubrics (not exact keyword matching), and the student assessment interface.
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: [STUD-01, AI-01, AI-02, STUD-02]
**Success Criteria**:
  1. Student can log in, view assigned/available assessment, answer predetermined Criminal Law I essay questions in a single session, and submit answers.
  2. AI Evaluation Engine processes student answers against reference materials and rubrics using semantic legal reasoning (evaluating concepts, completeness, reasoning, alternative expressions without inventing legal rules or relying solely on keywords).
  3. AI evaluation generates complete structured output: numerical score, maximum score, scoring basis/reason, criterion-level scores, criterion-level reasoning, strengths, missing elements, areas for improvement, and confidence/review flags.
  4. Student can view returned diagnostic feedback and scores tailored for learning.
**Plans**: 2 plans

Plans:
- [ ] 02-01: AI evaluation service (semantic evaluation prompt pipeline, Zod schema validation, criterion breakdown, confidence scoring, version tagging)
- [ ] 02-02: Student assessment portal (exam session UI, essay submission handler, feedback and score viewer)

### Phase 3: Double-Blind Expert Evaluation, Comparison Matrix & Iterative Refinement Workflow
**Goal**: Deliver the double-blind expert grading workflow (no AI score visibility), side-by-side AI vs Expert comparison matrix, conflict/gap documentation, and the structured refinement process transitioning V1 → V2 → V3.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: [EXPT-01, EXPT-02, COMP-01, COMP-02, ITER-01, ITER-02]
**Success Criteria**:
  1. Legal Expert independently evaluates student answers, viewing question and reference materials WITHOUT seeing AI scores or reasoning during iterations 1–3.
  2. Expert provides numerical score, scoring basis/reason, criterion-level scores, and qualitative legal comments.
  3. Researcher can view side-by-side comparison of AI vs Expert scores and scoring bases, identifying score differences, reasoning differences, missing elements, interpretation gaps, weighting issues, alternative expressions, and partial-credit issues (preserving both evaluations).
  4. Researcher can document conflict analyses using a structured refinement framework to record findings, expert feedback, and component modification rationales.
  5. Researcher can incorporate approved refinements into the next Agent Version (V1 → V2 → V3) while locking past iteration records immutably.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Double-blind expert evaluation portal (evaluation queue, reference view, criterion scoring, independent legal reasoning input)
- [ ] 03-02: AI vs Expert comparison dashboard & refinement manager (side-by-side diffs, delta metrics, gap categorization, version iteration transition)

### Phase 4: Post-V3 Final Evaluation, Configurable Usability Surveys & Research Data Export
**Goal**: Deliver the post-V3 final expert agreement review module, separate configurable questionnaires for student usability and expert capability, descriptive statistical metrics, and research dataset export.
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: [FEVL-01, USAB-01, USAB-02, STAT-01, REPO-01]
**Success Criteria**:
  1. Expert can perform post-V3 Final Evaluation reviewing Question, Student Answer, AI Score, AI Scoring Basis, and AI Criterion Scores to indicate agreement/disagreement, reasoning correctness, specific errors, improvement suggestions, and recommended scores.
  2. Students can complete a configurable Usability / User Acceptance questionnaire post-V3.
  3. Experts can complete a configurable Assessment Capability evaluation of the AI Agent post-V3.
  4. System supports descriptive statistics (score differences, agreement measures, weighted means, standard deviations) without hardcoding a finalized statistical methodology.
  5. Researcher can export complete research datasets to CSV, JSON, and printable/downloadable PDF reports with demo data strictly filtered out.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Post-V3 final evaluation module & configurable survey engine (agreement scoring, survey builder, response collector, descriptive metrics)
- [ ] 04-02: Researcher analytics dashboard & multi-format export pipeline (CSV, JSON, PDF exports, demo data filtering)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, RBAC, Question/Rubric Management & Agent Component Snapshots | 0/2 | Not started | - |
| 2. Semantic AI Evaluation Engine & Student Assessment Portal | 0/2 | Not started | - |
| 3. Double-Blind Expert Evaluation, Comparison Matrix & Iterative Refinement Workflow | 0/2 | Not started | - |
| 4. Post-V3 Final Evaluation, Configurable Usability Surveys & Research Data Export | 0/2 | Not started | - |
