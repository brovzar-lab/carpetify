---
phase: 05-export-manager
plan: 02
subsystem: export
tags: [react-pdf, pdf-templates, prose, tables, contracts, meta-documents, pdf-renderer]

# Dependency graph
requires:
  - phase: 05-export-manager
    provides: EXPORT_FILE_MAP registry, pdfStyles shared stylesheet, NotoSans font registration, TemplateType union
  - phase: 04-validation-dashboard
    provides: ValidationReport and ScoreEstimate types for meta-document templates
provides:
  - 12 document PDF templates covering all EFICINE sections (prose, tables, contracts, cartas)
  - 3 internal meta-document templates (validation report, score estimate, submission guide)
  - pdfRenderer routing module with renderDocumentToPdf and renderMetaDocument
  - buildSubmissionSteps helper generating SHCP portal field mapping from EXPORT_FILE_MAP
affects: [05-03-export-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Document-to-template routing via TemplateType switch", "React.createElement for runtime template instantiation", "Side-effect font import at module level for PDF registration"]

key-files:
  created:
    - src/components/pdf/templates/ProseDocument.tsx
    - src/components/pdf/templates/ResumenEjecutivo.tsx
    - src/components/pdf/templates/SolidezEquipo.tsx
    - src/components/pdf/templates/BudgetSummary.tsx
    - src/components/pdf/templates/BudgetDetail.tsx
    - src/components/pdf/templates/CashFlowTable.tsx
    - src/components/pdf/templates/RutaCritica.tsx
    - src/components/pdf/templates/FinancialScheme.tsx
    - src/components/pdf/templates/ContractDocument.tsx
    - src/components/pdf/templates/CartaCompromiso.tsx
    - src/components/pdf/templates/CartaAportacion.tsx
    - src/components/pdf/templates/FichaTecnica.tsx
    - src/components/pdf/templates/ValidationReport.tsx
    - src/components/pdf/templates/ScoreEstimate.tsx
    - src/components/pdf/templates/SubmissionGuide.tsx
    - src/lib/export/pdfRenderer.ts
  modified: []

key-decisions:
  - "React.createElement used in pdfRenderer instead of JSX to keep router in .ts file without JSX transform concerns"
  - "ContractDocument uses regex clause splitting with fee-reference detection to place yellow highlight box contextually"
  - "RutaCritica has dual rendering: structured timeline grid when phases data available, prose fallback otherwise"
  - "SubmissionGuide includes buildSubmissionSteps helper that generates ordered SHCP portal steps from EXPORT_FILE_MAP"
  - "PORTAL_FIELD_MAP hardcoded in SubmissionGuide since SHCP portal fields are stable across submission periods"

patterns-established:
  - "PDF template pattern: import fonts + pdfStyles, accept typed props, return Document > Page with header/footer"
  - "Landscape orientation for dense financial tables (BudgetDetail, CashFlowTable, RutaCritica)"
  - "pdfRenderer routing: switch on TemplateType for documents, switch on meta type string for internal docs"

requirements-completed: [EXPRT-01, EXPRT-03, EXPRT-05]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 05 Plan 02: PDF Templates Summary

**15 PDF templates (12 document + 3 meta-document) with pdfRenderer routing module for complete EFICINE carpeta rendering**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T20:25:30Z
- **Completed:** 2026-03-24T20:30:30Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- All 12 document PDF templates created covering every TemplateType in the union (prose, financial tables, contracts, cartas, ficha tecnica)
- 3 internal meta-document templates: validation report checklist (D-09), score estimate with red DOCUMENTO INTERNO stamp (D-10), SHCP submission guide with portal field mapping (D-11)
- pdfRenderer routes all 12 document types via renderDocumentToPdf and 3 meta types via renderMetaDocument, both producing Blob output via pdf().toBlob()
- Landscape orientation correctly applied to BudgetDetail (A9b), CashFlowTable (A9d), RutaCritica (A8b)
- ContractDocument includes yellow fee highlight box (D-03) with #fff3cd background and #ffc107 border
- Zero TypeScript errors across all 16 new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 12 document PDF templates** - `d304b64b` (feat)
2. **Task 2: Create 3 meta-document templates and pdfRenderer routing** - `e950e1bc` (feat)

## Files Created/Modified
- `src/components/pdf/templates/ProseDocument.tsx` - Generic prose template for A2, A4, A7, A8a, A10, A11
- `src/components/pdf/templates/ResumenEjecutivo.tsx` - FORMATO 1 key-value table
- `src/components/pdf/templates/SolidezEquipo.tsx` - FORMATO 2 team member table
- `src/components/pdf/templates/BudgetSummary.tsx` - A9a summary budget table
- `src/components/pdf/templates/BudgetDetail.tsx` - A9b landscape budget detail with partidas
- `src/components/pdf/templates/CashFlowTable.tsx` - FORMATO 3 landscape cash flow matrix
- `src/components/pdf/templates/RutaCritica.tsx` - A8b landscape timeline grid with prose fallback
- `src/components/pdf/templates/FinancialScheme.tsx` - FORMATO 9 funding sources table
- `src/components/pdf/templates/ContractDocument.tsx` - Contract template with yellow fee highlight (D-03)
- `src/components/pdf/templates/CartaCompromiso.tsx` - FORMATO 6/7 formal letter with signature lines
- `src/components/pdf/templates/CartaAportacion.tsx` - FORMATO 10 letter with contribution table
- `src/components/pdf/templates/FichaTecnica.tsx` - FORMATO 8 key-value grid
- `src/components/pdf/templates/ValidationReport.tsx` - Internal validation checklist (D-09)
- `src/components/pdf/templates/ScoreEstimate.tsx` - Internal score breakdown with DOCUMENTO INTERNO stamp (D-10)
- `src/components/pdf/templates/SubmissionGuide.tsx` - Internal SHCP upload guide with buildSubmissionSteps helper (D-11)
- `src/lib/export/pdfRenderer.ts` - Document-to-template routing with renderDocumentToPdf and renderMetaDocument

## Decisions Made
- Used React.createElement in pdfRenderer.ts instead of JSX to keep the routing module as a plain .ts file
- ContractDocument splits content by legal clause markers (PRIMERA, SEGUNDA, etc.) and detects fee-reference paragraphs to place the yellow highlight box contextually
- RutaCritica supports dual rendering: structured timeline grid (green cells for active months) when phases data is provided, or prose fallback when only raw text is available
- PORTAL_FIELD_MAP in SubmissionGuide hardcodes all 20 SHCP portal field names since these are stable across EFICINE submission periods
- buildSubmissionSteps helper iterates EXPORT_FILE_MAP in section order (A, B, C, E) to produce numbered steps

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Known Stubs

None - all planned functionality is fully implemented.

## Next Phase Readiness
- Plan 03 (export pipeline) can now import renderDocumentToPdf and renderMetaDocument from pdfRenderer.ts
- Plan 03 can use buildSubmissionSteps to generate the submission guide data
- All 15 templates compile cleanly and are ready for integration with the export orchestration pipeline

## Self-Check: PASSED

All 16 created files verified present. Both task commits (d304b64b, e950e1bc) verified in git log.

---
*Phase: 05-export-manager*
*Completed: 2026-03-24*
