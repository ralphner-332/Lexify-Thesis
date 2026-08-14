# Features Research

**Domain:** Academic Legal Essay Evaluation System & Research Prototype
**Researched:** 2026-08-15
**Confidence:** HIGH

## Feature Analysis

### Table Stakes (Must-Have Core)

These capabilities are mandatory to conduct the academic research study on Criminal Law I essay evaluations.

| Feature | Complexity | Why Essential |
|---------|------------|---------------|
| Role-Based Access Control (Student, Expert, Admin) | Medium | Separates student submission, double-blind expert grading, and admin management |
| Academic & Legal Research Disclaimers | Low | Legal/ethical requirement stating system is a research prototype, not official bar/course grading |
| Question & Legal Reference Answer Repository | Medium | Manages Criminal Law I questions, model answers, legal elements, and statutory citations |
| Configurable Scoring Rubric Engine | Medium | Multi-criteria scoring (Legal Accuracy, Legal Elements, Reasoning, Application, Terminology) |
| Gemini AI Evaluation Service with Structured Schema | High | Generates numerical criteria scores, IRAC legal rationale, missing elements, and confidence rating |
| Student Assessment Portal | Medium | Single-session assessment interface for answering essay questions and reviewing returned feedback |
| Double-Blind Expert Evaluation Portal | High | Allows legal experts to score student answers against reference answers WITHOUT seeing AI scores (V1-V3) |
| Distributed Expert Assignment Workflow | Medium | Allocates student answers across expert evaluators (1-2 experts per answer) |
| AI vs Expert Side-by-Side Comparison Module | High | Visual comparison matrix showing AI score vs expert score, score delta, and gap categorization |
| Iterative Agent Versioning (V1 → V2 → V3) | High | Allows researcher to capture prompt refinements, compare performance, and preserve version snapshots |
| Immutable Research Data & Audit Trail | Medium | Ensures historical evaluation data, deltas, and scores cannot be overwritten or altered |
| Export & Research Reporting (CSV/JSON/PDF) | Medium | Enables researchers to export complete evaluation datasets for statistical analysis and thesis documentation |

### Differentiators (Research Enhancements)

These features provide high academic value and deeper diagnostic insights.

| Feature | Complexity | Value Proposition |
|---------|------------|-------------------|
| Post-V3 Final Evaluation Module | High | Experts review AI scores and reasoning, providing formal agreement ratings and qualitative feedback |
| Student Usability Questionnaire (SUS/Likert) | Medium | Computes weighted mean and standard deviation for student user acceptance assessment |
| Expert Assessment Capability Questionnaire | Medium | Measures expert perception of AI accuracy, fairness, and utility with statistical summaries |
| Inter-Rater Reliability & Delta Analytics | High | Real-time calculation of score variances, agreement rates, and disagreement categorizations |
| Low-Confidence Fallback Flagging | Medium | Automatically flags answers where AI confidence is low for mandatory expert manual review |

### Anti-Features (Deliberately Excluded)

| Feature | Reason for Exclusion |
|---------|----------------------|
| Generative Cheating / Answer Rewriting | Violates academic integrity; YAWA is an evaluator/diagnostic system, not a ghostwriter |
| Runtime Prompt Auto-Tuning | Destroys experimental control; version updates must be deliberate and researcher-controlled |
| Free-Form Legal Chatbot | Distracts from controlled Criminal Law I rubric assessment |
| Cloud Multi-Tenant SaaS | Unnecessary for localized university research study |

---
*Features research for: YAWA (Yet Another Written-Answer AI Agent)*
*Researched: 2026-08-15*
