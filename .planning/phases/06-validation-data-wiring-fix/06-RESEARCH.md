# Phase 6: Validation Data Wiring Fix - Research

**Researched:** 2026-03-24
**Domain:** Firestore data path resolution, React state assembly, validation engine data flow
**Confidence:** HIGH

## Summary

Phase 6 is a gap closure phase. The validation engine (pure functions in `src/validation/`) is correctly implemented and well-tested. The problem is that `useValidation` -- the hook that assembles `ProjectDataSnapshot` from Firestore -- reads from wrong paths, uses hardcoded placeholders, and lacks extractors for fee data. The result: all validation rules receive empty/zero data, producing false-green traffic lights and allowing export when it should be blocked.

This research audited every Firestore read in `useValidation.ts`, traced how data is written by each wizard screen, and compared write paths against read paths. Nine distinct data wiring bugs were found. Six are in `useValidation.ts`, one is in `DocumentUpload.tsx` (wrong metadata read path), one is in `DocumentChecklist.tsx` (date format), and one is a missing schema field for ERPI submission tracking. The validation rules, engine orchestrator, and scoring functions require no changes.

**Primary recommendation:** Fix `useValidation.ts` data assembly (6 bugs), add ERPI/project submission tracking schema fields, implement fee extractors from generated document content, fix `DocumentUpload.tsx` metadata path, and replace any remaining non-Spanish date formatting in DocumentChecklist.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALD-01 | Financial reconciliation -- budget == cash flow == esquema totals | Bug #1: useValidation reads financials from project root instead of financials/data subcollection. Budget/cashflow/esquema subscriptions are correct. |
| VALD-02 | Title consistency across documents | Bug #2: useValidation reads titulo_proyecto from project root instead of metadata.titulo_proyecto. |
| VALD-03 | Fee cross-matching across contracts, budget, cash flow | Bug #3: extractFeesFromContracts/Budget/CashFlow return undefined. Must implement real extractors reading generated doc content. |
| VALD-04 | Date compliance -- docs within 3 months of registration close | Bug #2 affects periodo_registro read. Also: the engine passes `new Date(data.metadata.periodo_registro)` which would be NaN for "2026-P1" -- needs mapping to actual close date. |
| VALD-05 | EFICINE compliance percentages | Bug #1 + #2: financial fields read from wrong path, and metadata fields (costo_total, monto_solicitado) read from root instead of metadata subpath. |
| VALD-07 | Experience thresholds for producer/director | Team subscription is correct (reads from projects/{id}/team subcollection). Rule function is correct. Wiring is OK. |
| VALD-08 | ERPI eligibility -- submission/attempt counts | Bug #4: submissionsThisPeriod and projectAttempts hardcoded to 0. Bug #5: ERPI settings path is 'erpiSettings/default' but service writes to 'erpi_settings/default'. |
| VALD-13 | Bonus points eligibility | Bug #6: Regional bonus fields (category c) hardcoded false. Need schema fields and UI for location data, or accept current limitation with explicit documentation. |
| VALD-14 | Real-time validation -- checks run as data entered | This is an architecture requirement. Once data paths are fixed, the existing debounced onSnapshot architecture already satisfies this. |
| VALD-16 | Traffic light dashboard reflects real state | Bug #8: Sidebar only passes validacion status. With empty data from wiring bugs, traffic light is false-green. Fix data wiring and the traffic light works. |
| LANG-03 | Dates in Spanish format | Bug #7: DocumentChecklist already uses formatDateES (confirmed in code), but DocumentUpload reads periodo_registro from wrong path which affects expiration computation. |
</phase_requirements>

## Identified Bugs (Complete Inventory)

### Bug #1: Metadata read from document root instead of metadata subpath
**Location:** `src/hooks/useValidation.ts` lines 311-321
**What happens:** `useValidation` subscribes to `projects/${projectId}` and reads `projectData.titulo_proyecto`, `projectData.categoria_cinematografica`, `projectData.periodo_registro`, etc. directly from the document root.
**Correct path:** Data is stored under `metadata.*` nested field. `createProject` in `projects.ts` writes `{ metadata: { titulo_proyecto: ..., ... } }`. All other components read `data.metadata.titulo_proyecto`.
**Impact:** All metadata fields in ProjectDataSnapshot are empty strings / 0 / false. Affects VALD-02, VALD-04, VALD-05, VALD-07 (genre), VALD-13, VALD-17.
**Fix:** Read `projectData.metadata.titulo_proyecto` etc. or destructure `metadata` from `projectData`.

