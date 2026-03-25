# Carpetify

## What This Is

Carpetify is an internal web tool for Lemon Studios that takes a feature film screenplay (PDF) and project metadata, then systematically generates a complete EFICINE Article 189 submission dossier ("carpeta") — the ~30-document package required by IMCINE for the Mexican film tax incentive program. The user uploads a screenplay, enters project data through a guided wizard, and the app generates documents using AI, validates them against EFICINE rules, and exports a ready-to-upload package.

Target user: A single producer at Lemon Studios submitting up to 3 projects per EFICINE registration period via the SHCP portal (estimulosfiscales.hacienda.gob.mx).

## Core Value

Given a screenplay and project data, produce a complete, internally-consistent, EFICINE-compliant carpeta where every amount, title, date, and fee matches across all ~30 documents — eliminating the cross-document inconsistencies that get applications rejected.

## Requirements

### Validated

- [x] Screenplay PDF parsing — extract scene count, locations, characters, INT/EXT/DAY/NIGHT breakdown *(Validated in Phase 02: screenplay-processing)*
- [x] AI screenplay analysis via Anthropic Claude API using Spanish prompts from `prompts/` folder *(Validated in Phase 02: screenplay-processing)*
- [x] AI document generation pipeline: 4 sequential passes (Line Producer → Finance Advisor → Legal → Combined) *(Validated in Phase 03: ai-doc-generation)*
- [x] ~20 AI-generated documents across Sections A, C, and E of the carpeta *(Validated in Phase 03: ai-doc-generation — 21 documents)*
- [x] Budget generation using IMCINE standard account structure (accounts 100–1200) with Mexican market crew rates *(Validated in Phase 03: ai-doc-generation)*
- [x] Contract template generation (cesión de derechos, producer/director contracts) with fee amounts matching budget *(Validated in Phase 03: ai-doc-generation)*
- [x] One-click regeneration — changing data regenerates affected documents *(Validated in Phase 03: ai-doc-generation)*
- [x] 13 cross-module validation rules (financial reconciliation, title consistency, fee matching, date compliance, ERPI eligibility, etc.) *(Validated in Phase 04: validation-dashboard — 14 rules: 10 blockers + 4 warnings)*
- [x] Traffic light dashboard showing validation status per rule *(Validated in Phase 04: validation-dashboard)*
- [x] Real-time validation as data is entered — flag blockers vs warnings *(Validated in Phase 04: validation-dashboard — tiered D-11 timing)*
- [x] Score estimate against EFICINE rubric (100 points + 5 bonus, 90/100 minimum to pass) *(Validated in Phase 04: validation-dashboard — viability + 5 AI personas)*
- [x] Financial compliance checks: ERPI ≥ 20%, EFICINE ≤ 80% and ≤ $25M MXN, screenwriter ≥ 3%, in-kind ≤ 10% *(Validated in Phase 04: validation-dashboard — VALD-05)*
- [x] PDF generation from stored documents with IMCINE file naming convention (max 15 chars, no accents/ñ/symbols) *(Validated in Phase 05: export-manager — 15 PDF templates, fileNaming registry)*
- [x] ZIP export of complete carpeta with organized folder structure (A_PROPUESTA/, B_PERSONAL/, C_ERPI/, D_COTIZ/, E_FINANZAS/) *(Validated in Phase 05: export-manager — 7 folders + _INTERNO)*
- [x] Language check utility detecting anglicisms and formatting violations in AI-generated docs *(Validated in Phase 05: export-manager — LANG-05)*

### Active

