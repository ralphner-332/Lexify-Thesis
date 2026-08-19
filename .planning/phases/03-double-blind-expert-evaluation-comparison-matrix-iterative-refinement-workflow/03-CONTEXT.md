# Phase 3: Double-Blind Expert Evaluation, Comparison Matrix & Iterative Refinement Workflow — Context

**Phase Status:** Discussed & Decisions Locked
**Requirements:** `EXPT-01, EXPT-02, COMP-01, COMP-02, ITER-01, ITER-02`
**Mode:** `mvp`

---

## 1. Locked Decisions

### Area 1: Double-Blind Expert Evaluation Workflow & Portal UI (`EXPT-01, EXPT-02`)
- **Student Anonymity:** Experts view student submissions tagged ONLY with anonymized research identifiers (e.g., `Student-01`, `Student-02`). Student names, emails, and identifying metadata are strictly withheld.
- **Evaluation Queue & Statuses:** Queue/table interface for assigned student submissions displaying clear statuses (`Not Started`, `Draft`, `Submitted`) with sequential navigation options.
- **Strict Double-Blind Protection:** Experts evaluate student essays with **zero exposure** to AI scores, AI reasoning, AI feedback, comparison metrics, or conflict flags before submitting their own evaluation. This restriction is enforced on the server side via role-specific DTOs and API route security.
- **Expert Reference Materials:** Experts have access to:
  1. Predetermined Criminal Law I Question & Factual Scenario
  2. Student's Written Essay Response
  3. Authoritative Model Reference Answer
  4. Statutory Legal Elements Checklist & Relevant RPC Provisions/Citations
  5. Active Research Scoring Rubric (same criteria used for AI evaluation)
- **Drafts & Immutability:** Draft expert scores and qualitative legal comments may be saved server-side. Upon final confirmation, expert evaluations become permanent immutable research evidence (`createdAt` only, no update/delete endpoints).
- **Data Mode Separation:** `isDemo: true` separation maintained for all expert evaluations and drafts.

### Area 2: AI vs Expert Side-by-Side Comparison Matrix (`COMP-01, COMP-02`)
- **Post-Submission Availability:** Comparison matrix is unlocked for researchers only after the independent expert evaluation has been submitted.
- **Side-by-Side Comparison Dimensions:**
  - Overall numerical score (AI vs Expert)
  - Criterion-level scores & score deltas
  - Total score delta (`Expert Score - AI Score` and absolute difference `|Expert - AI|`)
  - AI scoring basis vs Expert qualitative legal rationale
  - Identified strengths vs missing legal elements comparison
- **Configurable Conflict Thresholds & Signals:**
  - Conflict thresholds are configurable by researchers (not hardcoded conclusions).
  - Conflict signals include:
    - Overall score difference exceeding threshold (e.g., Δ > 10% or configurable pts)
    - Criterion-level divergence (specific rubric criteria with high discrepancy)
    - Disagreement on statutory legal elements
    - Substantial reasoning or partial-credit divergence
  - Automated flags are clearly labeled as review signals distinct from expert judgment.
- **Evidence Linking & Immutability:** Comparison records link exact `questionSnapshot`, `evaluationId` (AI), `expertEvaluationId`, and `agentVersionId` ("V1"), stored as append-only research evidence.

