# Phase 4: Validation Engine + Dashboard - Research

**Researched:** 2026-03-23
**Domain:** Real-time cross-document compliance validation, traffic light dashboard UI, score estimation engine for EFICINE Article 189
**Confidence:** HIGH

## Summary

This phase builds the validation and compliance layer that sits between AI document generation (Phase 3) and export (Phase 5). It must implement 17 discrete validation rules (10 blockers, 7 warnings/conditional) against data scattered across 6+ Firestore subcollections, display results on a traffic light dashboard that serves as the primary navigation surface, and estimate the project's EFICINE competition score (100 pts + 5 bonus). The validation must run in real time as data changes, not just at export time.

The project already has a solid foundation: Zod 4.3.6 schemas for all data models (project, team, financials, ERPI, documents, screenplay), an existing `useCompliance` hook implementing 7 basic financial percentage rules, a `TrafficLight` component with green/yellow/red states, a `CompliancePanel` showing 6 metrics, `date-fns` with Spanish locale for date formatting, and real-time Firestore `onSnapshot` patterns established in `useGeneratedDocs` and `useStaleness` hooks. The architecture pattern is clear: pure validation functions (no side effects) that consume Firestore data and return structured results, consumed by React components via hooks.

The critical architectural decision is where validation runs. Since all data lives in Firestore and needs real-time feedback, the validation engine must be a pure TypeScript module that runs client-side, consuming data from existing hooks and Firestore listeners. Each rule is a pure function: data in, `ValidationResult` out. The dashboard subscribes to all relevant data sources and re-runs validation on every change, displaying results via the traffic light system. Score estimation is similarly a pure function consuming the full project data snapshot.

**Primary recommendation:** Build validation as a pure TypeScript rule engine with individual rule functions in `src/validation/rules/`, a central orchestrator in `src/validation/engine.ts`, and a `useValidation` hook that composes existing data hooks (useAutoSave, useGeneratedDocs, useStaleness) to feed the engine. Extend the existing `CompliancePanel` into a full traffic light dashboard page. Score estimation is a separate pure module in `src/validation/scoring.ts`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALD-01 | Financial reconciliation: budget = cash flow = esquema | Pure function comparing totals from `projects/{id}/generated/` docs (A9a, A9d, E1). Centavos integer comparison -- exact match required. Extends existing `calculateCompliance`. |
| VALD-02 | Title consistency across all documents | String comparison of `titulo_proyecto` from metadata against title fields in every generated and uploaded document. Character-for-character match per validation_rules.md Rule 2. |
| VALD-03 | Fee cross-matching (producer, director, screenwriter) | Triple/quadruple match: contract fee == budget line item == cash flow line item. Data from `generated/B3-prod`, `generated/B3-dir`, `generated/C2b`, `generated/A9b`, `generated/A9d`. |
| VALD-04 | Date compliance: documents within 3 months of registration close | `date-fns/differenceInCalendarDays` comparing `fecha_emision` from uploaded documents against period close date from `PERIODOS_EFICINE` constants. |
| VALD-05 | EFICINE compliance percentages and caps | Already implemented in `useCompliance.ts` -- 7 rules. Needs integration into the unified validation engine. |
| VALD-06 | Document completeness (A-E sections) | Check that every required document in the EFICINE document map exists in `generated/` or `documents/` subcollections. Required doc list from `validation_rules.md` Rule 8. |
| VALD-07 | Experience thresholds (producer >= 1 feature, director >= 1 feature or 2 shorts) | Pure function checking `filmografia` array in team members by `cargo`. Genre-dependent rules per `validation_rules.md` Rule 5. |
| VALD-08 | ERPI eligibility (unexhibited projects < 2, submissions <= 3, attempts <= 3) | Pure function checking `proyectos_previos_eficine` array from ERPI settings. Data already in `erpiSettingsSchema`. |
| VALD-09 | File format compliance (PDF, <= 40 MB, filename <= 15 chars, ASCII only) | Validation at export time. Check filename patterns against `^[A-Za-z0-9_]{1,15}\.pdf$` regex from `export_manager.json`. |
| VALD-10 | Prohibited expenditure scan | Scan `generated/A9d` (flujo de efectivo) for EFICINE-sourced funds in prohibited categories per `validation_rules.md` Rule 7. |
| VALD-11 | Ruta critica <-> cash flow sync (warning) | Compare stage months in `generated/A8b` against spending periods in `generated/A9d`. Overlap check. |
| VALD-12 | Hyperlink accessibility (warning) | Check URLs in team member `enlaces` and generated docs for public accessibility. Client-side HEAD request or flag for manual verification. |
| VALD-13 | Bonus points eligibility (warning) | Pure function checking team member demographics and project metadata against 4 bonus categories per `scoring_rubric.md`. Non-cumulative -- only one can apply. |
| VALD-14 | Real-time validation | Validation hook re-runs on every Firestore data change via `onSnapshot` subscriptions already established in codebase. |
| VALD-15 | Score estimation (100 pts + 5 bonus) | Pure scoring function mapping rubric categories to project data completeness and quality signals per `scoring_rubric.md`. |
| VALD-16 | Traffic light dashboard | React page with per-document and per-rule status rows using existing `TrafficLight` component. Primary navigation surface. |
| VALD-17 | Document expiration alerts | `date-fns/differenceInCalendarDays` computing days remaining for each uploaded doc relative to period close. Red when < 14 days. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.3.6 | Validation schemas for rule inputs and outputs | Already used throughout codebase; v4 refine chains with method composition |
| zustand | 5.0.12 | Validation state store for dashboard | Already used for app and wizard state |
| @tanstack/react-query | 5.95.2 | Data fetching for project data aggregation | Already used in dashboard; provides caching and invalidation |
| date-fns | 4.1.0 | Date arithmetic for expiration calculations | Already installed; provides `differenceInCalendarDays`, `addDays`, `isBefore` |
| firebase (client SDK) | 12.11.0 | Firestore `onSnapshot` for real-time data subscriptions | Already used in `useGeneratedDocs` and `useStaleness` hooks |
| lucide-react | 0.577.0 | Icons for dashboard status indicators | Already installed and used throughout the app |
| shadcn/ui | 4.1.0 | Dashboard UI components (Card, Badge, Progress, Accordion) | Already used for all UI; provides consistent design system |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications for validation status changes | Already installed; use for real-time violation alerts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side validation engine | Cloud Function validation | Client-side is instant, no network latency, no function invocation cost. Cloud Functions only needed at export gate (Phase 5). |
| Individual rule functions | Single monolithic validator | Individual functions are independently testable, composable, and can be enabled/disabled. Critical for 17 rules with different severity levels. |
| onSnapshot real-time | Polling with React Query | onSnapshot is already the established pattern in this codebase (useStaleness, useGeneratedDocs). Zero latency on data changes. |

