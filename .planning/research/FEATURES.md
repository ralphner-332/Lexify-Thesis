# Features Research

**Domain:** Academic Legal Essay Evaluation System & Research Prototype
**Researched:** 2026-08-15
**Confidence:** HIGH

## Feature Analysis

### Table Stakes (Must-Have Core Research Capabilities)

These capabilities are mandatory to conduct the academic research study on Criminal Law I essay evaluations.

| Feature | Complexity | Why Essential |
|---------|------------|---------------|
| Role-Based Access Control (Student, Expert, Admin) | Medium | Enforces strict operational boundaries between student test-taking, double-blind expert grading, and researcher configuration |
| Academic & Legal Research Disclaimers | Low | Legal/ethical requirement stating system is an academic research prototype, not an official grading/legal tool |
| Predetermined Question & Reference Material Management | Medium | Manages predetermined Criminal Law I questions, model reference answers, statutory elements, and reference materials (no AI-generated questions) |
| Configurable Scoring Rubric Engine | Medium | Allows researcher to configure criteria, weightings, and maximum scores without code changes |
| Agent Component Versioning Manager (V1 → V2 → V3) | High | Manages snapshots of AI skills, instructions, rubrics, evaluation patterns, and reference configs; ensures past versions are never overwritten |
| Semantic AI Evaluation Engine (Non-Keyword) | High | Evaluates legal concepts, completeness, reasoning, and acceptable alternative expressions according to approved rubric without inventing authorities |
| Structured AI Evaluation Output | Medium | Produces numerical score, max score, scoring basis, criterion breakdown, missing elements, strengths, improvement areas, confidence flag |
| Student Assessment Portal | Medium | Single-session test taking on predetermined questions, essay submission, and diagnostic feedback viewing |
| Double-Blind Expert Independent Evaluation Portal | High | Legal experts score student answers against reference answers WITHOUT seeing AI scores or reasoning (iterations 1–3) |
| AI vs Expert Comparison Matrix | High | Side-by-side comparison of AI vs Expert scores and scoring bases, identifying score/reasoning differences, missing elements, weighting gaps, etc. |
| Structured 6-Question Refinement Documentation | Medium | Standardizes researcher documentation of conflicts, expert feedback, component changes, and rationale |
| Post-V3 Final Expert Evaluation Module | Medium | Allows experts to review unblinded AI evaluations to rate agreement, verify reasoning correctness, and recommend adjustments |
| Configurable Usability & Capability Questionnaires | Medium | Separate post-V3 surveys for student user acceptance and expert assessment capability |
| Research Data Preservation & Audit Logging | High | Append-only immutability for all historical evaluations, version snapshots, comparison findings, and refinement logs |
| Complete Research Data Export (CSV/JSON/PDF) | Medium | Enables researchers to export complete evaluation datasets and reports for thesis and statistical analysis |
| Strict Demo Data Isolation (`isDemo: true`) | Low | Completely isolates test/demo records from research statistics and exports |

### Unresolved / Configurable Scope (Placeholders until Adviser Approval)

| Item | Status | Configuration Approach |
|------|--------|------------------------|
| Exact number of student respondents | Unresolved / Configurable | System supports variable cohort sizes |
| Exact number of expert evaluators | Unresolved / Configurable | Flexible assignment configuration |
| Exact Criminal Law I coverage & questions | Unresolved / Configurable | Managed dynamically via Admin Question CRUD |
| Exact scoring rubric criteria & weights | Unresolved / Configurable | Managed dynamically via Admin Rubric Builder |
| Exact questionnaire items (SUS/Likert) | Unresolved / Configurable | Managed dynamically via Admin Questionnaire Builder |
| Exact AI model/provider | Unresolved / Configurable | Configurable via environment variables and AI settings |
| Exact statistical tests | Unresolved / Configurable | Standard descriptive metrics (weighted mean, SD, deltas) provided with extensible analytics |
| Exact final evaluation procedure & title | Unresolved / Configurable | Configurable metadata |

### Anti-Features (Deliberately Excluded)

| Feature | Reason for Exclusion |
|---------|----------------------|
| Generative Cheating / Answer Rewriting | Violates academic integrity; YAWA is an evaluation/diagnostic tool, not a ghostwriter |
| Runtime Prompt Auto-Tuning | Destroys experimental control; version updates must be deliberate and researcher-controlled |
| Free-Form Legal Chatbot | Distracts from controlled Criminal Law I rubric assessment |
| Dynamic Question Generation by AI | Questions must be predetermined and human-vetted |
| Multi-Tenant Cloud SaaS | Unnecessary for localized university research study |

---
*Features research for: YAWA (Yet Another Written-Answer AI Agent)*
