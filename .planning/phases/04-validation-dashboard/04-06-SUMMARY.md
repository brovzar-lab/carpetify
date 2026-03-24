---
phase: 04-validation-dashboard
plan: 06
subsystem: validation
tags: [typescript, react, shadcn-accordion, shadcn-collapsible, shadcn-tabs, firebase-functions, httpsCallable, two-panel-layout, score-estimation]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    plan: 05
    provides: useValidation hook, ValidationDashboard route target, shadcn accordion/collapsible components, WizardScreen validacion type
  - phase: 04-validation-dashboard
    plan: 03
    provides: computeViabilityScore, generateImprovementSuggestions, ScoreCategory, PersonaScore, ImprovementSuggestion types
  - phase: 04-validation-dashboard
    plan: 01
    provides: ValidationResult, ValidationReport, NavigateTo, Severity, ValidationStatus types
provides:
  - ValidationDashboard page with two-panel layout (rules left 360px score right)
  - ValidationSummary card with blocker/warning/pass status display
  - RuleStatusRow with expandable accordion and severity/status badges
  - RuleDetailPanel with issue details and IrAlCampoLink navigation
  - IrAlCampoLink deep-link button navigating to wizard fields with highlight params
  - ScoreEstimationPanel with viabilidad/artistico/bonus tabs
  - ViabilityScoreCard with progress bar and deterministic scores
  - ArtisticScoreCard with per-persona breakdown and manual override
  - PersonaScoreRow for individual AI persona score display
  - BonusPointsCard with 4 bonus categories showing met/unmet status
  - Cloud Function invocation pattern for estimateScore via httpsCallable (120s timeout)
