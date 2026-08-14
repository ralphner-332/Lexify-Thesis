<!-- GSD:project-start source:PROJECT.md -->
## Project

### YAWA — Yet Another Written-Answer AI Agent

A locally-deployed academic research prototype that evaluates written essay answers from FSUU College of Law students in Criminal Law I. The system compares structured AI-generated evaluations against independent expert legal assessments across three iterative agent versions (V1 → V2 → V3), then conducts a final evaluation measuring AI assessment capability, expert agreement, and student user acceptance.

*Disclaimer: This is a research prototype — not a replacement for a law professor, lawyer, formal examination, or official institutional grading system.*

**Core Value:** Enable rigorous, reproducible academic research comparing structured AI evaluations against expert legal assessments, iteratively refining evaluation quality across three agent versions while preserving every piece of historical research data as immutable evidence.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite
- **AI Integration:** Google Gemini API with Zod schema validation
- **Frontend:** React, Vite, Tailwind CSS, Lucide React, Recharts
- **Export & Statistics:** papaparse/json2csv, jspdf, simple-statistics
- **Authentication:** JWT, bcryptjs (Role-based: Student, Expert Evaluator, Admin/Researcher)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- Use TypeScript with strict typing across backend models, API routes, and frontend components.
- Ground all legal evaluations in statutory elements and model reference answers.
- Maintain append-only immutability for all research evaluation records and version snapshots.
- Keep test/demo records strictly separated using `isDemo: true`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

- **Frontend:** React (Vite SPA) hosting Student Assessment Portal, Double-Blind Expert Portal, and Researcher Admin Dashboard.
- **Backend:** Node.js/Express REST API orchestrating auth, assessment submissions, Gemini evaluation calls, comparison metrics, and research exports.
- **Database:** SQLite managed via Prisma ORM for zero-config local research persistence.
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
