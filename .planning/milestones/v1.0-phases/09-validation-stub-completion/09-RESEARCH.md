# Phase 9: Validation Stub Completion - Research

**Researched:** 2026-03-25
**Domain:** Validation engine data wiring (VALD-09 file format, VALD-12 hyperlink accessibility)
**Confidence:** HIGH

## Summary

Phase 9 closes two low-priority gaps from the v1.0 milestone audit: VALD-09 (file format compliance) permanently skips because `outputFiles` is never populated in the `ProjectDataSnapshot`, and VALD-12 (hyperlink accessibility) permanently skips because `extractLinks()` in `engine.ts` always returns an empty array.

Both validation rules already have complete implementations -- the rule functions themselves are correct and well-tested. The gap is purely in the data wiring layer: the snapshot assembly in `useValidation.ts` never populates the `outputFiles` field, and the `extractLinks()` function in `engine.ts` never extracts URLs from team member filmography entries. This phase is strictly about connecting existing data sources to existing rule functions.

The scope is small and self-contained. No new libraries, no new patterns, no new UI components. The changes touch 2 files (`useValidation.ts` and `engine.ts`) with supporting test updates.

**Primary recommendation:** Wire `outputFiles` from EXPORT_FILE_MAP + generated doc list in the snapshot assembly, and rewrite `extractLinks()` to extract filmography `enlace` URLs from team members. Both changes are pure data transformations with no side effects.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALD-09 | File format compliance -- all output PDFs <=40 MB, filenames <=15 chars, no accents/n-tilde/commas/&/symbols (blocker) | `outputFiles` can be computed deterministically from `EXPORT_FILE_MAP` + `generatedDocs` list + project title. No PDF rendering needed -- filenames are deterministic and sizes can be estimated or set to 0 (filename validation is the real check). |
| VALD-12 | Hyperlink accessibility -- verify filmmaker portfolio and material visual links are publicly accessible (warning) | Team members have `filmografia[].enlace` (URL per filmography entry) stored in Firestore. `extractLinks()` should map these to `LinkCheckInput[]`. HyperlinkVerifier component already exists and caches verification results per URL. |
</phase_requirements>

## Standard Stack

No new libraries needed. All work uses existing project code.

### Core (already installed)
| Library | Version | Purpose | Usage in Phase |
|---------|---------|---------|----------------|
| React | 19.2 | Frontend framework | useValidation hook changes |
| TypeScript | 5.9 | Type safety | Pure function signatures |
| Vitest | 4.1 | Unit tests | Test updates for engine, wiring |

### Existing Code Being Connected
| Module | Path | Current State | Needed Change |
|--------|------|---------------|---------------|
| `validateFileFormatCompliance` | `src/validation/rules/fileFormatCompliance.ts` | Working, tested | None -- rule is correct |
| `validateHyperlinkAccessibility` | `src/validation/rules/hyperlinkAccessibility.ts` | Working, tested | None -- rule is correct |
| `extractLinks()` | `src/validation/engine.ts` (line 200-203) | Stub returns `[]` | Rewrite to extract from team filmography |
| `useValidation` snapshot | `src/hooks/useValidation.ts` (line 436-518) | Missing `outputFiles` | Add computed `outputFiles` from EXPORT_FILE_MAP |
| `EXPORT_FILE_MAP` | `src/lib/export/fileNaming.ts` | Complete registry of 21 generated docs | Import and use for filename validation |
| `generateFilename` | `src/lib/export/fileNaming.ts` | Generates IMCINE-compliant filenames | Use to compute output file names |
| `HyperlinkVerifier` | `src/components/validation/HyperlinkVerifier.tsx` | Working, renders inline next to filmography URL fields | Already wired in TeamMemberForm |

## Architecture Patterns

### Pattern 1: Deterministic Output File List from EXPORT_FILE_MAP

**What:** Compute `outputFiles` without rendering actual PDFs. The filenames are fully deterministic from `EXPORT_FILE_MAP` + project title. File sizes are unknown pre-export, but filename validation is the critical check (size validation already happens during export).

**When to use:** When VALD-09 needs pre-export filename validation.

**Implementation approach:**

