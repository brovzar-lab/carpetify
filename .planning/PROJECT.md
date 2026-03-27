# Carpetify

## What This Is

Carpetify is an internal collaborative web tool for Lemon Studios that takes a feature film screenplay (PDF) and project metadata, then systematically generates a complete EFICINE Article 189 submission dossier ("carpeta") — the ~30-document package required by IMCINE for the Mexican film tax incentive program. A team of up to 4 roles (producer, line producer, lawyer, director) collaborates in real-time through a guided wizard, and the app generates 21 documents using AI, validates them against 17 EFICINE compliance rules, tracks document versions with side-by-side diffs, runs an AI pre-submission review simulating IMCINE evaluators, and exports a ready-to-upload ZIP package with IMCINE file naming.

Target users: A production team at Lemon Studios (producer, line producer, lawyer, director) collaborating on up to 3 projects per EFICINE registration period via the SHCP portal (estimulosfiscales.hacienda.gob.mx).

## Core Value

Given a screenplay and project data, produce a complete, internally-consistent, EFICINE-compliant carpeta where every amount, title, date, and fee matches across all ~30 documents — eliminating the cross-document inconsistencies that get applications rejected.

## Current State

**Version:** v2.0 shipped 2026-03-27
**Codebase:** ~40K LOC TypeScript (35K frontend + 5K Cloud Functions)
**Stack:** React 19 + Vite 8 + Tailwind v4 + shadcn/ui, Firebase (Firestore, Storage, Functions v2, Auth, RTDB), Anthropic Claude API
**Tests:** Unit tests (vitest), E2E tests (Playwright), 0 TypeScript errors

## Requirements

### Validated

- [x] 5-screen Spanish intake wizard with multi-project support, auto-save, compliance panel *(v1.0 — Phases 1, 6)*
- [x] Screenplay PDF parsing and Claude-powered analysis via Cloud Functions *(v1.0 — Phase 2)*
- [x] 4-pass AI document generation pipeline: Line Producer → Finance Advisor → Legal → Combined *(v1.0 — Phase 3)*
- [x] 21 AI-generated documents with deterministic financial injection, staleness tracking, one-click regeneration *(v1.0 — Phase 3)*
- [x] Budget generation using IMCINE standard account structure (100–1200) with Mexican market rates *(v1.0 — Phase 3)*
- [x] Contract templates (cesion de derechos, producer/director contracts) with fee amounts matching budget *(v1.0 — Phase 3)*
- [x] 17 validation rules (10 blockers + 4 warnings + 3 accuracy) with real-time traffic light dashboard *(v1.0 — Phases 4, 6, 7, 8, 9)*
- [x] Score estimation: viability (38 pts deterministic) + artistic (62 pts via 5 AI personas) + bonus (5 pts) *(v1.0 — Phases 4, 8)*
- [x] Financial compliance: ERPI >= 20%, EFICINE <= 80%/<= $25M, screenwriter >= 3%, in-kind <= 10%, gestor cap *(v1.0 — Phases 4, 6)*
- [x] PDF generation with IMCINE file naming (<=15 chars, ASCII) + ZIP export with EFICINE folder structure *(v1.0 — Phase 5)*
- [x] Language check: anglicism detection, format consistency, title identity across all documents *(v1.0 — Phase 5)*
- [x] Entire UI in Mexican Spanish with IMCINE/EFICINE terminology never translated *(v1.0 — all phases)*
- [x] Firebase Auth with Google sign-in, session persistence, route protection *(v2.0 — Phase 10)*
- [x] 4-role RBAC (productor, line_producer, abogado, director) with per-project permissions *(v2.0 — Phase 11)*
- [x] Real-time collaboration: simultaneous editing, section locking, presence indicators *(v2.0 — Phase 12)*
- [x] Activity log with field-level change attribution and day-grouped feed *(v2.0 — Phase 13)*
- [x] Email-based project invitation flow with accept/decline via deep link *(v2.0 — Phase 13)*
- [x] Document version history with 10-version prune and version attribution *(v2.0 — Phase 14)*
- [x] Side-by-side diff comparison: word-level prose diff + cell-level structured diff *(v2.0 — Phase 14)*
- [x] One-click document revert with copy-forward pattern and soft downstream warning *(v2.0 — Phase 14)*
- [x] AI pre-submission review: 5-persona critique with 2-pass architecture and checklist summary *(v2.0 — Phase 15)*