**No new packages needed.** All required libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  validation/
    engine.ts                    # Central orchestrator: runs all rules, returns ValidationReport
    types.ts                     # ValidationRule, ValidationResult, ValidationReport, Severity types
    rules/
      financialReconciliation.ts # VALD-01: budget == cashflow == esquema (blocker)
      titleConsistency.ts        # VALD-02: title match across all docs (blocker)
      feeCrossMatch.ts           # VALD-03: fee triple/quadruple match (blocker)
      dateCompliance.ts          # VALD-04: 3-month document freshness (blocker)
      eficineCompliance.ts       # VALD-05: percentage rules (blocker) -- wraps existing calculateCompliance
      documentCompleteness.ts    # VALD-06: all required docs present (blocker)
      experienceThresholds.ts    # VALD-07: producer/director minimums (blocker)
      erpiEligibility.ts         # VALD-08: unexhibited < 2, submissions <= 3 (blocker)
      fileFormatCompliance.ts    # VALD-09: PDF, size, filename rules (blocker)
      prohibitedExpenditure.ts   # VALD-10: EFICINE funds in banned categories (blocker)
      rutaCriticaSync.ts         # VALD-11: timeline vs spending alignment (warning)
      hyperlinkAccessibility.ts  # VALD-12: URL accessibility check (warning)
      bonusEligibility.ts        # VALD-13: bonus points category check (warning)
      documentExpiration.ts      # VALD-17: expiration alerts with days remaining (warning)
    scoring.ts                   # VALD-15: EFICINE rubric score estimation
    constants.ts                 # Required document map, prohibited categories, etc.
  hooks/
    useValidation.ts             # VALD-14/16: orchestrates real-time validation
  components/
    validation/
      ValidationDashboard.tsx    # VALD-16: main dashboard page
      RuleStatusRow.tsx          # Single rule with traffic light + detail
      DocumentStatusGrid.tsx     # Per-document status matrix
      ScoreEstimate.tsx          # VALD-15: score breakdown with suggestions
      ExpirationAlerts.tsx       # VALD-17: document expiration warnings
```

### Pattern 1: Pure Validation Rule Function

**What:** Each of the 17 validation rules is a pure function: data in, `ValidationResult` out. No side effects, no Firestore access, no React dependencies. This makes them independently unit-testable.

**When to use:** Every validation rule.

**Example:**
```typescript
// src/validation/types.ts
export type Severity = 'blocker' | 'warning'

export interface ValidationResult {
  ruleId: string          // e.g., 'VALD-01'
  ruleName: string        // Spanish display name
  severity: Severity
  status: 'pass' | 'fail' | 'skip'  // skip = not enough data to evaluate
  message: string         // Spanish explanation
  details?: string[]      // Per-item breakdown (e.g., which documents mismatch)
  metadata?: Record<string, unknown>  // Extra data for UI (e.g., days remaining)
}