```typescript
// In useValidation.ts snapshot assembly:
import { EXPORT_FILE_MAP, generateFilename } from '@/lib/export/fileNaming'

// Compute outputFiles from generated docs that exist
const outputFiles = useMemo((): Array<{ name: string; format: string; sizeMB: number }> => {
  if (!projectData) return []
  const title = (projectData.metadata as Record<string, unknown>)?.titulo_proyecto as string ?? ''
  if (!title) return []

  return generatedDocs
    .filter(d => EXPORT_FILE_MAP[d.docId]) // Only docs that have export entries
    .map(d => {
      const entry = EXPORT_FILE_MAP[d.docId]
      const filename = generateFilename(entry.filenameTemplate, title) + '.pdf'
      return { name: filename, format: 'pdf', sizeMB: 0 } // Size unknown pre-export
    })
}, [generatedDocs, projectData])
```

**Key insight:** The `validateFileFormatCompliance` rule checks filename pattern (`^[A-Za-z0-9_]{1,15}\.pdf$`) and size (`<=40 MB`). Since `generateFilename` already enforces the 15-char truncation and ASCII-only pattern, the filename check will always pass for generated docs. The real value is validating uploaded files as well. However, the current rule signature only takes `outputFiles` (not uploaded files), so for this phase we wire what exists. Uploaded file validation already happens during export in `services/export.ts`.

**Size handling:** Set `sizeMB: 0` for pre-export validation. The actual size check happens at export time when PDFs are rendered. VALD-09 will pass (0 < 40), which is correct behavior -- we cannot know PDF sizes before rendering.

### Pattern 2: Extract Links from Team Filmography

**What:** Rewrite `extractLinks()` to iterate team members' filmography entries and extract `enlace` URLs.

**Data flow analysis:**

1. TeamMemberForm has filmography entries with `enlace` field (URL per entry)
2. Data saved to Firestore `projects/{id}/team/{memberId}`
3. `useValidation` subscribes to team collection and gets `TeamMember[]`
4. Team schema defines `filmografia: z.array(filmographyEntrySchema)` where `filmographyEntrySchema` has `enlace: z.string().url().optional()`
5. Team schema also defines `enlaces: z.array(z.string()).optional()` (top-level, but NOT in the form schema)

**Critical finding:** The form (`TeamMemberForm.tsx`) saves `filmografia[].enlace` per entry but does NOT save a top-level `enlaces` array. The team schema has `enlaces` at the top level, but the form never populates it. The scoring code (`scoring.ts` line 160-161) checks `m.enlaces && m.enlaces.length > 0` which may never find data from form-saved entries. However, this is a pre-existing issue in scoring, not in scope for Phase 9.

**For VALD-12, use `filmografia[].enlace` as the data source:**

```typescript
function extractLinks(data: ProjectDataSnapshot): LinkCheckInput[] {
  const links: LinkCheckInput[] = []
  for (const member of data.team) {
    if (!member.filmografia) continue
    for (const entry of member.filmografia) {
      if (entry.enlace && entry.enlace.startsWith('http')) {
        links.push({
          url: entry.enlace,
          label: `${member.nombre_completo} - ${entry.titulo}`,
          verified: false,  // Engine doesn't do HTTP -- verified status comes from UI cache
          accessible: false,
        })
      }
    }
  }
  return links
}
```

**Verification status problem:** The `HyperlinkVerifier` component caches verification results in a module-level `Map<string, { accessible: boolean; corsBlocked: boolean }>` -- but this is component-local state, NOT persisted to Firestore. The validation engine is pure (no React, no Firestore, no side effects). It cannot read the HyperlinkVerifier cache.

**Design decision required:** How to get verification status into the engine:

- **Option A (recommended):** `extractLinks` always returns `verified: false, accessible: false` for links that have not been verified. The rule will report "X enlace(s) no verificado(s)" as a warning. This is honest and simple. Users can verify links in the team form UI. This matches the D-12 decision: "Hyperlink rule reads cached verification only, no HTTP requests."

- **Option B:** Add a `linkVerificationCache` field to `ProjectDataSnapshot` populated from HyperlinkVerifier results. This requires threading verification callbacks from every TeamMemberForm up to useValidation. Complex and fragile for a warning-level rule.

- **Option C:** Persist verification results to Firestore per team member per filmography entry (e.g., `filmografia[].enlace_verificado: boolean`). This survives page reloads but requires schema changes.

**Recommendation:** Option A for this phase. The rule will go from "permanently skipping" to "reporting unverified links as warnings." This is a meaningful improvement. Option C could be a future enhancement if users want persistent verification state.

### Anti-Patterns to Avoid

