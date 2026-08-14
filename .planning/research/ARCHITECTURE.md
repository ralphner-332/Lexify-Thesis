# Architecture Research

**Domain:** Academic Legal Essay Evaluation System & Research Prototype
**Researched:** 2026-08-15
**Confidence:** HIGH

## System Architecture

YAWA is structured as a modular research platform designed around the experimental research workflow. The architecture enforces strict separation of concerns across:
1. **Frontend (React / Vite):** Role-specific portals (Student, Expert, Admin/Researcher) with clear research disclaimers.
2. **Backend REST API (Node.js / Express):** Authentication, RBAC enforcement, assessment session orchestration, comparison engine, and survey manager.
3. **AI Evaluation Service:** Isolated service module that connects to LLM APIs (e.g., Google Gemini / configurable models), enforcing structured output schemas, semantic concept scoring (non-keyword), and confidence flagging.
4. **Agent Version Manager:** Manages immutable snapshots of Agent components (skills, instructions, rubrics, evaluation patterns, reference materials/configs) across V1, V2, and V3.
5. **Research / Evaluation Logic:** Side-by-side comparison, delta calculation, 6-question refinement documentation, post-V3 final evaluation, and survey aggregation.
6. **Persistence Layer (Prisma ORM & SQLite):** Single-file local database with append-only immutable evaluation records and strict `isDemo` isolation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React / Vite)                         │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │  Student Portal  │  │ Expert Portal (Blind)│  │ Researcher Admin │  │
│  └────────┬─────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└───────────┼───────────────────────┼───────────────────────┼────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Backend API (Node.js / Express)                   │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │  Auth & RBAC     │  │ Assessment Engine    │  │ Analytics/Export │  │
│  └────────┬─────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│           │                       │                       │            │
│           ▼                       ▼                       ▼            │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ AI Eval Service  │  │ Agent Version Manager│  │ Comparison &     │  │
│  │ (Semantic JSON)  │  │ (Skills/Instructions/│  │ 6-Q Refinement   │  │
│  │                  │  │  Rubric Snapshots)   │  │ Module           │  │
│  └────────┬─────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└───────────┼───────────────────────┼───────────────────────┼────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Persistence Layer (Prisma ORM)                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      SQLite Database File                        │  │
│  │  - Users & RBAC        - Rubrics & Criteria  - Version Snapshots │  │
│  │  - Questions & Models  - Evaluations (AI)    - Refinement Logs   │  │
│  │  - Student Submissions - Expert Evaluations  - Usability Surveys │  │
│  │  - Delta Records       - Final Evaluations   - (isDemo Isolation)│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

## Component Boundaries & Data Flow

### 1. Student Submission & AI Evaluation Flow
1. Student views assigned assessment with predetermined Criminal Law I questions.
2. Student submits written essay answers in a single session.
3. Backend invokes `AIEvaluationService` with the currently active Agent Version snapshot (skills, instructions, rubric, reference answers).
4. AI evaluates semantic meaning, legal concepts, completeness, reasoning, and acceptable alternative expressions (not keyword matching).
5. AI produces structured output (numerical score, max score, scoring basis, criterion breakdown, missing elements, strengths, improvement areas, confidence flag).
6. Evaluation is persisted immutably with the producing Agent Version ID and iteration tag.

### 2. Double-Blind Expert Independent Evaluation Flow (Iterations 1–3)
1. Expert logs in and sees assigned student answers along with the question and model reference answer.
2. Expert DOES NOT see AI scores, basis, or reasoning during iterations 1–3.
3. Expert provides independent numerical score, scoring basis/reason, criterion scores, and comments.
4. Expert evaluation is saved immutably linked to the student submission.

### 3. AI vs Expert Comparison & 6-Question Refinement Workflow
1. System compares AI score vs Expert score AND AI scoring basis vs Expert scoring basis.
2. System computes deltas and presents differences in reasoning, elements, interpretations, weighting, and partial credit.
3. System preserves both evaluations (recognizing score differences do not automatically imply AI error).
4. Researcher documents gap analysis across the 6 core questions:
   - What was wrong or inconsistent?
   - Why did the conflict occur?
   - What did the expert say?
   - What should be changed?
   - Which Agent component should be changed? (skills, instructions, rubric, patterns, reference materials/configs)
   - Why should it be changed?
5. Approved refinements are saved as a new immutable Agent Version (V1 → V2 → V3).

### 4. Post-V3 Final Evaluation & Usability Surveys Flow
1. Following Version 3, Expert performs Final Evaluation: reviews unblinded AI score and basis, indicating agreement/disagreement, reasoning correctness, specific errors, improvement suggestions, and recommended scores.
2. Students complete configurable Usability / User Acceptance questionnaires.
3. Experts complete configurable Assessment Capability questionnaires.
4. Researcher dashboard aggregates descriptive statistics (weighted mean, standard deviation, deltas) and exports full research datasets (CSV, JSON, PDF) with demo data strictly filtered out.

---
*Architecture research for: YAWA (Yet Another Written-Answer AI Agent)*
