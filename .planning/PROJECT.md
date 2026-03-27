# Carpetify

## What This Is

Carpetify is an internal web tool for Lemon Studios that takes a feature film screenplay (PDF) and project metadata, then systematically generates a complete EFICINE Article 189 submission dossier ("carpeta") — the ~30-document package required by IMCINE for the Mexican film tax incentive program. The user uploads a screenplay, enters project data through a guided wizard, and the app generates 21 documents using AI, validates them against 17 EFICINE compliance rules, and exports a ready-to-upload ZIP package with IMCINE file naming.

Target users: A production team at Lemon Studios (producer, line producer, lawyer, director) collaborating on up to 3 projects per EFICINE registration period via the SHCP portal (estimulosfiscales.hacienda.gob.mx).

## Core Value

Given a screenplay and project data, produce a complete, internally-consistent, EFICINE-compliant carpeta where every amount, title, date, and fee matches across all ~30 documents — eliminating the cross-document inconsistencies that get applications rejected.

## Current State

**Version:** v1.0 shipped 2026-03-25
**Codebase:** ~30K LOC TypeScript (25K frontend + 5K Cloud Functions)
**Stack:** React 19 + Vite 8 + Tailwind v4 + shadcn/ui, Firebase (Firestore, Storage, Functions v2), Anthropic Claude API
**Tests:** 313 unit tests passing, 0 TypeScript errors

## Requirements

### Validated

- [x] 5-screen Spanish intake wizard with multi-project support, auto-save, compliance panel *(v1.0 — Phases 1, 6)*
- [x] Screenplay PDF parsing and Claude-powered analysis via Cloud Functions *(v1.0 — Phase 2)*
- [x] 4-pass AI document generation pipeline: Line Producer → Finance Advisor → Legal → Combined *(v1.0 — Phase 3)*
- [x] 21 AI-generated documents with deterministic financial injection, staleness tracking, one-click regeneration *(v1.0 — Phase 3)*
- [x] Budget generation using IMCINE standard account structure (100–1200) with Mexican market rates *(v1.0 — Phase 3)*
- [x] Contract templates (cesión de derechos, producer/director contracts) with fee amounts matching budget *(v1.0 — Phase 3)*
- [x] 17 validation rules (10 blockers + 4 warnings + 3 accuracy) with real-time traffic light dashboard *(v1.0 — Phases 4, 6, 7, 8, 9)*
- [x] Score estimation: viability (38 pts deterministic) + artistic (62 pts via 5 AI personas) + bonus (5 pts) *(v1.0 — Phases 4, 8)*
- [x] Financial compliance: ERPI ≥ 20%, EFICINE ≤ 80%/≤ $25M, screenwriter ≥ 3%, in-kind ≤ 10%, gestor cap *(v1.0 — Phases 4, 6)*
- [x] PDF generation with IMCINE file naming (≤15 chars, ASCII) + ZIP export with EFICINE folder structure *(v1.0 — Phase 5)*
- [x] Language check: anglicism detection, format consistency, title identity across all documents *(v1.0 — Phase 5)*
- [x] Document completeness: VALD-06 correctly identifies uploaded documents with aligned namespace *(v1.0 — Phase 7)*
- [x] File format pre-validation: VALD-09 checks filenames/sizes before export *(v1.0 — Phase 9)*
- [x] Hyperlink accessibility: VALD-12 extracts team filmography URLs for verification *(v1.0 — Phase 9)*
- [x] Entire UI in Mexican Spanish with IMCINE/EFICINE terminology never translated *(v1.0 — all phases)*
- [x] Amounts formatted as $X,XXX,XXX MXN; dates in Spanish format *(v1.0 — Phases 1, 6)*

## Current Milestone: v2.0 Multi-User & Extended Modalities

**Goal:** Transform Carpetify from a single-user tool into a collaborative platform with multi-user auth, role-based access, full co-production engine, AI pre-submission review, and support for EFICINE Postproducción and resubmission modalities.

**Target features:**
- Firebase Auth with Google login + role-based collaboration (producer, line producer, lawyer)
- Full international co-production rules engine with multi-currency support
- AI-powered pre-submission review simulating IMCINE evaluator perspective
- Document version comparison and diff view
- EFICINE Postproducción modality (different rubric, different FORMATO structures)
- Previously-authorized project resubmission modality

