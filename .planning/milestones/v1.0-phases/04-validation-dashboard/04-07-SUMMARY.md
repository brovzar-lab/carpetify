---
phase: 04-validation-dashboard
plan: 07
subsystem: validation
tags: [typescript, react, expiration-badges, hyperlink-verification, field-highlighting, project-card, scroll-into-view, query-params]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    plan: 06
    provides: ValidationDashboard page, IrAlCampoLink with ?highlight= query params, severity-grouped rule display
  - phase: 04-validation-dashboard
    plan: 05
    provides: useValidation hook with ValidationReport, wizard route integration
  - phase: 04-validation-dashboard
    plan: 02
    provides: documentExpiration rule with per-doc daysRemaining and status metadata
  - phase: 04-validation-dashboard
    plan: 01
    provides: ValidationResult, ValidationReport types, EXPIRABLE_DOC_TYPES constant
provides:
  - ExpirationBadge with 4-tier color-coded status (vigente/proximo/critico/vencido)
  - ExpirationAlert contextual warning for upload screen documents
  - HyperlinkVerifier with cached URL checks, CORS fallback, and re-verify button
  - ValidationProjectCardBadge with clickable blocker/warning navigation to dashboard
  - ProjectCard wired to real validation data via useValidation hook
  - Expiration badges inline on Screen 5 (DocumentChecklist) for expirable documents
  - HyperlinkVerifier inline on Screen 3 (TeamMemberForm) next to filmography URLs
  - "Ir al campo" field highlighting across all wizard screens (ring-2 ring-primary/50 with 3s fade)
