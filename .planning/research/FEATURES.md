# Feature Landscape: v2.0 Multi-User & Extended Modalities

**Domain:** Multi-user collaborative EFICINE submission platform
**Researched:** 2026-03-25
**Overall confidence:** HIGH (auth/RBAC, collaboration, versioning), MEDIUM (postproduccion rules -- PDF not machine-readable, cross-referenced with scoring_rubric.md and export_manager.json)
**Scope:** New features ONLY. v1.0 features (wizard, 4-pass AI generation, 17 validation rules, score estimation, PDF/ZIP export) are validated and shipped.

---

## Table Stakes

Features that v2.0 MUST have for the stated goals to be met. Without these, the multi-user/collaboration promise is broken.

### TS-1: Google Sign-In Authentication

| Attribute | Detail |
|-----------|--------|
| **Why Expected** | Team members need individual identities. Currently no auth at all -- Firestore rules are `allow read, write: if true`. Google matches Lemon Studios' Google Workspace. |
| **Complexity** | Low |
| **v1.0 Dependencies** | `src/lib/firebase.ts` (add `getAuth` export), `src/main.tsx` (wrap with AuthProvider), `src/App.tsx` (add `/login` route + ProtectedRoute wrapper) |
| **v1.0 Breaking Changes** | None if deployed atomically with security rules. Existing unauthenticated flows stop working once rules deploy. |
| **New Files** | `AuthContext.tsx`, `LoginPage.tsx`, `ProtectedRoute.tsx` |
| **Confidence** | HIGH -- Firebase Auth Google provider is well-documented, already in the Firebase SDK bundle (v12.11) |

### TS-2: Role-Based Access Control (RBAC)

| Attribute | Detail |
|-----------|--------|
| **Why Expected** | Producer, line producer, lawyer, director each need different permissions. The producer owns the project and manages collaborators; the lawyer should not edit budgets; the director should not trigger AI generation. |
| **Complexity** | Medium |
| **Roles** | `producer` (full access), `line_producer` (datos/equipo/financiera/generacion), `lawyer` (documentos/financiera), `director` (guion/equipo), `viewer` (read-only) |
| **Implementation** | Firebase custom claims (set server-side via Admin SDK), enforced in Firestore security rules via `request.auth.token.role`. Client-side `RoleGate` component for UX only. |
| **v1.0 Dependencies** | `src/hooks/useAutoSave.ts` (add `updatedBy` + permission check), `src/stores/appStore.ts` (add user/role state), all wizard screen components (wrap edit controls with RoleGate) |
| **Why Custom Claims Over Firestore Docs** | Firestore security rules have a 10-document-read limit per evaluation. The existing `useValidation` hook opens 10+ real-time listeners per project. Custom claims are in the JWT token -- zero extra reads. |
| **Confidence** | HIGH -- Firebase official docs describe this exact pattern |

### TS-3: Project-Level Permissions

| Attribute | Detail |
|-----------|--------|
| **Why Expected** | Each user should see only projects they own or collaborate on, not every project in Firestore. |
| **Complexity** | Medium |
| **Implementation** | `ownerId: string` + `collaborators: { [uid]: role }` map on each project document. Security rules check membership. Dashboard query filtered by user. |
| **v1.0 Dependencies** | `src/services/projects.ts` (`createProject` must set `ownerId`; `listProjects` must filter by collaborator membership), `src/components/dashboard/DashboardPage.tsx` (filter query) |
| **Data Migration** | Existing projects have no `ownerId`. Migration script must add `ownerId` (first authenticated user) and `collaborators` map to all existing project documents. |
| **Confidence** | HIGH |

### TS-4: Auth-Protected Cloud Functions

| Attribute | Detail |
|-----------|--------|
| **Why Expected** | All 7 existing `onCall` functions accept unauthenticated requests. Anyone with the project ID could invoke `extractScreenplay` or `runCombinedPass`. |
| **Complexity** | Low (but high deployment risk) |
| **v1.0 Dependencies** | ALL 7 callables in `functions/src/index.ts`: `extractScreenplay`, `analyzeScreenplay`, `runLineProducerPass`, `runFinanceAdvisorPass`, `runLegalPass`, `runCombinedPass`, plus `estimateScore` |
| **Deployment Risk** | Must deploy Functions auth checks AND Firestore/Storage security rules atomically. Partial deployment = broken app. Functions deployed without client auth = all calls fail. Rules deployed without Functions auth = data exposed. |
| **Confidence** | HIGH |