- **Do NOT render PDFs to get file sizes for VALD-09.** PDF rendering is expensive and happens during export. Pre-export validation should check filenames only. Size 0 passes the <=40MB check correctly.
- **Do NOT make HTTP requests in extractLinks().** The engine is pure -- no side effects. Per D-12, the hyperlink rule reads cached results only.
- **Do NOT try to access the HyperlinkVerifier component cache from the engine.** The cache is in React component state, not accessible from pure functions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Filename generation | Custom filename builder | `generateFilename()` from `fileNaming.ts` | Already handles sanitization, truncation, ASCII enforcement |
| URL validation | Custom URL regex | `entry.enlace.startsWith('http')` guard + existing Zod `.url()` on schema | Schema already validates URL format at entry time |

## Common Pitfalls

### Pitfall 1: Trying to Compute PDF File Sizes Pre-Export

**What goes wrong:** Attempting to render PDFs just to get file sizes, which is expensive and unnecessary.
**Why it happens:** VALD-09 checks both filename AND size. Temptation to provide real sizes.
**How to avoid:** Set `sizeMB: 0` for pre-export validation. Real size checking happens at export time in `fetchUploadedFiles()` which already validates `MAX_FILE_SIZE = 40 * 1024 * 1024`.
**Warning signs:** Importing PDF rendering code into useValidation.

### Pitfall 2: Confusing `filmografia[].enlace` with `TeamMember.enlaces`

**What goes wrong:** Reading from `member.enlaces` (top-level array) which is never populated by the form.
**Why it happens:** The Zod schema has both fields. Scoring code uses `member.enlaces`.
**How to avoid:** Use `member.filmografia[].enlace` which is the actual data source from TeamMemberForm.
**Warning signs:** Empty link arrays despite users having entered URLs in filmography.

### Pitfall 3: Circular Dependency Between UI Verification and Engine

**What goes wrong:** Trying to thread HyperlinkVerifier cache results back into the pure validation engine.
**Why it happens:** VALD-12 wants to report verified/accessible status, but the verification cache lives in React component state.
**How to avoid:** Accept that `extractLinks()` returns `verified: false` for all links. The rule reports them as "not verified" which is a valid warning. Users can verify links via the inline HyperlinkVerifier in the form.
**Warning signs:** Adding Firestore writes to HyperlinkVerifier, adding React state to engine.ts.

### Pitfall 4: Breaking Existing Tests

**What goes wrong:** Changing `extractLinks` or snapshot shape breaks existing engine integration tests.
**Why it happens:** `engine.test.ts` has `emptySnapshot()` with no team data and `validSnapshot()` with team data but no filmography URLs.
**How to avoid:** Existing tests should continue to pass because: (1) empty team -> empty links -> VALD-12 skips, (2) team without enlace URLs -> empty links -> VALD-12 skips. Add NEW tests for the wired scenarios.
**Warning signs:** Existing test assertions changing status from 'skip' to something else.

## Code Examples

### VALD-09: Computing outputFiles in useValidation

```typescript
// src/hooks/useValidation.ts -- inside the hook, before snapshot assembly

import { EXPORT_FILE_MAP, generateFilename } from '@/lib/export/fileNaming'

// Compute outputFiles from generated docs + EXPORT_FILE_MAP
const outputFiles = useMemo((): Array<{ name: string; format: string; sizeMB: number }> => {
  const title = (projectData?.metadata as Record<string, unknown>)?.titulo_proyecto as string ?? ''
  if (!title || generatedDocs.length === 0) return []

  return generatedDocs
    .filter(d => d.docId in EXPORT_FILE_MAP)
    .map(d => ({
      name: generateFilename(EXPORT_FILE_MAP[d.docId].filenameTemplate, title) + '.pdf',
      format: 'pdf',
      sizeMB: 0, // Size unknown pre-export; filename validation is the critical check
    }))
}, [generatedDocs, projectData])

// Then in the snapshot:
return {
  // ...existing fields...
  outputFiles,
}
```

### VALD-12: Extracting Links from Team Filmography

```typescript
// src/validation/engine.ts -- replace the extractLinks stub

function extractLinks(data: ProjectDataSnapshot): LinkCheckInput[] {
  const links: LinkCheckInput[] = []
  for (const member of data.team) {
    if (!member.filmografia) continue
    for (const entry of member.filmografia) {
      if (entry.enlace && entry.enlace.startsWith('http')) {
        links.push({
          url: entry.enlace,
          label: `${member.nombre_completo} - ${entry.titulo}`,
          verified: false,
          accessible: false,
        })
      }
    }
  }
  return links
}
```

