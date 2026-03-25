---
phase: 01-scaffold-intake-wizard
plan: 04
subsystem: ui
tags: [react, react-pdf, shadcn, compliance, wizard, firebase-storage, screenplay, financial]

# Dependency graph
requires:
  - phase: 01-scaffold-intake-wizard/01-03
    provides: Wizard shell with sidebar, Screen 1 (ProjectSetup), Screen 3 (CreativeTeam), auto-save, MXNInput
provides:
  - Screen 2 (Guion) with PDF viewer + parsed data editor for screenplay upload and manual correction
  - Screen 4 (Estructura Financiera) with real-time EFICINE compliance panel reading team subcollection
  - Screen 5 (Documentos) with document checklist, upload tracking, and expiration date monitoring
  - Complete 5-screen intake wizard end-to-end functional
affects: [02-screenplay-processing, 03-ai-generation, 04-validation-engine]

# Tech tracking
tech-stack:
  added: [react-pdf v10]
  patterns: [side-by-side PDF viewer + data editor, real-time compliance calculation from form watch(), dynamic contributor list, document checklist with status badges]

key-files:
  created:
    - src/components/wizard/ScreenplayUpload.tsx
    - src/components/wizard/ScreenplayViewer.tsx
    - src/components/wizard/ScreenplayParsedData.tsx
    - src/components/wizard/FinancialStructure.tsx
    - src/components/wizard/ContributorRow.tsx
    - src/components/common/CompliancePanel.tsx
    - src/components/wizard/DocumentUpload.tsx
    - src/components/wizard/DocumentChecklist.tsx
  modified:
    - src/components/wizard/WizardShell.tsx

key-decisions:
  - "react-pdf v10 with local pdfjs-dist worker for screenplay PDF display"
  - "Compliance panel reads team subcollection for in-kind totals and screenwriter fee, passes to calculateCompliance()"
  - "Document checklist hardcodes REQUIRED_UPLOADS list matching EFICINE document requirements"
  - "FinancialStructure uses watch() for real-time compliance updates (not Firestore reads)"

patterns-established:
  - "Side-by-side viewer pattern: left panel for document display, right panel for editable structured data"
  - "Compliance panel as always-visible 280px fixed right panel computing percentages in real time"
  - "Dynamic row pattern: contributor list with add/remove buttons using useFieldArray"
  - "Document checklist pattern: required uploads with status badges (Subido/Faltante/Vencido) and expiration tracking"

requirements-completed: [INTK-04, INTK-05, INTK-07, INTK-08, INTK-09, INTK-10, INTK-11, LANG-02]

# Metrics
duration: 10min
completed: 2026-03-22
---

# Phase 01 Plan 04: Remaining Wizard Screens Summary

**Screenplay PDF viewer with react-pdf, financial structure form with real-time EFICINE compliance panel reading team data, and document upload checklist with expiration tracking -- completing all 5 wizard screens**

## Performance

- **Duration:** ~10 min (across execution sessions)
- **Started:** 2026-03-21T19:14:58Z
- **Completed:** 2026-03-22T19:53:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files created:** 8
- **Files modified:** 1

## Accomplishments
- Screen 2 (Guion) provides side-by-side layout with react-pdf PDF viewer on the left and editable parsed data (scenes, locations, characters) on the right, with manual entry fallback when no PDF is uploaded
- Screen 4 (Estructura Financiera) renders the financial form with ERPI contributions, dynamic third-party contributor list, gestor toggle, and a permanently visible 280px compliance panel that updates percentages in real time via watch()
- Screen 4 queries the Firestore team subcollection to sum in-kind contributions (totalInkindHonorariosCentavos) and extract the screenwriter fee (screenwriterFeeCentavos), passing both to calculateCompliance()
- Screen 5 (Documentos) displays a checklist of 13 required document types with upload status badges, file upload via Firebase Storage, and fecha_emision tracking for documents that expire
- WizardShell updated to replace all placeholder screens with real components -- all 5 wizard screens now functional

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Screen 2 (Guion) + Screen 5 (Documentos)** - `abfd3ab4` (feat)
2. **Task 2: Build Screen 4 (Estructura Financiera) with compliance panel** - `7cbb388e` (feat)
3. **Task 3: End-to-end verification** - checkpoint:human-verify (approved, no commit needed)