### TS-5: Firestore Security Rules Rewrite

| Attribute | Detail |
|-----------|--------|
| **Why Expected** | Currently `allow read, write: if true`. This is the single biggest security gap. Every other v2.0 feature assumes rules exist. |
| **Complexity** | High (most fragile change in v2.0) |
| **v1.0 Dependencies** | `firestore.rules` (complete rewrite), `storage.rules` (new, currently no file). Every Firestore read/write in the codebase must work under new rules. |
| **Subcollections Affected** | `projects/{id}`, `projects/{id}/team`, `projects/{id}/financials`, `projects/{id}/screenplay`, `projects/{id}/generated`, `projects/{id}/documents`, `projects/{id}/meta` -- all must have matching rules |
| **ERPI Settings Migration** | `erpi_settings/default` singleton must migrate to `organizations/{orgId}/erpi_settings/default`. Affects `src/services/erpi.ts`, `functions/src/pipeline/orchestrator.ts`, `ERPISettingsPage.tsx`. |
| **Testing** | Must use Firestore emulator with security rules enabled. Every existing test that writes to Firestore needs auth context. |
| **Confidence** | HIGH (pattern well-known), but EXECUTION RISK is the highest in v2.0 |

---

## Differentiators

Features that make v2.0 significantly more valuable. Not expected by default, but high impact for the Lemon Studios workflow.

### DIFF-1: Section-Level Collaboration with Presence

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | Producer fills metadata, line producer enters team data, lawyer handles financials -- all working on the same project in parallel instead of sequentially passing a laptop. |
| **Complexity** | Medium |
| **v1.0 Dependencies** | `src/hooks/useAutoSave.ts` (add `updatedBy`, detect external changes via onSnapshot), `src/components/wizard/WizardShell.tsx` (add presence indicators), Firestore merge writes (already used -- no conflict for different fields) |
| **Concurrency Model** | Last-write-wins for same-field conflicts. Firestore merge semantics handle different-field updates natively. Non-blocking toast when another user's save is detected. |
| **New Data** | `projects/{id}/presence/{uid}` subcollection with TTL (5min expiry, 60s heartbeat). `ActiveEditors` component shows avatar badges per screen. |
| **Why NOT CRDTs/OT** | Wizard screens are structured forms, not prose. Firestore merge writes already handle field-level concurrency. Building OT for form fields would cost 10x for zero benefit. |
| **Confidence** | HIGH |

### DIFF-2: AI Pre-Submission Review (Evaluator Simulation)

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | Before export, run the entire carpeta through Claude simulating an IMCINE CE Produccion evaluator. Get a holistic predicted score + specific improvement suggestions. Different from existing `estimateScore` (which scores individual signals) -- this reads all generated document prose and evaluates coherence, completeness, and compliance as a whole. |
| **Complexity** | High |
| **v1.0 Dependencies** | Requires ALL 21 generated documents to exist (depends on complete pipeline execution). Reads from `projects/{id}/generated/*` subcollection. Extends the existing 5-persona scoring model (prompts/evaluadores/) to a full-document review. |
| **Architecture** | New `runPreSubmissionReview` Cloud Function. Loads all generated doc content + project metadata. Sends to Claude (claude-sonnet-4-20250514, 200K context) with evaluator persona prompt. Returns structured review: `{ score_estimate, findings[], recommendations[], risk_areas[] }`. Stored at `projects/{id}/review/latest`. |
| **Token Budget** | 21 generated documents' prose content could total 50-100K tokens. Must summarize each document to key points before sending to review prompt. Alternatively, use a two-pass approach: (1) summarize each doc individually, (2) send summaries to evaluator prompt. |
| **Existing Foundation** | 5 evaluador personas already exist (`prompts/evaluadores/`). The viability scoring engine (`src/validation/scoring.ts`) already computes deterministic signals. This feature extends both by doing a holistic prose review. |
| **New Prompt** | `prompts/revision_pre_envio.md` -- Spanish prompt simulating full dossier evaluation against the official rubric. Must reference the 100-point rubric (or 65-point for postproduccion). |
| **Confidence** | MEDIUM -- LLM-as-a-Judge methodology is proven (80-90% agreement with humans per research), but accuracy for EFICINE-specific evaluation is unvalidated. Flag for user testing. |

