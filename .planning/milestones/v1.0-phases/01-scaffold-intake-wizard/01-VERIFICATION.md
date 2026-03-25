---
phase: 01-scaffold-intake-wizard
verified: 2026-03-22T14:05:00Z
status: gaps_found
score: 12/13 must-haves verified
gaps:
  - truth: "Dates formatted in Spanish ('15 de julio de 2026' or 'Agosto 2026') throughout the UI per LANG-03"
    status: partial
    reason: "formatDateES and formatMonthYearES are implemented and fully tested, but DocumentChecklist.tsx uses toLocaleDateString('es-MX') which produces numeric format '14/7/2026' instead of '15 de julio de 2026'. No component outside tests calls formatDateES or formatMonthYearES."
    artifacts:
      - path: "src/components/wizard/DocumentChecklist.tsx"
        issue: "Line 190 uses toLocaleDateString('es-MX') producing '14/7/2026' instead of formatDateES() producing '15 de julio de 2026'"
    missing:
      - "Replace `new Date(record.uploadedAt).toLocaleDateString('es-MX')` with `formatDateES(new Date(record.uploadedAt))` in DocumentChecklist.tsx"
      - "Audit any future date display additions to enforce formatDateES/formatMonthYearES usage"
human_verification:
  - test: "End-to-end wizard navigation"
    expected: "All 5 wizard screens render in Spanish with correct content; sidebar navigation works freely; auto-save persists data across page refresh; MXN amounts format correctly on blur"
    why_human: "Requires running dev server and interacting with Firebase (real credentials needed for data persistence)"
  - test: "Compliance panel real-time update"
    expected: "Typing in financial fields updates compliance percentages instantly without debounce lag; in-kind total reflects team Screen 3 data correctly"
    why_human: "Requires Firestore data and live form interaction"
  - test: "Dark mode via system preference"
    expected: "Toggling OS dark mode immediately switches all pages to dark variant; no elements remain light-mode-only"
    why_human: "Requires OS-level dark mode toggle and visual inspection"
  - test: "No English visible anywhere in UI"
    expected: "All buttons, labels, placeholders, error messages, tooltips, and toasts are in Mexican Spanish"
    why_human: "Cannot exhaustively verify all rendered strings programmatically without running the app"
---

# Phase 01: Scaffold + Data Model + Intake Wizard Verification Report

