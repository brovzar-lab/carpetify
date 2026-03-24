---
phase: 05-export-manager
plan: 01
subsystem: export
tags: [react-pdf, jszip, file-naming, language-check, pdf-fonts, imcine]

# Dependency graph
requires:
  - phase: 03-ai-doc-generation
    provides: FRONTEND_DOC_REGISTRY with 21 document IDs and section mappings
  - phase: 01-scaffold-intake-wizard
    provides: DocumentChecklist REQUIRED_UPLOADS with 13 upload document types
provides:
  - EXPORT_FILE_MAP registry mapping 21 doc IDs to IMCINE-compliant filenames and folders
  - sanitizeProjectAbbrev and generateFilename for filename sanitization
  - UPLOADED_DOC_FOLDER_MAP for routing uploaded docs to ZIP folders
  - runLanguageCheck LANG-05 pre-export language scanner
  - NotoSans font registration for PDF Spanish character support
  - pdfStyles shared stylesheet for all PDF templates
  - ExportFileEntry, ExportProgress, TemplateType shared types
affects: [05-02-pdf-templates, 05-03-export-pipeline]

# Tech tracking
tech-stack:
  added: ["@react-pdf/renderer 4.3.2", "@ag-media/react-pdf-table", "jszip 3.10.1", "file-saver 2.0.5", "@types/file-saver"]
  patterns: ["Document-to-filename registry pattern", "Word-boundary anglicism scanner", "Variable font file reuse for weight registration"]

key-files:
  created:
    - src/lib/export/types.ts
    - src/lib/export/fileNaming.ts
    - src/lib/export/folderStructure.ts
    - src/lib/export/languageCheck.ts
    - src/components/pdf/fonts.ts
    - src/components/pdf/styles.ts
    - src/__tests__/export/fileNaming.test.ts
    - src/__tests__/export/languageCheck.test.ts
    - public/fonts/NotoSans-Regular.ttf
    - public/fonts/NotoSans-Bold.ttf
    - public/fonts/NotoSans-Italic.ttf
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "NotoSans variable font files used for all three weight registrations (Regular/Bold/Italic) -- variable fonts contain all weights on the wght axis"
  - "Language check passed=true even with flagged anglicisms per D-07 (dismissable warnings); only title mismatches are blockers"
  - "INVALID_CURRENCY_PATTERNS defined internally in languageCheck.ts (format.ts exports formatMXN/formatDateES functions but not regex patterns)"

patterns-established:
  - "EXPORT_FILE_MAP: Record<string, ExportFileEntry> as document-to-export routing registry"
  - "Word-boundary regex matching for anglicism detection with flagged/noted severity tiers"
  - "pdfStyles shared stylesheet imported by all PDF template components"

requirements-completed: [EXPRT-01, EXPRT-05, LANG-05]

# Metrics
duration: 7min
completed: 2026-03-24
---

# Phase 05 Plan 01: Export Infrastructure Summary

**IMCINE file naming registry (21 docs), LANG-05 anglicism/format/title scanner, and NotoSans PDF font infrastructure with shared stylesheet**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T20:15:15Z
- **Completed:** 2026-03-24T20:22:50Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- EXPORT_FILE_MAP covers all 21 generated document IDs with IMCINE-compliant filename templates (max 15 chars, ASCII-only)
- Language check scans for 30 flagged anglicisms with replacements, 13 accepted industry terms, currency/date format violations, and title consistency
- NotoSans fonts registered for PDF generation with full Spanish character support (accents, n-tilde)
- Shared PDF stylesheet covers all document types: prose, tables, contracts with fee highlight (D-03), alternating rows (D-02), internal stamp (D-10)
- 45 vitest tests covering all utilities

## Task Commits

Each task was committed atomically:

1. **Task 1: Export types, file naming registry, folder structure, fonts** - `f3662590` (feat)
2. **Task 2: Language check utility, PDF font/style infrastructure** - `e42b8cb5` (feat)

_Note: TDD tasks -- tests written first (RED), implementation passing (GREEN), no refactor needed._

## Files Created/Modified
- `src/lib/export/types.ts` - Shared export types (TemplateType, ExportFileEntry, ExportProgress)
- `src/lib/export/fileNaming.ts` - EXPORT_FILE_MAP (21 entries), sanitizeProjectAbbrev, generateFilename, validateAllFilenames
- `src/lib/export/folderStructure.ts` - EXPORT_FOLDERS (7 folders), UPLOADED_DOC_FOLDER_MAP (19 upload types), generateZipFilename
- `src/lib/export/languageCheck.ts` - ANGLICISM_BLOCKLIST (30), ANGLICISM_ACCEPTED (13), currency/date/title scanners, runLanguageCheck
- `src/components/pdf/fonts.ts` - NotoSans Font.register (3 weights) + hyphenation disabled
- `src/components/pdf/styles.ts` - pdfStyles with 18 style definitions (page, landscape, tables, legal, highlights, stamps)
- `src/__tests__/export/fileNaming.test.ts` - 26 tests for sanitization, filename generation, registry coverage
- `src/__tests__/export/languageCheck.test.ts` - 19 tests for anglicisms, formats, dates, titles, aggregation
- `public/fonts/NotoSans-Regular.ttf` - NotoSans variable font (400 weight)
- `public/fonts/NotoSans-Bold.ttf` - NotoSans variable font (700 weight)
- `public/fonts/NotoSans-Italic.ttf` - NotoSans italic variable font
- `package.json` - Added @react-pdf/renderer, @ag-media/react-pdf-table, jszip, file-saver, @types/file-saver
- `package-lock.json` - Updated lockfile

## Decisions Made
- NotoSans variable font files reused for Bold registration since the variable font contains all weights (100-900) via wght axis
- Language check `passed` is true even with flagged anglicisms per D-07 (they are dismissable warnings); only title mismatches set `hasBlockers=true`
- Currency/date regex patterns defined internally in languageCheck.ts rather than importing from format.ts (which exports formatting functions, not regex patterns)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Google Fonts download URL returned HTML instead of ZIP; resolved by downloading variable font TTF files directly from the google/fonts GitHub repository

## Known Stubs

None - all planned functionality is fully implemented.

## Next Phase Readiness
- Plan 02 (PDF templates) can now import pdfStyles and fonts.ts for rendering
- Plan 03 (export pipeline) can now import EXPORT_FILE_MAP, generateFilename, runLanguageCheck, and folder structure constants
- All shared types (ExportFileEntry, ExportProgress, TemplateType) available for downstream plans

## Self-Check: PASSED

All 11 created files verified present. Both task commits (f3662590, e42b8cb5) verified in git log.

---
*Phase: 05-export-manager*
*Completed: 2026-03-24*
