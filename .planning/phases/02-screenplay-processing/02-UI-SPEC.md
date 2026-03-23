---
phase: 2
slug: screenplay-processing
status: draft
shadcn_initialized: true
preset: base-nova (neutral)
created: 2026-03-22
---

# Phase 2 --- UI Design Contract

> Incremental visual and interaction contract for the screenplay processing backend phase. Phase 2 is backend-heavy; the Screen 2 layout (side-by-side PDF viewer + parsed data editor) was built in Phase 1. This contract covers only the new UI states introduced by backend processing: extraction loading, analysis loading, analysis results display, error states, and the "Analizar guion" trigger.

---

## Design System

Inherited from Phase 1. No changes.

| Property | Value |
|----------|-------|
| Tool | shadcn/ui v4 CLI |
| Preset | base-nova (neutral) |
| Component library | Radix UI (via shadcn/ui) |
| Icon library | Lucide React |
| Font | Inter, system-ui, -apple-system, sans-serif |

**Source:** Phase 1 UI-SPEC, confirmed via `components.json` (style: base-nova, baseColor: neutral).

---

## Spacing Scale

Inherited from Phase 1. No changes or exceptions for Phase 2.

| Token | Value | Usage in Phase 2 |
|-------|-------|-------------------|
| xs | 4px | Spinner icon gap to label text |
| sm | 8px | Alert banner internal padding, badge gaps |
| md | 16px | Analysis results section padding, card padding |
| lg | 24px | Section gaps between analysis result categories |
| xl | 32px | Not used in Phase 2 additions |
| 2xl | 48px | Not used in Phase 2 additions |
| 3xl | 64px | Not used in Phase 2 additions |

Exceptions: none.

---

## Typography

Inherited from Phase 1. No changes. Phase 2 additions use these existing roles:

| Role | Size | Weight | Line Height | Phase 2 Usage |
|------|------|--------|-------------|---------------|
| Body | 14px | 400 (regular) | 1.5 | Analysis result values, spinner label text, error descriptions, alert body text |
| Body (label) | 14px | 600 (semibold) | 1.5 | Analysis result field labels, section subheadings in results panel |
| Heading | 20px | 600 (semibold) | 1.2 | Not new in Phase 2 (screen title "Guion" already exists) |

**No new typography roles introduced.** All Phase 2 text fits within the existing 14px body / 20px heading system.

---

## Color

Inherited from Phase 1. No new tokens. Phase 2 uses these existing tokens for new states:

| Token | Phase 2 Usage |
|-------|---------------|
| `--color-status-green` | "Analisis completo" success badge, analysis completion indicator |
| `--color-status-yellow` | Parse warning banner (already used in Phase 1 for parser failure), "Reanalizando..." stale indicator |
| `--color-status-red` | Analysis failure alert, extraction failure alert |
| `--color-muted-foreground` | Spinner label text ("Analizando guion..."), disabled button text |
| `--color-primary` | "Analizar guion" CTA button, "Reintentar" button |
| `--color-destructive` | Not used in Phase 2 (no destructive actions added) |

**No new CSS custom properties required.**

---

## Copywriting Contract

All copy in Mexican Spanish per INTK-10 and `directives/politica_idioma.md`. New strings for Phase 2 to be added to `src/locales/es.ts` under a new `screen2Analysis` key (or extended into existing `screen2` key).

### New `screenplay_status` States

Phase 1 defined statuses: `pending`, `uploaded`, `parsed`, `error`. Phase 2 adds backend-driven statuses: `extracting`, `analyzing`, `analyzed`, `analysis_error`, `extraction_error`. The UI must handle all states.

### Extraction States (Cloud Function 1: PDF text extraction)

