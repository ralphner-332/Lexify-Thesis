# Stack Research

**Domain:** Academic Legal Essay Evaluation System & Multi-Version AI Research Prototype
**Researched:** 2026-08-15
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js / Express | 20.x LTS / Express 4.19+ | Backend REST API & Orchestration | Lightweight, stable, excellent async handling for LLM API calls and local SQLite transactions |
| TypeScript | 5.4+ | Type Safety | Eliminates runtime schema mismatch across AI structured outputs, database models, and API responses |
| React + Vite | React 18.3+ / Vite 5.x | Frontend SPA | Fast developer experience, instant HMR, clean component architecture for multi-portal workflows |
| Tailwind CSS + Lucide Icons | 3.4+ / Lucide React | Styling & UI System | Clean, modern, responsive interface for dense legal text comparison, side-by-side review, and student portals |
| Prisma ORM + SQLite | Prisma 5.15+ / SQLite3 | Database & Persistence | Single-file zero-config database ideal for local researcher deployment; Prisma ensures strict schema typing and relational integrity |
| @google/genai or @google/generative-ai | 0.21+ | AI Evaluation Engine | Official Google SDK with native structured JSON schema enforcement (`responseMimeType: "application/json"`) and system instructions |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.23+ | Runtime Validation | Validating structured JSON outputs from Gemini API and API payloads |
| json2csv / papaparse | 5.0+ | Data Export (CSV) | Exporting immutable evaluation records and research metrics |
| jspdf / html2canvas | 2.5+ | PDF Report Generation | Exporting structured comparison reports and evaluation summaries |
| jsonwebtoken + bcryptjs | 9.0+ / 2.4+ | Authentication & RBAC | Securing Student, Expert Evaluator, and Researcher roles with signed session tokens |
| recharts | 2.12+ | Analytics & Visualizations | Plotting score distributions, inter-rater reliability deltas, and Likert scale usability charts |
| simple-statistics | 7.8+ | Statistical Computations | Computing weighted mean, standard deviation, and Cohen's Kappa / agreement rates for research metrics |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ts-node-dev / nodemon | Backend Hot Reload | Fast local backend development |
| Prisma Studio | Database GUI | Inspecting local SQLite database records during research audits |
| Vitest / Jest | Unit & Integration Testing | Testing scoring rubric calculations and delta computation logic |

## Installation

```bash
# Backend dependencies
npm install express cors dotenv @google/generative-ai zod jsonwebtoken bcryptjs prisma @prisma/client simple-statistics json2csv

# Backend dev dependencies
npm install -D typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs ts-node-dev vitest

# Frontend dependencies (in frontend/)
npm install react react-dom react-router-dom lucide-react clsx tailwind-merge recharts papaparse jspdf html2canvas

# Frontend dev dependencies
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss postcss autoprefixer
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SQLite + Prisma | PostgreSQL | If multi-user remote concurrent access exceeds 100+ simultaneous writes (unnecessary for local research cohort) |
| Express REST API | Next.js Fullstack | If server-side rendering is required; Express keeps backend AI orchestrator and API cleanly separated |
| Google Gemini API | OpenAI GPT-4o / Claude 3.5 | If institutional provider changes; Gemini 2.0 Flash / 1.5 Pro provides large context and strong legal reasoning |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Dynamic Prompt Injection at Runtime | Compromises research repeatability across versions | Explicit versioned prompt snapshots (V1, V2, V3) in configuration |
| Unstructured Text Responses from LLM | High risk of parsing failures and unquantified criteria | Strict Zod + Gemini `responseSchema` for numerical breakdown |
| Client-Side Gemini API Key Usage | Exposes API credentials and bypasses audit logging | Backend-isolated AI execution pipeline |

---
*Stack research for: YAWA (Yet Another Written-Answer AI Agent)*
*Researched: 2026-08-15*
