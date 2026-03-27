# Milestones

## v2.0 Multi-User & Extended Modalities (Shipped: 2026-03-27)

**Phases completed:** 7 phases, 21 plans, 46 tasks

**Key accomplishments:**

- Firebase Auth with Google sign-in, AuthProvider context, route protection via ProtectedRoute, branded Spanish login page with dark mode, and AppHeader user avatar with cache-clearing logout
- Organization creation flow, v1.0 data migration (ownerId/orgId on projects + ERPI to org scope), ownership-filtered project queries, and org-scoped ERPI across frontend, validation, and Cloud Functions orchestrator
- Shared auth guard on all 8 Cloud Functions, owner-based Firestore security rules for projects/organizations/users, auth-gated Storage rules, and dev bypass login for local testing
- 4-role permission model with D-02 matrix, membership-based Firestore security rules replacing owner-only access, collaborators migration function, and upgraded Cloud Function guard returning role
- Complete project invitation flow with 4 Cloud Functions (invite/accept/decline/revoke), client service, and team management UI with pending invitations banner
- RBAC access gate in WizardShell with AccessDenied page for non-members, ReadOnlyBanner on view-only screens, hidden pipeline/export/delete actions per role, and role badges on dashboard project cards
- RTDB presence/lock plumbing with 4 hooks (usePresence, useProjectPresence, useSectionLock, useIdleDetection), forceBreakLock Cloud Function, and auth-gated security rules
- 5 presence/lock UI components (avatar ring colors, lock banner, force-break dialog) plus Spanish collaboration strings in es.ts
- WizardShell/Sidebar/AppHeader wired with presence hooks, section lock on edit intent, idle auto-release, lock-aware auto-save with flush-before-release, and RTDB sign-out cleanup
- TDD RED stubs for activity log service (8 tests) and invitation email flow (14 tests) defining behavioral contracts for Plans 01 and 02
- Field-level activity log with useAutoSave integration, 30-second coalescing, day-grouped feed with filter pills, and sidebar badge count
- Resend email delivery via onDocumentCreated trigger + InvitationPage deep link with 6 states and return URL pattern
- 19 test stubs covering diff computation (7 GREEN with Spanish prose), version snapshots (6 RED), and revert logic (6 RED) for Plans 01-03
- Pre-save document snapshot to Firestore subcollection with 10-version prune and userId threading across all 21 generation callsites
- 6 versioning UI components with diff library, word-level prose diff (diffWords), cell-level structured diff (diffJson), version history panel, and revert confirmation dialog with D-10/D-11 warnings
- revertDocumentVersion Cloud Function with copy-forward and soft downstream warning, DocumentViewer with history panel + diff comparison + revert confirmation dialog
- Replaced 6 expect.fail stubs with real firebase-admin mocked assertions verifying saveGeneratedDocument version snapshot, prune, and atomicity behavior
- 57 vitest it.todo stubs covering pre-submission review handler logic (personas, parsing, readiness, streaming) and UI states (6 states + readiness badges)
- 5 AI persona critique prompts with 2-pass review handler (parallel personas + coherence check) and streaming Cloud Function
- Complete review UI with streaming progress, finding checklist, coherence panel, and readiness badge integrated as fourth ScoreEstimationPanel tab
- Firestore userProjects self-access rule, Phase 12 formal verification (5/5 COLLAB requirements passed), and Phase 11 re-verification resolving orphaned TeamMembers gap

---

## v1.0 EFICINE Carpeta Generator (Shipped: 2026-03-25)

**Phases completed:** 11 phases, 31 plans, 63 tasks

**Key accomplishments:**