| State | UI Element | Copy |
|-------|-----------|------|
| Extracting in progress | Inline spinner in right panel header | Extrayendo texto del guion... |
| Extraction succeeded | Toast notification | Texto extraido exitosamente |
| Extraction failed (garbled text) | Warning banner (yellow) at top of right panel | No se pudo extraer el texto correctamente. Puedes ingresar los datos manualmente. |
| Extraction failed (file too large) | Toast error on upload attempt | El guion excede el limite de 200 paginas o 15 MB. Sube un archivo mas pequeno. |
| Extraction failed (not a valid PDF) | Toast error on upload attempt | No se pudo leer el PDF. Verifica que sea un PDF digital (no escaneado) generado desde Final Draft, WriterSolo u otro software de guion. |
| Extraction failed (scanned PDF / no text) | Warning banner (yellow) + manual fallback | Este PDF parece ser una imagen escaneada. Solo se admiten PDFs digitales. Puedes ingresar los datos manualmente. |

**Source:** D-01 (digital-native only), D-03 (garbled text warning + manual fallback), D-04 (no OCR), D-05 (200 pages / 15MB limit).

### Analysis States (Cloud Function 2: Claude API)

| State | UI Element | Copy |
|-------|-----------|------|
| Analysis CTA (ready to trigger) | Primary button below summary cards | Analizar guion |
| Analysis CTA (disabled -- no parsed data) | Disabled primary button, tooltip on hover | Analizar guion (tooltip: "Primero sube un guion o ingresa los datos manualmente") |
| Analysis in progress | Spinner + label replacing the CTA button area | Analizando guion... esto puede tomar hasta 30 segundos. |
| Analysis succeeded | Toast notification + success badge | Analisis completado |
| Analysis succeeded (badge) | Badge next to screen title or in summary area | Analisis completo |
| Analysis failed (first silent retry happened) | Error alert (red) + retry button | No se pudo completar el analisis. Verifica tu conexion e intenta de nuevo. |
| Analysis retry CTA | Primary button replacing error alert | Reintentar analisis |
| Analysis stale (screenplay re-uploaded after analysis) | Warning banner (yellow) + re-analyze CTA | El guion fue modificado despues del ultimo analisis. Los resultados pueden estar desactualizados. |
| Analysis stale re-analyze CTA | Outline button within the stale warning | Reanalizar guion |

**Source:** D-12 (two-step trigger), D-13 (honest spinner with time estimate), D-14 (auto-retry once, then "Reintentar"), D-15 (partial success supported).

### Analysis Results Display

| Element | Copy |
|---------|------|
| Results section heading | Resultados del Analisis |
| Shooting days estimate label | Dias de rodaje estimados |
| Complexity analysis label | Analisis de complejidad |
| Complexity: stunts | Escenas de riesgo / stunts |
| Complexity: VFX | Efectos visuales (VFX) |
| Complexity: water | Escenas con agua |
| Complexity: animals | Escenas con animales |
| Complexity: children | Escenas con menores |
| Complexity: night percentage | Porcentaje nocturno |
| Last analyzed timestamp label | Ultimo analisis |
| Timestamp format | "22 de marzo de 2026, 14:35" (Spanish date + 24h time) |

### Error States Summary

| Scenario | Type | Copy |
|----------|------|------|
| Cloud Function extraction timeout | Toast error | La extraccion tardo demasiado. Intenta con un archivo mas pequeno. |
| Cloud Function analysis timeout | Error alert + retry | El analisis tardo demasiado. Esto puede ocurrir con guiones muy largos. Intenta de nuevo. |
| Network error during extraction | Toast error | Error de conexion. Verifica tu internet e intenta de nuevo. |
| Network error during analysis | Error alert + retry | Error de conexion durante el analisis. Verifica tu internet e intenta de nuevo. |
| Claude API returned invalid JSON | Error alert + retry | No se pudo procesar la respuesta del analisis. Intenta de nuevo. |
| Generic unexpected error | Toast error | Ocurrio un error inesperado. Intenta de nuevo o recarga la pagina. |

---

## Component Inventory

### New shadcn/ui Components Needed

| Component | Usage | Already Installed? |
|-----------|-------|--------------------|
| Alert | Error and warning banners for extraction/analysis failures | No -- install via `npx shadcn@latest add alert` |
| Progress | Not needed (D-13 explicitly says no fake progress bar) | No -- not needed |

### Existing Components Reused

