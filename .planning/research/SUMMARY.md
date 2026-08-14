# Research Summary

**Domain:** Academic Legal Essay Evaluation System & Research Prototype (YAWA)
**Researched:** 2026-08-15
**Confidence:** HIGH

## Executive Summary

YAWA is an academic research platform supporting the empirical study of iterative AI Agent refinement for legal essay evaluation in Criminal Law I (FSUU College of Law).

The system centers on a 3-cycle iterative research workflow (V1 → V2 → V3) with double-blind expert evaluation, structured gap analysis and refinement framework, post-V3 final expert evaluation, and configurable usability surveys:
1. **Iterative Refinement Architecture:** Version 1 → Iteration 1 → Comparison with independent Expert scores/bases → Structured gap analysis & expert reasoning → Version 2 → Iteration 2 → Comparison & refinement → Version 3 → Iteration 3 → Final Evaluation.
2. **Preservation & Immutability:** Version 1 is never overwritten when Version 2 is created; Version 2 is never overwritten when Version 3 is created. Every evaluation records its producing Agent Version and iteration.
3. **Semantic AI Evaluation:** AI evaluates legal meaning, concepts, completeness, reasoning, and acceptable alternative expressions according to approved rubrics (not keyword matching, and zero invented authorities).
4. **Configurable Framework:** In accordance with research requirements, unresolved items (participant counts, exact predetermined Criminal Law I question counts/topics, rubrics, questionnaires, AI models, statistical methodology, research titles) remain configurable placeholders until formal instructor/adviser sign-off.
5. **Research Integrity:** Strictly zero data fabrication; demo records are isolated via `isDemo: true` and excluded from research metrics.

## Key Findings

### Stack Choices
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite
- **AI Integration:** Google Gemini API (or configurable LLM) with Zod structured output validation
- **Frontend:** React, Vite, Tailwind CSS, Lucide React, Recharts
- **Analytics & Export:** simple-statistics, papaparse/json2csv, jspdf, bcryptjs, jsonwebtoken

### Core Workflow Pillars
1. **Foundation & Snapshots:** RBAC (Student, Expert, Researcher), Disclaimers, Predetermined Question & Rubric Builder, Version Snapshot Manager.
2. **AI & Student Portal:** Single-session exam runner, semantic structured evaluation, student feedback.
3. **Double-Blind & Comparison:** Blind expert grading, side-by-side comparison, structured refinement framework into V2/V3.
4. **Final Evaluation & Analytics:** Post-V3 expert agreement review, configurable student/expert usability surveys, descriptive statistics, CSV/JSON/PDF raw data & report reporting.

---
*Research summary complete for: YAWA (Yet Another Written-Answer AI Agent)*