**Phase Goal:** User can create and manage EFICINE projects, enter all required data through a guided Spanish-language wizard, and upload supporting documents
**Verified:** 2026-03-22T14:05:00Z
**Status:** gaps_found (1 gap — LANG-03 partial compliance)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Vite dev server starts and renders a React page | ? HUMAN | package.json, vite.config.ts, index.html all present; build not run in verification |
| 2  | Zod schemas validate project metadata fields matching modulo_a.json structure | VERIFIED | `projectMetadataSchema` exports verified; field names `titulo_proyecto`, `categoria_cinematografica`, `monto_solicitado_eficine_centavos` match JSON schema. Note: JSON uses `_mxn` suffix, TypeScript uses `_centavos` suffix — intentional storage unit distinction, both documents refer to the same concept |
| 3  | formatMXN(2500000000) returns '$25,000,000 MXN' | VERIFIED | test passes: `format.test.ts` line verified; function exported from `src/lib/format.ts` |
| 4  | formatDateES produces '15 de julio de 2026' format | VERIFIED | test passes; function exported; but see Truth #13 for LANG-03 gap |
| 5  | EFICINE compliance calculator correctly flags violations | VERIFIED | 8 compliance tests all pass; `calculateCompliance` exported from `src/hooks/useCompliance.ts` with correct Spanish violation messages |
| 6  | All UI string constants are in Mexican Spanish with no English | VERIFIED | `src/locales/es.ts` (161 lines) contains all screen labels, error messages, status strings, button text in Spanish; no English user-facing strings found in components |
| 7  | Firebase SDK initializes without errors | VERIFIED | `src/lib/firebase.ts` exports `app`, `db`, `storage` via correct Firebase v12 API |
| 8  | User sees 'Mis Proyectos' dashboard with period-grouped project cards | VERIFIED | `DashboardPage.tsx` (159 lines) uses `listProjects()` via useQuery; `PeriodGroup.tsx` renders grid; `ProjectCard.tsx` shows title/genre/period/budget/days-remaining |
| 9  | User can create, delete, and clone projects with Spanish confirmation dialogs | VERIFIED | `DashboardPage.tsx` imports and calls `createProject`, `deleteProject`, `cloneProject` from `src/services/projects.ts`; delete dialog text present |
| 10 | User can navigate to ERPI settings and enter shared company data | VERIFIED | `ERPISettingsPage.tsx` (162 lines) at route `/erpi`; `ERPICompanyForm.tsx` has all 4 required fields; `getERPISettings`/`updateERPISettings` wired |
| 11 | Wizard has 5 navigable screens with sidebar traffic lights | VERIFIED | `WizardShell.tsx` reads `projectId` from `useParams`; `WizardSidebar.tsx` renders 5 Link items with `TrafficLight` components; all screens mapped in shell |
| 12 | Screen 1 captures all INTK-01 fields with Zod validation and co-production toggle | VERIFIED | `ProjectSetup.tsx` (503 lines) has all required fields; co-production switch reveals `tipo_cambio_fx`/`fecha_tipo_cambio`/territorial split inline; `zodResolver` with schema that mirrors `projectMetadataSchema` |
| 13 | Dates formatted as '15 de julio de 2026' or 'Agosto 2026' throughout UI | FAILED | `formatDateES` and `formatMonthYearES` exist and are tested, but `DocumentChecklist.tsx` line 190 uses `toLocaleDateString('es-MX')` producing numeric `14/7/2026` format instead. No other component calls `formatDateES` in production code. |
| 14 | User can add team members with fees, in-kind contributions, filmography | VERIFIED | `CreativeTeam.tsx`/`TeamMemberForm.tsx` implement dynamic list; in-kind <= honorarios validated; `Agregar obra` for filmography; `es_socio_erpi` toggle present |
| 15 | Screen 4 financial structure with real-time compliance panel | VERIFIED | `FinancialStructure.tsx` (395 lines) queries team subcollection to compute `totalInkindHonorariosCentavos` and `screenwriterFeeCentavos`; passes both to `calculateCompliance()`; `CompliancePanel.tsx` (107 lines) renders 6 metrics with violation list |
| 16 | User can upload screenplay PDF and manually edit parsed data | VERIFIED | `ScreenplayUpload.tsx` uses `uploadFile` + `ScreenplayViewer` (react-pdf) + `ScreenplayParsedData`; manual fallback warning shown when status not 'parsed'/'pending'; add/remove locations and characters wired |
| 17 | User can upload supporting documents and track which are missing | VERIFIED | `DocumentChecklist.tsx` has all 13 document types from INTK-08; Faltante/Subido/Vencido badges via `es.screen5` locale; `uploadFile` wired; `fecha_emision` tracked for expiration |
| 18 | MXN fields format on blur to $X,XXX,XXX MXN | VERIFIED | `MXNInput.tsx` calls `formatMXN` on blur, `parseMXNInput` on focus; used in ProjectSetup, TeamMemberForm, FinancialStructure, ContributorRow, CompliancePanel |

**Score:** 17/18 truths verified (LANG-03 date format gap in one component)

---

## Required Artifacts