### Area 3: Structured Refinement Framework & Conflict Logging (`ITER-01`)
- **Structured Refinement Schema:**
  - `id` / `gapId` (e.g., `GAP-001`)
  - `questionId` / `questionCode`
  - `submissionId` / `sessionId`
  - `aiEvaluationId` & `expertEvaluationId`
  - `agentVersionId` (e.g., "V1")
  - `targetComponent` (`SYSTEM_INSTRUCTIONS` | `EVALUATION_PATTERNS` | `RUBRIC_SNAPSHOT` | `CONCEPT_VARIATIONS` | `SKILLS_DEFINITION` | `OTHER`)
  - `gapCategory` (`LEGAL_CONCEPT_MISUNDERSTANDING` | `STATUTORY_ELEMENT_OMISSION` | `REASONING_IRAC_ISSUE` | `ACCEPTABLE_VARIATION_HANDLING` | `SCORING_RUBRIC_INTERPRETATION` | `HALLUCINATION_UNSUPPORTED_CLAIM` | `REFERENCE_MATERIAL_GROUNDING` | `OTHER`)
  - `discrepancyDescription` (Summary of identified gap)
  - `aiPosition` (Summary of AI stance)
  - `expertPosition` (Summary of Expert stance)
  - `expertRationale` (Direct quote/synthesis of expert feedback)
  - `rootCauseAnalysis` (Researcher's analysis of why the AI diverged)
  - `proposedRefinement` (Proposed adjustment to target component)
  - `status` (`DRAFT` | `APPROVED` | `APPLIED` | `REJECTED`)
  - `approvedDecision` (Explicit researcher decision)
  - `resultingAgentVersionId` (e.g., "V2" when applied)
  - `isDemo: boolean`
  - `createdAt` / `updatedAt` / `auditMetadata`
- **Direct 1-Click Linking:** Researchers can generate a refinement log entry directly from an AI-vs-Expert comparison view, auto-populating comparison evidence.
- **Human-in-the-Loop Governance:** AI Agent versions are never modified automatically upon conflict detection; all refinements require explicit researcher review and approval.

### Area 4: Iterative Version Transition Engine (V1 → V2 → V3) (`ITER-02, VERS-02`)
- **Branching Lineage (V1 → V2 → V3):**
  - V1 is the baseline locked snapshot.
  - Creating V2 clones V1 configuration and applies approved refinement logs, recording `parentVersionId: "V1"`.
  - Creating V3 branches from V2, recording `parentVersionId: "V2"`.
- **Structured Version Changelog:** Every new version stores a structured changelog recording:
  - What changed in each component
  - Why it changed
  - Linked refinement log IDs (`refinementLogIds: ["GAP-001", "GAP-002"]`)
  - Approver user ID / timestamp
- **Side-by-Side Version Diff Inspector:** Visual diff viewer comparing V1 vs V2 and V2 vs V3 across System Instructions, Evaluation Patterns, Skills, Rubrics, and Model Config.
- **Snapshot Immutability & Activation:**
  - New versions become locked and immutable upon publication.
  - Prior versions (V1) and all evaluations produced under them are permanently preserved and never overwritten.
  - Version activation is an explicit researcher action logged to `AuditLog`.
  - Empirical data from V1, V2, and V3 is preserved to study whether iterative refinement improved alignment with expert legal standards.

---

## 2. Downstream Directives for Researcher & Planner

- **Backend (03-01):**
  - Implement `ExpertEvaluation` and `RefinementLog` Prisma models.
  - Implement double-blind expert assessment endpoints with draft auto-save and submission locking.
  - Implement server-side anonymization of student identities for expert endpoints.
  - Implement AI-vs-Expert comparison service with configurable delta metrics and conflict signals.
  - Implement structured Refinement Log CRUD with comparison evidence linking.
  - Implement Agent Version branching engine (V1 → V2 → V3) with changelog metadata and lineage tracking.
- **Frontend (03-02):**
  - Implement Double-Blind Expert Portal (`ExpertEvaluationPortal.tsx`, `ExpertQueue.tsx`, `ExpertGradingForm.tsx`) with student anonymity and reference view.
  - Implement AI vs Expert Comparison Matrix (`ComparisonMatrix.tsx`, `ComparisonDetailView.tsx`) with configurable threshold sliders and 1-click "Create Refinement Log" action.
  - Implement Structured Refinement Manager (`RefinementManager.tsx`, `RefinementEditor.tsx`).
  - Implement Version Lineage & Iteration Console (`VersionLineageConsole.tsx`, `VersionDiffModal.tsx`).
