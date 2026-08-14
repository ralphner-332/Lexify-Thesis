# YAWA — Yet Another Written-Answer AI Agent

## What This Is

A locally-deployed academic research prototype designed to support an empirical study on developing and iteratively refining an AI Agent that evaluates written essay answers from FSUU College of Law students in Criminal Law I.

The purpose of YAWA is NOT simply to act as an automated grading system, but to serve as the research platform for an iterative development and evaluation study:
- **AI Agent Version 1:** Students answer predetermined Criminal Law I questions → AI evaluates answers (numerical score + scoring basis + criterion breakdown) → Legal expert independently evaluates SAME answers (without seeing AI score/reasoning) → AI and expert evaluations are compared → Researchers identify conflicts/gaps across 6 structured questions → Expert reasoning is used to refine specific Agent components.
- **AI Agent Version 2:** Refined Agent evaluated on the answers → comparison with expert assessments → gap analysis & refinement.
- **AI Agent Version 3:** Final refined Agent evaluated on the answers → comparison.
- **Final Evaluation:** Post-V3 expert review of AI evaluation quality/agreement, plus separate configurable student usability and expert capability evaluations.

*Disclaimer: This is strictly an academic research prototype — not a replacement for a law professor, lawyer, formal examination, official institutional grading system, or legal advice.*

## Core Value

Enable rigorous, reproducible academic research on iterative AI Agent refinement for legal essay evaluation by comparing structured AI evaluations against independent expert legal assessments across three immutable versions (V1 → V2 → V3), preserving every evaluation, comparison, conflict analysis, and refinement decision as immutable research evidence.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Role-Based Access Control (RBAC):** Three dedicated roles with server-enforced permissions — Student, Expert Evaluator, Admin/Researcher.
- [ ] **Prominent Academic & Research Disclaimers:** Visible on all views stating system is a research prototype with zero official grading/legal authority.
- [ ] **Predetermined Question & Reference Material Management:** Researcher manages predetermined Criminal Law I questions, model reference answers, statutory elements, and reference materials (no dynamically AI-generated questions).
- [ ] **Configurable Scoring Rubric Management:** Researcher configures rubric criteria (e.g., Legal Accuracy, Legal Elements, Reasoning, Application, Terminology), weightings, and maximum scores.
- [ ] **Multi-Version Agent Component Management:** Explicit management and snapshotting of Agent components (AI skills, instructions, rubrics, evaluation patterns, reference materials/configs) across V1, V2, and V3.
- [ ] **Immutable Version Snapshots:** Version 1 is never overwritten when Version 2 is created; Version 2 is never overwritten when Version 3 is created. Every AI evaluation records the exact Agent Version that produced it.
- [ ] **Non-Keyword AI Evaluation Engine:** AI evaluates meaning, legal concepts, completeness, reasoning, and acceptable alternative expressions according to approved rubric (NOT exact keyword matching, and zero tolerance for invented legal rules/cases).
- [ ] **Structured AI Evaluation Output:** Produces numerical score, maximum score, scoring basis/reason, criterion-level scores, criterion-level reasoning, strengths, missing elements, areas for improvement, and confidence/review flag where appropriate.
- [ ] **Student Assessment Portal:** Student logs in, views assigned/available assessment, answers predetermined questions in a single session, submits written answers, views student-appropriate AI feedback, and completes usability questionnaire.
- [ ] **Double-Blind Expert Independent Evaluation Portal:** Legal expert independently evaluates the same student answers, providing numerical score, scoring basis/reason, criterion scores, and comments WITHOUT seeing AI scores or reasoning during iterations 1–3.
- [ ] **AI vs Expert Comparison Module:** Compares AI score vs Expert score AND AI scoring basis vs Expert scoring basis, highlighting score differences, reasoning differences, missing elements, interpretation gaps, weighting issues, alternative expressions, and partial-credit issues (preserving both evaluations without assuming AI is automatically wrong).
- [ ] **Structured 6-Question Refinement Documentation:** Researcher records: (1) What was wrong/inconsistent? (2) Why did conflict occur? (3) What did expert say? (4) What should be changed? (5) Which Agent component should be changed? (6) Why should it be changed?
- [ ] **Post-V3 Final Evaluation Module:** Expert reviews Question, Student Answer, AI Score, AI Scoring Basis, and AI Criterion Scores to indicate agreement/disagreement, correctness of reasoning, specific errors, improvement suggestions, and recommended scores.
- [ ] **Configurable Usability & Capability Evaluations:** Separate post-V3 configurable questionnaires for Student Usability/User Acceptance and Expert Assessment Capability Evaluation.
- [ ] **Research Analytics & Descriptive Statistics:** Computes score differences, agreement rates, weighted mean, standard deviation, and inter-rater variances across iterations.
- [ ] **Complete Research Data Preservation & Export:** Preserves full audit trail (questions, reference answers, student answers, version tags, AI & expert evaluations, comparisons, gap analyses, refinement decisions) with export to CSV, JSON, and PDF.
- [ ] **Strict Demo Data Isolation:** Complete database separation via `isDemo` flags; demo data is never included in research statistics or exports.