- Vite 8 + React 19 scaffold with Zod schemas matching Firestore model, MXN/date formatting, Spanish locale, EFICINE compliance calculator, and 35 passing tests
- Project dashboard with period-grouped cards, CRUD operations, and ERPI company settings page with auto-save
- Wizard shell with 240px sidebar navigation, Screen 1 (Datos del Proyecto) with 11 fields including co-production toggle, and Screen 3 (Equipo Creativo) with dynamic team member forms including filmography and in-kind contributions
- Screenplay PDF viewer with react-pdf, financial structure form with real-time EFICINE compliance panel reading team data, and document upload checklist with expiration tracking -- completing all 5 wizard screens
- Firebase Cloud Functions project with pdf-parse v2 text extraction, regex-based screenplay parser (scenes, characters, locations, INT/EXT/DIA/NOCHE breakdowns), and extractScreenplay callable Cloud Function storing parsed data in Firestore
- Claude API screenplay analysis via Cloud Function with prompt injection from prompts/analisis_guion.md, JSON response validation, Firestore storage, and frontend analysis CTA with loading/error/stale/success states and shooting day estimate display
- Handlebars prompt loader with language guardrail, IMCINE budget computation (100-1200 accounts), staleness tracking with cascade, and 28 passing tests
- Line Producer (5 docs) and Finance Advisor (3 docs) Cloud Functions with deterministic budget computation, parallel generation via concurrency pool, and streaming progress
- Legal pass with 5 contract documents using formatMXNLegal fee injection, combined pass with 8 synthesis documents including A4 director template and PITCH for corporate CFOs, completing the 4-pass generation pipeline backend
- Frontend generation screen with real-time pipeline progress via Firebase streaming, document list organized by EFICINE section, and wizard sidebar integration for triggering and monitoring the 4-pass document generation pipeline
- Document viewer with read/edit modes, real-time staleness detection via Firestore timestamp comparison with cascade propagation, and pass-level regeneration with confirmation dialog for edited documents
- Spreadsheet-like budget editor with IMCINE account structure (100-1200), auto-recalculating subtotals, downstream inconsistency warnings (D-16), dual-location auto-save for pipeline compatibility, and A4 Word export template
- 10 pure TypeScript validation rule functions (VALD-01 through VALD-10) with TDD test suite covering financial reconciliation, title consistency, fee matching, date compliance, EFICINE percentages, document completeness, experience thresholds, ERPI eligibility, file format, and prohibited expenditure
- 4 warning-level validation rules (ruta critica sync, hyperlink accessibility, bonus eligibility, document expiration) with dynamic severity for expired docs and bonus category recommendation engine
- Deterministic viability scoring (38 pts, 5 categories) with AI persona artistic scoring (5 parallel evaluator Cloud Function) and 69 Phase 4 Spanish locale strings
- Central engine orchestrator with three tiered entry points (instant 12 / medium 2 / all 14) mapping ProjectDataSnapshot to 14 rule functions per D-11 timing specification
- Real-time useValidation hook with tiered execution (instant 300ms debounce + medium on document timestamp change) wiring 7 Firestore sources, integrated into wizard sidebar with full-width ValidationDashboard route
- Two-panel validation dashboard with severity-grouped accordion rule rows, score estimation tabs (viability/artistic/bonus), AI persona evaluation via httpsCallable, and Ir al campo deep-link navigation
- Expiration badges at 3 touchpoints (project card, dashboard, upload screen), inline hyperlink verification with CORS fallback, and "Ir al campo" field highlighting across all wizard screens
- Wired 3 verification gaps: sidebar traffic light from validation report, bonus eligibility from team es_mujer/es_indigena_afromexicano, and ruta critica/cash flow extractors from A8b/A9d document content
- IMCINE file naming registry (21 docs), LANG-05 anglicism/format/title scanner, and NotoSans PDF font infrastructure with shared stylesheet
- 15 PDF templates (12 document + 3 meta-document) with pdfRenderer routing module for complete EFICINE carpeta rendering
- Full export pipeline with content adapters, ZIP compilation, 10 UI components, and wizard integration as 8th screen -- producer clicks "Exportar carpeta" and gets organized ZIP ready for SHCP portal upload
- Fixed 5 Firestore path wiring bugs in useValidation, DocumentUpload, and engine.ts that caused validation rules to receive empty data and produce false-green traffic lights
- Fee cross-match extractors reading budget_output cuentas and team honorarios, plus ERPI submission tracking and regional bonus schema/UI fields for VALD-03/08/13
- Per-screen traffic light derivation from validation results with deriveScreenStatuses, plus regional bonus category (c) data flow from project metadata to engine
- VALD-06 namespace alignment: REQUIRED_DOCUMENTS keys now match DocumentChecklist tipo values, hasExclusiveContribution wired from ERPI in-kind data
- Added cv_productor upload entry to DocumentChecklist REQUIRED_UPLOADS, closing the last namespace gap that permanently blocked VALD-06 and export
- Fixed role name mismatch in viability scoring (Productor/Director vs Productor/a/Director/a) and populated 7 scoring signals from Firestore subscriptions so viability score reflects actual project state
- estimateScore Cloud Function self-reads A3/A4/A5 from Firestore, ProjectCard shows real validation pass rate, locale compliance fix
- Wired VALD-09 (IMCINE filename compliance) and VALD-12 (filmography hyperlink accessibility) data sources so both rules produce real results instead of permanently skipping

---
