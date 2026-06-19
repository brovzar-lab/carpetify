# CARPETIFY

Internal web tool for Lemon Studios that takes a feature film screenplay (PDF) and project metadata, then generates a complete EFICINE Article 189 submission dossier ("carpeta") — the ~30-document package required by IMCINE for the Mexican film tax incentive. Multi-user with role-based access, real-time collaboration, document versioning, and AI pre-submission review. This is a legal compliance tool — financial calculations and document rules must match the 2026 Lineamientos exactly.

## Critical Rules

1. **All UI is Mexican Spanish.** Every label, button, error, tooltip — Spanish. English ONLY for code (component names, functions, git). Read `directives/politica_idioma.md` before touching any UI.
2. **EFICINE terms never translated.** "ERPI", "presupuesto desglosado", "flujo de efectivo", "esquema financiero", "cesion de derechos", "ruta critica" — Spanish even in code comments.
3. **All UI strings come from `src/locales/es.ts`.** Never hardcode Spanish text in components.
4. **Money is integer centavos.** Store and compute as centavos. Format only at display via `formatMXN()` from `src/lib/format.ts`. Display: `$X,XXX,XXX MXN`.
5. **Dates in Spanish.** Use `formatDateES()` / `formatMonthYearES()` from `src/lib/format.ts`.
6. **AI prompts are pre-written.** Files in `prompts/` are exact system prompts — inject data into `{{variable}}` placeholders, don't rewrite.

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2 |
| Bundler | Vite | 8.0 |
| Language | TypeScript (strict) | 5.9 |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova style) | 4.2 |
| State | Zustand (client) + React Query (server) | 5.0 / 5.94 |
| Forms | React Hook Form + Zod | 7.71 / 4.3 |
| Routing | React Router | 7.13 |
| Backend | Firebase (Firestore, RTDB, Storage, Functions v2, Hosting, Auth) | 12.11 |
| AI | Anthropic SDK in Cloud Functions | 0.80 |
| Email | Resend (invitation emails via Cloud Function trigger) | 6.9 |
| Prompt templates | Handlebars ({{variable}} injection in prompts) | 4.7 |
| Concurrency | p-limit (parallel AI calls in generation/review) | 7.3 |
| PDF input | pdf-parse (server), pdfjs-dist via react-pdf (client) | 2.4 / 10.4 |
| PDF output | pdf-lib (export document PDF generation) | 1.17 |
| Unit tests | Vitest + Testing Library + jsdom | 4.1 |
| E2E tests | Playwright | 1.58 |
| Icons | Lucide React | 0.577 |
| Toasts | Sonner | 2.0 |

## Project Structure