### DIFF-3: Document Version History + Diff View

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | Track what changed between regenerations. When upstream data changes (budget modified, team member added), see exactly what the AI changed in each generated document. Essential for lawyer review of contracts and producer review of financial documents. |
| **Complexity** | Medium |
| **v1.0 Dependencies** | All 4 pipeline passes in `functions/src/pipeline/passes/*.ts` (modify to snapshot current version before overwriting). `projects/{id}/generated/{docId}` subcollection (existing -- stores current version). |
| **History Model** | `projects/{id}/generated/{docId}/history/{versionId}` sub-subcollection. Full content snapshots (not deltas). Keep last 10 versions per document. Version metadata: `{ version, generatedAt, generatedBy, passId }`. |
| **Diff Engine** | `diff` (jsdiff) npm package for word-level text comparison. `diff2html` for side-by-side HTML rendering with additions/deletions highlighted. Client-side computation (lightweight, no server needed). |
| **v1.0 Staleness Integration** | v1.0 already has staleness tracking (`isStale` flag on generated docs). Version history naturally extends this: when a doc is marked stale, the user can see the diff between current version and what will change upon regeneration. |
| **Confidence** | HIGH -- `diff` is 8M+ weekly downloads, well-tested. |

### DIFF-4: Full Co-Production Rules Engine

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | International co-productions have complex EFICINE requirements: territorial budget splits (gasto nacional vs. extranjero), multi-currency accounting with Banxico FIX rates, IMCINE prior recognition certificate, pertinence justification in propuesta de produccion. v1.0 has a boolean toggle (`es_coproduccion_internacional`) and two optional fields (`tipo_cambio_fx`, `fecha_tipo_cambio`). v2.0 provides the full engine. |
| **Complexity** | High |
| **EFICINE Rules (from validation_rules.md, Rule 12)** | (1) IMCINE prior recognition certificate required. (2) Budget must split national vs. foreign spend. (3) Foreign currency must show MXN equivalent + exchange rate at registration date. (4) Propuesta de produccion must justify Mexican creative participation. |
| **v1.0 Dependencies** | `src/schemas/project.ts` (already has `es_coproduccion_internacional`, `tipo_cambio_fx`, `fecha_tipo_cambio`), `src/lib/constants.ts` (add supported currencies), `src/validation/rules/` (already has empty conditional for co-production in Rule 12), `functions/src/pipeline/passes/financeAdvisor.ts` (add territorial split tables), `prompts/documentos_financieros.md` (add co-production context variables) |
| **Currency Architecture** | `dinero.js` v2 for type-safe multi-currency integer arithmetic. All conversion outputs to MXN centavos (consistent with existing pattern). Exchange rates from Banxico SIE API (`SF43718` = USD/MXN FIX). Rate locked per submission (immutable once set). |
| **New Validation Rules** | VALD-COPROD-01 (IMCINE recognition present), VALD-COPROD-02 (territorial split totals match budget), VALD-COPROD-03 (exchange rate source and date valid), VALD-COPROD-04 (Mexican participation percentage meets minimum) |
| **Confidence** | HIGH for EFICINE rules (documented in validation_rules.md and modulo_e.json). MEDIUM for Banxico API integration (requires API token, rate freshness). |

### DIFF-5: Multi-Currency Financial Module

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | Co-production budgets involve MXN + USD/EUR/CAD. Type-safe currency arithmetic prevents catastrophic cross-currency mixing errors that would invalidate the entire carpeta. |
| **Complexity** | Medium |
| **v1.0 Dependencies** | `src/lib/format.ts` (existing `formatMXN` -- add `formatCurrency(amount, code)` variant), `src/lib/constants.ts` (add currency definitions) |
| **Implementation** | `dinero.js` v2 (integer-based, TypeScript-first, prevents MXN+USD addition at type level). Gradual adoption -- only in co-production module. Existing MXN centavos code unchanged. |
| **Critical Rule** | All EFICINE documents, validation, and export remain in MXN centavos. Foreign currencies are converted at entry using locked Banxico FIX rate and never stored as foreign amounts in generated documents. |
| **Confidence** | HIGH |

