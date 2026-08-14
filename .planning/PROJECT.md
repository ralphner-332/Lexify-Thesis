# YAWA — Yet Another Written-Answer AI Agent

## What This Is

A locally-deployed academic research prototype that evaluates written essay answers from FSUU College of Law students in Criminal Law I. The system compares structured AI-generated evaluations against independent expert legal assessments across three iterative agent versions (V1 → V2 → V3), then conducts a final evaluation measuring AI assessment capability, expert agreement, and student user acceptance.

*Disclaimer: This is a research prototype — not a replacement for a law professor, lawyer, formal examination, or official institutional grading system.*

## Core Value

Enable rigorous, reproducible academic research comparing structured AI evaluations against expert legal assessments, iteratively refining evaluation quality across three agent versions while preserving every piece of historical research data as immutable evidence.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Role-Based Access Control with 3 dedicated roles: Student, Expert Evaluator, Admin/Researcher
- [ ] Academic and research disclaimers displayed prominently across all portals
- [ ] Question & Reference Answer Management — predetermined Criminal Law I questions, model answers, legal elements managed by researcher
- [ ] Configurable Scoring Rubric Management — criteria (legal accuracy, legal elements, reasoning, application, terminology) with configurable max scores
- [ ] Multi-version AI Agent Evaluation Engine (V1 baseline → V2 refined → V3 refined) powered by Google Gemini API
- [ ] Structured AI Evaluation Output — numerical score, overall basis, criterion breakdown, missing elements, strengths, improvement areas, confidence score, expert-review fallback flag
- [ ] Student Assessment Portal — register/login, view available assessment, answer all predetermined questions in a single session, submit written answers, view AI score and student-appropriate feedback
- [ ] Double-Blind Expert Evaluation Portal — expert sees question, reference answer, and student answer but NOT AI scores during iterations 1–3; scores per rubric criterion with detailed legal reasoning
- [ ] Expert Answer Distribution — student answers distributed among multiple experts (1–2 experts per answer)
- [ ] AI vs Expert Comparison Module — side-by-side AI and expert scores/bases, score delta, researcher-documented gaps/conflicts with categorized disagreement types
- [ ] Agent Iteration Management — V1→gap analysis→V2→gap analysis→V3 workflow with immutable version snapshots preserving skills, instructions, rubric, references, and configuration
- [ ] Final Evaluation Module — post-V3: expert reviews AI score and basis, indicates agreement/disagreement, provides reasoning and recommendations
- [ ] Student Usability Evaluation — configurable questionnaire for user acceptance assessment with weighted mean and standard deviation
- [ ] Expert Assessment Capability Evaluation — separate configurable expert questionnaire evaluating AI agent's assessment quality
- [ ] Researcher Analytics Dashboard — research progress across all 3 versions/iterations, filters by version/iteration/question/student/expert
- [ ] Immutable Historical Research Data & Audit Trail — every evaluation record (question, reference, student answer, agent version, AI score/basis, expert score/basis, deltas, iteration) preserved permanently
- [ ] Data Export & Reporting — export questions, answers, AI evaluations, expert evaluations, comparisons, and statistics to CSV/JSON/PDF for research documentation

### Out of Scope

- Official grading system or legal advice tool — this is strictly a research prototype with explicit disclaimers
- Automatic student answer rewriting or generative cheating tools — focus is purely on evaluation and diagnostic feedback
- Autonomous prompt self-modification at runtime — prompt/rubric iterations (V1→V2→V3) are explicitly managed and version-tagged by researchers
- Free-form legal query chatbot — evaluations constrained to approved Criminal Law I questions and verified reference materials
- Cloud deployment — local deployment on researcher's machine / university network only
- Mobile app — web-first research tool
- OAuth/social login — email/password sufficient for research context
- Real-time collaborative features — not needed for controlled research setting

## Context

- **Target Setting:** FSUU College of Law, Criminal Law I curriculum (Revised Penal Code Book 1: felonies, criminal liability, justifying/exempting/mitigating/aggravating circumstances, penalties)
- **Research Methodology:** 3-cycle iterative design with same fixed student cohort and same predetermined questions across all iterations; AI agent evolves while questions remain constant
- **Participant Design:** Same students answer same questions each iteration. Multiple experts evaluate answers — distributed assignment (1–2 experts per student answer). Experts see reference answers during independent evaluation but NOT AI scores (double-blind on AI side)
- **AI Engine:** Google Gemini API (gemini-2.0-flash / gemini-1.5-pro) with structured JSON output, configurable system instructions, and low-confidence fallback tagging
- **Legal Evaluation Nuances:** Evaluates legal elements, conceptual soundness, legal reasoning (IRAC-style), acceptable legal terminology variations, and partial correctness — NOT exact string matching
- **Deployment:** Local only — researcher's machine or university network

## Constraints

- **Architecture:** Modular separation — Frontend: React/Vite, Backend: Node.js/Express, Database: SQLite with Prisma ORM, AI Service: Google Gemini SDK as isolated module
- **Security & Privacy:** API keys via `.env` only; student identities anonymized to expert evaluators during iterations 1–3; role-based access control enforced server-side
- **Data Integrity:** Historical iteration records are strictly immutable; version updates create new snapshots without overwriting past data; database transactions for research-critical writes
- **Safety:** Disclaimer on all views; zero tolerance for hallucinated legal provisions or invented case citations; low-confidence answers flagged for expert review
- **Demo Data:** If test/demo data is needed during development, clearly labeled as DEMO DATA and completely separated from real research data; demo data must never appear in research statistics or exports

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React (Vite) + Node.js/Express + Prisma | Lightweight, fast prototyping, type-safe schema migrations, clean modular separation | — Pending |
| Google Gemini API for Evaluation Agent | High context reasoning, strong structured JSON output, configurable system instructions | — Pending |
| SQLite over PostgreSQL | Local deployment only — simpler setup, no separate DB server, sufficient for research scale | — Pending |
| Double-blind expert evaluation (iterations 1–3) | Eliminates AI-influence bias; experts score from own legal knowledge + reference answer only | — Pending |
| Structured JSON schema for AI evaluations | Guarantees consistent criterion scoring, missing element identification, automated delta analysis | — Pending |
| Same questions across all 3 iterations | Isolates agent version as the only variable — valid research comparison | — Pending |
| Same student cohort across all iterations | Controls for participant variability in research design | — Pending |
| Expert sees reference answer during evaluation | Ensures expert evaluation is anchored to approved legal standards, not personal interpretation alone | — Pending |
| Distributed expert assignment (1–2 per answer) | Practical for expert workload; sufficient for research comparison without requiring every expert to grade every answer | — Pending |

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
*Last updated: 2026-08-15 after initialization*