```
├── src/                          # Frontend React app
│   ├── main.tsx                  # Entry: QueryClientProvider + Toaster wrapping App
│   ├── App.tsx                   # AuthProvider + BrowserRouter with 8 routes
│   ├── index.css                 # Tailwind v4 config, shadcn theme vars, status colors
│   ├── components/
│   │   ├── ui/                   # shadcn primitives — DO NOT edit manually, use `npx shadcn add`
│   │   ├── auth/                 # LoginPage, OrgSetupPage, ProtectedRoute, AccessDenied
│   │   ├── wizard/               # WizardShell, WizardSidebar, 9-screen wizard components
│   │   ├── dashboard/            # DashboardPage, ProjectCard, PeriodGroup, EmptyState
│   │   ├── erpi/                 # ERPISettingsPage, ERPICompanyForm, PriorProjectsList
│   │   ├── collaboration/        # PresenceAvatar, LockBanner, ForceBreakDialog
│   │   ├── generation/           # GenerationPanel, PassProgress, DocumentCard
│   │   ├── validation/           # ValidationDashboard, ScoreEstimationPanel, CompliancePanel
│   │   ├── versioning/           # VersionHistoryPanel, VersionBadge, ProseDiffViewer, StructuredDiffViewer, VersionSelector, RevertConfirmDialog
│   │   ├── export/               # ExportPanel, DocumentChecklist, ZipDownload
│   │   ├── pdf/                  # PDF viewer/preview components
│   │   ├── project/              # Project-level components (team management, settings)
│   │   ├── layout/               # AppHeader (dark mode toggle, user menu, presence)
│   │   └── common/               # MXNInput, TrafficLight, AutoSaveIndicator
│   ├── contexts/                 # AuthContext.tsx (AuthProvider, useAuth hook)
│   ├── pages/                    # InvitationPage.tsx (standalone route outside ProtectedRoute)
│   ├── schemas/                  # Zod runtime validation (project, team, financials, screenplay, erpi, documents)
│   ├── services/                 # Firestore CRUD: projects, erpi, storage, generation, export, invitations, organizations, activityLog, review, versionHistory
│   ├── stores/                   # Zustand: appStore (activeProjectId, user, role), wizardStore (activeScreen, sidebarOpen)
│   ├── hooks/                    # useAutoSave, useCompliance, useValidation, useGeneration, useGeneratedDocs, useStaleness, useExport, useBudgetEditor, useProjectAccess, usePresence, useProjectPresence, useSectionLock, useIdleDetection, useActivityLog, usePreSubmissionReview, use-mobile
│   ├── lib/
│   │   ├── firebase.ts           # Firebase init (Firestore, RTDB, Storage, Functions, Auth)
│   │   ├── format.ts             # formatMXN, parseMXNInput, formatDateES, formatMonthYearES
│   │   ├── constants.ts          # EFICINE thresholds, periodos, categorias, cargos
│   │   └── utils.ts              # cn() helper
│   ├── locales/es.ts             # ALL Spanish UI strings — single source of truth
│   ├── parsers/                  # Client-side screenplay parser (pdfjs-dist)
│   └── types/index.ts            # Re-exports from schemas + Project interface
├── functions/                    # Cloud Functions — SEPARATE npm project, Node 22
│   ├── src/
│   │   ├── index.ts              # 17 exports: 14 callables + 1 event trigger + 2 re-exports
│   │   ├── auth/                 # requireAuth, requireProjectAccess, requireRole helpers
│   │   ├── screenplay/           # extractWithClaude, analyzeHandler, analyzeWithClaude, validateAnalysis, types
│   │   ├── pipeline/             # orchestrator, passes/ (lineProducer, financeAdvisor, legal, combined)
│   │   ├── claude/               # client.ts (shared Claude client init)
│   │   ├── collaboration/        # forceBreakLock handler
│   │   ├── email/                # Resend email delivery for invitations
│   │   ├── financial/            # Deterministic budget computation, cash flow, financial scheme
│   │   ├── invitations/          # inviteToProject, acceptInvitation, declineInvitation, revokeAccess
│   │   ├── migration/            # migrateV1Data (v1.0 → v2.0 ownership migration)
│   │   ├── migrations/           # addCollaboratorsField (Phase 11 RBAC migration)
│   │   ├── review/               # preSubmissionReview (5 persona + coherence, 2-pass architecture)
│   │   ├── shared/               # Shared utilities across Cloud Functions
│   │   ├── staleness/            # Staleness dependency graph for document regeneration
│   │   ├── triggers/             # onInvitationCreated (Firestore event → email)
│   │   ├── utils/                # Common utilities
│   │   ├── versioning/           # revertDocument handler with soft cascade warning
│   │   └── scoreHandler.ts       # 5-persona parallel AI score estimation
│   ├── package.json              # firebase-functions v2, @anthropic-ai/sdk, pdf-parse, resend, handlebars, p-limit, pdf-lib
│   └── tsconfig.json             # nodenext, es2022, outDir: lib
├── e2e/                          # Playwright tests (es-MX locale, baseURL localhost:5174)
├── directives/                   # Read-only spec documents
│   ├── app_spec.md               # Full architecture + EFICINE rules
│   └── politica_idioma.md        # Language policy + protected terms
├── prompts/                      # 11+ Spanish AI prompts with {{variable}} placeholders (copied to functions/ on predeploy)
├── schemas/                      # JSON Schema reference specs (modulo_a-e, export_manager) — NOT runtime code
├── references/                   # scoring_rubric.md, validation_rules.md
├── .planning/                    # State, roadmap, requirements, phase plans
└── public/                       # favicon
```

