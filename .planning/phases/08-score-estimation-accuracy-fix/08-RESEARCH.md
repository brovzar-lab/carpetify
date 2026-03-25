# Phase 8: Score Estimation & Accuracy Fix - Research

**Researched:** 2026-03-24
**Domain:** EFICINE viability scoring accuracy, scoring signal population, Cloud Function UI integration, dashboard completion metric
**Confidence:** HIGH

## Summary

Phase 8 addresses four related defects in the scoring subsystem that were identified in the v1.0 milestone audit as partial implementation of VALD-15. The issues are all in existing code -- no new architectural concepts needed. The work is purely corrective: fixing role name mismatches in `scoring.ts`, populating scoring signal fields in `useValidation.ts`, wiring the existing `estimateScore` Cloud Function to its UI trigger, and replacing a hardcoded `0%` completion bar in `ProjectCard.tsx`.

The codebase already has all the infrastructure in place. The scoring module (`src/validation/scoring.ts`) is pure TypeScript with well-defined signal inputs. The validation hook (`src/hooks/useValidation.ts`) assembles a `ProjectDataSnapshot` from 9+ Firestore subscriptions. The `ScoreEstimationPanel` UI component already has a button and Cloud Function call wired -- the gap is that the frontend sends only `{ projectId }` while the Cloud Function handler expects full document content in the request body. The `ProjectCard` just needs to derive its percentage from the existing validation report data already available via `useValidation`.

**Primary recommendation:** Fix these as four discrete, independently testable changes: (1) role name fix in scoring.ts, (2) scoring signal population in useValidation.ts, (3) Cloud Function data-fetch or frontend content-pass fix for artistic scoring, (4) ProjectCard completion percentage from validation data.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALD-15 | Score estimation -- estimate project's EFICINE score against the rubric (100 pts + 5 bonus) with actionable improvement suggestions | All four fixes directly enable accurate score estimation: role matching provides correct team signals, signal population enables viability scoring, Cloud Function trigger enables artistic scoring, ProjectCard shows the result |
</phase_requirements>

## Standard Stack

No new libraries needed. All fixes use existing project dependencies.

### Core (already installed)
| Library | Version | Purpose | Why Used |
|---------|---------|---------|----------|
| React | 19.2 | Component rendering | Existing stack |
| TypeScript | 5.9 | Type safety | Existing stack |
| Firebase Functions v2 | 12.11 | Cloud Function for artistic scoring | Existing stack |
| Vitest | 4.1 | Unit testing for scoring fixes | Existing stack |

### No New Dependencies

All four fixes operate on existing code with existing libraries. No `npm install` needed.

## Architecture Patterns

### Existing Pattern: Pure Scoring Module
`src/validation/scoring.ts` is a pure TypeScript module with no React or Firestore dependencies. It takes a `ProjectDataSnapshot` and returns `ScoreCategory[]`. This pattern must be preserved -- all fixes to scoring logic stay pure.

### Existing Pattern: Snapshot Assembly in useValidation
`src/hooks/useValidation.ts` assembles the `ProjectDataSnapshot` from multiple Firestore real-time subscriptions. Adding new scoring signal fields follows the same pattern: subscribe to the data source, extract the signal, add it to the snapshot returned from the `useMemo`.

### Existing Pattern: Cloud Function Handler Extraction
`functions/src/scoreHandler.ts` uses handler extraction: `handleScoreEstimation()` is a pure async function, and `index.ts` wraps it with `onCall`. The handler expects `ScoreEstimationRequest` with document content fields, not just a projectId. The fix must bridge this gap.

### Pattern for Fix 1: Role Name Matching
```
CARGOS_EQUIPO = ['Productor', 'Director', 'Guionista', ...]
```
scoring.ts currently calls `findTeamByRole(snapshot.team, 'Productor/a')` and `findTeamByRole(snapshot.team, 'Director/a')`. Team members store `cargo` using the exact `CARGOS_EQUIPO` values (e.g., `'Productor'`, `'Director'`). The `/a` suffix never matches. The fix is trivial: change `'Productor/a'` to `'Productor'` and `'Director/a'` to `'Director'` in all locations within `scoring.ts`.