export interface ValidationReport {
  results: ValidationResult[]
  blockers: ValidationResult[]  // Filtered: severity=blocker && status=fail
  warnings: ValidationResult[]  // Filtered: severity=warning && status=fail
  passed: ValidationResult[]    // Filtered: status=pass
  skipped: ValidationResult[]   // Filtered: status=skip
  canExport: boolean            // True if blockers.length === 0
  timestamp: Date
}

// src/validation/rules/titleConsistency.ts
export function validateTitleConsistency(
  projectTitle: string,
  generatedDocs: Array<{ docId: string; title?: string }>,
  uploadedDocs: Array<{ tipo: string; title?: string }>,
): ValidationResult {
  if (!projectTitle) {
    return {
      ruleId: 'VALD-02',
      ruleName: 'Consistencia del titulo',
      severity: 'blocker',
      status: 'skip',
      message: 'No se ha definido el titulo del proyecto.',
    }
  }

  const mismatches: string[] = []
  for (const doc of [...generatedDocs, ...uploadedDocs]) {
    if (doc.title && doc.title !== projectTitle) {
      mismatches.push(`${doc.docId}: "${doc.title}"`)
    }
  }

  return {
    ruleId: 'VALD-02',
    ruleName: 'Consistencia del titulo',
    severity: 'blocker',
    status: mismatches.length === 0 ? 'pass' : 'fail',
    message: mismatches.length === 0
      ? 'El titulo es identico en todos los documentos.'
      : `El titulo no coincide en ${mismatches.length} documento(s).`,
    details: mismatches,
  }
}
```

### Pattern 2: Validation Engine Orchestrator

**What:** Central engine that runs all 17 rules against a project data snapshot and produces a `ValidationReport`.

**When to use:** Called by `useValidation` hook whenever any upstream data changes.

**Example:**
```typescript
// src/validation/engine.ts
import type { ValidationResult, ValidationReport } from './types'
import { validateFinancialReconciliation } from './rules/financialReconciliation'
import { validateTitleConsistency } from './rules/titleConsistency'
// ... import all rule functions

export interface ProjectDataSnapshot {
  metadata: ProjectMetadata
  team: TeamMember[]
  financials: Financials
  erpiSettings: ERPISettings
  uploadedDocs: UploadedDocument[]
  generatedDocs: GeneratedDocClient[]
  // Budget/cashflow/esquema extracted from generated docs
  budgetTotal?: number
  cashFlowTotal?: number
  esquemaTotal?: number
}

export function runValidation(data: ProjectDataSnapshot): ValidationReport {
  const results: ValidationResult[] = [
    validateFinancialReconciliation(data.budgetTotal, data.cashFlowTotal, data.esquemaTotal),
    validateTitleConsistency(data.metadata.titulo_proyecto, data.generatedDocs, data.uploadedDocs),
    // ... all 17 rules
  ]

  const blockers = results.filter(r => r.severity === 'blocker' && r.status === 'fail')
  const warnings = results.filter(r => r.severity === 'warning' && r.status === 'fail')
  const passed = results.filter(r => r.status === 'pass')
  const skipped = results.filter(r => r.status === 'skip')

  return {
    results,
    blockers,
    warnings,
    passed,
    skipped,
    canExport: blockers.length === 0,
    timestamp: new Date(),
  }
}
```

### Pattern 3: Real-Time Validation Hook

**What:** React hook that composes multiple Firestore data hooks and re-runs the validation engine whenever any input changes. Uses `useMemo` to avoid re-running on every render.

**When to use:** Consumed by the dashboard page and the wizard sidebar.

**Example:**
```typescript
// src/hooks/useValidation.ts
import { useMemo } from 'react'
import { useGeneratedDocs } from './useGeneratedDocs'
import { runValidation, type ProjectDataSnapshot } from '@/validation/engine'
import type { ValidationReport } from '@/validation/types'

export function useValidation(projectId: string): {
  report: ValidationReport | null
  loading: boolean
} {
  const { docs: generatedDocs, loading: genLoading } = useGeneratedDocs(projectId)
  // ... compose other data hooks for team, financials, uploads, etc.

  const report = useMemo(() => {
    if (genLoading /* || other loading states */) return null
    const snapshot: ProjectDataSnapshot = {
      // ... assemble from hook data
    }
    return runValidation(snapshot)
  }, [generatedDocs, /* ... other deps */])

  return { report, loading: genLoading /* || ... */ }
}
```

### Pattern 4: Score Estimation as Pure Function

**What:** Map EFICINE rubric categories to measurable signals from project data. Returns a score breakdown with per-category estimates and improvement suggestions.

**When to use:** Score estimation panel on the dashboard.

**Example:**
```typescript
// src/validation/scoring.ts
export interface ScoreCategory {
  name: string           // Spanish category name
  maxPoints: number
  estimatedPoints: number
  signals: ScoreSignal[]  // What we can measure
  suggestions: string[]   // Actionable improvement tips in Spanish
}