### Active

- [ ] Full international co-production rules engine (territorial budget splits, exchange rates, IMCINE recognition)
- [ ] Multi-currency support with exchange rate tracking
- [ ] EFICINE Postproduccion modality (different documents, 65-pt rubric, different FORMATOs)
- [ ] Previously-authorized project resubmission modality

### Out of Scope

| Feature | Reason | Still valid? |
|---------|--------|-------------|
| SaaS features (billing, onboarding) | Internal tool, not a product | Yes |
| Mobile app | 30-document dossier requires desktop | Yes |
| Document translation | All docs are in Spanish | Yes |
| Direct SHCP portal integration | No API; scraping tax portal is legally risky | Yes |
| Push notifications / daily digest | Deferred from v2.0 Phase 13 — v2.1 | Yes |
| Activity log export as PDF | Deferred from v2.0 Phase 13 — v2.1 | Yes |

## Context

- **Legal basis:** Articulo 189 LISR, Reglas Generales DOF 12-enero-2024 (modificadas 23-dic-2025), Lineamientos EFICINE Produccion enero 2026
- **Stack:** React 19 + Vite 8 + Tailwind v4 + shadcn/ui frontend, Firebase (Firestore, Storage, Functions v2, Auth, RTDB) backend, Anthropic Claude API (claude-haiku-4-5) for AI generation
- **Auth:** Firebase Auth with Google sign-in, 4-role RBAC, email invitations via Resend
- **Registration periods 2026:** Period 1 (Jan 30 - Feb 13), Period 2 (Jul 1 - Jul 15)
- **Scoring:** Minimum 90/100 to pass; average winning score (2025 Period 1) was 94.63/100
- **Key risk (mitigated):** Cross-document inconsistency was the #1 rejection reason. The 17-rule validation engine with real-time traffic lights addresses this.

## Constraints

- **Language**: Entire UI and all generated documents in Mexican Spanish. Protected EFICINE/IMCINE terminology never translated. See `directives/politica_idioma.md`.
- **Tech stack**: React + Tailwind + shadcn/ui, Firebase, Anthropic Claude API — decided, not negotiable.
- **EFICINE rules**: All financial calculations, document requirements, and validation rules match 2026 Lineamientos exactly.
- **File naming**: IMCINE convention — max 15 characters, no accents/n/commas/&/symbols.
- **File size**: All PDFs <= 40 MB per SHCP upload system.
- **AI prompts**: Pre-written in `prompts/` folder in Spanish with `{{variable}}` substitution.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No authentication for v1 | Internal tool for one user — auth adds complexity without value | ✓ Good — simplified v1.0 stack |
| Firebase as backend | BaaS reduces backend work; Firestore handles document-heavy data model | ✓ Good — real-time subscriptions power validation + collaboration |
| Registration period per project | Drives 3-month document expiration validation | ✓ Good — VALD-04/17 depend on this |
| Spanish-first UI (no i18n) | Internal tool for Mexican market; i18n adds overhead | ✓ Good — es.ts locale file is clean and maintainable |
| Pre-written AI prompts | Domain expertise baked into prompts; prevents drift | ✓ Good — Handlebars injection works reliably |
| 4-pass generation pipeline | Line Producer → Finance → Legal → Combined ensures data flows correctly | ✓ Good — each pass consumes prior pass output |
| Document-level RBAC (collaborators map) | Per-project roles instead of Firebase custom claims | ✓ Good — supports per-project role differentiation |
| Client-side activity logging | Client has auth context and field diff; avoids Cloud Function overhead | ✓ Good — fire-and-forget pattern keeps UI responsive |
| Copy-forward revert (not pointer swap) | Linear version timeline, no orphaned references | ✓ Good — simple mental model for producers |
| Soft cascade on revert (warning only) | Existing staleness tracks input data, not document content changes | ✓ Good — avoids false stale indicators |
| 5 critique personas reusing Phase 4 scoring personas | Consistent evaluator perspective between scoring and review | ✓ Good — single persona definition, dual mode |
| 2-pass review (parallel personas + coherence) | Persona independence + cross-document coherence check | ✓ Good — catches contradictions without redundancy |

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
*Last updated: 2026-03-27 — v2.0 Multi-User & Extended Modalities shipped. 7 phases, 21 plans, 21/21 requirements satisfied.*
