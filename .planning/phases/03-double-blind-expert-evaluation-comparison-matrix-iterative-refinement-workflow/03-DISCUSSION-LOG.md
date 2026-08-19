# Phase 3: Discussion Log

**Date:** 2026-08-19
**Phase:** 03-double-blind-expert-evaluation-comparison-matrix-iterative-refinement-workflow
**Participants:** Lead Researcher (User) & Antigravity (AI Assistant)

## Topics Discussed & Choices Locked

### 1. Double-Blind Expert Evaluation Workflow & Portal UI (`EXPT-01, EXPT-02`)
- **Student Anonymity:** Experts evaluate answers identified only as `Student-01`, `Student-02`, etc., without access to names or emails.
- **Double-Blind Protection:** Strictly zero AI scores, reasoning, or feedback are visible to the expert prior to independent evaluation submission (enforced server-side).
- **Materials Available to Expert:** Question scenario, student answer, reference answer, statutory elements, legal citations, and active rubric.
- **Server Drafts & Immutability:** Expert drafts may be saved server-side; final submission permanently locks expert evaluations as immutable research records.

### 2. AI vs. Expert Side-by-Side Comparison Matrix (`COMP-01, COMP-02`)
- **Access Gate:** Available to researchers only after independent expert evaluation is submitted.
- **Comparison Dimensions:** Overall numerical score, criterion-level scores & deltas, total delta (`Expert Score - AI Score` and absolute difference), AI scoring basis vs Expert rationale, strengths vs missing elements.
- **Configurable Conflict Signals:** Unhardcoded conflict thresholds for score differences, criterion divergence, statutory element disagreements, and reasoning divergence.
- **Evidence Linking:** Immutable comparison records link exact question snapshots, AI evaluation ID, expert evaluation ID, and agent version ID.

### 3. Structured Refinement Framework & Conflict Logging (`ITER-01`)
- **Refinement Schema:** Gap ID, question ref, AI eval ref, expert eval ref, agent version, target agent component, gap category, discrepancy description, AI position, expert position, expert rationale, root cause analysis, proposed refinement, approved decision, resulting version, audit timestamps.
- **1-Click Linking:** Ability to create refinement entries directly from AI-vs-Expert comparisons with pre-populated evidence.
- **Human-in-the-Loop:** Refinements require explicit researcher approval; no automated agent changes upon conflict detection.

### 4. Iterative Version Transition Engine (V1 → V2 → V3) (`ITER-02, VERS-02`)
- **Lineage Tracking:** V2 branches from V1; V3 branches from V2; parent version references stored permanently.
- **Structured Changelog:** Records what changed, why it changed, linked refinement IDs, and approver timestamp.
- **Version Diffs:** Side-by-side visual diff inspector comparing agent components across versions.
- **Snapshot Immutability:** New versions lock upon publication; past versions and evaluations are never overwritten.