- [ ] Multi-project support — manage up to 3 projects simultaneously per EFICINE period
- [ ] Registration period selection per project (Period 1: Jan 30 – Feb 13, Period 2: Jul 1 – Jul 15) driving date validation
- [ ] 5-screen intake wizard: project setup, screenplay upload, creative team, financial structure, document upload
- [x] ~~Screenplay PDF parsing~~ → moved to Validated
- [x] ~~AI screenplay analysis~~ → moved to Validated
- [x] ~~AI document generation pipeline~~ → moved to Validated
- [x] ~~~20 AI-generated documents~~ → moved to Validated
- [ ] User-uploaded document management for items the app cannot generate (acta constitutiva, INDAUTOR certs, bank statements, IDs, signed contracts, etc.)
- [x] ~~13 cross-module validation rules~~ → moved to Validated
- [x] ~~Traffic light dashboard~~ → moved to Validated
- [x] ~~Real-time validation~~ → moved to Validated
- [x] ~~PDF generation with IMCINE file naming~~ → moved to Validated
- [x] ~~ZIP export with organized folder structure~~ → moved to Validated
- [x] ~~Score estimate against EFICINE rubric~~ → moved to Validated
- [ ] Entire UI in Mexican Spanish — no English visible to user, ever
- [ ] All generated documents in Mexican Spanish using IMCINE/EFICINE terminology without translation
- [ ] Amounts formatted as $X,XXX,XXX MXN throughout; dates in Spanish format
- [x] ~~Budget generation~~ → moved to Validated
- [x] ~~Financial compliance checks~~ → moved to Validated
- [x] ~~Contract template generation~~ → moved to Validated
- [x] ~~One-click regeneration~~ → moved to Validated
- [ ] Completeness checklist showing what's done and what the user still needs to provide

### Out of Scope

- Authentication / user accounts — internal tool, no login needed (v1)
- Multi-user collaboration — single user fills everything (v1)
- SaaS features (billing, onboarding, user isolation) — internal tool for Lemon Studios
- Mobile app — desktop web only
- Document translation services — all docs are in Spanish
- Direct SHCP portal integration — export ZIP, user uploads manually
- Distributor/sales agent workflow — producer-side only
- EFICINE postproducción (different program, different rules)

## Context

- **Legal basis:** Artículo 189 LISR, Reglas Generales DOF 12-enero-2024 (modificadas 23-dic-2025), Lineamientos EFICINE Producción enero 2026
- **Stack decision:** React + Tailwind + shadcn/ui frontend, Firebase (Firestore, Storage, Functions) backend, Anthropic Claude API for AI generation
- **No auth:** Firebase is used as a backend-as-a-service for data persistence and cloud functions, not for user management
- **Registration periods 2026:** Period 1 (Jan 30 – Feb 13), Period 2 (Jul 1 – Jul 15)
- **Scoring:** Minimum 90/100 to pass; average winning score (2025 Period 1) was 94.63/100
- **Existing assets:** Complete schemas (6 JSON files), 11 Spanish AI prompts, scoring rubric, 13 validation rules — all pre-built in the repo
- **Key risk:** Cross-document inconsistency is the #1 rejection reason. The validation engine is the most critical component after document generation.

## Constraints

- **Language**: Entire UI and all generated documents must be in Mexican Spanish. Protected EFICINE/IMCINE terminology is never translated. See `directives/politica_idioma.md`.
- **Tech stack**: React + Tailwind + shadcn/ui, Firebase, Anthropic Claude API — already decided, not negotiable.
- **EFICINE rules**: All financial calculations, document requirements, and validation rules must match the 2026 Lineamientos exactly. This is a legal compliance tool.
- **File naming**: Output files must follow IMCINE convention — max 15 characters, no accents/ñ/commas/&/symbols.
- **File size**: All PDFs must be ≤ 40 MB per the SHCP upload system.
- **AI prompts**: Runtime prompts are pre-written in `prompts/` folder in Spanish. Use them as-is with `{{variable}}` substitution — do not rewrite.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No authentication for v1 | Internal tool for one user at Lemon Studios — auth adds complexity without value | — Pending |
| Firebase as backend | BaaS reduces backend work; Firestore handles document-heavy data model well | — Pending |
| Single-user, multi-project | Lemon Studios submits up to 3 projects per period; one producer manages all | — Pending |
| Registration period per project | Drives 3-month document expiration validation; each project targets a specific period | — Pending |
| Spanish-first UI (no i18n) | Internal tool for Mexican market; i18n abstraction adds overhead with no benefit | — Pending |
| Pre-written AI prompts | Domain expertise baked into prompts; prevents drift during development | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after Phase 08 completion — score estimation accuracy fix. Role name matching corrected, 7 scoring signals populated, Cloud Function reads content from Firestore, ProjectCard shows dynamic completion percentage.*