export interface ScoreEstimate {
  categories: ScoreCategory[]
  totalEstimated: number
  maxPossible: number   // 100
  bonusPoints: number   // 0 or 5
  bonusCategory: string | null
  passingThreshold: number  // 90
  meetsThreshold: boolean
}
```

### Anti-Patterns to Avoid

- **Validation in Firestore triggers:** Do NOT use Cloud Functions `onWrite` triggers to run validation. The entire point is real-time client-side feedback with zero latency. Validation is a read-only operation on existing data -- it belongs on the client.
- **Monolithic validation function:** Do NOT put all 17 rules in a single function. Each rule must be independently testable and its results independently displayable.
- **Storing validation results in Firestore:** The validation report is derived state (computed from other data). Storing it creates a sync problem. Compute it on the fly from live data.
- **Coupling validation to React components:** Validation logic must be pure TypeScript, importable in both client and potential future Cloud Function contexts (Phase 5 export gate).
- **Floating point for money:** All financial comparisons use integer centavos. Never compare formatted MXN strings.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic | Manual day counting | `date-fns/differenceInCalendarDays` | Handles timezone, DST, leap year edge cases |
| Date parsing | `new Date()` from strings | `date-fns/parseISO` or `date-fns/parse` | Consistent cross-browser parsing |
| URL validation | Regex for URLs | `z.string().url()` | Handles edge cases in URL formats |
| Financial comparison | `===` on floating point | Integer centavos comparison | Already established pattern: `totalBudgetCentavos === cashFlowTotalCentavos` |
| Traffic light UI | Custom styled divs | Existing `TrafficLight` component | Already has green/yellow/red states with dark mode support |
| Toast notifications | Custom notification system | `sonner` (already installed) | Consistent with existing notification patterns |

**Key insight:** This phase is almost entirely pure business logic (validation rules + scoring) wrapped in a thin React UI layer. The codebase already has all the infrastructure -- Firestore listeners, traffic light component, compliance panel, date formatting, centavos arithmetic. The work is encoding the 17 rules from `validation_rules.md` and the scoring rubric as testable TypeScript functions.

## Common Pitfalls

### Pitfall 1: Financial Reconciliation Floating Point
**What goes wrong:** Budget total in centavos from one computation doesn't match cash flow total from another due to rounding during percentage calculations.
**Why it happens:** Intermediate calculations that convert centavos to pesos, apply percentages, then convert back introduce rounding errors.
**How to avoid:** All financial computations stay in centavos. Percentage calculations use `Math.round()` on the final centavos result. The "golden equation" comparison is strict integer equality: `budgetTotalCentavos === cashFlowTotalCentavos === esquemaTotalCentavos`.
**Warning signs:** Tests pass with round numbers but fail with realistic budgets.

### Pitfall 2: Missing "Skip" State for Incomplete Data
**What goes wrong:** Validation rule returns "pass" when it should return "skip" because the data doesn't exist yet (e.g., no generated documents). User thinks they're compliant when they haven't generated anything.
**Why it happens:** Rule checks `array.length === 0` and treats empty as "no mismatches" instead of "nothing to validate".
**How to avoid:** Every rule must have a "skip" state: "Not enough data to evaluate this rule." The dashboard shows skipped rules in a distinct visual state (gray, not green).
**Warning signs:** Dashboard shows all green before any documents are generated.

### Pitfall 3: Title Comparison Ignoring Whitespace/Encoding
**What goes wrong:** Title "La Ultima Frontera" (no accent) doesn't match "La Ultima Frontera" (with trailing space) or "La Ultima Frontera" (different unicode normalization).
**Why it happens:** Titles come from different input sources (user entry, AI generation, uploaded document metadata) with different whitespace handling.
**How to avoid:** Normalize before comparison: `title.normalize('NFC').trim()`. Log the raw values when a mismatch is detected so the user can see what's different.
**Warning signs:** Title rule fails on identical-looking strings.

### Pitfall 4: Document Expiration Date Edge Cases
**What goes wrong:** Document expiration check uses "3 months" literally instead of "90 days" or the exact Lineamientos definition, causing false positives/negatives at month boundaries.
**Why it happens:** The Lineamientos say "no more than 3 months before the registration period close date" but the exact definition varies.
**How to avoid:** Use `differenceInCalendarDays(closeDate, issueDate) <= 90` as a conservative approximation. Show the exact days remaining so the user can make the final call. Per the `validation_rules.md`: `registration_close - timedelta(days=90)`.
**Warning signs:** Documents issued exactly 3 months before show inconsistent pass/fail.

### Pitfall 5: Score Estimation Overconfidence
**What goes wrong:** Score estimation shows 95/100 and user thinks they'll pass, but the score is based on document completeness, not content quality (which only human evaluators can assess).
**Why it happens:** The rubric scores creative merit (40 pts for screenplay alone), which no automated tool can evaluate.
**How to avoid:** Clearly label the score as "estimado basado en completitud y senales medibles" (not prediction of committee decision). Use ranges instead of point values for subjective categories. Show which categories are measurable vs estimated.
**Warning signs:** Every project gets the same score regardless of content quality.

### Pitfall 6: Validation Thrashing on Real-Time Updates
**What goes wrong:** User typing in a form field triggers validation re-run on every keystroke, causing the dashboard to flicker between states.
**Why it happens:** Firestore `onSnapshot` fires on every write, and React Hook Form's `onTouched` mode updates Firestore via auto-save.
**How to avoid:** Debounce validation re-runs (200-300ms). The auto-save hook already debounces Firestore writes. Validation should run after the debounced save completes, not on every form change.
**Warning signs:** Traffic lights flash rapidly while user is typing.

### Pitfall 7: Circular Data Dependency Between Validation and Generated Docs
**What goes wrong:** Validation rules check generated documents, but generated documents may not exist yet (Phase 3 hasn't run). Rules that depend on generated doc data must gracefully degrade.
**Why it happens:** Phase 4 validation assumes Phase 3 generation is complete, but in practice users may run validation before generating all documents.
**How to avoid:** Every rule that reads from `generated/` must handle the case where the document doesn't exist yet, returning `status: 'skip'` with a message like "Genera los documentos primero para evaluar esta regla."
**Warning signs:** Console errors from trying to read properties of undefined generated doc data.

## Code Examples

### Financial Reconciliation Rule (VALD-01)
```typescript
// src/validation/rules/financialReconciliation.ts
// Source: validation_rules.md Rule 1 - The "golden equation"
import type { ValidationResult } from '../types'