| Artifact | Min Lines | Actual | Status | Details |
|----------|-----------|--------|--------|---------|
| `src/schemas/project.ts` | — | 52 | VERIFIED | Exports `projectMetadataSchema`, `ProjectMetadata`; co-production refine present |
| `src/lib/format.ts` | — | 37 | VERIFIED | Exports `formatMXN`, `parseMXNInput`, `formatDateES`, `formatMonthYearES` |
| `src/locales/es.ts` | — | 161 | VERIFIED | Contains `Mis Proyectos`, `Guardando...`, `Guardado`, all screen labels |
| `src/hooks/useCompliance.ts` | — | 149 | VERIFIED | Exports `calculateCompliance`, `ComplianceResult` interface |
| `src/hooks/useAutoSave.ts` | — | 61 | VERIFIED | Exports `useAutoSave` with debounce, retry, and status |
| `src/components/dashboard/DashboardPage.tsx` | 50 | 159 | VERIFIED | Period grouping, CRUD wiring, useQuery |
| `src/components/dashboard/ProjectCard.tsx` | 40 | 163 | VERIFIED | formatMXN, navigate to /project/{id}/datos, action buttons |
| `src/components/erpi/ERPISettingsPage.tsx` | 40 | 162 | VERIFIED | getERPISettings/updateERPISettings wired, useAutoSave |
| `src/components/wizard/WizardShell.tsx` | 30 | 65 | VERIFIED | 240px sidebar reference via WizardSidebar, useParams |
| `src/components/wizard/WizardSidebar.tsx` | 30 | 74 | VERIFIED | 5 screen Links, TrafficLight, back-to-dashboard |
| `src/components/wizard/ProjectSetup.tsx` | 60 | 503 | VERIFIED | All INTK-01 fields, zodResolver, useAutoSave, MXNInput, co-prod toggle |
| `src/components/wizard/CreativeTeam.tsx` | 60 | 97 | VERIFIED | Dynamic member list, delegates to TeamMemberForm |
| `src/components/common/MXNInput.tsx` | 20 | 86 | VERIFIED | formatMXN/parseMXNInput on blur/focus |
| `src/components/wizard/ScreenplayUpload.tsx` | 50 | 277 | VERIFIED | Side-by-side layout, uploadFile, ScreenplayViewer, ScreenplayParsedData |
| `src/components/wizard/FinancialStructure.tsx` | 80 | 395 | VERIFIED | calculateCompliance, team subcollection read, compliance panel |
| `src/components/common/CompliancePanel.tsx` | 40 | 107 | VERIFIED | ComplianceResult prop, 6 metrics, violations list |
| `src/components/wizard/DocumentUpload.tsx` | 50 | 80 | VERIFIED | Renders DocumentChecklist with projectId |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/schemas/project.ts` | `schemas/modulo_a.json` | field name alignment | VERIFIED | `titulo_proyecto`, `categoria_cinematografica` match; `_centavos` vs `_mxn` suffix is intentional unit distinction |
| `src/components/dashboard/DashboardPage.tsx` | `src/services/projects.ts` | createProject, deleteProject, cloneProject | VERIFIED | All three imported and called on user actions |
| `src/components/dashboard/ProjectCard.tsx` | `src/lib/format.ts` | formatMXN | VERIFIED | Both budget fields formatted via formatMXN |
| `src/components/erpi/ERPISettingsPage.tsx` | `src/services/erpi.ts` | getERPISettings, updateERPISettings | VERIFIED | Both imported and wired |
| `src/components/wizard/ProjectSetup.tsx` | `src/schemas/project.ts` | zodResolver with equivalent schema | VERIFIED | Local `projectFormSchema` is structurally identical to `projectMetadataSchema` with same fields/types/refines |
| `src/components/wizard/TeamMemberForm.tsx` | `src/schemas/team.ts` | zodResolver with equivalent schema | VERIFIED | Local `teamMemberFormSchema` is structurally identical to `teamMemberSchema` |
| `src/components/common/MXNInput.tsx` | `src/lib/format.ts` | formatMXN + parseMXNInput | VERIFIED | Both called on blur/focus handlers |
| `src/components/wizard/FinancialStructure.tsx` | `src/hooks/useCompliance.ts` | calculateCompliance() | VERIFIED | Imported and called with all 9 params including team subcollection data |
| `src/components/common/CompliancePanel.tsx` | `src/hooks/useCompliance.ts` | ComplianceResult type | VERIFIED | Imported and used for prop type |
| `src/components/wizard/ScreenplayUpload.tsx` | `src/schemas/screenplay.ts` | screenplaySchema.safeParse | VERIFIED | Schema used for data validation |
| `src/components/wizard/DocumentChecklist.tsx` | `src/services/storage.ts` | uploadFile() | VERIFIED | Imported and called on file selection |
| `src/components/wizard/FinancialStructure.tsx` | Firestore team subcollection | useQuery reads aportacion_especie_centavos + Guionista honorarios | VERIFIED | Lines 67–133 query team, sum inkind, extract screenwriter fee |

---

## Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| INTK-01 | 01-01, 01-03 | Create project with all core metadata fields | SATISFIED | All 10 fields in ProjectSetup.tsx with Zod validation |
| INTK-02 | 01-01, 01-02, 01-03 | Period selector (P1/P2) per project | SATISFIED | `periodo_registro` in ProjectSetup with PERIODOS_EFICINE options; drives daysRemaining in ProjectCard |
| INTK-03 | 01-02 | Manage projects with isolated data and project selector | SATISFIED | Each project has isolated Firestore path `projects/{projectId}/...`; ProjectCard navigates to `/project/{id}/datos`; no project limit enforced (D-07) |
| INTK-04 | 01-04 | Upload screenplay PDF and view parsed breakdown | SATISFIED | ScreenplayUpload has side-by-side viewer+editor; uploadFile stores PDF; ScreenplayParsedData shows scenes/locations/characters |
| INTK-05 | 01-04 | Correct/override parsed screenplay data | SATISFIED | All parsed data fields editable; add/remove locations and characters; manual fallback banner when status != 'parsed' |
| INTK-06 | 01-01, 01-03 | Enter creative team data per role with fee and in-kind | SATISFIED | TeamMemberForm has all fields; in-kind <= honorarios validated; filmography dynamic list |
| INTK-07 | 01-02, 01-04 | Enter financial structure | SATISFIED | FinancialStructure has ERPI (cash+especie), dynamic contributors, read-only EFICINE amount, gestor toggle |
| INTK-08 | 01-04 | Upload manually-provided documents | SATISFIED | DocumentChecklist has all 13 required document types from spec |
| INTK-09 | 01-02, 01-04 | Track document upload status and missing | SATISFIED | Faltante/Subido/Vencido badges; fecha_emision expiry tracking; count summary shown |
| INTK-10 | 01-01, 01-03, 01-04 | Entire UI in Mexican Spanish | SATISFIED | All user-visible strings in es.ts in Spanish; components reference locale keys; no English user-facing text found in component scan |
| INTK-11 | 01-01, 01-03, 01-04 | Co-production flag with required fields | SATISFIED | Switch in ProjectSetup reveals tipo_cambio_fx, fecha_tipo_cambio, territorial split inline; conditional Zod refine enforces required fields when enabled |
| LANG-02 | 01-01, 01-03 | Monetary amounts as $X,XXX,XXX MXN | SATISFIED | formatMXN used in ProjectCard, FinancialStructure, CompliancePanel, MXNInput (all monetary display points) |
| LANG-03 | 01-01 | Dates in Spanish format ("15 de julio de 2026") | PARTIAL | formatDateES is implemented and tested. However, DocumentChecklist.tsx line 190 uses `toLocaleDateString('es-MX')` producing numeric format `14/7/2026`. No other component calls formatDateES in production code. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/wizard/ProjectSetup.tsx` | 491 | `{/* Certificado IMCINE placeholder */}` — renders informational text redirecting to Screen 5 | Info | Not a functional stub; redirects user to upload in Documentos screen, which is correct per plan spec |
| `src/components/dashboard/ProjectCard.tsx` | 70–76 | `{/* Completion placeholder */}` — hardcoded `w-0` progress bar and `0%` text | Warning | Project readiness/completion % is always shown as 0% — computed completion will be added in Phase 3 validation engine. Does not block Phase 1 goal but leaves a non-functional UI element |
| `src/components/wizard/DocumentChecklist.tsx` | 190 | `toLocaleDateString('es-MX')` produces `14/7/2026` | Blocker | Violates LANG-03 requirement; format is numeric not written-out Spanish |

