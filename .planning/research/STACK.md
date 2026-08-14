# Stack Research

**Domain:** Academic Legal Essay Evaluation System & Research Prototype (YAWA)
**Researched:** 2026-08-15
**Confidence:** HIGH

## Recommended Stack

The application is designed strictly around the academic research workflow, maintaining modular separation across all tiers.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js / Express | 20.x LTS / Express 4.19+ | Backend REST API & Service Layer | Lightweight, reliable async orchestration for AI evaluation pipeline, RBAC enforcement, and local transactions |
| TypeScript | 5.4+ | Type Safety | Enforces strict type consistency across database entities, API payloads, and AI structured outputs |
| React + Vite | React 18.3+ / Vite 5.x | Frontend SPA | High responsiveness for multi-portal workflows (Student, Expert, Researcher) with instant local HMR |
| Tailwind CSS + Lucide Icons | 3.4+ / Lucide React | Styling & UI Design System | Clean, accessible layouts for dense legal text analysis, side-by-side comparison matrices, and survey forms |
| Prisma ORM + SQLite | Prisma 5.15+ / SQLite3 | Database & Persistence | Single-file zero-config database ideal for local researcher deployment; supports append-only relational integrity and transactional writes |
| AI Service Integration (e.g., Google Gemini SDK) | @google/generative-ai 0.21+ / Configurable | AI Evaluation Service | Configurable LLM integration supporting structured JSON output schemas, system instructions, and confidence scoring |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.23+ | Schema Validation | Validating structured JSON outputs from AI evaluation engine and API requests |
| json2csv / papaparse | 5.0+ | Data Export (CSV) | Exporting full evaluation records, deltas, and research datasets |
| jspdf / html2canvas | 2.5+ | PDF Report Generation | Generating formatted research reports, audit summaries, and comparison sheets |
| jsonwebtoken + bcryptjs | 9.0+ / 2.4+ | Authentication & RBAC | Securing Student, Expert Evaluator, and Researcher endpoints with signed tokens |
| recharts | 2.12+ | Analytics & Visualizations | Rendering score delta distributions, agreement trends, and survey response charts |
| simple-statistics | 7.8+ | Statistical Calculations | Computing descriptive statistics (weighted mean, standard deviation, deltas) |

### Key Principles

1. **Environment-driven Secrets:** All API keys and secrets loaded via `.env` on the backend only; never hardcoded or exposed to the client.
2. **Modular AI Service:** The AI evaluation layer is decoupled from business logic, allowing flexible configuration of model parameters without breaking core research flows.
3. **Immutability & Demo Isolation:** Database schema strictly distinguishes demo data via `isDemo: true` and preserves historical version snapshots permanently.

---
*Stack research for: YAWA (Yet Another Written-Answer AI Agent)*
