# Architecture Research

**Domain:** Academic Legal Essay Evaluation System & Research Prototype
**Researched:** 2026-08-15
**Confidence:** HIGH

## System Architecture

YAWA is structured as a modular three-tier local web application with an isolated AI orchestration pipeline, designed for reproducibility, data immutability, and clean separation between student, expert, and researcher workflows.

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
│           ▼                       ▼                       │            │
│  ┌──────────────────┐  ┌──────────────────────┐           │            │
│  │ Gemini AI Service│  │ Comparison & Delta   │           │            │
│  │ (Structured JSON)│  │ Calculation Service  │           │            │
│  └────────┬─────────┘  └──────────┬───────────┘           │            │
└───────────┼───────────────────────┼───────────────────────┼────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Persistence Layer (Prisma ORM)                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      SQLite Database File                        │  │
│  │  - Users & Roles       - Rubrics & Criteria  - Iteration Versions│  │
│  │  - Questions & Models  - Evaluations (AI)    - Usability Surveys │  │
│  │  - Student Submissions - Expert Evaluations  - Audit Records     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

## Component Boundaries & Data Flow

### 1. Student Submission & AI Evaluation Flow
1. Student logs in, views available assessment session with Criminal Law I questions.
2. Student inputs written answers and submits before session close.
3. Backend receives submission, triggers `GeminiEvaluationService` asynchronously with current active agent version prompt & rubric.
4. Gemini returns structured JSON: criterion breakdown, legal elements identified/missed, IRAC rationale, numerical score, confidence level.
5. AI evaluation is persisted immutably with agent version ID and question reference.

### 2. Double-Blind Expert Evaluation Flow
1. Expert logs in and sees assigned student answers (anonymized student identifier).
2. Expert views question, approved reference answer, and legal elements rubric.
3. Expert DOES NOT see AI evaluation scores or rationales during iterations 1–3.
4. Expert inputs independent numerical criterion scores, identified elements, and legal rationale.
5. Record is saved immutably linked to the student submission and expert profile.

### 3. Comparison & Gap Analysis Flow
1. Backend `ComparisonService` computes score deltas (`AI_Score - Expert_Score`), inter-rater variance, and criterion-by-criterion gap metrics.
2. Researcher Admin views side-by-side comparison matrix.
3. Researcher annotates disagreement categories (e.g., Strict Terminology, Nuanced Interpretation, Missing Element Detection, Hallucination/Over-generosity).
4. Findings feed into V2 / V3 prompt engineering refinements.

### 4. Post-V3 Final Evaluation & Usability Surveys Flow
1. Following V3 iteration, experts enter Final Evaluation mode where AI scores are revealed. Experts score AI agreement and provide qualitative critique.
2. Students and Experts complete standardized survey instruments (SUS / customized Likert questionnaires).
3. Backend calculates weighted mean, standard deviation, and exports comprehensive research dataset (CSV, JSON, PDF).

## Build Order & Phase Dependencies

1. **Phase 1: Foundation, RBAC, Core Entities & Rubric Management**
   - Setup project workspace (Express backend, React frontend, Prisma SQLite).
   - Implement User Auth, Role-Based Access (Student, Expert, Admin), and Disclaimers.
   - Build Question & Reference Answer CRUD, Rubric & Criteria Management.
2. **Phase 2: Gemini AI Evaluation Engine, Student Portal & Assessment Submissions**
   - Integrate Google Gemini SDK with strict JSON schema validation.
   - Implement Agent Versioning manager (V1 baseline configuration).
   - Build Student Portal for exam taking, submission, and student feedback view.
3. **Phase 3: Double-Blind Expert Portal, Comparison Matrix & Iteration Management (V1→V2→V3)**
   - Build Expert Evaluation Portal with blind grading UI and answer distribution.
   - Implement side-by-side AI vs Expert comparison dashboard with delta calculations.
   - Build Iteration Transition workflow to archive V1/V2 and deploy refined prompts.
4. **Phase 4: Post-V3 Final Evaluation, Usability Questionnaires, Analytics & Research Reporting**
   - Build Expert Final Evaluation Agreement module.
   - Implement Student & Expert Usability Surveys with weighted mean/SD calculations.
   - Build Research Analytics Dashboard and multi-format Export engine (CSV/JSON/PDF).

---
*Architecture research for: YAWA (Yet Another Written-Answer AI Agent)*
*Researched: 2026-08-15*