### Active

- [ ] Firebase Auth with Google login for Lemon Studios team
- [ ] Section-based collaboration (multiple contributors per project)
- [ ] Role-based access control (producer, line producer, lawyer, director)
- [ ] Full co-production rules engine (territorial budget splits, exchange rates, IMCINE recognition)
- [ ] Multi-currency support with exchange rate tracking
- [ ] AI pre-submission review simulating evaluator perspective
- [ ] Document version comparison and diff view
- [ ] EFICINE Postproducción modality (different documents, 65-pt rubric, different FORMATOs)
- [ ] Previously-authorized project resubmission modality

### Out of Scope

| Feature | Reason | Still valid? |
|---------|--------|-------------|
| ~~Authentication / user accounts~~ | ~~Internal tool for single user~~ | Moved to Active for v2.0 |
| Multi-user collaboration | Single user fills everything | ✓ Valid |
| SaaS features (billing, onboarding) | Internal tool, not a product | ✓ Valid |
| Mobile app | 30-document dossier requires desktop | ✓ Valid |
| Document translation | All docs are in Spanish | ✓ Valid |
| Direct SHCP portal integration | No API; scraping tax portal is legally risky | ✓ Valid |
| ~~EFICINE postproducción~~ | ~~Different program, different rules~~ | Moved to Active for v2.0 |

## Context

- **Legal basis:** Artículo 189 LISR, Reglas Generales DOF 12-enero-2024 (modificadas 23-dic-2025), Lineamientos EFICINE Producción enero 2026
- **Stack:** React 19 + Vite 8 + Tailwind v4 + shadcn/ui frontend, Firebase (Firestore, Storage, Functions v2) backend, Anthropic Claude API (claude-haiku-4-5) for AI generation
- **Auth:** Firebase Auth with Google login, role-based collaboration (v2.0 — Phases 10-13)
- **Registration periods 2026:** Period 1 (Jan 30 – Feb 13), Period 2 (Jul 1 – Jul 15)
- **Scoring:** Minimum 90/100 to pass; average winning score (2025 Period 1) was 94.63/100
- **Key risk (mitigated):** Cross-document inconsistency was the #1 rejection reason. The 17-rule validation engine with real-time traffic lights addresses this.

## Constraints

- **Language**: Entire UI and all generated documents in Mexican Spanish. Protected EFICINE/IMCINE terminology never translated. See `directives/politica_idioma.md`.
- **Tech stack**: React + Tailwind + shadcn/ui, Firebase, Anthropic Claude API — decided, not negotiable.
- **EFICINE rules**: All financial calculations, document requirements, and validation rules match 2026 Lineamientos exactly.
- **File naming**: IMCINE convention — max 15 characters, no accents/ñ/commas/&/symbols.
- **File size**: All PDFs ≤ 40 MB per SHCP upload system.
- **AI prompts**: Pre-written in `prompts/` folder in Spanish with `{{variable}}` substitution.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No authentication for v1 | Internal tool for one user — auth adds complexity without value | ✓ Good — simplified entire stack |
| Firebase as backend | BaaS reduces backend work; Firestore handles document-heavy data model | ✓ Good — real-time subscriptions power validation |
| Single-user, multi-project | Lemon Studios submits up to 3 projects per period | ✓ Good — isolated data per project works well |
| Registration period per project | Drives 3-month document expiration validation | ✓ Good — VALD-04/17 depend on this |
| Spanish-first UI (no i18n) | Internal tool for Mexican market; i18n adds overhead | ✓ Good — es.ts locale file is clean and maintainable |
| Pre-written AI prompts | Domain expertise baked into prompts; prevents drift | ✓ Good — Handlebars injection works reliably |
| Tiered validation (instant/medium/all) | D-11: instant rules on every keystroke, expensive rules on doc change | ✓ Good — responsive UI without lag |
| Budget as structured data (not PDF) | Enables deterministic fee injection + cross-document reconciliation | ✓ Good — VALD-01/03 depend on this |
| 4-pass generation pipeline | Line Producer → Finance → Legal → Combined ensures data flows correctly | ✓ Good — each pass consumes prior pass output |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 — Phase 15 complete: AI pre-submission review with 5-persona critique, 2-pass architecture, and checklist summary (AIGEN-V2-01, 02). This is the LAST phase of v2.0 milestone.*