**Affected locations in scoring.ts:**
- Line 132: `findTeamByRole(snapshot.team, 'Productor/a')` -- computeEquipo
- Line 133: `findTeamByRole(snapshot.team, 'Director/a')` -- computeEquipo
- Line 437: `findTeamByRole(snap.team, 'Director/a')` -- SUGGESTION_RULES

**Note:** The existing tests in `scoring.test.ts` (lines 73-98) also use `'Productor/a'` and `'Director/a'` as cargo values. These tests pass with the current broken code because they use the same wrong strings. The tests must be updated to use `'Productor'` and `'Director'` to match `CARGOS_EQUIPO`.

### Pattern for Fix 2: Scoring Signal Population
The `ProjectDataSnapshot` type already declares all scoring signal fields (lines 104-119 of `types.ts`). The `useValidation.ts` hook never populates them. The signals can be derived from data already subscribed to or from one additional subscription:

| Signal | Data Source | Derivation |
|--------|-------------|------------|
| `screenplayPagesPerDay` | `projects/{id}/screenplay/data` (new subscription needed) | `num_paginas / dias_rodaje_estimados` |
| `budgetHasImprevistos` | `budgetDoc` (already subscribed as `meta/budget_output`) | Check if cuentas array has account 1200 with `subtotalCentavos > 0` |
| `exhibitionHasSpectatorEstimate` | `generated/A10` content (new subscription or check existing generatedDocs) | Check if A10 content mentions spectator/revenue keywords |
| `exhibitionHasFestivalStrategy` | `generated/A10` content | Check if A10 content mentions festival strategy keywords |
| `exhibitionHasTargetAudience` | `generated/A10` content | Check if A10 content mentions target audience keywords |
| `productionHasSafeWorkplace` | `generated/A7` content | Check if A7 content mentions safe workplace keywords |
| `rutaCriticaHasMonthlyDetail` | `rutaCriticaDoc` (already subscribed as `generated/A8b`) | Check if A8b prose contains month name patterns |
| `materialVisualPages` | Not directly available | Could default to presence of A5 doc, or skip (no A5 content data in current model) |

**Key insight:** Most signals can be derived from generated document content that is already partially subscribed to. The budget signal (`budgetHasImprevistos`) can use the existing `budgetDoc` subscription. The ruta critica signal can use the existing `rutaCriticaDoc` subscription. For A7/A10 signals, new individual document subscriptions are needed (to `generated/A7` and `generated/A10`), OR a simpler heuristic can be used: since the AI prompts explicitly instruct inclusion of safe workplace mentions, spectator estimates, festival strategies, and target audience sections, the presence of the generated document implies the signal is present (the same fallback pattern already used in `scoring.ts` where `hasSafeWorkplace = snapshot.productionHasSafeWorkplace ?? a7Exists`).

**Recommended approach:** Use document existence as the primary signal for prompt-enforced content (A7 safe workplace, A10 spectators/festival/audience). Only the screenplay data subscription is truly new. The budget imprevistos check should inspect `budgetDoc.cuentas` for account 1200. The ruta critica monthly detail check should scan `rutaCriticaDoc.content` for month name patterns (already done in `engine.ts` via `extractStagesFromProse`).

### Pattern for Fix 3: Cloud Function Artistic Scoring Trigger

**The gap:** The `ScoreEstimationPanel` (line 128) calls:
```typescript
const result = await estimateScoreFn({ projectId })
```

But the Cloud Function's `handleScoreEstimation` expects a `ScoreEstimationRequest`:
```typescript
interface ScoreEstimationRequest {
  projectId: string;
  guionContent: string;      // A3 screenplay content
  direccionContent: string;  // A4 direction proposal
  materialVisualContent: string; // A5 material visual
  tituloProyecto: string;
  categoriaCinematografica: string;
}
```

