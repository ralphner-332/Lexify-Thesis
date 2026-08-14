# Phase 1: Foundation, RBAC, Question/Rubric Management & Agent Component Snapshots - Discussion Log

**Date:** 2026-08-15
**Phase:** 01-foundation-rbac-questions-rubrics

## Areas Discussed & User Selections

### Area 1: User Authentication & Default Role Setup
- **Options presented:**
  1. Seeded Default Accounts + Role Switcher (pre-configured Student, Expert, Admin with one-click test login) + email/password login.
  2. Strict Email/Password Login Only.
- **User selection:** Seeded Default Accounts + Role Switcher.
- **Disclaimer presentation options:**
  1. Persistent Header Banner + First-time Acceptance Modal.
  2. Persistent Header & Footer Banner Only.
- **User selection:** Persistent Header Banner + First-time Acceptance Modal.

### Area 2: Predetermined Question & Reference Answer Authoring
- **Authoring structure options:**
  1. Multi-Field Structured Authoring (Scenario, Model Answer, Key Statutory Elements, Provisions, Keyword Variations).
  2. Single Rich-Text Markdown Editor.
- **User selection:** Multi-Field Structured Authoring.
- **Question management options:**
  1. Active/Inactive Toggle + Question Sets.
  2. Simple Flat List.
- **User selection:** Active/Inactive Toggle + Question Sets.

### Area 3: Rubric Builder & Criteria Presets
- **Initialization options:**
  1. Preloaded Customizable Template (Legal Accuracy, Legal Elements, Reasoning, Application, Terminology) with edit/delete/add capabilities.
  2. Blank Slate Builder.
- **User selection:** Preloaded Customizable Template.
- **Validation options:**
  1. Percentage / Weighted Points with Auto-Validation (100% sum check).
  2. Independent Raw Points per Criterion.
- **User selection:** Percentage / Weighted Points with Auto-Validation.

### Area 4: Agent Component Snapshot Interface & Version Storage
- **Console presentation options:**
  1. Tabbed Component Management Console (System Instructions, Skills, Rubric Snapshot, Model Config) with "Publish & Snapshot Version" action.
  2. Unified Single-Page JSON/YAML Editor.
- **User selection:** Tabbed Component Management Console.
- **History inspection options:**
  1. Immutable Version History with Side-by-Side Diff viewer.
  2. Simple Read-Only Version Archive.
- **User selection:** Immutable Version History with Side-by-Side Diff viewer.

## Summary of Decisions
- All 4 areas resolved with clear implementation decisions captured in `01-CONTEXT.md`.
- No blockers identified.