| Component | Phase 2 Usage |
|-----------|---------------|
| Button | "Analizar guion" CTA, "Reintentar analisis", "Reanalizar guion" |
| Skeleton | Loading state for analysis results section while data loads from Firestore |
| Badge | "Analisis completo" success indicator, "Desactualizado" stale indicator |
| Sonner (toast) | Extraction success, extraction errors, analysis success |
| Tooltip | Disabled "Analizar guion" button hover explanation |
| Dialog | Not new in Phase 2 (re-upload confirmation already exists) |
| Separator | Between parsed data section and analysis results section |

### Custom Components to Build

| Component | Description |
|-----------|-------------|
| `AnalysisSpinner` | Inline spinner with Loader2 icon (animated) + descriptive label. Uses existing Lucide `Loader2` with `animate-spin` class. Not a separate component file needed -- can be inline JSX within ScreenplayUpload. |
| `AnalysisResults` | Displays Claude analysis output: shooting day estimate, complexity flags, last-analyzed timestamp. Sits below the existing parsed data in the right panel. |
| `AnalysisStatusBanner` | Alert-based banner showing analysis state (stale, error, success). Uses shadcn Alert component with appropriate variant. |

---

## Layout Contract

### Screen 2 Layout (unchanged from Phase 1)

```
+--------+----------------------------------+
| Sidebar| Content Area                     |
| 240px  |                                  |
|        | "Guion" (Heading)                |
|        |                                  |
|        | +-- Side-by-side (flex) --------+|
|        | | Left 50%   | Right 50%        ||
|        | | PDF Viewer  | Parsed Data      ||
|        | |             | Summary Cards    ||
|        | |             | [Analizar guion] ||  <-- NEW: CTA button
|        | |             | --------------- ||
|        | |             | Locations list   ||
|        | |             | Characters list  ||
|        | |             | Scenes (collapsed)||
|        | |             | --------------- ||
|        | |             | Analysis Results ||  <-- NEW: Results section
|        | |             | (when available) ||
|        | +-------------------------------+|
+--------+----------------------------------+
```

### Right Panel Additions (within existing ScreenplayParsedData or as sibling)

The right panel gains two new sections appended below the existing content:

1. **Analysis CTA zone** -- positioned between the summary cards and the locations section:
   - Contains the "Analizar guion" button (primary variant, full width of the right panel minus padding)
   - When analysis is in progress, button is replaced by spinner + label
   - When analysis failed, shows Alert component with error + "Reintentar" button
   - When analysis is stale, shows yellow Alert with "Reanalizar guion" outline button

2. **Analysis Results section** -- positioned at the bottom of the right panel, below the scenes section:
   - Separated from scenes by a `Separator`
   - Shows analysis results in a compact layout
   - Shooting days estimate as a prominent number (same style as existing SummaryCard)
   - Complexity flags as a row of Badge components (green if absent, yellow/red if present)
   - Last-analyzed timestamp in muted-foreground text

### Analysis CTA Button Placement

```
+-- Right Panel (within existing p-4 container) --+
| [Summary Cards: 5 across] (existing)             |
|                                                   |
| +-- Analysis CTA Zone (new) -------------------+ |
| | [Analizar guion]  (primary, full-width)       | |
| | OR                                            | |
| | [Loader2 spin] Analizando guion... ~30s       | |
| | OR                                            | |
| | [Alert: red] Error msg + [Reintentar]         | |
| | OR                                            | |
| | [Alert: yellow] Stale msg + [Reanalizar]      | |
| | OR                                            | |
| | [Badge: green] Analisis completo  [timestamp] | |
| +-----------------------------------------------+ |
|                                                   |
| --- Separator (existing) ---                      |
| Pages / Shooting days fields (existing)           |
| --- Separator (existing) ---                      |
| Locations list (existing)                         |
| ...                                               |
| --- Separator (new) ---                           |
| Analysis Results (new, only when analyzed)        |
+---------------------------------------------------+
```

### Analysis Results Detail Layout