export function validateFinancialReconciliation(
  budgetTotalCentavos: number | undefined,
  cashFlowTotalCentavos: number | undefined,
  esquemaTotalCentavos: number | undefined,
): ValidationResult {
  // Skip if any total is not yet computed
  if (
    budgetTotalCentavos === undefined ||
    cashFlowTotalCentavos === undefined ||
    esquemaTotalCentavos === undefined
  ) {
    return {
      ruleId: 'VALD-01',
      ruleName: 'Conciliacion financiera',
      severity: 'blocker',
      status: 'skip',
      message: 'Genera el presupuesto, flujo de efectivo y esquema financiero para evaluar.',
    }
  }

  const mismatches: string[] = []

  if (budgetTotalCentavos !== cashFlowTotalCentavos) {
    mismatches.push(
      `Presupuesto ($${Math.round(budgetTotalCentavos / 100).toLocaleString('es-MX')} MXN) ≠ ` +
      `Flujo ($${Math.round(cashFlowTotalCentavos / 100).toLocaleString('es-MX')} MXN)`,
    )
  }

  if (budgetTotalCentavos !== esquemaTotalCentavos) {
    mismatches.push(
      `Presupuesto ($${Math.round(budgetTotalCentavos / 100).toLocaleString('es-MX')} MXN) ≠ ` +
      `Esquema ($${Math.round(esquemaTotalCentavos / 100).toLocaleString('es-MX')} MXN)`,
    )
  }

  return {
    ruleId: 'VALD-01',
    ruleName: 'Conciliacion financiera',
    severity: 'blocker',
    status: mismatches.length === 0 ? 'pass' : 'fail',
    message: mismatches.length === 0
      ? 'Presupuesto = Flujo de efectivo = Esquema financiero.'
      : 'Los totales financieros no coinciden.',
    details: mismatches,
  }
}
```

### Document Expiration Check (VALD-17)
```typescript
// src/validation/rules/documentExpiration.ts
// Source: validation_rules.md Rule 4 + VALD-17
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { ValidationResult } from '../types'
import { PERIODOS_EFICINE } from '@/lib/constants'

interface DocWithDate {
  tipo: string
  filename: string
  fecha_emision?: Date | string
}

const EXPIRABLE_DOC_TYPES = [
  'seguro',
  'contador',
  'estado_cuenta',
  'carta_apoyo',
  'cotizacion_especie',
]

