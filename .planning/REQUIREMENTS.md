# Requirements: YAWA (Yet Another Written-Answer AI Agent)

**Defined:** 2026-08-15
**Core Value:** Enable rigorous, reproducible academic research comparing structured AI evaluations against expert legal assessments, iteratively refining evaluation quality across three agent versions while preserving every piece of historical research data as immutable evidence.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation & Authentication (AUTH / CORE)

- [ ] **AUTH-01**: User can log in with role-based credentials (Student, Expert Evaluator, Admin/Researcher).
- [ ] **AUTH-02**: System enforces role-based access control (RBAC) across all API endpoints and frontend routes.
- [ ] **CORE-01**: System displays prominent academic and legal disclaimers on all portals stating it is a research prototype.
- [ ] **CORE-02**: System provides database schema with strict immutable historical records and isolation of demo/test data via `isDemo` flags.

### Question & Rubric Management (RUBRIC / QUESTION)

- [ ] **QUES-01**: Researcher can create and manage Criminal Law I questions with model reference answers and statutory elements.
- [ ] **RUBR-01**: Researcher can configure scoring rubrics with criteria (Legal Accuracy, Legal Elements, Reasoning, Application, Terminology) and weightings.
- [ ] **VERS-01**: Researcher can manage multi-version AI Agent configurations (V1 baseline → V2 refined → V3 refined) with immutable version snapshots.

### Assessment & AI Evaluation Engine (STUDENT / AI)

- [ ] **STUD-01**: Student can view available assessment session and answer all predetermined Criminal Law I questions in a single session.
- [ ] **STUD-02**: Student can submit written essay answers and receive confirmation.
- [ ] **AI-01**: System invokes Google Gemini API with strict structured JSON schema to evaluate student answers against reference rubrics.
- [ ] **AI-02**: AI evaluation produces numerical criterion scores, total score, IRAC-grounded legal rationale, missing elements, and confidence score.
- [ ] **AI-03**: System flags low-confidence AI evaluations for mandatory expert review.
- [ ] **STUD-03**: Student can view diagnostic evaluation feedback and scores tailored for student learning.

### Double-Blind Expert Evaluation (EXPERT)

- [ ] **EXPT-01**: System distributes student answers among expert evaluators (1–2 experts per answer).
- [ ] **EXPT-02**: Expert Evaluator views question, model reference answer, and student answer without seeing AI scores (double-blind).
- [ ] **EXPT-03**: Expert Evaluator scores student answer across rubric criteria with detailed qualitative legal reasoning.

### Comparison Matrix & Iteration Management (COMP / ITER)

- [ ] **COMP-01**: Researcher can view side-by-side comparison matrix of AI score vs Expert score with automated delta calculations.
- [ ] **COMP-02**: Researcher can annotate and categorize disagreement types (e.g., Strict Terminology, Reasoning Depth, Missing Element Detection).
- [ ] **ITER-01**: Researcher can execute iteration transitions (V1 → V2 → V3), creating new agent snapshots while locking past evaluation data.

### Final Evaluation, Usability & Analytics (EVAL / REPORT)

- [ ] **FEVL-01**: Post-V3 Final Evaluation module allows experts to review unblinded AI scores and provide formal agreement ratings and critique.
- [ ] **USAB-01**: Student and Expert usability questionnaires (SUS / Likert scale) collect user acceptance and capability data.
- [ ] **STAT-01**: System computes statistical metrics (weighted mean, standard deviation, inter-rater score deltas).
- [ ] **REPO-01**: Researcher can export complete research datasets (questions, answers, evaluations, comparisons, metrics) to CSV, JSON, and PDF reports.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Real-Time & Advanced Extensions

- **NOTF-01**: Real-time email and in-app notifications for assessment deadlines and expert assignment alerts.
- **AUDT-01**: Detailed visual diff engine comparing student answer text against statutory element phrases.
- **ANLT-01**: Longitudinal cohort progression graphs tracking student improvement across multiple academic terms.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Official Grading / Bar Exam Tool | Research prototype only; not certified for institutional grading or legal certification |
| Automated Answer Rewriting / Ghostwriting | Violates academic integrity; YAWA evaluates and diagnoses rather than rewrites |
| Runtime Prompt Auto-Tuning | Destroys experimental control; agent versions must be explicitly managed snapshots |
| Free-Form Legal Chatbot | Distracts from rubric-grounded Criminal Law I evaluation |
| Multi-tenant Cloud SaaS | Out of scope for localized researcher deployment |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| QUES-01 | Phase 1 | Pending |
| RUBR-01 | Phase 1 | Pending |
| VERS-01 | Phase 1 | Pending |
| STUD-01 | Phase 2 | Pending |
| STUD-02 | Phase 2 | Pending |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Pending |
| AI-03 | Phase 2 | Pending |
| STUD-03 | Phase 2 | Pending |
| EXPT-01 | Phase 3 | Pending |
| EXPT-02 | Phase 3 | Pending |
| EXPT-03 | Phase 3 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| ITER-01 | Phase 3 | Pending |
| FEVL-01 | Phase 4 | Pending |
| USAB-01 | Phase 4 | Pending |
| STAT-01 | Phase 4 | Pending |
| REPO-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-15*
*Last updated: 2026-08-15 after initial definition*