**Two options:**

1. **Frontend assembles content** (recommended): The frontend reads generated document content from Firestore and passes it in the request. This keeps the Cloud Function stateless and testable. The `ValidationDashboard` already has access to `projectId`, and the generated docs can be fetched.

2. **Cloud Function fetches from Firestore**: The Cloud Function uses the Admin SDK to read `projects/{projectId}/generated/A3`, `A4`, and `A5`. This avoids extra client-side reads but couples the handler to Firestore.

**Recommended approach:** Option 1. Have the `ScoreEstimationPanel` (or a helper) fetch the content of A3, A4, A5 from Firestore using `getDoc()` calls before invoking the Cloud Function. This matches the existing pattern where data is assembled client-side. Pass `tituloProyecto` and `categoriaCinematografica` from the project metadata already available in the component's context.

However, there is a subtlety: `ScoreEstimationPanel` currently receives only `projectId`, `viabilityScore`, and `improvements` as props. It would need access to project metadata and generated document content. The simplest fix is to either:
- Add additional props from the parent `ValidationDashboard` (which has `useValidation` providing the snapshot)
- Have the panel itself do async Firestore reads of the 3 documents before calling the Cloud Function

**Alternative approach:** Modify the Cloud Function to fetch from Firestore using Admin SDK when content fields are empty. This is simpler client-side but slightly less clean architecturally. Given this is a gap-closure phase, pragmatism may be preferred.

### Pattern for Fix 4: ProjectCard Completion Percentage

The current `ProjectCard.tsx` (lines 89-94) has:
```tsx
<div className="h-full w-0 bg-primary rounded-full" />
<span className="text-xs text-muted-foreground">0%</span>
```

The component already calls `useValidation(id)` and receives `report`. A completion percentage can be derived from the validation report:

```typescript
// Option A: Based on validation rule pass rate
const totalRules = report.results.length
const passedRules = report.passed.length + report.skipped.length
const completionPct = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 0

// Option B: Based on zero blockers + document readiness
// This is closer to "readiness" than "completion"
```

**Recommended approach:** Use validation pass rate (passed / total non-skipped). This gives a meaningful metric that progresses from 0% to 100% as the user completes data entry and fixes blockers. The `report` object already has categorized arrays (`passed`, `blockers`, `warnings`, `skipped`).

### Anti-Patterns to Avoid

- **Adding new Firestore subscriptions unnecessarily:** For scoring signals that can be derived from already-subscribed documents (budgetDoc, rutaCriticaDoc, cashFlowDoc), do NOT add new subscriptions. Derive from existing data.
- **Breaking pure function contract:** `scoring.ts` must remain free of React/Firestore dependencies. Signal derivation happens in `useValidation.ts`, not in `scoring.ts`.
- **Hardcoding signal presence:** While using document existence as a proxy for prompt-enforced signals is acceptable (the prompt guarantees inclusion), document the assumption clearly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month name parsing | Custom regex per signal | Reuse `MONTH_NAME_TO_NUMBER` from `engine.ts` | Already tested and proven |
| Keyword detection in generated content | NLP/regex for content analysis | Document existence as proxy for prompt-enforced content | AI prompts guarantee these sections exist; checking existence is sufficient |
| Completion percentage formula | Complex weighted scoring | Simple validation pass rate from existing `report` data | User needs progress indicator, not precision metric |

## Common Pitfalls

### Pitfall 1: Test Data Uses Wrong Cargo Values
**What goes wrong:** Existing tests in `scoring.test.ts` use `'Productor/a'` and `'Director/a'` as cargo values. After fixing `scoring.ts`, these tests would still pass because both the test data and the code use the same wrong value. But real Firestore data uses `'Productor'` and `'Director'`.
**Why it happens:** Tests were written to match the buggy code, not the actual data model.
**How to avoid:** Update test fixtures to use `CARGOS_EQUIPO` values (`'Productor'`, `'Director'`). Import from constants if possible.
**Warning signs:** Tests pass but scoring still returns 0 for equipo category with real data.