export function validateDocumentExpiration(
  docs: DocWithDate[],
  periodoRegistro: '2026-P1' | '2026-P2',
): ValidationResult {
  const closeDate = parseISO(PERIODOS_EFICINE[periodoRegistro].close)
  const alerts: string[] = []
  const metadata: Record<string, number> = {} // docType -> daysRemaining

  for (const doc of docs) {
    if (!EXPIRABLE_DOC_TYPES.includes(doc.tipo)) continue
    if (!doc.fecha_emision) continue

    const issueDate = typeof doc.fecha_emision === 'string'
      ? parseISO(doc.fecha_emision)
      : doc.fecha_emision

    const daysFromIssueToClose = differenceInCalendarDays(closeDate, issueDate)
    const daysRemaining = 90 - daysFromIssueToClose

    metadata[doc.tipo] = daysRemaining

    if (daysFromIssueToClose > 90) {
      alerts.push(`${doc.filename}: vencido (emitido hace ${daysFromIssueToClose} dias antes del cierre)`)
    } else if (daysRemaining < 14) {
      alerts.push(`${doc.filename}: vence en ${daysRemaining} dias`)
    }
  }

  return {
    ruleId: 'VALD-17',
    ruleName: 'Vigencia de documentos',
    severity: 'warning',
    status: alerts.length === 0 ? 'pass' : 'fail',
    message: alerts.length === 0
      ? 'Todos los documentos vigentes dentro del plazo de 3 meses.'
      : `${alerts.length} documento(s) vencidos o por vencer.`,
    details: alerts,
    metadata,
  }
}
```

### Experience Threshold Check (VALD-07)
```typescript
// src/validation/rules/experienceThresholds.ts
// Source: validation_rules.md Rule 5
import type { ValidationResult } from '../types'
import type { TeamMember, FilmographyEntry } from '@/schemas/team'

export function validateExperienceThresholds(
  team: TeamMember[],
  genre: string,
): ValidationResult {
  const issues: string[] = []

  // Find producer and director
  const producer = team.find(m => m.cargo === 'Productor')
  const director = team.find(m => m.cargo === 'Director')

  if (!producer) {
    issues.push('No se ha registrado un productor.')
  } else {
    const exhibitedFeatures = producer.filmografia.filter(
      f => f.exhibicion && f.exhibicion.length > 0,
    ).length

    if (genre === 'Animacion') {
      const exhibitedShorts = producer.filmografia.filter(
        f => f.formato === 'Cortometraje' && f.exhibicion,
      ).length
      if (exhibitedFeatures < 1 && exhibitedShorts < 3) {
        issues.push(
          'Productor necesita al menos 1 largometraje exhibido o 3 cortometrajes exhibidos (animacion).',
        )
      }
    } else {
      if (exhibitedFeatures < 1) {
        issues.push('Productor necesita al menos 1 largometraje exhibido.')
      }
    }

    // Producer must be ERPI partner
    if (!producer.es_socio_erpi) {
      issues.push('El productor debe ser socio de la ERPI.')
    }
  }

  if (!director) {
    issues.push('No se ha registrado un director.')
  } else {
    // Director experience check (genre-dependent)
    const dirFeatures = director.filmografia.filter(
      f => f.formato === 'Largometraje',
    ).length
    const dirShorts = director.filmografia.filter(
      f => f.formato === 'Cortometraje' || f.formato === 'Obra audiovisual',
    ).length

    if (genre === 'Animacion') {
      if (dirFeatures < 1 && dirShorts < 1) {
        issues.push('Director necesita al menos 1 largometraje o 1 cortometraje completado (animacion).')
      }
    } else {
      if (dirFeatures < 1 && dirShorts < 2) {
        issues.push('Director necesita al menos 1 largometraje o 2 cortometrajes completados.')
      }
    }
  }

  return {
    ruleId: 'VALD-07',
    ruleName: 'Experiencia minima del equipo',
    severity: 'blocker',
    status: issues.length === 0 ? 'pass' : ((!producer || !director) ? 'skip' : 'fail'),
    message: issues.length === 0
      ? 'Productor y director cumplen los requisitos de experiencia.'
      : `${issues.length} requisito(s) de experiencia no cumplidos.`,
    details: issues,
  }
}
```

### Bonus Points Eligibility (VALD-13)
```typescript
// src/validation/rules/bonusEligibility.ts
// Source: scoring_rubric.md Bonus Points + validation_rules.md Rule 13
import type { ValidationResult } from '../types'

export interface BonusCheckInput {
  directorEsMujer: boolean
  directorEsIndigenaAfromexicano: boolean
  directorEsCodireccionConHombre: boolean
  directorEsCodireccionConNoMiembro: boolean
  cartaAutoadscripcionUploaded: boolean
  directorOrigenFueraZMCM: boolean
  productorOrigenFueraZMCM: boolean
  porcentajeRodajeFueraZMCM: number
  porcentajePersonalCreativoLocal: number
  porcentajePersonalTecnicoLocal: number
  erpiDomicilioFueraZMCM: boolean
  allCreativeTeamQualify: boolean  // All women or indigenous
  noCodireccionConNoQualifying: boolean
}