### Bug #2: Financial fields read from project root instead of financials subcollection
**Location:** `src/hooks/useValidation.ts` lines 326-334
**What happens:** `useValidation` reads `projectData.aportacion_erpi_efectivo_centavos`, `projectData.aportacion_erpi_especie_centavos`, `projectData.gestor_monto_centavos` from the project root document.
**Correct path:** Financial structure data is stored in `projects/{projectId}/financials/data` via `useAutoSave(projectId, 'financials')` in FinancialStructure.tsx. Fields are `aportacion_erpi_efectivo_centavos`, `aportacion_erpi_especie_centavos`, `terceros`, `gestor_monto_centavos`.
**Impact:** All EFICINE compliance percentages compute as 0. VALD-05 always passes (or produces meaningless results).
**Fix:** Add a new onSnapshot subscription to `projects/${projectId}/financials/data` and read financial fields from that document.

### Bug #3: Fee extractors return undefined (stub implementations)
**Location:** `src/hooks/useValidation.ts` lines 471-519
**What happens:** `extractFeesFromContracts`, `extractFeesFromBudget`, `extractFeesFromCashFlow` all return `undefined`. They have TODO comments noting that generatedDocs only contains metadata, not full content.
**Root cause:** `useGeneratedDocs` only fetches metadata fields (docId, docName, section, passId, contentType, generatedAt, manuallyEdited, version) -- it does NOT fetch the `content` field from generated documents.
**Impact:** VALD-03 (fee cross-match) always skips because all three fee sources are undefined.
**Fix approach:**
  - For budget fees: Read from `meta/budget_output` (already subscribed). Budget stores fees as partidas in accounts 100 (Guionista), 200 (Productor), 300 (Director). Extract from the cuentas array.
  - For contract fees: Read contract documents from `generated/B3-prod`, `generated/B3-dir`, `generated/C2b`. The legal pass injects fees as `honorarios_productor`, `honorarios_director`, `honorarios_guionista` into the prompt variables, but the stored content is AI-generated prose. The actual fee amounts come from intake team data (D-15). The correct approach is to compare intake team fees against budget line items, since both are deterministic.
  - For cash flow fees: Cash flow distributes budget amounts across months. The total per account should match budget. Since budget fees already match intake fees by construction (D-15), the simplest correct approach is to extract fees from the budget_output stored data.
  - **Alternative (recommended):** Since all three sources derive from the same intake team data (D-15 design decision), and fees are injected deterministically, extract from: (a) intake team data (already available), (b) budget_output partidas, (c) cash flow structured data. The cross-match validates that the pipeline preserved fee integrity.

### Bug #4: Submission/attempt counts hardcoded to 0
**Location:** `src/hooks/useValidation.ts` line 342-343
**What happens:** `submissionsThisPeriod: 0` and `projectAttempts: 0` are hardcoded in the snapshot assembly. Comments say "Not tracked in current data model."
**Impact:** VALD-08 (ERPI eligibility) never fails for submission/attempt counts. Only the unexhibited project check works.
**Fix approach:**
  - Add `intentos_proyecto` field to project metadata (tracks how many times this specific project has been submitted to EFICINE).
  - Add `solicitudes_periodo` field to ERPI settings (tracks how many submissions the ERPI has made this period across all projects).
  - These are small integer fields the user enters manually (there is no API to query SHCP for this data).
  - Read from the respective Firestore paths and pass to the snapshot.

### Bug #5: ERPI settings path mismatch
**Location:** `src/hooks/useValidation.ts` line 184
**What happens:** `useValidation` subscribes to `erpiSettings/default` (camelCase collection name).
**Correct path:** `src/services/erpi.ts` line 5 writes to `erpi_settings/default` (snake_case collection name).
**Impact:** `erpiSettings` is always null in the validation snapshot. ERPI prior projects are never checked. Affects VALD-08.
**Fix:** Change line 184 to `doc(db, 'erpi_settings/default')`.