### Pitfall 2: Infinite Re-render from New Subscriptions
**What goes wrong:** Adding a new Firestore subscription in `useValidation.ts` creates a new state variable that triggers `useMemo` recalculation of `snapshot`, which triggers `useEffect` for rule execution, which could trigger more state changes.
**Why it happens:** Each `onSnapshot` fires on initial load AND on data changes.
**How to avoid:** Follow existing pattern: separate loading state per subscription, gate snapshot assembly on all loading states being false, debounce instant rules at 300ms.
**Warning signs:** Browser performance degradation, console showing rapid re-renders.

### Pitfall 3: Cloud Function Missing Document Content
**What goes wrong:** The `estimateScore` Cloud Function receives `{ projectId }` but its handler expects `guionContent`, `direccionContent`, `materialVisualContent`. If these are empty strings, the AI personas score everything at 0 or return errors.
**Why it happens:** The frontend was built with `httpsCallable({ projectId })` but the handler expects full content.
**How to avoid:** Either the frontend must fetch and pass content, or the Cloud Function must self-serve from Firestore. Pick one approach and implement completely.
**Warning signs:** Artistic scores always 0, Cloud Function errors in logs.

### Pitfall 4: ScoreEstimationPanel Hardcoded Strings
**What goes wrong:** Line 262 of `ScoreEstimationPanel.tsx` has a hardcoded Spanish string `'Reintentar evaluacion'` instead of using `es.ts` locales.
**Why it happens:** Oversight during Phase 4 implementation.
**How to avoid:** While fixing the component, also move this string to `src/locales/es.ts`.
**Warning signs:** Found during code review or language check.

### Pitfall 5: Budget Imprevistos Detection Logic
**What goes wrong:** Checking `budgetDoc.cuentas` for account 1200 may fail if the cuentas structure varies from expected shape.
**Why it happens:** `budgetDoc` is stored as `Record<string, unknown>` and requires careful type narrowing.
**How to avoid:** Use safe property access with fallbacks, matching the existing pattern in `extractFeesFromBudgetOutput`. Budget computer always generates account 1200, so if the budget doc exists AND has cuentas, account 1200 should be present.
**Warning signs:** `budgetHasImprevistos` always returns false even with generated budget.

## Code Examples

### Fix 1: Role Name Matching in scoring.ts
```typescript
// BEFORE (broken):
const producers = findTeamByRole(snapshot.team, 'Productor/a')
const directors = findTeamByRole(snapshot.team, 'Director/a')

// AFTER (correct):
const producers = findTeamByRole(snapshot.team, 'Productor')
const directors = findTeamByRole(snapshot.team, 'Director')
```

All 3 locations in scoring.ts (computeEquipo lines 132-133, SUGGESTION_RULES line 437).

### Fix 2: Scoring Signal Derivation in useValidation.ts

**screenplayPagesPerDay** -- requires new subscription to `projects/{id}/screenplay/data`:
```typescript
// New subscription:
const [screenplayData, setScreenplayData] = useState<Record<string, unknown> | null>(null)
const [screenplayLoading, setScreenplayLoading] = useState(true)

useEffect(() => {
  if (!projectId) { setScreenplayData(null); setScreenplayLoading(false); return }
  return onSnapshot(
    doc(db, `projects/${projectId}/screenplay/data`),
    (snap) => {
      setScreenplayData(snap.exists() ? snap.data() as Record<string, unknown> : null)
      setScreenplayLoading(false)
    },
    () => setScreenplayLoading(false),
  )
}, [projectId])

// In snapshot assembly:
const screenplayPagesPerDay = useMemo((): number | undefined => {
  if (!screenplayData) return undefined
  const numPaginas = screenplayData.num_paginas as number | undefined
  const diasRodaje = screenplayData.dias_rodaje_estimados as number | undefined
  if (!numPaginas || !diasRodaje || diasRodaje <= 0) return undefined
  return numPaginas / diasRodaje
}, [screenplayData])
```

