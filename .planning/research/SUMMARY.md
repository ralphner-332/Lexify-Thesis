# Research Summary

**Domain:** Academic Legal Essay Evaluation System & Research Prototype (YAWA)
**Researched:** 2026-08-15
**Confidence:** HIGH

## Executive Summary

The YAWA system is an academic research platform designed to evaluate written Criminal Law I essay answers from law students, comparing structured Google Gemini AI evaluations against independent double-blind legal expert assessments across three iterative versions (V1 → V2 → V3), followed by a post-V3 final evaluation and usability assessment.

To guarantee research integrity, reproducibility, and security:
- **Stack:** Node.js/Express + TypeScript backend, React/Vite + Tailwind CSS frontend, SQLite + Prisma ORM for local single-file zero-config persistence, Google Gemini API with native JSON schema enforcement for AI evaluations.
- **Architecture:** 4-phase modular separation ensuring clean boundaries between Student, Expert (blind), and Researcher workflows, with strictly immutable historical evaluation data and demo-data isolation.
- **Core Insights:** AI must be anchored to reference answers and statutory elements to prevent hallucination; blind evaluation API endpoints must omit AI evaluation data until final evaluation; and prompt iterations must be captured as versioned snapshots.

## Key Findings

### Recommended Stack
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite
- **AI Integration:** Google Gemini API (`gemini-2.0-flash` / `gemini-1.5-pro`) with Zod schema validation
- **Frontend:** React, Vite, Tailwind CSS, Lucide React, Recharts
- **Utilities:** simple-statistics, papaparse/json2csv, jspdf, bcryptjs, jsonwebtoken

### Table Stakes Features
- Role-Based Access Control (Student, Expert Evaluator, Researcher/Admin)
- Prominent Academic Research & Legal Disclaimers across all portals
- Question & Reference Answer Management with legal elements and statutory citations
- Configurable Scoring Rubrics (Legal Accuracy, Legal Elements, Reasoning, Application, Terminology)
- Gemini AI Evaluation Engine with numerical criteria scoring, IRAC rationale, and confidence scores
- Student Assessment Portal for single-session essay test-taking and feedback review
- Double-Blind Expert Evaluation Portal with distributed answer assignment
- AI vs Expert Side-by-Side Comparison Matrix with delta calculation and gap tagging
- Agent Iteration Management (V1 → V2 → V3) with immutable version snapshots
- Post-V3 Final Evaluation Module (expert agreement scoring & feedback)
- Usability & Capability Questionnaires (SUS / Likert) with weighted mean and standard deviation
- Research Analytics Dashboard & Multi-format Data Export (CSV/JSON/PDF)

### Pitfalls to Avoid
1. **Hallucination of Legal Provisions:** Ground prompts strictly in approved reference answers and elements.
2. **Blind Evaluation Leakage:** Isolate API response payloads so experts cannot access AI scores during V1–V3.
3. **Data Loss Across Iterations:** Ensure append-only immutability for all evaluation and comparison records.
4. **Schema Failures:** Use strict Gemini structured outputs + Zod runtime validation.
5. **Demo Data Contamination:** Separate test data from research data with `isDemo` flags.

---
*Research summary complete for: YAWA (Yet Another Written-Answer AI Agent)*