### Bug #6: Regional bonus fields always false (known limitation)
**Location:** `src/validation/engine.ts` lines 179-184
**What happens:** `buildBonusInput` sets all regional fields to false/0 with a comment: "Regional fields remain false/0 -- no location data in current schema."
**Impact:** VALD-13 category (c) regional bonus can never be detected. Categories (a), (b), (d) work correctly.
**Status:** This was a known limitation from Phase 4 (documented in STATE.md decisions). Fixing it requires adding location data fields to the project schema and ERPI schema (director/producer origin, shooting location percentage, local crew percentage, ERPI domicile location). This is new feature work, not just wiring.
**Recommendation:** Add the schema fields and basic UI inputs. The validation rule already exists and will work once data flows in.

### Bug #7: DocumentUpload reads periodo_registro from wrong path
**Location:** `src/components/wizard/DocumentUpload.tsx` line 63
**What happens:** Reads `data.periodo_registro` from the project document root.
**Correct path:** Should read `data.metadata.periodo_registro` (metadata is a nested field).
**Impact:** `periodoRegistro` is always undefined, so DocumentChecklist never computes expiration status. VALD-17 (document expiration) works in the validation engine but the DocumentChecklist UI does not show expiration badges.
**Fix:** Change to `data.metadata?.periodo_registro`.

### Bug #8: Traffic light sidebar only wired for validacion screen
**Location:** `src/components/wizard/WizardShell.tsx` lines 38-44, 76-77
**What happens:** WizardShell computes `validacionStatus` from the validation report and passes `{ validacion: validacionStatus }` to WizardSidebar. All other screens default to `'partial'` (yellow).
**Impact:** The 5 intake screens (datos, guion, equipo, financiera, documentos) always show yellow traffic lights regardless of actual validation state. Only the validacion screen shows a meaningful color.
**Fix approach:** Map validation results to per-screen status. Each validation rule has a `navigateTo.screen` field that indicates which wizard screen it relates to. Group results by target screen and derive status (green=all pass, yellow=warnings, red=blockers).

### Bug #9: canExport may be incorrectly true due to upstream data bugs
**Location:** `src/hooks/useValidation.ts` report assembly, consumed by `ExportReadinessCard`
**What happens:** Because wiring bugs cause most rules to skip (not fail), `canExport` evaluates to true (0 blocker failures). The export proceeds despite EFICINE rules not actually being satisfied.
**Impact:** Export is not properly gated.
**Fix:** This resolves automatically once bugs #1-5 are fixed. No additional code change needed for canExport itself.

## Architecture Patterns

### Recommended Fix Strategy

The fixes fall into three categories:

**Category A: Path corrections (low risk, high confidence)**
- Bug #1: Read metadata from `projectData.metadata.*`
- Bug #5: Change ERPI path from `erpiSettings` to `erpi_settings`
- Bug #7: Change DocumentUpload to read `data.metadata.periodo_registro`

**Category B: New subscriptions + extractors (medium complexity)**
- Bug #2: Add onSnapshot for `projects/{id}/financials/data`
- Bug #3: Implement fee extractors from budget_output and generated docs
- Bug #4: Add submission tracking fields to schema + read in snapshot

**Category C: New feature (additive, optional)**
- Bug #6: Add regional bonus location fields to schema/UI
- Bug #8: Compute per-screen traffic light from validation results

### Fee Extraction Architecture (Bug #3)

The fee cross-match (VALD-03) needs fees from three sources. Here is how they are stored:

**From intake (team data):**
- Already available via `teamMembers` in useValidation
- Producer: `team.find(m => m.cargo === 'Productor').honorarios_centavos`
- Director: `team.find(m => m.cargo === 'Director').honorarios_centavos`
- Screenwriter: `team.find(m => m.cargo === 'Guionista').honorarios_centavos`