### DIFF-6: Exchange Rate Lock-In

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | EFICINE requires foreign contributions to show MXN equivalent "at the exchange rate as of the system registration date." This must be a single, immutable rate fetched from Banxico and locked for the entire submission. |
| **Complexity** | Low |
| **EFICINE Legal Basis** | modulo_e.json: `tipo_cambio_mxn` field description: "must state MXN equivalent and the exchange rate as of the system registration date." validation_rules.md Rule 12: "foreign_contribution.exchange_rate_date == registration_date" |
| **v1.0 Dependencies** | `src/schemas/project.ts` (already has `tipo_cambio_fx` field), `src/lib/constants.ts` (already has `PERIODOS_EFICINE` with open/close dates) |
| **Implementation** | Cloud Function calling Banxico SIE API. Result cached in Firestore (`projects/{id}/coproduction/data.exchange_rates[]`). Immutable once set -- no updates allowed after lock-in. |
| **Confidence** | HIGH |

### DIFF-7: EFICINE Postproduccion Modality

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | Support the separate EFICINE Postproduccion program for projects with filming already complete. Different scoring rubric, different document requirements, different FORMATO structures, different wizard flow. |
| **Complexity** | High |
| **EFICINE Postproduccion Rules (from scoring_rubric.md + export_manager.json)** | See detailed breakdown below. |
| **v1.0 Dependencies** | Modality routing architecture must be built as a strategy pattern. `src/lib/constants.ts`, `src/schemas/project.ts`, `src/validation/engine.ts`, `functions/src/pipeline/orchestrator.ts`, `src/hooks/useValidation.ts` -- all need modality-aware branching via config registry. |
| **New Prompts Needed** | `prompts/escrito_libre_postproduccion.md`, `prompts/material_filmado_analisis.md` |
| **Confidence** | MEDIUM -- postproduccion rubric is documented in scoring_rubric.md, but full document requirements could not be extracted from the PDF lineamientos. Cross-referenced with export_manager.json `enrutador_modalidad` which confirms the modality enum. Phase-specific research needed. |

#### EFICINE Postproduccion: Document Differences from Produccion

Based on `references/scoring_rubric.md` (Section "SCORING FOR POSTPRODUCTION PROJECTS") and `schemas/export_manager.json` (`enrutador_modalidad`):

**Scoring Rubric Changes (Postproduccion vs. Produccion):**

| Category | Produccion | Postproduccion | Notes |
|----------|-----------|----------------|-------|
| Guion / Material filmado | 40 pts (screenplay) | **65 pts** (first cut video link with EFICINE watermark) | Completely different evaluation: filmed material replaces screenplay |
| Propuesta creativa de direccion | 12 pts | **0 pts** (not evaluated) | Director already made creative decisions -- evident in material |
| Material visual | 10 pts | **0 pts** (not evaluated) | Visual approach already visible in filmed material |
| Solidez equipo creativo | 2 pts | **2 pts** (same) | Team trajectory still evaluated |
| Propuesta de produccion | 12 pts | **0 pts** (replaced by escrito libre) | -- |
| Escrito libre de postproduccion | N/A | **15 pts** (max 5 cuartillas) | Explains remaining processes, timeline, resource justification |
| Plan de rodaje | 10 pts (shared with ruta critica) | **0 pts** (not applicable) | Filming already complete |
| Ruta critica | (shared with plan de rodaje) | **4 pts** (post stages only) | Monthly detail for remaining postproduction stages |
| Presupuesto | 10 pts | **10 pts** (same) | Full project budget including already-completed stages |
| Propuesta de exhibicion | 4 pts | **4 pts** (same) | Same evaluation criteria |
| **Total** | **100 pts** | **100 pts** | **Minimum to pass: 90/100 (same)** |