```
+-- Analysis Results Section --+
| "Resultados del Analisis"    |  (14px semibold)
|                              |
| Dias de rodaje: 28           |  (SummaryCard style, prominent)
|                              |
| Complejidad:                 |  (14px semibold label)
| [Stunts] [VFX] [Agua]       |  (Badge row, variant=outline if absent,
| [Animales] [Menores]         |   variant=default if flagged)
| Nocturno: 35%                |  (14px regular)
|                              |
| Ultimo analisis:             |  (12px muted-foreground)
| 22 de marzo de 2026, 14:35  |  (12px muted-foreground)
+------------------------------+
```

---

## Interaction Contracts

### "Analizar guion" Button Behavior

1. **Visibility:** Only appears when `screenplay_status` is `parsed` or `uploaded` (PDF has been processed by extraction). Hidden when status is `pending` (no screenplay uploaded yet).
2. **Disabled state:** Button renders but is disabled with a tooltip when there are zero scenes AND zero locations AND zero characters (nothing to analyze). Tooltip text: "Primero sube un guion o ingresa los datos manualmente".
3. **Click action:** Calls the analysis Cloud Function. Button immediately transitions to spinner state.
4. **During analysis:** Button area replaced by Loader2 icon (16px, `animate-spin`) + body text "Analizando guion... esto puede tomar hasta 30 segundos." The entire right panel remains interactive (user can still browse parsed data). No modal overlay.
5. **On success:** Spinner disappears. Toast fires ("Analisis completado"). Analysis results section populates below. Green badge "Analisis completo" appears next to the CTA zone. The shooting days field auto-fills from Claude's estimate (user can still override).
6. **On failure (after silent retry):** Spinner disappears. Red Alert component appears with error message + "Reintentar analisis" primary button. Parsed data remains intact (D-15).
7. **On stale:** After a screenplay re-upload or significant parsed data edit, yellow Alert replaces the green badge: "El guion fue modificado despues del ultimo analisis..." with "Reanalizar guion" outline button.

**Source:** D-12, D-13, D-14, D-15.

### Extraction Flow (triggered on PDF upload)

1. User clicks "Subir guion (PDF)" or drops file (existing Phase 1 behavior).
2. **Validation gate (new):** Before upload, check file size (max 15MB per D-05). If exceeded, show toast error immediately. Do not upload. Check page count after extraction -- if > 200 pages, show toast error.
3. **During extraction:** Show inline text "Extrayendo texto del guion..." with Loader2 spinner in the right panel header area (above summary cards). The PDF viewer loads independently in the left panel (existing behavior).
4. **On extraction success:** Spinner disappears. Summary cards populate with scene/location/character counts. Toast: "Texto extraido exitosamente". `screenplay_status` becomes `parsed`.
5. **On extraction failure:** Spinner disappears. Yellow warning banner appears (existing `parserFailed` banner, already built in Phase 1). User can enter data manually. `screenplay_status` becomes `uploaded` (not `parsed`).

### Auto-Retry Logic (invisible to user)

- Claude API failure triggers ONE automatic silent retry (D-14).
- The spinner continues during the retry -- no flicker or state change visible to the user.
- Only after the second failure does the error Alert appear.

### Analysis Results Staleness

- When `screenplay_status` changes from `analyzed` back to `parsed` (re-upload or re-extraction), the analysis results section remains visible but gains a yellow banner.
- The `analysis_stale` flag in Firestore controls this display.
- Clicking "Reanalizar guion" triggers the same flow as "Analizar guion".

### Loading States

| Element | Loading Behavior |
|---------|-----------------|
| Analysis CTA button | Not shown until Firestore data loaded (use existing `loaded` state in ScreenplayUpload) |
| Analysis results section | Skeleton (3 lines, 120px height) while fetching analysis data from Firestore |
| Right panel on initial load | Existing "Cargando..." text (already built in Phase 1) |

### Transitions

| Element | Transition |
|---------|-----------|
| Spinner appear/disappear | Instant (no fade). Follows existing Phase 1 pattern. |
| Alert banner appear | Instant. Consistent with existing yellow warning banner. |
| Analysis results populate | Instant. No staggered animation. |
| Success badge appear | Instant. |
| Toast notifications | Existing Sonner behavior (slide in from top-right, auto-dismiss 4s). |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Alert (new for Phase 2) | not required |

No third-party registries. All other components reused from Phase 1 installation.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