## Routes

| Path | Component | Guard | Purpose |
|------|-----------|-------|---------|
| `/login` | `LoginPage` | None (public) | Google sign-in |
| `/setup` | `OrgSetupPage` | `OrgSetupRoute` (auth + no org) | First-time organization creation |
| `/invitaciones/:invitationId` | `InvitationPage` | None (standalone) | Accept/decline project invitation (6 states) |
| `/` | `DashboardPage` | `ProtectedRoute` | Project list grouped by EFICINE period |
| `/project/:projectId` | `WizardShell` | `ProtectedRoute` | 9-screen wizard (defaults to "datos") |
| `/project/:projectId/:screen` | `WizardShell` | `ProtectedRoute` | Specific wizard screen |
| `/erpi` | `ERPISettingsPage` | `ProtectedRoute` | Shared ERPI company settings |
| `*` | `Navigate to="/"` | `ProtectedRoute` | Catch-all redirect to dashboard |

## Development

### Setup
```bash
npm install                          # Frontend dependencies
cd functions && npm install && cd .. # Cloud Functions dependencies
cp .env.example .env                 # Then fill in Firebase config values
```

### Environment Variables
`.env` (frontend — Vite exposes these to the browser):
```
VITE_FIREBASE_API_KEY=               # Firebase Console > Project Settings
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=          # RTDB URL for presence/locks
```

Cloud Functions use `ANTHROPIC_API_KEY` via Firebase Secret Manager (not in `.env`).
Resend email uses `RESEND_API_KEY` via Firebase Secret Manager.

### Commands
```bash
npm run dev          # Vite dev server (port 5173 default)
npm run build        # tsc -b && vite build → dist/
npm run lint         # ESLint
npm run preview      # Preview production build

# Tests
npx vitest           # Unit tests (watch mode, jsdom, globals: true)
npx vitest run       # Single run
npx playwright test  # E2E (requires dev server running on localhost:5174)

# Cloud Functions (from functions/ directory)
npm run build        # tsc → lib/
npm run serve        # Build + Firebase emulator
npm run deploy       # Deploy to Firebase
```

**Note:** Functions predeploy copies `prompts/` into `functions/prompts/` so Cloud Functions have runtime access to AI prompt templates.

### Firebase
- Project ID: `carpetify-mx`
- Hosting: serves `dist/`, SPA rewrite to `index.html`
- Functions runtime: Node 22, region: `us-central1`
- Functions predeploy: copies `prompts/` into `functions/prompts/` for runtime access
- Auth: Firebase Auth with Google sign-in, org-based project ownership model
- RTDB: Used for real-time presence indicators and section-level locks (not for primary data)
- Storage rules: auth-gate only (no `get()` available) — ownership enforced in Cloud Functions layer

## Cloud Functions

17 exports from `functions/src/index.ts`:

| Function | Type | Timeout | Memory | Purpose |
|----------|------|---------|--------|---------|
| `extractScreenplay` | callable | 240s | 1GiB | PDF → text → Claude structured extraction → Firestore |
| `analyzeScreenplay` | callable | 540s | 1GiB | Parsed screenplay → Claude narrative analysis |
| `runLineProducerPass` | streaming callable | 300s | 1GiB | Pass 2: generates 5 docs (A7, A8a, A8b, A9a, A9b) |
| `runFinanceAdvisorPass` | streaming callable | 300s | 1GiB | Pass 3: generates 3 docs (A9d, E1, E2) |
| `runLegalPass` | streaming callable | 300s | 1GiB | Pass 4: generates 5 docs (B3-prod, B3-dir, C2b, C3a, C3b) |
| `runCombinedPass` | streaming callable | 600s | 1GiB | Pass 5: generates 8 docs (A1, A2, A4, A6, A10, A11, C4, PITCH) |
| `estimateScore` | callable | 300s | 1GiB | 5 parallel AI persona evaluations for artistic score |
| `migrateV1Data` | callable | 60s | 256MiB | v1.0 → v2.0 ownership/org migration (idempotent) |
| `migrateAddCollaborators` | callable | 60s | 256MiB | Phase 11 RBAC field migration (idempotent) |
| `inviteToProject` | callable | 60s | 256MiB | Create invitation (productor-only) |
| `acceptInvitation` | callable | 60s | 256MiB | Accept invitation, add user to project (transactional) |
| `declineInvitation` | callable | 30s | 256MiB | Decline invitation without granting access |
| `revokeProjectAccess` | callable | 30s | 256MiB | Remove collaborator (productor-only) |
| `forceBreakLock` | callable | — | — | Break another user's RTDB section lock |
| `onInvitationCreated` | onDocumentCreated | — | — | Firestore trigger → sends invitation email via Resend |
| `revertDocumentVersion` | callable | — | — | Revert generated document to previous version |
| `runPreSubmissionReview` | streaming callable | 540s | 1GiB | 5 persona critiques + coherence check (2-pass) |