affects: [04-07, 05-export-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [two-panel-layout, severity-grouped-collapsible, httpsCallable-with-timeout, manual-score-override]

key-files:
  created:
    - src/components/validation/ValidationSummary.tsx
    - src/components/validation/RuleStatusRow.tsx
    - src/components/validation/RuleDetailPanel.tsx
    - src/components/validation/IrAlCampoLink.tsx
    - src/components/validation/ScoreEstimationPanel.tsx
    - src/components/validation/ViabilityScoreCard.tsx
    - src/components/validation/ArtisticScoreCard.tsx
    - src/components/validation/PersonaScoreRow.tsx
    - src/components/validation/BonusPointsCard.tsx
  modified:
    - src/components/validation/ValidationDashboard.tsx

key-decisions:
  - "ValidationDashboard uses Collapsible for severity sections (blockers/warnings expanded, passed/skipped collapsed) with Accordion for individual rule rows inside each section"
  - "IrAlCampoLink constructs URL with ?highlight={fieldId}&member={memberIndex} query params for wizard field deep-linking"
  - "ScoreEstimationPanel calls estimateScore Cloud Function via httpsCallable with 120s client-side timeout, stores persona scores in local state"
  - "Artistic score manual override stored in React local state only (not Firestore) with inline number input, recalculates total dynamically"
  - "BonusPointsCard renders all 4 bonus categories statically from es.scoring.* constants with met/unmet badges"

patterns-established:
  - "Two-panel validation layout: flex-1 scrollable rules list (left) + 360px fixed score panel (right), stacking vertically below lg breakpoint"
  - "Severity section pattern: Collapsible wrapper with colored dot + count badge, containing Accordion of RuleStatusRow items"
  - "Cloud Function CTA pattern: Button with three states (initial CTA / disabled+spinner during call / error Alert with retry)"
  - "Score override pattern: inline number input toggled by Ajustar link, local state only, applied to total calculation"

requirements-completed: [VALD-14, VALD-15, VALD-16]

# Metrics
duration: 24min
completed: 2026-03-24
---

# Phase 04 Plan 06: Validation Dashboard UI Components Summary

**Two-panel validation dashboard with severity-grouped accordion rule rows, score estimation tabs (viability/artistic/bonus), AI persona evaluation via httpsCallable, and Ir al campo deep-link navigation**

## Performance

- **Duration:** 24 min
- **Started:** 2026-03-24T15:27:32Z
- **Completed:** 2026-03-24T15:51:45Z
- **Tasks:** 2
- **Files created:** 9
- **Files modified:** 1

## Accomplishments
- Built full two-panel validation dashboard: severity-grouped rules list (left, scrollable) + score estimation panel (right, 360px fixed) that stacks vertically on mobile
- Severity sections use Collapsible with colored dots and count badges; blockers/warnings expanded by default, passed/skipped collapsed; supports ?filter= query param from project card deep-links
- Each rule row is an Accordion item with 48px height, status dot (10px), severity badge (BLOQUEADOR/ADVERTENCIA), status badge (Pasa/Falla/Sin datos), and expandable detail panel with IrAlCampoLink
- Score estimation panel with 3 tabs: Viabilidad (deterministic ViabilityScoreCard with progress bars), Artistico (ArtisticScoreCard with per-persona breakdown and manual Ajustar override), Bonus (BonusPointsCard with 4 categories)
- "Evaluar puntaje" button calls estimateScore Cloud Function via httpsCallable with 120s timeout, error state shows retry, loading state shows skeleton placeholders

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ValidationDashboard page with rules list components** - `94f93f94` (feat)
2. **Task 2: Build score estimation panel and all scoring sub-components** - `bedf872d` (feat)

## Files Created/Modified
- `src/components/validation/ValidationDashboard.tsx` - Rewritten: two-panel layout with severity-grouped Collapsible sections containing Accordion rule rows, ?filter= support, loading skeleton state
- `src/components/validation/ValidationSummary.tsx` - At-a-glance compliance card with red/yellow/green status dots and badges
- `src/components/validation/RuleStatusRow.tsx` - Expandable accordion row: status dot, rule name, severity badge, status badge, RuleDetailPanel on expand
- `src/components/validation/RuleDetailPanel.tsx` - Expanded rule detail: message, bullet list of issues, IrAlCampoLink
- `src/components/validation/IrAlCampoLink.tsx` - Deep-link button navigating to wizard screen with ?highlight= and ?member= query params
- `src/components/validation/ScoreEstimationPanel.tsx` - 360px right panel with viabilidad/artistico/bonus tabs, httpsCallable evaluation, error/retry state
- `src/components/validation/ViabilityScoreCard.tsx` - Deterministic score card with Progress bar and font-mono score display
- `src/components/validation/ArtisticScoreCard.tsx` - AI-evaluated score card with per-persona breakdown, manual Ajustar override via inline input
- `src/components/validation/PersonaScoreRow.tsx` - Single persona score row with name, description, score value
- `src/components/validation/BonusPointsCard.tsx` - 4 bonus categories with met/unmet badges and recommended category highlight

## Decisions Made
- ValidationDashboard combines Collapsible (severity sections) with Accordion (rule rows) for a two-level expand pattern -- Collapsible groups by severity, Accordion expands individual rule details within each group
- IrAlCampoLink uses react-router useNavigate with constructed URL including ?highlight={fieldId}&member={memberIndex} query params for precise field targeting in the wizard
- ScoreEstimationPanel stores persona scores and evaluation state in React local state (useState), not Firestore -- the AI evaluation is ephemeral and re-runnable on demand
- Artistic score manual override is local-only (not persisted to Firestore) -- this is a what-if exploration tool, not a data entry field
- BonusPointsCard renders all 4 categories from static constants rather than from dynamic scoring data -- bonus eligibility detection is planned for future integration when bonus signals are wired in the scoring module

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None -- no external service configuration required.

## Known Stubs

- `ScoreEstimationPanel.tsx` (line ~103): `bonusPoints`, `bonusCategory`, and `eligibleCategories` are hardcoded to 0/null/[] because bonus eligibility detection is not yet wired from the scoring module. The BonusPointsCard renders correctly with these defaults, showing all categories as "No cumplido". Will be resolved when bonus scoring signals are integrated into the useValidation hook data assembly.

## Next Phase Readiness
- All 10 validation dashboard UI components built and compiling
- ValidationDashboard is the active route target in WizardShell (from Plan 05)
- ScoreEstimationPanel is ready to call estimateScore Cloud Function when deployed
- All 122 validation tests continue to pass
- Plan 07 (integration tests + final polish) has full component surface to test

## Self-Check: PASSED

All 9 created files and 1 modified file verified present. Commits 94f93f94 and bedf872d verified in git log.

---
*Phase: 04-validation-dashboard*
*Completed: 2026-03-24*
