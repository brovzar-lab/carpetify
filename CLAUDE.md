# CARPETIFY

Internal web tool for Lemon Studios that takes a feature film screenplay (PDF) and project metadata, then generates a complete EFICINE Article 189 submission dossier ("carpeta") — the ~30-document package required by IMCINE for the Mexican film tax incentive. Single producer, up to 3 projects per registration period. This is a legal compliance tool — financial calculations and document rules must match the 2026 Lineamientos exactly.

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
| Backend | Firebase (Firestore, Storage, Functions v2, Hosting) | 12.11 |
| AI | Anthropic SDK in Cloud Functions | 0.80 |
| PDF input | pdf-parse (server), pdfjs-dist via react-pdf (client) | 2.4 / 10.4 |
| Unit tests | Vitest + Testing Library + jsdom | 4.1 |
| E2E tests | Playwright | 1.58 |
| Icons | Lucide React | 0.577 |
| Toasts | Sonner | 2.0 |

## Project Structure

```
├── src/                      # Frontend React app
│   ├── main.tsx              # Entry: QueryClientProvider + Toaster wrapping App
│   ├── App.tsx               # BrowserRouter with 4 routes
│   ├── index.css             # Tailwind v4 config, shadcn theme vars, status colors
│   ├── components/
│   │   ├── ui/               # shadcn primitives — DO NOT edit manually, use `npx shadcn add`
│   │   ├── wizard/           # 5-screen intake wizard (WizardShell, ProjectSetup, ScreenplayUpload, CreativeTeam, FinancialStructure, DocumentChecklist)
│   │   ├── dashboard/        # DashboardPage, ProjectCard, PeriodGroup, EmptyState
│   │   ├── erpi/             # ERPISettingsPage, ERPICompanyForm, PriorProjectsList
│   │   ├── layout/           # AppHeader (dark mode toggle)
│   │   └── common/           # MXNInput, TrafficLight, CompliancePanel, AutoSaveIndicator
│   ├── schemas/              # Zod runtime validation (project, team, financials, screenplay, erpi, documents)
│   ├── services/             # Firestore CRUD: projects.ts, erpi.ts, storage.ts
│   ├── stores/               # Zustand: appStore (activeProjectId), wizardStore (activeScreen, sidebarOpen)
│   ├── hooks/                # useAutoSave (1500ms debounce + retry), useCompliance (EFICINE rules), use-mobile
│   ├── lib/
│   │   ├── firebase.ts       # Firebase init (Firestore, Storage, Functions, Auth)
│   │   ├── format.ts         # formatMXN, parseMXNInput, formatDateES, formatMonthYearES
│   │   ├── constants.ts      # EFICINE thresholds, periodos, categorias, cargos
│   │   └── utils.ts          # cn() helper
│   ├── locales/es.ts         # ALL Spanish UI strings — single source of truth
│   ├── parsers/              # Client-side screenplay parser (pdfjs-dist)
│   └── types/index.ts        # Re-exports from schemas + Project interface
├── functions/                # Cloud Functions — SEPARATE npm project, Node 22
│   ├── src/
│   │   ├── index.ts          # 6 callables: extractScreenplay, analyzeScreenplay, runLineProducerPass, runFinanceAdvisorPass, runLegalPass, runCombinedPass
│   │   ├── screenplay/       # extractWithClaude, analyzeHandler, analyzeWithClaude, validateAnalysis, types
│   │   ├── pipeline/         # orchestrator, passes/ (lineProducer, financeAdvisor, legal, combined)
│   │   └── claude/           # client.ts (shared Claude client init)
│   ├── package.json          # firebase-functions v2, @anthropic-ai/sdk, pdf-parse
│   └── tsconfig.json         # nodenext, es2022, outDir: lib
├── e2e/                      # Playwright tests (es-MX locale, baseURL localhost:5174)
├── directives/               # Read-only spec documents
│   ├── app_spec.md           # Full architecture + EFICINE rules
│   └── politica_idioma.md    # Language policy + protected terms
├── prompts/                  # 11 Spanish AI prompts with {{variable}} placeholders
├── schemas/                  # JSON Schema reference specs (modulo_a-e, export_manager) — NOT runtime code
├── references/               # scoring_rubric.md, validation_rules.md
├── .planning/                # GSD state, roadmap, requirements, phase plans
└── public/                   # favicon
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `DashboardPage` | Project list grouped by EFICINE period |
| `/project/:projectId` | `WizardShell` | 5-screen wizard (defaults to "datos") |
| `/project/:projectId/:screen` | `WizardShell` | Specific wizard screen |
| `/erpi` | `ERPISettingsPage` | Shared ERPI company settings |

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
```