export function validateBonusEligibility(
  input: BonusCheckInput,
): ValidationResult {
  const eligible: string[] = []
  const ineligible: string[] = []

  // (a) Female director
  if (input.directorEsMujer && !input.directorEsCodireccionConHombre) {
    eligible.push('(a) Directora mujer (+5 puntos)')
  }

  // (b) Indigenous/Afro-Mexican director
  if (input.directorEsIndigenaAfromexicano && !input.directorEsCodireccionConNoMiembro) {
    if (input.cartaAutoadscripcionUploaded) {
      eligible.push('(b) Director indigena/afromexicano (+5 puntos)')
    } else {
      ineligible.push('(b) Director indigena/afromexicano: falta carta de autoadscripcion')
    }
  }

  // (c) Regional decentralization
  if (
    (input.directorOrigenFueraZMCM || input.productorOrigenFueraZMCM) &&
    input.porcentajeRodajeFueraZMCM >= 75 &&
    input.porcentajePersonalCreativoLocal >= 50 &&
    input.porcentajePersonalTecnicoLocal >= 50 &&
    input.erpiDomicilioFueraZMCM
  ) {
    eligible.push('(c) Descentralizacion regional (+5 puntos)')
  }

  // (d) 100% qualifying creative team
  if (input.allCreativeTeamQualify && input.noCodireccionConNoQualifying) {
    eligible.push('(d) Equipo creativo 100% mujeres o indigenas/afromexicanos (+5 puntos)')
  }

  return {
    ruleId: 'VALD-13',
    ruleName: 'Puntos adicionales (bonus)',
    severity: 'warning',
    status: eligible.length > 0 ? 'pass' : 'fail',
    message: eligible.length > 0
      ? `Elegible para: ${eligible[0]}`  // Only one can apply
      : 'No se detectaron categorias elegibles para puntos adicionales.',
    details: [...eligible, ...ineligible],
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zod v3 ZodEffects wrapping | Zod v4 inline refinements | Zod 4.0 (2025) | `.refine()` can now chain with `.min()`, `.max()` -- simplifies complex schema validation |
| React Query v4 | React Query v5 (TanStack Query) | 2024 | `useQuery` requires `queryKey` + `queryFn` object syntax. Already used in codebase. |
| Zustand v4 | Zustand v5 | 2024 | Minimal API changes. Store creation pattern unchanged. |
| Form validation at submit | Real-time validation as-you-type | Standard practice | React Hook Form `onTouched` mode already implemented in Phase 1. |

**Deprecated/outdated:**
- Zod v3's `ZodEffects` wrapping pattern -- v4 stores refinements inline
- Firestore `onSnapshot` with `includeMetadataChanges` for hasPendingWrites -- not needed here; validation cares about committed data

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALD-01 | Financial reconciliation (exact match of 3 totals) | unit | `npx vitest run src/validation/__tests__/financialReconciliation.test.ts -x` | Wave 0 |
| VALD-02 | Title consistency across documents | unit | `npx vitest run src/validation/__tests__/titleConsistency.test.ts -x` | Wave 0 |
| VALD-03 | Fee cross-matching (triple/quadruple match) | unit | `npx vitest run src/validation/__tests__/feeCrossMatch.test.ts -x` | Wave 0 |
| VALD-04 | Date compliance (3-month freshness) | unit | `npx vitest run src/validation/__tests__/dateCompliance.test.ts -x` | Wave 0 |
| VALD-05 | EFICINE compliance percentages | unit | `npx vitest run src/hooks/__tests__/useCompliance.test.ts -x` | Exists (7 tests) |
| VALD-06 | Document completeness | unit | `npx vitest run src/validation/__tests__/documentCompleteness.test.ts -x` | Wave 0 |
| VALD-07 | Experience thresholds | unit | `npx vitest run src/validation/__tests__/experienceThresholds.test.ts -x` | Wave 0 |
| VALD-08 | ERPI eligibility | unit | `npx vitest run src/validation/__tests__/erpiEligibility.test.ts -x` | Wave 0 |
| VALD-09 | File format compliance | unit | `npx vitest run src/validation/__tests__/fileFormatCompliance.test.ts -x` | Wave 0 |
| VALD-10 | Prohibited expenditure scan | unit | `npx vitest run src/validation/__tests__/prohibitedExpenditure.test.ts -x` | Wave 0 |
| VALD-11 | Ruta critica <-> cash flow sync | unit | `npx vitest run src/validation/__tests__/rutaCriticaSync.test.ts -x` | Wave 0 |
| VALD-12 | Hyperlink accessibility | unit | `npx vitest run src/validation/__tests__/hyperlinkAccessibility.test.ts -x` | Wave 0 |
| VALD-13 | Bonus eligibility | unit | `npx vitest run src/validation/__tests__/bonusEligibility.test.ts -x` | Wave 0 |
| VALD-14 | Real-time validation hook | integration | `npx vitest run src/hooks/__tests__/useValidation.test.ts -x` | Wave 0 |
| VALD-15 | Score estimation | unit | `npx vitest run src/validation/__tests__/scoring.test.ts -x` | Wave 0 |
| VALD-16 | Traffic light dashboard | component | `npx vitest run src/components/validation/__tests__/ValidationDashboard.test.tsx -x` | Wave 0 |
| VALD-17 | Document expiration alerts | unit | `npx vitest run src/validation/__tests__/documentExpiration.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/validation/__tests__/` directory -- all 14 new test files for individual rules
- [ ] `src/validation/__tests__/engine.test.ts` -- integration test for orchestrator
- [ ] `src/hooks/__tests__/useValidation.test.ts` -- hook integration test
- [ ] `src/validation/__tests__/scoring.test.ts` -- score estimation tests
- [ ] Test fixtures for generated document data (budget, cash flow, esquema structures)

## Open Questions

1. **Hyperlink accessibility verification (VALD-12) -- how deep?**
   - What we know: Rule says verify URLs are publicly accessible (no password, no email required)
   - What's unclear: Browser CORS restrictions prevent client-side HEAD requests to arbitrary URLs. Cannot reliably verify from the browser.
   - Recommendation: Implement as a manual verification prompt rather than automated check. Show the URL with a "Verificar enlace" button that opens in new tab. Mark as "no verificado automaticamente" if the check can't run. Optional: add a Cloud Function that does a HEAD request if automated checking is desired later.

2. **Score estimation granularity (VALD-15) -- how precise?**
   - What we know: 8 rubric categories, each with specific point ranges. Some categories (screenplay = 40 pts) are purely qualitative.
   - What's unclear: How much of the score can we meaningfully estimate? Creative merit (62 pts) is entirely subjective.
   - Recommendation: Score only what's measurable: document completeness, financial coherence, team experience depth, production plan detail level, filming schedule feasibility. For subjective categories, show "range" (e.g., "Guion: 20-40 pts -- no se puede estimar automaticamente"). Focus improvement suggestions on the 38 viability points where we have data.

3. **Co-production validation (Rule 12) -- scope in this phase?**
   - What we know: Co-production has special rules (territorial split, FX rate, IMCINE recognition). Flag already exists in project metadata (`es_coproduccion_internacional`).
   - What's unclear: How much co-production data is available from Phase 3 generated docs?
   - Recommendation: Implement as a conditional rule that activates when `es_coproduccion_internacional === true`. Check for the presence of required co-production fields. If the data model doesn't yet capture all co-production specifics (e.g., territorial split percentage), the rule returns `status: 'skip'` with guidance on what's needed.

4. **Integration with existing CompliancePanel (Phase 1)**
   - What we know: `CompliancePanel` on Screen 4 shows 6 financial compliance metrics using `calculateCompliance`.
   - What's unclear: Should the existing panel be replaced by the new validation dashboard, or should it continue to show the simplified view?
   - Recommendation: Keep `CompliancePanel` on Screen 4 as-is (it provides immediate feedback during financial data entry). The new validation dashboard is a separate route (`/project/:id/validacion`) that shows the full 17-rule report. Wire `calculateCompliance` results into the unified `runValidation` engine so the dashboard doesn't duplicate logic.

## Sources

### Primary (HIGH confidence)
- `references/validation_rules.md` -- All 17 cross-module validation rules with pseudocode (project file, authoritative)
- `references/scoring_rubric.md` -- EFICINE scoring breakdown by category (project file, authoritative)
- `src/hooks/useCompliance.ts` -- Existing 7-rule compliance implementation (project source code)
- `src/hooks/useGeneratedDocs.ts` -- Existing Firestore real-time listener pattern (project source code)
- `src/hooks/useStaleness.ts` -- Existing staleness detection with dependency graph (project source code)
- `schemas/export_manager.json` -- File format rules, naming conventions (project file)
- `schemas/modulo_e.json` -- Financial validation requirements from EFICINE Lineamientos (project file)
- `directives/app_spec.md` -- Validation engine section, Phase 3 checks (project file)

### Secondary (MEDIUM confidence)
- [Zod v4 release notes](https://zod.dev/v4) -- Confirmed refine/superRefine inline chain behavior
- [Zod API documentation](https://zod.dev/api) -- Confirmed v4 schema methods
- [Firebase real-time queries documentation](https://firebase.google.com/docs/firestore/query-data/listen) -- onSnapshot pattern verified

### Tertiary (LOW confidence)
- Hyperlink accessibility verification feasibility -- needs validation in browser environment
- Score estimation precision for subjective rubric categories -- no precedent found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new packages needed; all libraries already installed and in use
- Architecture: HIGH - Pattern of pure functions + hooks established in Phases 1-2; validation is the same pattern
- Pitfalls: HIGH - Financial reconciliation edge cases documented in project files; date arithmetic is standard date-fns
- Scoring: MEDIUM - Rubric is well-documented but mapping subjective criteria to automated signals requires judgment
- Hyperlink check: LOW - Browser CORS limitations may prevent automated verification

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain -- EFICINE rules are annual, no library changes expected)