All callables require `request.auth` via shared `requireAuth()` helper. Project-scoped functions additionally call `requireProjectAccess()` to verify membership. Role-restricted actions (invite, revoke) enforce via `requireRole()`.

## Key Patterns

### Authentication & Authorization
Firebase Auth with Google sign-in. `AuthProvider` in `src/contexts/AuthContext.tsx` wraps the app and exposes `useAuth()` hook with `user`, `loading`, `needsOrgSetup`, `signInWithGoogle()`, `signOut()`. `ProtectedRoute` redirects unauthenticated users to `/login`. Logout clears Zustand store and React Query cache before Firebase signOut to prevent data leakage.

### RBAC (4 Roles)
Per-project roles stored in `collaborators` map on project document: `productor` (owner, full access), `line_producer` (financial screens), `abogado` (legal/contracts), `director` (creative screens). `memberUIDs` array enables `array-contains` queries for dashboard filtering. Hidden-not-disabled pattern: unauthorized actions are conditionally rendered, not shown as disabled. `useProjectAccess` hook syncs role to Zustand for downstream access without prop drilling.

### Real-Time Collaboration
Firebase RTDB for presence and section locks. `usePresence`/`useProjectPresence` hooks show who is online and which screen each user is viewing. `useSectionLock` implements section-level locking with 2-minute lock duration, 30-second idle threshold (via `useIdleDetection`), and `forceBreakLock` Cloud Function. `onDisconnect` queued before `set()` to prevent orphaned RTDB entries. Server time offset (`.info/serverTimeOffset`) used for clock skew handling.

### Document Versioning
Each regeneration preserves the previous version with timestamp, trigger reason, and user attribution. 10-version prune limit per document. Inline diff comparison (prose via `diffWords`, structured via JSON diff with `ProseDiffViewer`/`StructuredDiffViewer` fallback). One-click revert via `revertDocumentVersion` Cloud Function with soft downstream cascade warning (toast, not blocker).

### Activity Tracking
Field-level change attribution logged via `useAutoSave` diff integration. `useActivityLog` hook provides paginated, filtered activity entries. `ActivityTab` in wizard sidebar with unread badge count. Invitation events, revert events, and review events also logged.

### AI Pre-Submission Review
2-pass architecture: Pass 1 runs 5 persona critiques in parallel (p-limit concurrency pool of 3), Pass 2 runs cross-document coherence check. Produces per-section scores, improvement suggestions in Spanish, and overall readiness assessment (lista/casi_lista/necesita_trabajo/no_lista). Staleness detection compares review timestamp against all pass generation timestamps. Results integrate alongside deterministic score estimation on validation dashboard.

### Score Estimation
5 named AI evaluator personas independently score guion (40pts), direccion (12pts), material_visual (10pts). Results aggregated with mean/range display. Based on EFICINE scoring rubric (100pts + 5 bonus).

### Two Separate TypeScript Projects
Root is the Vite frontend (`@/` alias → `./src/`). `functions/` is the Cloud Functions project (nodenext modules). Separate `package.json`, `tsconfig.json`, `node_modules`. Never import across the boundary.