**Document Requirements Differences:**

| Document | Produccion | Postproduccion | Impact on Carpetify |
|----------|-----------|----------------|---------------------|
| A3 Guion | Required (user uploads screenplay) | **Not required** | Wizard skips screenplay upload screen |
| Material filmado (video link) | Not applicable | **Required** (first cut + EFICINE watermark) | New wizard screen: video URL input with watermark validation (VALD-10 equivalent) |
| A4 Propuesta creativa de direccion | Required (AI-generated) | **Not required** | Pipeline skips this document |
| A5 Material visual | Required (AI-generated) | **Not required** | Pipeline skips this document |
| A7 Propuesta de produccion | Required (AI-generated) | **Replaced by escrito libre** | New prompt: `escrito_libre_postproduccion.md` |
| A8a Plan de rodaje | Required (AI-generated) | **Not required** | Pipeline skips this document |
| A8b Ruta critica | Required (all stages) | **Required** (postproduction stages only) | Modified prompt: only post-production timeline |
| A9a/A9b Presupuesto | Required | **Required** (full budget including prior stages) | Same generation, but budget must reflect already-spent amounts |
| Escrito libre | Not applicable | **Required** (max 5 cuartillas) | New AI-generated document |
| All Section B, C, D, E docs | Required | **Required** (same) | No change |

**Pipeline Impact:**

| Pipeline Pass | Produccion | Postproduccion |
|--------------|-----------|----------------|
| Line Producer | Generates A7, A8a, A8b, A9a, A9b | Generates **only** A8b (post stages), A9a, A9b + **new** escrito libre |
| Finance Advisor | Generates A9d, E1, E2 | Same (but budget reflects prior + remaining spend) |
| Legal | Generates B3 contracts, C2b, C3a, C3b | Same |
| Combined | Generates A1, A2, A6, A10, C4, A11 | Modified: A1 references filmed material, no A2 sinopsis, A6 same, A10 same, C4 references filmed material |

### DIFF-8: Resubmission Modality (Previamente Autorizado)

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | Previously-authorized projects that need to resubmit (e.g., budget changes, contributor changes) can import their prior carpeta and generate comparative documents showing what changed. |
| **Complexity** | Medium |
| **EFICINE Rules** | `export_manager.json` enumerates 4 resubmission modalities: `previamente_autorizado_sin_material`, `previamente_autorizado_con_material`, `previamente_evaluado_produccion`, `previamente_evaluado_postproduccion`. Each has different document carry-forward rules. |
| **v1.0 Dependencies** | Clone mechanism for existing project data. Comparative budget FORMATO (shows old vs. new amounts). `src/schemas/project.ts` `intentos_proyecto` field (already exists, tracks submission count up to 3). |
| **Key Documents** | Comparative presupuesto (side-by-side old/new), updated ruta critica, updated esquema financiero. Most other documents carry forward from prior approval. |
| **Confidence** | LOW -- resubmission document requirements could not be verified from available sources. The exact FORMATOs for comparative budgets are not in the codebase schemas. Phase-specific research with the actual PDF lineamientos is required. |

### DIFF-9: Activity Log

| Attribute | Detail |
|-----------|--------|
| **Value Proposition** | Track who changed what and when. Essential for collaboration accountability ("who modified the budget last?") and debugging data inconsistencies. |
| **Complexity** | Low |
| **v1.0 Dependencies** | `src/hooks/useAutoSave.ts` (add `updatedBy` field to every write) |
| **Implementation** | `updatedBy: userId` and `updatedAt: serverTimestamp()` on all Firestore writes. Simple log viewer component reading from document change history. NOT a tamper-proof audit trail (anti-feature). |
| **Confidence** | HIGH |

---

## Anti-Features