---

## Human Verification Required

### 1. End-to-end wizard in browser

**Test:** Start dev server, create a new project, navigate all 5 wizard screens, enter data, refresh — verify persistence
**Expected:** Data survives page refresh; sidebar navigation is free (no locking); auto-save indicator shows Guardando... then Guardado
**Why human:** Requires Firebase credentials and live Firestore interaction

### 2. Real-time compliance panel

**Test:** On Screen 4, enter ERPI contribution amounts, add a third-party contributor, watch the compliance panel
**Expected:** Percentages update instantly on keystroke, not only after form blur or save; violations appear/disappear as values cross thresholds
**Why human:** Requires live React state with form watch() interaction

### 3. System dark mode

**Test:** Set OS to dark mode, load the app
**Expected:** All pages render correctly in dark variant (dark: classes active via AppHeader's matchMedia listener)
**Why human:** Requires OS-level toggle and visual inspection

### 4. No English visible in UI

**Test:** Walk through every screen, every state (empty, loading, error, filled)
**Expected:** Zero English text visible in buttons, labels, placeholders, toasts, error messages, tooltips
**Why human:** Cannot exhaustively render all conditional states programmatically

---

## Gaps Summary

One gap blocks full LANG-03 compliance:

**LANG-03 partial — date format in DocumentChecklist.tsx (line 190).** The `formatDateES` utility is fully implemented and passes all tests, but `DocumentChecklist.tsx` bypasses it and calls `new Date(...).toLocaleDateString('es-MX')` directly, which produces numeric `14/7/2026` instead of the required `15 de julio de 2026`. The fix is a one-line change: replace the `toLocaleDateString` call with `formatDateES(new Date(record.uploadedAt))`.

This is the only gap. All other 12 requirements (INTK-01 through INTK-11, LANG-02) are fully satisfied. All 35 unit tests pass. All component artifacts exist with substantive implementations. All critical wiring connections (services, schemas, compliance calculator, team subcollection read) are verified.

The completion % indicator in ProjectCard (always showing 0%) is a noted placeholder but does not block Phase 1 goal — it will be computed by the Phase 3 validation engine.

---

_Verified: 2026-03-22T14:05:00Z_
_Verifier: Claude (gsd-verifier)_