### Financial Calculations
All money in centavos (integer arithmetic). EFICINE thresholds in `src/lib/constants.ts`. Compliance engine in `src/hooks/useCompliance.ts` — checks 7 rules (ERPI min 20%, EFICINE max 80%, cap $25M, federal max 80%, screenwriter min 3%, in-kind max 10%, gestor cap 4-5%). Violations classified as `blocker` or `warning`.

### Auto-Save
`useAutoSave` hook: 1500ms debounce, 3 retries with exponential backoff, flush on unmount. Writes to `projects/{projectId}/{path}/data` in Firestore with merge. Coordinates with section locks — `flushAndWait` before `releaseLock` ensures no pending data is lost when edit mode ends. Logs field-level diffs to activity log with user attribution.

### Forms
React Hook Form with `onTouched` validation mode (errors appear after field blur). Zod schemas in `src/schemas/` provide runtime validation. Each team member form has its own independent useForm instance.

### Screenplay Pipeline
1. Upload PDF → Firebase Storage via `services/storage.ts`
2. `extractScreenplay` Cloud Function: downloads from Storage, extracts text with pdf-parse, sends text to Claude (claude-haiku-4-5) for structured scene/character/location extraction via tool_use, stores breakdown in `projects/{projectId}/screenplay/data`
3. User-triggered `analyzeScreenplay` Cloud Function: reads parsed data, calls Claude (claude-sonnet-4-20250514) with `prompts/analisis_guion.md`, validates response, stores analysis
4. Client-side parser (`src/parsers/screenplayParser.ts`) uses pdfjs-dist for local preview

### Wizard Screens
9 screens identified by slug: `datos`, `guion`, `equipo`, `financiera`, `documentos`, `generacion`, `validacion`, `exportar`, `actividad`. State managed in `wizardStore`. URL-synced via `/project/:projectId/:screen`. Role-based screen access enforced per RBAC rules.

## Do / Don't

### Always
- Use `src/locales/es.ts` for all UI strings
- Use centavos for money, `formatMXN()` for display only
- Use Zod schemas from `src/schemas/` for validation
- Run `npm run build` to verify TypeScript before claiming done
- Test financial calculations — wrong thresholds get applications rejected
- Keep Cloud Functions in `functions/src/`, frontend in `src/`
- Validate user authentication before any Firestore or Cloud Function operation

### Never
- Hardcode Spanish strings directly in components
- Use floating-point for monetary values
- Manually edit files in `src/components/ui/` (shadcn-managed)
- Translate EFICINE/IMCINE terminology
- Rewrite prompts in `prompts/` — use as-is with variable injection
- Import between `src/` and `functions/src/`

## Fragile Areas

- **Compliance thresholds** (`src/lib/constants.ts`, `src/hooks/useCompliance.ts`): These mirror EFICINE legal requirements. Wrong values = rejected application.
- **Currency formatting** (`src/lib/format.ts`): Must produce `$X,XXX,XXX MXN` exactly. `toLocaleString('es-MX')` handles comma separators.
- **Prompt variable injection**: AI prompts in `prompts/` use `{{variable}}` syntax. Missing variables produce broken documents.
- **Cloud Function timeouts**: `analyzeScreenplay` and `runPreSubmissionReview` use 540s (Firebase max for callable). `runCombinedPass` uses 600s. Long screenplays/large projects may approach these limits.
- **Zod schemas for Claude tool_use**: Schemas passed to `z.toJSONSchema()` for Claude tool definitions must NOT use `.transform()` — Zod v4 cannot serialize transforms to JSON Schema. Apply normalization post-parse instead.
- **Screenplay token limits**: `extractWithClaude.ts` sends extracted text (not raw PDF) to Claude. Raw PDF as base64 can exceed the 200K token limit for long screenplays. Text is truncated at 300K chars as a safety valve.
- **RBAC membership checks**: `requireProjectAccess` reads the project document on every Cloud Function call. Collaborators map and `memberUIDs` array must stay in sync — use `runTransaction` for any membership mutations.
- **RTDB lock expiry**: Lock duration (2min) is enforced in RTDB security rules. If the security rule expiry check and client-side timeout desync, locks may become unjammable. `forceBreakLock` Cloud Function is the escape hatch.
- **Storage rules limitation**: Storage rules use auth-gate only (no Firestore `get()` available). File-level ownership is enforced in Cloud Functions, not in rules — a signed-in user can theoretically access any Storage path.
- **Staleness dependency graph** (`functions/src/staleness/`): Documents have upstream dependencies (e.g., combined pass depends on all prior passes). Regenerating one pass must mark downstream documents as stale. Missing a dependency edge = silently outdated documents.
- **Anthropic rate limits for score estimation/review**: `estimateScore` runs 5 parallel Claude calls; `runPreSubmissionReview` runs 5+1. Both use `p-limit` (concurrency 3) but sustained use across multiple projects can hit Anthropic API rate limits.