**budgetHasImprevistos** -- from existing `budgetDoc`:
```typescript
const budgetHasImprevistos = useMemo((): boolean => {
  if (!budgetDoc) return false
  const cuentas = budgetDoc.cuentas as Array<{ numeroCuenta: number; subtotalCentavos: number }> | undefined
  if (!cuentas) return false
  const imprevistos = cuentas.find((c) => c.numeroCuenta === 1200)
  return (imprevistos?.subtotalCentavos ?? 0) > 0
}, [budgetDoc])
```

**rutaCriticaHasMonthlyDetail** -- from existing `rutaCriticaDoc`:
```typescript
const rutaCriticaHasMonthlyDetail = useMemo((): boolean => {
  if (!rutaCriticaDoc) return false
  const content = rutaCriticaDoc.content
  const prose = typeof content === 'string'
    ? content
    : typeof (content as Record<string, unknown>)?.prose === 'string'
      ? (content as Record<string, unknown>).prose as string
      : ''
  if (!prose) return false
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const lower = prose.toLowerCase()
  const monthCount = monthNames.filter(m => lower.includes(m)).length
  return monthCount >= 3 // At least 3 distinct months mentioned
}, [rutaCriticaDoc])
```

### Fix 3: Cloud Function Data Assembly

**Option A (recommended): Cloud Function reads from Firestore:**
```typescript
// In functions/src/index.ts estimateScore handler:
import { getFirestore } from 'firebase-admin/firestore';

// Inside the onCall handler, before calling handleScoreEstimation:
const adminDb = getFirestore();
const projectRef = adminDb.doc(`projects/${data.projectId}`);
const [projectSnap, a3Snap, a4Snap, a5Snap] = await Promise.all([
  projectRef.get(),
  adminDb.doc(`projects/${data.projectId}/generated/A3`).get(),
  adminDb.doc(`projects/${data.projectId}/generated/A4`).get(),
  adminDb.doc(`projects/${data.projectId}/generated/A5`).get(),
]);

const projectMeta = projectSnap.data()?.metadata ?? {};
const enrichedRequest: ScoreEstimationRequest = {
  projectId: data.projectId,
  guionContent: extractProse(a3Snap.data()?.content),
  direccionContent: extractProse(a4Snap.data()?.content),
  materialVisualContent: extractProse(a5Snap.data()?.content),
  tituloProyecto: projectMeta.titulo_proyecto ?? '',
  categoriaCinematografica: projectMeta.categoria_cinematografica ?? '',
};

return await handleScoreEstimation(enrichedRequest, apiKey);
```

This approach is simpler because the Cloud Function already has admin access and the frontend doesn't need additional reads.