affects: [05-export-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [cached-url-verification, field-highlight-query-param, expiration-badge-tiers, stop-propagation-on-nested-click]

key-files:
  created:
    - src/components/validation/ExpirationAlert.tsx
    - src/components/validation/ExpirationBadge.tsx
    - src/components/validation/HyperlinkVerifier.tsx
    - src/components/validation/ValidationProjectCardBadge.tsx
  modified:
    - src/components/dashboard/ProjectCard.tsx
    - src/components/wizard/DocumentChecklist.tsx
    - src/components/wizard/TeamMemberForm.tsx
    - src/components/wizard/DocumentUpload.tsx
    - src/components/wizard/ProjectSetup.tsx
    - src/components/wizard/FinancialStructure.tsx
    - src/locales/es.ts

key-decisions:
  - "ExpirationBadge uses 4-tier color system: vigente(green)/proximo(yellow)/critico(red)/vencido(solid-red) matching UI-SPEC copywriting contract"
  - "HyperlinkVerifier caches results per URL in component local state, with CORS fallback showing 'No se pudo verificar automaticamente'"
  - "ValidationProjectCardBadge uses stopPropagation on clicks to prevent card-level navigation from firing"
  - "Field highlighting reads ?highlight= query param, applies ring-2 ring-primary/50, scrolls into view, and fades after 3 seconds via setTimeout"
  - "DocumentUpload passes periodoRegistro to DocumentChecklist for expiration computation against period close date"

patterns-established:
  - "Expiration badge pattern: compute daysRemaining from fecha_emision vs period close date, classify into vigente/proximo/critico/vencido tiers, render color-coded badge"
  - "Field highlight pattern: useSearchParams reads ?highlight= param, useEffect applies ring class + scrollIntoView, setTimeout removes after 3s"
  - "Inline URL verification pattern: HEAD request with no-cors fallback, cache result in state, show re-verify button after first check"

requirements-completed: [VALD-04, VALD-06, VALD-07, VALD-08, VALD-09, VALD-11, VALD-12, VALD-15, VALD-16, VALD-17]

# Metrics
duration: 8min
completed: 2026-03-24
---

# Phase 04 Plan 07: Validation Integration Touchpoints Summary

**Expiration badges at 3 touchpoints (project card, dashboard, upload screen), inline hyperlink verification with CORS fallback, and "Ir al campo" field highlighting across all wizard screens**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-24T16:30:00Z
- **Completed:** 2026-03-24T16:43:10Z
- **Tasks:** 3 (2 code + 1 visual verification checkpoint)
- **Files created:** 4
- **Files modified:** 7

## Accomplishments
- Built 4 new validation components: ExpirationAlert, ExpirationBadge, HyperlinkVerifier, ValidationProjectCardBadge with full Spanish copy from locales
- Wired ProjectCard to real validation data via useValidation hook -- replaced placeholder blocker text with clickable blocker/warning counts that navigate to the validation dashboard with filters
- Added expiration badges inline on Screen 5 (DocumentChecklist) for documents in EXPIRABLE_DOC_TYPES, computing daysRemaining from fecha_emision vs period close date
- Added HyperlinkVerifier inline on Screen 3 (TeamMemberForm) next to filmography URL fields with cached results and re-verify button
- Implemented "Ir al campo" field highlighting across 4 wizard screens (ProjectSetup, TeamMemberForm, DocumentChecklist, FinancialStructure) using ?highlight= query param with ring-2 ring-primary/50 and 3-second fade
- Visual verification checkpoint approved -- complete Phase 4 validation system working end-to-end

## Task Commits

Each task was committed atomically:

1. **Task 1: Create expiration/hyperlink components, wire validation into ProjectCard** - `cca8837c` (feat)
2. **Task 2: Integrate expiration alerts into Screen 5 and hyperlink verification into Screen 3** - `9a5b4de4` (feat)
3. **Task 3: Visual verification checkpoint** - APPROVED (no commit)

## Files Created/Modified
- `src/components/validation/ExpirationBadge.tsx` - Compact 4-tier color-coded badge showing days remaining until document expiration
- `src/components/validation/ExpirationAlert.tsx` - Contextual alert for upload screen with proximo/critico/vencido messages
- `src/components/validation/HyperlinkVerifier.tsx` - Inline URL verification with HEAD request, CORS fallback, cached results, and re-verify button
- `src/components/validation/ValidationProjectCardBadge.tsx` - Clickable blocker/warning counts navigating to validation dashboard with filter params
- `src/components/dashboard/ProjectCard.tsx` - Wired to useValidation hook for real blocker/warning counts, added expiration banner for critico/vencido documents
- `src/components/wizard/DocumentChecklist.tsx` - Added ExpirationBadge/ExpirationAlert inline for expirable documents, field highlight support
- `src/components/wizard/TeamMemberForm.tsx` - Added HyperlinkVerifier next to filmography URL fields, field highlight support
- `src/components/wizard/DocumentUpload.tsx` - Passes periodoRegistro prop to DocumentChecklist for expiration computation
- `src/components/wizard/ProjectSetup.tsx` - Added "Ir al campo" field highlighting via ?highlight= query param
- `src/components/wizard/FinancialStructure.tsx` - Added "Ir al campo" field highlighting via ?highlight= query param
- `src/locales/es.ts` - Added validation expiration and hyperlink Spanish copy strings

## Decisions Made
- ExpirationBadge implements the UI-SPEC copywriting contract exactly: vigente (green), proximo a vencer (yellow, <=30 days), vence pronto (red, <=14 days), vencido (solid red)
- HyperlinkVerifier uses no-cors mode as fallback when CORS blocks HEAD requests, displaying "No se pudo verificar automaticamente" with a link to open the URL in a new tab
- ValidationProjectCardBadge uses stopPropagation on click events to prevent the card-level navigation from intercepting badge clicks
- Field highlighting pattern uses useSearchParams + useEffect + setTimeout(3s) + scrollIntoView for a consistent experience across all 4 wizard screens
- DocumentUpload passes periodoRegistro down to DocumentChecklist so expiration can be computed against the correct EFICINE registration period close date

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None -- no external service configuration required.

## Known Stubs
None -- all components are wired to real data sources.

## Next Phase Readiness
- Phase 4 (Validation Engine + Dashboard) is now COMPLETE with all 7 plans executed
- All 17 VALD requirements fulfilled: 10 blocker rules, 4 warning rules, validation engine orchestrator, real-time validation hook, dashboard UI, score estimation, and integration touchpoints
- Complete validation flow verified end-to-end: project card badges -> validation dashboard -> "Ir al campo" -> wizard field highlight
- Phase 5 (Export Manager) can now consume validation data (canExport flag, blocker list) to gate exports

## Self-Check: PASSED

All 4 created files and 7 modified files verified present. Commits cca8837c and 9a5b4de4 verified in git log.

---
*Phase: 04-validation-dashboard*
*Completed: 2026-03-24*