Features to explicitly NOT build for v2.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Email/password auth** | Adds password management, reset flows, brute-force protection, 2FA. Google Workspace covers the entire 4-person Lemon Studios team. | Google sign-in only via Firebase Auth Google provider. |
| **Granular field-level permissions** | "Only the lawyer can edit the screenwriter fee" creates a permission matrix that explodes combinatorially with fields x roles. 4 users do not need this. | Screen-level role gating (who can edit which wizard screens). Firestore rules check project membership, not field-level ACLs. |
| **Real-time co-editing (Google Docs style)** | CRDTs/OT for form fields is massive overengineering. The wizard has structured form fields, not free-text prose. Firestore's merge writes already handle field-level concurrency. | Firestore merge writes + presence indicators + "data changed by [user]" toast. |
| **Push notifications** | Service workers, FCM setup, notification permissions -- all for 4 desktop users who are in the same office. | In-app indicators via Firestore real-time onSnapshot listeners. |
| **Audit trail with legal weight** | Tamper-proof, timestamped, immutable audit logs with notarization. EFICINE does not require internal audit trails. | Simple `updatedBy` activity log sufficient for internal tool accountability. |
| **SaaS multi-tenancy** | Multiple production companies on one instance requires org isolation, billing, onboarding, admin consoles. Lemon Studios is the only user. | Single-tenant. Design data model with `organizationId` (future-proofing), but build UI for single org. |
| **Automated exchange rate cron** | Daily Banxico rate fetching via scheduled Cloud Function. Exchange rates for EFICINE are locked on a specific date, not tracked daily. | On-demand fetch when user sets co-production rate. Rate is immutable once locked. |
| **Dual-currency display everywhere** | Showing MXN + foreign currency side-by-side throughout the entire app. Only the co-production entry panel needs dual-currency. | Convert once at entry using locked Banxico rate. All generated documents, validation, and export use MXN centavos exclusively. |
| **Offline support / PWA** | Service workers, IndexedDB caching, offline Firestore persistence. 4-person team in office with reliable internet. | Not needed. If internet drops, Firestore SDK queues writes automatically (default behavior). |
| **Mobile-responsive wizard** | 30-document dossier creation is a desktop workflow. Budget tables, contract reviews, and document comparison do not work on mobile. | Desktop-only. Already stated as out of scope in PROJECT.md. |
| **Separate postproduccion app** | Building a completely separate application for the postproduccion modality. | Modality routing within the same app using strategy pattern config registry. Share 80%+ of code. |
| **AI-powered document editing** | Let users edit AI-generated documents with AI assistance (suggestions, rewrites). | Users review generated documents and regenerate with modified inputs. Direct editing of AI output opens up consistency risks with cross-document validation. |

---

## Feature Dependencies

### Dependency Graph

```
[Auth Foundation] -- HARD prerequisite for everything
  |
  +-> TS-1: Google Sign-In
  +-> TS-2: RBAC (requires TS-1)
  +-> TS-3: Project Permissions (requires TS-1)
  +-> TS-4: Cloud Function Auth (requires TS-1)
  +-> TS-5: Security Rules (requires TS-1, TS-2, TS-3)
  |
  +-> [Collaboration Layer] -- requires auth foundation complete
  |     +-> DIFF-1: Section Collaboration + Presence (requires TS-2, TS-5)
  |     +-> DIFF-9: Activity Log (requires TS-1)
  |
  +-> [Co-Production Engine] -- independent of collaboration
  |     +-> DIFF-5: Multi-Currency Module (no auth dependency, but needs project ownership for writes)
  |     +-> DIFF-6: Exchange Rate Lock-In (requires DIFF-5)
  |     +-> DIFF-4: Full Co-Production Rules (requires DIFF-5, DIFF-6)
  |
  +-> [Document Intelligence] -- requires existing generation pipeline
  |     +-> DIFF-3: Version History (modifies pipeline passes, requires TS-1 for generatedBy)
  |     +-> DIFF-3b: Diff View (requires DIFF-3 -- needs two versions to compare)
  |     +-> DIFF-2: AI Pre-Submission Review (requires ALL generated docs to exist)
  |
  +-> [Modality Routing] -- independent of collaboration and co-production
        +-> DIFF-7: Postproduccion Modality (requires modality router architecture)
        +-> DIFF-8: Resubmission Modality (requires modality router + project clone)
```

### Critical Path

**TS-1 -> TS-2 -> TS-5 -> ALL other features**

Authentication is the hard prerequisite. Nothing else ships without it.

### Parallel Work Streams (after auth foundation)

Once the auth foundation (TS-1 through TS-5) is complete, four independent streams can run in parallel:

1. **Collaboration**: DIFF-1 (section collaboration + presence) + DIFF-9 (activity log)
2. **Co-Production**: DIFF-4 + DIFF-5 + DIFF-6 (currency module -> exchange rates -> rules engine)
3. **Document Intelligence**: DIFF-3 (version history) -> DIFF-3b (diff view) -> DIFF-2 (AI review)
4. **Modality Routing**: DIFF-7 (postproduccion) + DIFF-8 (resubmission)

### v1.0 Integration Points (Files That MUST Change)

These existing v1.0 files must be modified for v2.0 to work:

| v1.0 File | Features That Touch It | Risk Level |
|-----------|----------------------|------------|
| `firestore.rules` | TS-5 (complete rewrite) | **CRITICAL** -- wide open to fully locked |
| `src/lib/firebase.ts` | TS-1 (add Auth import) | Low |
| `src/main.tsx` | TS-1 (AuthProvider wrapper) | Low |
| `src/App.tsx` | TS-1 (login route), DIFF-7 (modality routing) | Medium |
| `functions/src/index.ts` | TS-4 (auth checks on all 7 callables) | **HIGH** -- atomic with rules |
| `src/services/projects.ts` | TS-3 (ownerId, collaborators), DIFF-9 (updatedBy) | Medium |
| `src/services/erpi.ts` | TS-5 (migrate singleton to org-scoped) | Medium |
| `src/hooks/useAutoSave.ts` | TS-2 (permission check), DIFF-1 (conflict detection), DIFF-9 (updatedBy) | Medium |
| `src/stores/appStore.ts` | TS-1 (user state), TS-2 (role state) | Low |
| `src/schemas/project.ts` | TS-3 (ownerId, collaborators), DIFF-7 (modalidad field) | Medium |
| `src/lib/constants.ts` | DIFF-4 (currencies), DIFF-7 (modality configs, postproduccion thresholds) | Medium |
| `src/validation/engine.ts` | DIFF-7 (modality-aware rule selection) | Medium |
| `functions/src/pipeline/orchestrator.ts` | DIFF-3 (version snapshots), DIFF-4 (co-production data), DIFF-7 (modality routing) | **HIGH** -- central pipeline logic |
| `functions/src/pipeline/passes/*.ts` | DIFF-3 (snapshot before overwrite), DIFF-7 (conditional document generation) | Medium |
| `src/locales/es.ts` | ALL features (every new UI string) | Low (additive only) |

---

## MVP Recommendation

### Must Ship (core v2.0 promise):

1. **TS-1: Google Sign-In** -- identity foundation for everything
2. **TS-2: RBAC** -- roles give collaboration meaning
3. **TS-3: Project Permissions** -- ownership and sharing
4. **TS-4: Cloud Function Auth** -- server-side enforcement
5. **TS-5: Security Rules Rewrite** -- close the gaping security hole
6. **DIFF-1: Section Collaboration + Presence** -- the headline user-facing feature
7. **DIFF-9: Activity Log** -- low effort, high accountability value

### Should Ship (key differentiators):

8. **DIFF-3: Document Version History + Diff** -- high value for lawyer/producer review cycles
9. **DIFF-2: AI Pre-Submission Review** -- flagship v2.0 intelligence feature
10. **DIFF-7: Modality Router Architecture** -- strategy pattern infrastructure, even if only produccion modality is fully implemented initially

### Defer to v2.1 (large independent feature blocks):

11. **DIFF-4 + DIFF-5 + DIFF-6: Full Co-Production Engine** -- complex domain with its own regulatory rules, multi-currency complexity, and API integration. Independent milestone.
12. **DIFF-7 (full): Postproduccion Modality** -- new prompts, new rubric, new wizard screens, new validation rules. Build the router in v2.0, but defer full postproduccion implementation.
13. **DIFF-8: Resubmission Modality** -- LOW confidence on requirements. Needs phase-specific research with actual PDF lineamientos before building.

### Deferral Rationale