**From budget (`meta/budget_output`):**
- Already subscribed in useValidation (budgetTotalCentavos)
- Need to expand subscription to read full `cuentas` array
- Producer fee: `cuentas[account 200].partidas.find(p => p.concepto === 'Productor').subtotalCentavos`
- Director fee: `cuentas[account 300].partidas.find(p => p.concepto === 'Director').subtotalCentavos`
- Screenwriter fee: `cuentas[account 100].partidas.find(p => p.concepto === 'Guionista').subtotalCentavos`

**From cash flow (`generated/A9d`):**
- Already subscribed in useValidation (cashFlowDoc)
- Cash flow distributes budget across months. The total per account row should equal the budget account total.
- Extract by finding the row with `cuenta` matching the account name pattern and summing the `amounts` array.

**From contracts (`generated/B3-prod`, `B3-dir`, `C2b`):**
- Contract content is AI-generated prose with injected fee amounts
- Extracting exact centavo amounts from prose is fragile (regex on "$X,XXX,XXX MXN" patterns)
- **Recommended approach:** Since contracts are generated from intake team fees (D-15 design decision), the authoritative source is intake data. Compare intake fees vs budget fees vs cash flow totals to validate the pipeline preserved integrity. Contract fee extraction from prose is optional and can be deferred.

### Per-Screen Traffic Light Architecture (Bug #8)

Each validation rule's `navigateTo.screen` field maps it to a wizard screen:

| Screen | Rules |
|--------|-------|
| datos | VALD-02 (title), VALD-04 (dates via periodo) |
| guion | (none directly -- VALD-09 file format) |
| equipo | VALD-07 (experience), VALD-13 (bonus) |
| financiera | VALD-01 (reconciliation), VALD-03 (fees), VALD-05 (EFICINE) |
| documentos | VALD-06 (completeness), VALD-17 (expiration) |
| erpi | VALD-08 (eligibility) |
| generacion | VALD-10 (prohibited expenditure), VALD-11 (ruta critica sync) |

Derive screen status: if any blocker fails -> red, if any warning fails -> yellow, all pass/skip -> green.

### Firestore Data Model Reference