### Test: extractLinks with filmography URLs

```typescript
// src/validation/__tests__/engine.test.ts -- add to existing tests

it('VALD-12 should report unverified links when team has filmography URLs', () => {
  const snap = emptySnapshot()
  snap.team = [
    {
      nombre_completo: 'Ana Lopez',
      cargo: 'Director',
      filmografia: [
        { titulo: 'Corto 1', anio: 2020, cargo_en_obra: 'Director', enlace: 'https://vimeo.com/123' },
        { titulo: 'Corto 2', anio: 2021, cargo_en_obra: 'Director' }, // no enlace
      ],
      nacionalidad: 'Mexicana',
      honorarios_centavos: 100000,
      aportacion_especie_centavos: 0,
    },
  ] as ProjectDataSnapshot['team']

  const report = runInstantRules(snap)
  const vald12 = report.results.find(r => r.ruleId === 'VALD-12')
  expect(vald12?.status).toBe('fail') // Warning: 1 unverified link
  expect(vald12?.severity).toBe('warning')
})
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/validation/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALD-09 | outputFiles populated from EXPORT_FILE_MAP + generatedDocs | unit | `npx vitest run src/validation/__tests__/engine.test.ts -x` | Yes (update needed) |
| VALD-09 | Filename validation passes for generated docs | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -x` | Yes (existing tests sufficient) |
| VALD-12 | extractLinks extracts filmography enlace URLs | unit | `npx vitest run src/validation/__tests__/engine.test.ts -x` | Yes (add new test) |
| VALD-12 | Rule reports unverified links as warning | unit | `npx vitest run src/validation/__tests__/warningRules.test.ts -x` | Yes (existing tests sufficient) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/validation/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Tests in `blockerRules.test.ts`, `warningRules.test.ts`, and `engine.test.ts` cover VALD-09 and VALD-12 rule functions. New test cases needed for the wired scenarios only.

## Open Questions

1. **Should uploaded file metadata also feed into VALD-09?**
   - What we know: Uploaded files have `filename` and can have size measured at export. Currently VALD-09 only checks `outputFiles` (generated docs).
   - What's unclear: Should uploaded docs be included in pre-export filename/size validation?
   - Recommendation: Out of scope for this phase. Uploaded files are validated at export time by `fetchUploadedFiles()`. The `outputFiles` type in `ProjectDataSnapshot` is for generated output files only. Adding uploaded file validation would require changing the VALD-09 rule signature or adding a separate rule.

2. **Should verification status be persisted to Firestore?**
   - What we know: HyperlinkVerifier caches results in module-level Map. Results lost on page refresh.
   - What's unclear: Whether users expect verification to persist.
   - Recommendation: Out of scope. Current approach (report unverified links as warnings) is correct and useful. Persistence can be added later as an enhancement.

## Sources

### Primary (HIGH confidence)
- Direct code analysis of `src/validation/rules/fileFormatCompliance.ts` -- complete rule implementation
- Direct code analysis of `src/validation/rules/hyperlinkAccessibility.ts` -- complete rule implementation
- Direct code analysis of `src/validation/engine.ts` -- extractLinks stub at line 200-203
- Direct code analysis of `src/hooks/useValidation.ts` -- snapshot assembly missing outputFiles
- Direct code analysis of `src/lib/export/fileNaming.ts` -- EXPORT_FILE_MAP and generateFilename
- Direct code analysis of `src/schemas/team.ts` -- filmografia schema with enlace field
- Direct code analysis of `src/components/wizard/TeamMemberForm.tsx` -- filmografia form with enlace input
- Direct code analysis of `src/components/validation/HyperlinkVerifier.tsx` -- verification cache in component state
- v1.0 Milestone Audit (`.planning/v1.0-MILESTONE-AUDIT.md`) -- gap definitions

### Secondary (MEDIUM confidence)
- Phase decisions from STATE.md: D-12 ("Hyperlink rule reads cached verification only, no HTTP requests")
- Phase decisions from STATE.md: D-11 ("Three tiered entry points: runInstantRules (12), runMediumRules (2), runAllRules (14)")

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing code
- Architecture: HIGH -- both changes are simple data wiring in existing modules
- Pitfalls: HIGH -- identified from direct code analysis, all verified

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- internal project, no external API changes)