- Co-production and postproduccion are large independent feature blocks that do NOT affect the core multi-user collaboration story
- The modality routing ARCHITECTURE should be built in v2.0 (strategy pattern), but only the produccion modality needs full implementation
- Resubmission requirements are insufficiently documented -- building without verified requirements risks rework
- Co-production is the only feature that requires a new external API dependency (Banxico SIE)
- These features benefit from real user feedback on the v2.0 collaboration experience before adding more complexity

---

## Complexity Budget Summary

| Feature | Estimated Effort | Risk | Depends On |
|---------|-----------------|------|------------|
| TS-1: Google Sign-In | 1-2 days | Low | Nothing |
| TS-2: RBAC | 2-3 days | Medium | TS-1 |
| TS-3: Project Permissions | 2-3 days | Medium | TS-1 |
| TS-4: Cloud Function Auth | 1 day | High (atomic deploy) | TS-1 |
| TS-5: Security Rules | 3-5 days | **CRITICAL** | TS-1, TS-2, TS-3 |
| DIFF-1: Collaboration + Presence | 3-4 days | Medium | TS-1 through TS-5 |
| DIFF-2: AI Pre-Submission Review | 4-6 days | Medium | All generated docs |
| DIFF-3: Version History + Diff | 3-4 days | Low | Pipeline passes |
| DIFF-4: Co-Production Engine | 6-8 days | High | DIFF-5, DIFF-6 |
| DIFF-5: Multi-Currency Module | 2-3 days | Medium | None (gradual) |
| DIFF-6: Exchange Rate Lock-In | 1-2 days | Low | DIFF-5 |
| DIFF-7: Postproduccion Full | 6-10 days | High (research gap) | Modality router |
| DIFF-8: Resubmission | 4-6 days | **HIGH** (LOW confidence reqs) | Modality router |
| DIFF-9: Activity Log | 1 day | Low | TS-1 |

**Total MVP (must + should): ~20-30 days**
**Total v2.0 + v2.1 (everything): ~40-55 days**

---

## Sources

### HIGH Confidence
- `references/scoring_rubric.md` -- Postproduccion rubric (65pt material filmado, 15pt escrito libre, etc.)
- `references/validation_rules.md` -- Co-production rules (Rule 12), all financial reconciliation rules
- `schemas/export_manager.json` -- Modality router enum, co-production flag, file compilation rules
- `schemas/modulo_e.json` -- Co-production partner schema, exchange rate requirements
- `.planning/PROJECT.md` -- v2.0 requirements and target features
- `src/schemas/project.ts`, `src/lib/constants.ts` -- Existing co-production fields already in data model
- `firestore.rules` -- Confirms current state is wide open (`allow read, write: if true`)
- [Firebase Auth Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims) -- RBAC implementation pattern
- [Firestore Role-Based Access](https://firebase.google.com/docs/firestore/solutions/role-based-access) -- Security rules patterns
- [Firestore Transaction Concurrency](https://firebase.google.com/docs/firestore/transaction-data-contention) -- Optimistic locking behavior

### MEDIUM Confidence
- [EFICINE Lineamientos 2026 (PDF)](https://www.imcine.gob.mx/media/2026/1/lineamientosyrequisitosparalaevaluaciondeproyectosdeeficineproduccion-file_6971706c4a932.pdf) -- Official source but PDF not machine-readable; postproduccion and resubmission details extracted from scoring_rubric.md cross-reference only
- [LLM-as-a-Judge methodology](https://arxiv.org/html/2412.05579v2) -- Multi-evaluator AI review pattern
- [diff (jsdiff)](https://www.npmjs.com/package/diff) -- Text diffing library, 8M+ downloads/week
- [diff2html](https://diff2html.xyz/) -- Diff visualization renderer
- [KOSMA film budgeting](https://kosma.io/) -- International co-production budgeting software (competitor reference)
- [Dinero.js v2](https://www.dinerojs.com/) -- Multi-currency integer arithmetic library

### LOW Confidence (needs phase-specific research)
- Resubmission modality (previamente autorizado) exact document requirements -- not in codebase schemas, not extractable from PDF
- Postproduccion exact FORMATO structures -- scoring rubric is documented but specific FORMATO templates for escrito libre and material filmado analysis are not in the codebase
- Banxico SIE API reliability and rate limits -- not verified