```
projects/{projectId}                    # Root document
  metadata: {                           # Nested field (NOT subcollection)
    titulo_proyecto, categoria_cinematografica, categoria_director,
    duracion_estimada_minutos, formato_filmacion, relacion_aspecto,
    idiomas, costo_total_proyecto_centavos, monto_solicitado_eficine_centavos,
    periodo_registro, es_coproduccion_internacional, tipo_cambio_fx,
    fecha_tipo_cambio
  }
  createdAt, updatedAt

projects/{projectId}/financials/data    # Subcollection document
  aportacion_erpi_efectivo_centavos, aportacion_erpi_especie_centavos,
  terceros: [...], monto_eficine_centavos, tiene_gestor,
  gestor_nombre, gestor_monto_centavos

projects/{projectId}/team/{memberId}    # Subcollection
  nombre_completo, cargo, honorarios_centavos, aportacion_especie_centavos,
  filmografia: [...], es_mujer, es_indigena_afromexicano, es_socio_erpi

projects/{projectId}/documents/{tipo}   # Subcollection
  tipo, filename, storagePath, uploadedAt, fecha_emision, status

projects/{projectId}/generated/{docId}  # Subcollection
  docId, docName, section, passId, content, contentType,
  generatedAt, modelUsed, promptFile, version, manuallyEdited

projects/{projectId}/meta/budget_output # Subcollection document
  cuentas: [...], totalCentavos, totalFormatted

erpi_settings/default                   # Top-level document (snake_case!)
  razon_social, rfc, representante_legal, domicilio_fiscal,
  proyectos_previos_eficine: [...]
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fee extraction from prose | Regex parser for contract text | Compare intake fees vs budget partidas | Prose parsing is fragile; all fees derive from same intake source by design (D-15) |
| Date period mapping | Manual date parsing of "2026-P1" | PERIODOS_EFICINE constant from `src/lib/constants.ts` | Already has open/close dates per period |
| Traffic light computation | Custom per-screen logic | Group ValidationResult by navigateTo.screen | Validation results already have screen mapping |

## Common Pitfalls

### Pitfall 1: Firestore Path Case Sensitivity
**What goes wrong:** Using `erpiSettings` vs `erpi_settings` -- Firestore collection names are case-sensitive strings.
**Why it happens:** Different developers wrote the service vs the hook at different times with different naming conventions.
**How to avoid:** Always trace the write path from the service/form that creates the data. Never assume the path.
**Warning signs:** Data is always null despite being visible in the Firestore console.

### Pitfall 2: Nested Fields vs Subcollections
**What goes wrong:** Reading `projectData.titulo_proyecto` when the actual structure is `projectData.metadata.titulo_proyecto`.
**Why it happens:** Firestore documents can have both nested fields and subcollections. The Firestore `onSnapshot` returns the document data including nested objects, but NOT subcollection data.
**How to avoid:** Check `createProject` / `updateProjectMetadata` to see the exact write structure.
**Warning signs:** Fields that should have values are always empty/undefined/0.

### Pitfall 3: False-Green Validation State
**What goes wrong:** Empty data causes rules to skip rather than fail, producing canExport=true.
**Why it happens:** Validation rules are designed to skip when insufficient data is available (graceful degradation). But when ALL data is missing due to wiring bugs, everything skips and nothing fails.
**How to avoid:** After fixing wiring, add a "minimum data threshold" check -- if metadata is empty, the report should not report canExport=true. Consider: if titulo_proyecto is empty, at least VALD-02 should fail, not skip.
**Warning signs:** All rules show "skip" status; dashboard appears all-green for an incomplete project.

### Pitfall 4: Budget Output Structure for Fee Extraction
**What goes wrong:** Assuming flat fee fields exist in budget_output when fees are nested in cuentas[].partidas[].
**Why it happens:** budget_output stores the full BudgetOutput with cuentas array containing BudgetAccount objects with partidas arrays.
**How to avoid:** Navigate: `budget_output.cuentas.find(c => c.numeroCuenta === 200).partidas.find(p => p.concepto === 'Productor').subtotalCentavos`
**Warning signs:** Fee extraction returns undefined or 0.

### Pitfall 5: Multiple Subscriptions and Render Cycles
**What goes wrong:** Adding a new Firestore subscription (for financials/data) causes additional re-renders and may trigger the debounced validation multiple times.
**Why it happens:** Each useState setter in an onSnapshot callback triggers a re-render, and the snapshot useMemo has many dependencies.
**How to avoid:** Follow the existing pattern: separate loading state per subscription, include in the `loading` conjunction. The 300ms debounce in runInstant already handles rapid state changes.

### Pitfall 6: VALD-04 Date Parsing Bug
**What goes wrong:** The engine passes `new Date(data.metadata.periodo_registro)` as the registration close date. But `periodo_registro` contains "2026-P1" or "2026-P2", which `new Date()` cannot parse (returns Invalid Date).
**How to avoid:** Map the periodo string to an actual close date using `PERIODOS_EFICINE['2026-P1'].close`.
**Warning signs:** VALD-04 always passes because the close date is NaN and date comparisons with NaN always return false.

## Code Examples

### Pattern: Correct Metadata Read
```typescript
// WRONG (current):
const metadata = {
  titulo_proyecto: (projectData.titulo_proyecto as string) ?? '',
  // ...reads from document root
}

// CORRECT:
const meta = projectData.metadata as Record<string, unknown> | undefined
const metadata = {
  titulo_proyecto: (meta?.titulo_proyecto as string) ?? '',
  categoria_cinematografica: (meta?.categoria_cinematografica as string) ?? '',
  periodo_registro: (meta?.periodo_registro as string) ?? '',
  // ...
}
```

### Pattern: New Financial Subscription
```typescript
// Add alongside existing subscriptions in useValidation:
const [financialData, setFinancialData] = useState<Record<string, unknown> | null>(null)
const [financialLoading, setFinancialLoading] = useState(true)