## Reference Documents

| Need | File |
|------|------|
| Full app spec, EFICINE rules, document map | `directives/app_spec.md` |
| Language policy, protected terms | `directives/politica_idioma.md` |
| AI prompt execution order | `prompts/README.md` |
| EFICINE scoring rubric (100pts + 5 bonus) | `references/scoring_rubric.md` |
| Cross-module validation rules | `references/validation_rules.md` |
| JSON Schema specs (sections A-E + export) | `schemas/README.md` |
| Project status and roadmap | `.planning/STATE.md`, `.planning/ROADMAP.md` |
| Full requirements | `.planning/REQUIREMENTS.md` |
| v1.0 detailed roadmap | `.planning/milestones/v1.0-ROADMAP.md` |

## Current Status (2026-03-27)

### v1.0 — EFICINE Carpeta Generator (shipped 2026-03-25)
9 phases, 31 plans — all complete. Single-user tool with intake wizard, screenplay processing, 4-pass AI document generation pipeline, validation engine with 17 compliance rules, score estimation, and PDF export with IMCINE naming and ZIP packaging.

### v2.0 — Multi-User & Extended Modalities (feature-complete 2026-03-27)
7 phases (10-16), 21 plans — all complete.

| Phase | Description | Plans | Status |
|-------|-------------|-------|--------|
| 10 | Authentication & Identity | 3/3 | ✅ Complete |
| 11 | RBAC & Project Access Control | 3/3 | ✅ Complete |
| 12 | Real-Time Collaboration | 3/3 | ✅ Complete |
| 13 | Activity Tracking & Invitation Flow | 3/3 | ✅ Complete |
| 14 | Document Versioning | 5/5 | ✅ Complete |
| 15 | AI Pre-Submission Review | 3/3 | ✅ Complete |
| 16 | Milestone Gap Closure | 1/1 | ✅ Complete |

### Audit Fixes (2026-06-19)
Tech debt cleanup covering all findings from a full codebase audit:
- **CLAUDE.md**: Fully rewritten to match v2.0 reality (was frozen at Phase 3 state)
- **Node runtime**: firebase.json updated from `nodejs20` → `nodejs22`
- **scoreHandler concurrency**: Added `createConcurrencyPool(3)` to cap the 5 parallel persona evaluations (matches generation passes per D-04)
- **Locale sweep**: 38 new keys added to `es.ts`; hardcoded Spanish strings replaced with locale refs in `ContributorRow`, `ScreenplayParsedData`, `PriorProjectsList`, `ERPICompanyForm`
- **ERPICompanyForm textarea**: Native `<textarea>` replaced with shadcn `<Textarea>` component
- **Legacy promptLoader**: Import in `analyzeWithClaude.ts` migrated to pipeline version (Handlebars + language guardrail); `functions/src/utils/promptLoader.ts` deleted
- **E2E test IDs**: Hardcoded project ID consolidated to shared `e2e/helpers.ts` constant across all 8 spec files
- **Phase 14 Plan 04**: documentStore version snapshot tests verified — 6/6 pass with real assertions (zero stubs remain)
- **Verified**: TypeScript clean (frontend + backend), 352 unit tests pass, zero regressions