### Fix 4: ProjectCard Completion Percentage
```typescript
// In ProjectCard.tsx:
const completionPct = useMemo(() => {
  if (!report) return 0
  const evaluatedResults = report.results.filter(r => r.status !== 'skip')
  if (evaluatedResults.length === 0) return 0
  const passedResults = evaluatedResults.filter(r => r.status === 'pass')
  return Math.round((passedResults.length / evaluatedResults.length) * 100)
}, [report])

// In JSX:
<div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-primary rounded-full transition-all"
    style={{ width: `${completionPct}%` }}
  />
</div>
<span className="text-xs text-muted-foreground">{completionPct}%</span>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `findTeamByRole('Productor/a')` | `findTeamByRole('Productor')` | This phase | Team data actually matches, scoring signals fire |
| Scoring signals undefined | Derived from Firestore subscriptions | This phase | Viability score reflects actual project state |
| Artistic scoring unreachable | Cloud Function self-reads from Firestore | This phase | Full 100-point estimation possible |
| Hardcoded 0% completion | Derived from validation pass rate | This phase | Dashboard shows meaningful progress |

## Open Questions

1. **Exhibition signals: document existence vs. content analysis**
   - What we know: A10 is generated by AI prompt that explicitly requests spectator estimates, festival strategy, and target audience. If A10 exists, these sections should exist in its content.
   - What's unclear: Whether users can manually edit A10 to remove these sections after generation.
   - Recommendation: Use document existence as proxy. This is the pattern already assumed in `scoring.ts` (`hasSafeWorkplace = snapshot.productionHasSafeWorkplace ?? a7Exists`). Add a TODO comment noting this could be refined with content analysis later.

2. **materialVisualPages signal**
   - What we know: A5 (Material Visual) is a creative document with images/links/references. The number of "pages" is not tracked in Firestore.
   - What's unclear: How to determine page count without rendering the content.
   - Recommendation: Leave `materialVisualPages` as undefined for now. The improvement suggestion will still show for this signal, but it won't affect viability scoring directly (it's in the `artistic` category, not viability). This is acceptable for a gap-closure phase.

3. **Cloud Function approach: server-side read vs. client-side pass**
   - What we know: Both approaches work. Server-side read is simpler for the frontend. Client-side pass keeps the handler pure.
   - What's unclear: Whether the handler's testability is a priority for this gap-closure phase.
   - Recommendation: Server-side read in the `onCall` wrapper (not in the handler). The handler stays pure with its existing interface. The wrapper enriches the request. This preserves testability.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/validation/__tests__/scoring.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALD-15a | findTeamByRole matches 'Productor' not 'Productor/a' | unit | `npx vitest run src/validation/__tests__/scoring.test.ts -x` | Exists (needs fixture update) |
| VALD-15b | Scoring signals populated in snapshot | unit | `npx vitest run src/validation/__tests__/scoringSignals.test.ts -x` | Wave 0 |
| VALD-15c | Cloud Function receives document content | integration | Manual -- requires Firebase emulator | manual-only |
| VALD-15d | ProjectCard shows non-zero completion | unit | `npx vitest run src/components/dashboard/__tests__/ProjectCard.test.ts -x` | Wave 0 (optional) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/validation/__tests__/scoring.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [x] `src/validation/__tests__/scoring.test.ts` -- exists but fixtures use wrong cargo values, needs update
- [ ] Signal derivation helpers could benefit from unit tests, but the logic is simple enough to test via scoring integration
- No new test framework or config needed

## Sources

### Primary (HIGH confidence)
- `src/validation/scoring.ts` -- direct code inspection of bug at lines 132-133, 437
- `src/hooks/useValidation.ts` -- direct code inspection confirming scoring signals never populated (lines 406-424)
- `src/lib/constants.ts` -- `CARGOS_EQUIPO` array confirming correct values are `'Productor'`, `'Director'`
- `src/validation/types.ts` -- `ProjectDataSnapshot` type with scoring signal fields (lines 104-119)
- `functions/src/scoreHandler.ts` -- `ScoreEstimationRequest` interface showing required fields
- `src/components/validation/ScoreEstimationPanel.tsx` -- line 128 showing only `{ projectId }` sent to Cloud Function
- `src/components/dashboard/ProjectCard.tsx` -- lines 89-94 showing hardcoded `0%`

### Secondary (MEDIUM confidence)
- `functions/src/screenplay/analyzeHandler.ts` -- Firestore write path for `dias_rodaje_estimados` and `num_paginas`
- `functions/src/financial/budgetComputer.ts` -- Budget always generates account 1200 (Imprevistos)
- `src/validation/__tests__/scoring.test.ts` -- Test fixtures using wrong cargo values

### Tertiary (LOW confidence)
- None -- all findings are from direct code inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing code
- Architecture: HIGH - all patterns already established in codebase, fixes are localized
- Pitfalls: HIGH - identified from direct code inspection of the bugs

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- this is a bug-fix phase on existing code)