useEffect(() => {
  if (!projectId) {
    setFinancialData(null)
    setFinancialLoading(false)
    return
  }
  return onSnapshot(
    doc(db, `projects/${projectId}/financials/data`),
    (snap) => {
      setFinancialData(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
      setFinancialLoading(false)
    },
    () => setFinancialLoading(false),
  )
}, [projectId])
```

### Pattern: Fee Extraction from Budget Output
```typescript
function extractFeesFromBudgetOutput(
  budgetDoc: Record<string, unknown> | null,
): { producerFeeCentavos?: number; directorFeeCentavos?: number; screenwriterFeeCentavos?: number } | undefined {
  if (!budgetDoc) return undefined
  const cuentas = budgetDoc.cuentas as Array<{
    numeroCuenta: number
    partidas: Array<{ concepto: string; subtotalCentavos: number }>
  }> | undefined
  if (!cuentas) return undefined

  function findFee(accountNum: number, concepto: string): number | undefined {
    const account = cuentas!.find(c => c.numeroCuenta === accountNum)
    if (!account) return undefined
    const partida = account.partidas.find(p => p.concepto === concepto)
    return partida?.subtotalCentavos
  }

  return {
    screenwriterFeeCentavos: findFee(100, 'Guionista'),
    producerFeeCentavos: findFee(200, 'Productor'),
    directorFeeCentavos: findFee(300, 'Director'),
  }
}
```

### Pattern: Per-Screen Traffic Light
```typescript
function deriveScreenStatuses(
  report: ValidationReport | null,
): Partial<Record<WizardScreen, TrafficLightStatus>> {
  if (!report) return {}

  const statusMap: Partial<Record<WizardScreen, TrafficLightStatus>> = {}
  const screenResults = new Map<string, ValidationResult[]>()

  for (const result of report.results) {
    const screen = result.navigateTo?.screen ?? 'validacion'
    const existing = screenResults.get(screen) ?? []
    existing.push(result)
    screenResults.set(screen, existing)
  }

  for (const [screen, results] of screenResults) {
    const hasBlocker = results.some(r => r.severity === 'blocker' && r.status === 'fail')
    const hasWarning = results.some(r => r.severity === 'warning' && r.status === 'fail')
    statusMap[screen as WizardScreen] = hasBlocker ? 'error' : hasWarning ? 'partial' : 'complete'
  }

  return statusMap
}
```

## State of the Art

| Old Approach (Current) | Correct Approach (Phase 6) | Impact |
|------------------------|---------------------------|--------|
| Read metadata from document root | Read from `metadata.*` nested field | Fixes VALD-02, 04, 05, 07, 13, 17 |
| No financials subscription | Subscribe to `financials/data` | Fixes VALD-05 |
| ERPI path `erpiSettings/default` | Correct path `erpi_settings/default` | Fixes VALD-08 |
| Fee extractors return undefined | Real extractors from budget_output + cash flow | Fixes VALD-03 |
| Submission counts hardcoded 0 | Track in schema, read from Firestore | Fixes VALD-08 |
| Regional bonus always false | Add location fields to schema | Fixes VALD-13 category (c) |
| Single validacion traffic light | Per-screen traffic light mapping | Fixes VALD-16 |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1 + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/validation/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALD-01 | Financial reconciliation receives correct totals | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -t "VALD-01" -x` | Yes |
| VALD-02 | Title consistency receives correct title | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -t "VALD-02" -x` | Yes |
| VALD-03 | Fee cross-match receives real fees from 3 sources | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -t "VALD-03" -x` | Yes |
| VALD-04 | Date compliance receives correct close date | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -t "VALD-04" -x` | Yes |
| VALD-05 | EFICINE compliance receives correct financial data | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -t "VALD-05" -x` | Yes |
| VALD-07 | Experience thresholds team data flows correctly | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -t "VALD-07" -x` | Yes |
| VALD-08 | ERPI eligibility receives real counts + settings | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -t "VALD-08" -x` | Yes |
| VALD-13 | Bonus eligibility receives regional fields | unit | `npx vitest run src/validation/__tests__/warningRules.test.ts -t "VALD-13" -x` | Yes |
| VALD-14 | Real-time validation fires on data change | integration | manual-only (requires Firestore emulator + UI) | N/A |
| VALD-16 | Traffic light reflects real validation state | unit | Wave 0 -- `src/validation/__tests__/trafficLight.test.ts` | No |
| LANG-03 | Dates formatted in Spanish | unit | `npx vitest run src/validation/__tests__/dateFormat.test.ts -x` | No (Wave 0) |
| Data wiring | useValidation reads correct paths | unit | Wave 0 -- `src/hooks/__tests__/useValidation.test.ts` | No |
| Fee extraction | Budget/cashflow fee extractors return correct amounts | unit | Wave 0 -- `src/hooks/__tests__/feeExtractors.test.ts` | No |

### Sampling Rate
- **Per task commit:** `npx vitest run src/validation/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/hooks/__tests__/feeExtractors.test.ts` -- covers VALD-03 fee extraction from budget_output and cash flow structured data
- [ ] `src/validation/__tests__/trafficLight.test.ts` -- covers VALD-16 per-screen status derivation
- [ ] Update `src/validation/__tests__/engine.test.ts` -- expand emptySnapshot and validSnapshot to use correct metadata/financial structures matching real Firestore paths

## Open Questions

1. **Regional bonus data capture (Bug #6)**
   - What we know: VALD-13 category (c) requires director/producer origin, shooting location %, local crew %, ERPI domicile. The validation rule is fully implemented; only data is missing.
   - What's unclear: Should we add full UI fields for all 6 regional data points, or is a simpler "applies for regional bonus" boolean sufficient?
   - Recommendation: Add the specific fields to project metadata schema and minimal UI inputs on the Datos screen. The validation rule already uses the granular fields. Keep it simple: checkboxes for origin + numeric inputs for percentages.

2. **ERPI submission tracking persistence**
   - What we know: `submissionsThisPeriod` and `projectAttempts` are not tracked anywhere in the data model.
   - What's unclear: Should these be auto-incremented on export, or manually entered by the user?
   - Recommendation: Manual entry. Add `intentos_proyecto` to project metadata and `solicitudes_periodo_actual` to ERPI settings. The user knows how many times they have submitted. Auto-increment on export would be wrong if they export multiple times for review without actually submitting.

3. **False-green on empty project**
   - What we know: An empty project will have many rules skip, resulting in canExport=true despite having no data.
   - Recommendation: After fixing data wiring, rules like VALD-06 (document completeness) and VALD-05 (EFICINE compliance with 0 budget) will fail as blockers. This should be self-correcting. Verify after implementation.

## Sources

### Primary (HIGH confidence)
- Direct code audit of `src/hooks/useValidation.ts` (522 lines) -- all 8 Firestore subscriptions traced
- Direct code audit of `src/services/projects.ts` -- createProject and updateProjectMetadata confirm metadata nesting
- Direct code audit of `src/services/erpi.ts` -- confirms `erpi_settings` collection name
- Direct code audit of `src/components/wizard/FinancialStructure.tsx` -- confirms financials/data write path
- Direct code audit of `functions/src/pipeline/documentStore.ts` -- confirms generated doc and budget_output structure
- Direct code audit of `functions/src/financial/budgetComputer.ts` -- confirms fee storage in cuentas/partidas
- Direct code audit of `functions/src/financial/cashFlowBuilder.ts` -- confirms CashFlowOutput structure
- Direct code audit of `functions/src/pipeline/passes/legal.ts` -- confirms D-15 fee injection from intake
- Direct code audit of `src/validation/engine.ts` -- confirms rule parameter mapping
- Direct code audit of `src/validation/types.ts` -- confirms ProjectDataSnapshot interface

### Secondary (MEDIUM confidence)
- STATE.md decisions log -- confirms regional bonus fields were known limitation from Phase 4

## Metadata

**Confidence breakdown:**
- Bug identification: HIGH -- every bug found by direct code path tracing (write path vs read path comparison)
- Fix approach: HIGH -- patterns follow existing codebase conventions exactly
- Fee extraction architecture: MEDIUM -- budget_output structure confirmed but cash flow row parsing needs validation against real data
- Regional bonus scope: MEDIUM -- whether to include full UI or just schema depends on user preference

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase, internal tool)