**Auto-fix commit:** `90a6ddf6` (fix) - Corrected react-pdf v10 CSS import paths

## Files Created/Modified
- `src/components/wizard/ScreenplayUpload.tsx` - Screen 2 container: side-by-side layout with PDF upload, viewer, and parsed data editor (277 lines)
- `src/components/wizard/ScreenplayViewer.tsx` - react-pdf v10 continuous scroll PDF viewer with loading/error states (69 lines)
- `src/components/wizard/ScreenplayParsedData.tsx` - Editable scene/location/character data with summary cards and manual entry fallback (358 lines)
- `src/components/wizard/FinancialStructure.tsx` - Screen 4: ERPI contributions, dynamic contributors, gestor toggle, team data query, compliance panel integration (395 lines)
- `src/components/wizard/ContributorRow.tsx` - Single contributor row with name, tipo, monto, efectivo/especie fields (95 lines)
- `src/components/common/CompliancePanel.tsx` - 280px panel displaying 6 EFICINE compliance metrics with traffic light indicators (107 lines)
- `src/components/wizard/DocumentUpload.tsx` - Screen 5 container: document checklist with upload instructions (80 lines)
- `src/components/wizard/DocumentChecklist.tsx` - 13 required document types with status badges, file upload, and expiration tracking (272 lines)
- `src/components/wizard/WizardShell.tsx` - Updated to import and render real screen components instead of placeholders

## Decisions Made
- **react-pdf v10 with local worker:** Used `pdfjs-dist/build/pdf.worker.min.mjs` via `import.meta.url` for the PDF.js worker, avoiding CDN dependency
- **Compliance from watch() not Firestore:** FinancialStructure uses React Hook Form `watch()` for instant compliance updates as the user types, avoiding debounce delay from Firestore reads
- **Team data via Firestore query:** FinancialStructure reads the team subcollection directly to compute in-kind totals, keeping Screen 3 as the single source of truth for per-person in-kind amounts
- **Document checklist hardcoded:** The 13 required upload types are defined as a const array in DocumentChecklist.tsx, matching EFICINE Section A-E requirements

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed react-pdf v10 CSS import paths**
- **Found during:** Task 1 verification
- **Issue:** CSS imports for AnnotationLayer and TextLayer used incorrect paths for react-pdf v10
- **Fix:** Updated import paths to correct react-pdf v10 CSS locations
- **Files modified:** `src/components/wizard/ScreenplayViewer.tsx`
- **Verification:** Build compiles without CSS import errors
- **Committed in:** `90a6ddf6`

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor CSS path correction, no scope change.

## Issues Encountered
None beyond the CSS import fix documented above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components render real data from Firestore and accept user input. Screenplay parsing (AI-powered text extraction) is intentionally deferred to Phase 2 as specified in the plan; manual entry is fully functional.

## Next Phase Readiness
- All 5 wizard screens are functional: project setup, screenplay upload, creative team, financial structure, documents
- Phase 1 is complete -- all intake data can be entered, persisted, and validated
- Phase 2 (Screenplay Processing) can build on the Screen 2 PDF viewer and parsed data structure, replacing the manual-only flow with AI-powered extraction
- The compliance panel is ready for Phase 4 to expand with additional validation rules

## Self-Check: PASSED

- All 9 files verified present on disk
- All 3 commits (abfd3ab4, 7cbb388e, 90a6ddf6) verified in git log
- SUMMARY.md exists at expected path

---
*Phase: 01-scaffold-intake-wizard*
*Completed: 2026-03-22*