### Out of Scope

- Official institutional grading system or certified bar review grading tool.
- Automated answer rewriting or generative ghostwriting/cheating features.
- Autonomous prompt self-modification at runtime (all refinements are researcher-controlled and version-tagged).
- Free-form legal chatbot or dynamic question generation by AI.
- Multi-tenant cloud SaaS deployment (local deployment on researcher machine/local network only).

## Context

- **Academic Setting:** FSUU College of Law, Criminal Law I curriculum.
- **Research Workflow:** 3 iterative cycles (V1 → V2 → V3) with predetermined questions and independent expert evaluation, followed by post-V3 final evaluation and usability surveys.
- **Component Refinement Targets:** Agent skills, instructions, scoring rubrics, evaluation patterns, reference materials/configurations.
- **Configurable / Unresolved Parameters (Placeholders until Adviser Approval):**
  - Exact number of student respondents (configurable).
  - Exact number of expert evaluators and answer distribution ratio (configurable).
  - Exact Criminal Law I question set and curriculum scope (managed via Admin CRUD).
  - Exact scoring rubric criteria and weight distributions (managed via Admin CRUD).
  - Exact student usability and expert capability questionnaires (managed via Admin CRUD).
  - Exact AI model/provider configuration (configurable via environment/settings).
  - Exact statistical test suite (configurable descriptive & inferential metrics).
  - Exact final evaluation procedure details and research title (configurable).

## Constraints

- **Technical Architecture:** Clean separation between Frontend (React/Vite), Backend (Node.js/Express), Database (SQLite with Prisma ORM), Authentication (JWT + bcryptjs RBAC), AI Evaluation Service, Research/Evaluation Logic, and Agent Version Management.
- **Security & Secrets:** All API keys managed strictly via `.env`; never hardcoded or exposed to frontend.
- **Research Data Integrity:** Historical evaluation data, comparison notes, and version snapshots are strictly append-only and immutable.
- **Zero Fabrication:** Strictly no fabricated participants, answers, expert scores, feedback, authorities, or statistics. Demo data explicitly isolated via `isDemo: true`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modular AI Evaluation Service | Decouples AI provider/model from business logic, allowing easy model configuration | — Pending |
| Append-only Version Snapshots (V1, V2, V3) | Ensures historical iterations remain immutable evidence for academic reporting | — Pending |
| Double-blind Expert Evaluation (V1–V3) | Prevents AI output from biasing expert scoring; expert sees question, reference, student answer only | — Pending |
| 6-Question Structured Refinement Framework | Standardizes the qualitative analysis connecting expert feedback to Agent component changes | — Pending |
| Post-V3 Final Evaluation Separation | Distinct workflow where expert reviews unblinded AI score and reasoning to assess agreement | — Pending |
| Configurable Questionnaires (Usability & Capability) | Allows researcher to adapt survey instruments without code changes upon adviser review | — Pending |
| Local SQLite with Prisma ORM | Zero-config, single-file relational database ideal for offline local research deployment | — Pending |
| Demo Data Isolation (`isDemo: true`) | Allows interface demonstration and testing without polluting research datasets or statistics | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-15 after research requirements alignment*
