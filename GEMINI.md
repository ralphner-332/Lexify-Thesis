<!-- GSD:project-start source:PROJECT.md -->
## Project

### YAWA — Yet Another Written-Answer AI Agent

A locally-deployed academic research prototype supporting an empirical study on developing and iteratively refining an AI Agent that evaluates written essay answers from FSUU College of Law students in Criminal Law I. The system compares structured AI evaluations against independent double-blind expert legal assessments across three iterative agent versions (V1 → V2 → V3), conducting gap analysis using a structured refinement framework, followed by post-V3 final expert evaluation, student usability testing, and comprehensive research data export.

*Disclaimer: This is strictly an academic research prototype — not a replacement for a law professor, lawyer, formal examination, official institutional grading system, or legal advice.*

**Core Value:** Enable rigorous, reproducible academic research comparing structured AI evaluations against expert legal assessments, iteratively refining evaluation quality across three agent versions while preserving every piece of historical research data as immutable evidence.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite
- **AI Integration:** Google Gemini API / Configurable LLM service with Zod schema validation
- **Frontend:** React, Vite, Tailwind CSS, Lucide React, Recharts
- **Export & Statistics:** papaparse/json2csv, jspdf, simple-statistics
- **Authentication:** JWT, bcryptjs (Role-based: Student, Expert Evaluator, Admin/Researcher)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- Use TypeScript with strict typing across backend models, API routes, and frontend components.
- Ground all legal evaluations in statutory elements and model reference answers; evaluate meaning, concepts, completeness, and reasoning (not keyword-only matching).
- Maintain append-only immutability for all research evaluation records, version snapshots, and refinement notes.
- Keep test/demo records strictly separated using `isDemo: true`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

- **Frontend:** React (Vite SPA) hosting Student Assessment Portal, Double-Blind Expert Portal, and Researcher Admin Dashboard.
- **Backend:** Node.js/Express REST API orchestrating auth, assessment submissions, AI evaluation calls, comparison metrics, structured refinement logs, and research exports.
- **Database:** SQLite managed via Prisma ORM for zero-config local research persistence with immutable audit trails.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No custom project skills found. Using standard GSD skills.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
<!-- GSD:profile-end -->
