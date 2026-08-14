# Phase 1: Foundation, RBAC, Question/Rubric Management & Agent Component Snapshots - Context

**Gathered:** 2026-08-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the fullstack architecture (Node.js/Express, TypeScript, React/Vite, Tailwind CSS, Prisma/SQLite) with secure 3-role RBAC (Student, Expert, Admin/Researcher), prominent academic & legal research disclaimers, predetermined Criminal Law I question & model reference answer management (configurable question count), configurable scoring rubrics, demo data isolation (`isDemo: true`), and multi-version Agent component snapshot architecture (V1, V2, V3).

AI evaluation execution, student exam-taking sessions, double-blind grading, and post-V3 surveys belong in subsequent phases.

</domain>

<decisions>
## Implementation Decisions

### User Authentication & Default Role Setup
- **D-01:** Provide seeded local default accounts (`student@yawa.local`, `expert@yawa.local`, `admin@yawa.local`) with a one-click quick role switcher on the login interface for seamless local testing and research demonstrations, alongside standard email/password authentication and server-side RBAC middleware.
- **D-02:** Display a persistent academic & research disclaimer banner across the top header of all views, plus a mandatory first-time login modal acknowledgment reminding users that YAWA is an academic research prototype with no official grading or legal authority.

### Predetermined Question & Reference Answer Authoring
- **D-03:** Multi-Field Structured Authoring: Questions are stored and authored with dedicated fields for Scenario Text, Model Reference Answer, Key Statutory Elements (tag/list format), Relevant Statutory Provisions (citations), and Acceptable Keyword/Concept Variations.
- **D-04:** Active/Inactive Status & Reordering: Researcher can curate, toggle active status, and reorder predetermined Criminal Law I questions freely without hardcoded question counts.

### Rubric Builder & Criteria Presets
- **D-05:** Preloaded Customizable Template: Initialize the rubric builder with standard legal criteria presets (Legal Accuracy, Legal Elements, Reasoning, Application, Terminology) while allowing the researcher full flexibility to add, edit, re-weight, or delete criteria.
- **D-06:** Percentage / Weighted Points Auto-Validation: Criteria weights calculate against 100% (or target total points) with real-time live visual sum validation.

### Agent Component Snapshots & Version Storage
- **D-07:** Tabbed Component Management Console: Researcher Admin interface provides dedicated visual tabs for System Instructions, AI Skills/Guidelines, Active Rubric Snapshot, Evaluation Patterns, and Model Parameters, with an explicit "Publish & Snapshot Version" action.
- **D-08:** Immutable Version History with Diffs: Database enforces append-only snapshots (V1, V2, V3) so past versions are never overwritten; Admin UI includes a side-by-side component diff viewer.

### the agent's Discretion
- Exact layout styling, color tokens, and icon choices using Tailwind CSS and Lucide React.
- JWT token expiration and password hashing rounds via bcryptjs.
- Local SQLite database file naming and Prisma schema structure.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Research Contract
- `.planning/PROJECT.md` — Core research value, iterative refinement framework, and unhardcoded parameters
- `.planning/REQUIREMENTS.md` — Active v1 requirements (AUTH-01, CORE-01, CORE-02, CORE-03, QUES-01, RUBR-01, VERS-01, VERS-02)
- `.planning/ROADMAP.md` — Phase 1 scope and success criteria
- `.planning/research/ARCHITECTURE.md` — System architecture and component boundaries
- `.planning/research/STACK.md` — Recommended dependencies and technology stack

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield setup: Node.js/Express backend and React/Vite frontend will be established in Plan 01-01 and Plan 01-02.

### Established Patterns
- Clean separation between frontend, backend API, database persistence, and AI orchestration.
- Append-only immutability for all research entities.
- Separation of demo data with `isDemo: true` flags.

### Integration Points
- Backend REST API routes (`/api/auth`, `/api/questions`, `/api/rubrics`, `/api/agent-versions`).
- Prisma ORM models (`User`, `Question`, `Rubric`, `RubricCriterion`, `AgentVersion`, `AuditLog`).

</code_context>

<deferred>
## Deferred Ideas

- AI Evaluation Engine execution & Zod JSON parsing — Phase 2
- Student assessment taking interface — Phase 2
- Double-blind expert grading & comparison matrix — Phase 3
- Post-V3 final evaluation & usability surveys — Phase 4

</deferred>

---

*Phase: 01-foundation-rbac-questions-rubrics*
*Context gathered: 2026-08-15*