Cloud Functions use `ANTHROPIC_API_KEY` via Firebase Secret Manager (not in `.env`).

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

### Firebase
- Project ID: `carpetify-mx`
- Hosting: serves `dist/`, SPA rewrite to `index.html`
- Functions runtime: Node 22, region: `us-central1`
- Functions predeploy: copies `prompts/` into `functions/prompts/` for runtime access
- Auth: Firebase Auth with Google sign-in (added in v2.0)

## Key Patterns

### Authentication
Firebase Auth with Google sign-in. `AuthProvider` in `src/contexts/AuthContext.tsx` wraps the app and exposes `useAuth()` hook with `user`, `loading`, `signInWithGoogle()`, `signOut()`. `ProtectedRoute` redirects unauthenticated users to `/login`. All Cloud Functions check `request.auth` before executing. Firestore security rules enforce owner-based access.

### Two Separate TypeScript Projects
Root is the Vite frontend (`@/` alias → `./src/`). `functions/` is the Cloud Functions project (nodenext modules). Separate `package.json`, `tsconfig.json`, `node_modules`. Never import across the boundary.

### Financial Calculations
All money in centavos (integer arithmetic). EFICINE thresholds in `src/lib/constants.ts`. Compliance engine in `src/hooks/useCompliance.ts` — checks 7 rules (ERPI min 20%, EFICINE max 80%, cap $25M, federal max 80%, screenwriter min 3%, in-kind max 10%, gestor cap 4-5%). Violations classified as `blocker` or `warning`.

### Auto-Save
`useAutoSave` hook: 1500ms debounce, 3 retries with exponential backoff, flush on unmount. Writes to `projects/{projectId}/{path}/data` in Firestore with merge.

### Forms
React Hook Form with `onTouched` validation mode (errors appear after field blur). Zod schemas in `src/schemas/` provide runtime validation. Each team member form has its own independent useForm instance.

### Screenplay Pipeline
1. Upload PDF → Firebase Storage via `services/storage.ts`
2. `extractScreenplay` Cloud Function: downloads from Storage, extracts text with pdf-parse, sends text to Claude (claude-haiku-4-5) for structured scene/character/location extraction via tool_use, stores breakdown in `projects/{projectId}/screenplay/data`
3. User-triggered `analyzeScreenplay` Cloud Function: reads parsed data, calls Claude (claude-haiku-4-5) with `prompts/analisis_guion.md`, validates response, stores analysis
4. Client-side parser (`src/parsers/screenplayParser.ts`) uses pdfjs-dist for local preview

### Wizard Screens
5 screens identified by slug: `datos`, `guion`, `equipo`, `financiera`, `documentos`. State managed in `wizardStore`. URL-synced via `/project/:projectId/:screen`.

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
- **Cloud Function timeouts**: `analyzeScreenplay` uses 540s (Firebase max for callable). Long screenplays may approach this limit.
- **Zod schemas for Claude tool_use**: Schemas passed to `z.toJSONSchema()` for Claude tool definitions must NOT use `.transform()` — Zod v4 cannot serialize transforms to JSON Schema. Apply normalization post-parse instead.
- **Screenplay token limits**: `extractWithClaude.ts` sends extracted text (not raw PDF) to Claude. Raw PDF as base64 can exceed the 200K token limit for long screenplays. Text is truncated at 300K chars as a safety valve.

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

## Current Status (2026-03-23)

**Phase 1 — Scaffold + Intake Wizard:** Complete. Dashboard with period-grouped cards, 5-screen wizard, ERPI settings, auto-save, compliance panel, dark mode, MXN formatting.

**Phase 2 — Screenplay Processing:** Complete. PDF upload to Storage, Cloud Function text extraction (pdf-parse), regex structure parsing, Claude analysis via Cloud Function, results display with stale detection.

**Phase 3 — AI Document Generation Pipeline:** Next up. 6 plans written (not yet executed). 4-pass generation: Line Producer → Finance Advisor → Legal → Combined. ~20 documents with staleness tracking and one-click regeneration.

**Phase 4 — Validation Engine + Dashboard:** Not started. 17 compliance rules, traffic light dashboard, score estimation.

**Phase 5 — Export Manager:** Not started. PDF generation, IMCINE file naming, ZIP packaging.

**Phase 10 — Authentication & Identity:** In progress. Firebase Auth with Google sign-in, route protection, data migration.

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow

Before making code changes, use a GSD command so planning artifacts stay in sync:
- `/gsd:quick` — small fixes, doc updates
- `/gsd:debug` — investigation and bug fixing
- `/gsd:execute-phase` — planned phase work
- `/gsd:progress` — check current state and next action

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
