---
phase: 3
slug: ai-doc-generation
status: draft
shadcn_initialized: true
preset: base-nova (neutral)
created: 2026-03-23
---

# Phase 3 — UI Design Contract

> Visual and interaction contract for the AI document generation pipeline phase. Phase 3 introduces new UI surfaces: pipeline control with real-time progress, document management list organized by EFICINE section, document viewer with read/edit modes, structured budget editor, staleness indicators with cascade awareness, and regeneration controls. All copy in Mexican Spanish.

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

**Source:** Phase 1 UI-SPEC, confirmed via `components.json` (style: base-nova, baseColor: neutral, iconLibrary: lucide).

---

## Spacing Scale

Inherited from Phase 1. Phase 3 uses the same 8-point scale with the following usage specifics:

| Token | Value | Phase 3 Usage |
|-------|-------|---------------|
| xs | 4px | Icon gaps within document status badges, inline gaps between status dot and label |
| sm | 8px | Document list item internal padding, budget cell padding, progress chunk gaps |
| md | 16px | Document list item vertical spacing, viewer panel padding, budget editor cell spacing |
| lg | 24px | Section padding within document viewer, gaps between EFICINE section groups in document list |
| xl | 32px | Gap between document list panel and viewer panel, pipeline progress card padding |
| 2xl | 48px | Not used in Phase 3 additions |
| 3xl | 64px | Not used in Phase 3 additions |

Exceptions:
- Document list panel width: 320px (fixed left panel, accommodates long Spanish document names like "Propuesta de Produccion" and status badges)
- Document viewer area: fills remaining width after 320px list panel (no max-width constraint -- documents need horizontal space for tabular content)
- Budget editor minimum width: 800px (spreadsheet-like layout requires width for account columns, amounts, subtotals)

---

## Typography

Inherited from Phase 1. No new type roles. Phase 3 additions map to existing roles:

| Role | Size | Weight | Line Height | Phase 3 Usage |
|------|------|--------|-------------|---------------|
| Body | 14px | 400 (regular) | 1.5 | Document content in viewer, progress chunk messages, budget cell values, document list metadata (pass name, timestamp), staleness warning body text |
| Body (label) | 14px | 600 (semibold) | 1.5 | Document list item names (e.g. "Propuesta de Produccion"), EFICINE section group headers ("Seccion A - Propuesta"), budget account names, staleness warning title, pipeline pass names |
| Heading | 20px | 600 (semibold) | 1.2 | "Documentos Generados" page title, document viewer title showing current document name |
| Display | 28px | 600 (semibold) | 1.2 | Not used in Phase 3 additions |

**Budget editor cell typography:** 14px regular monospaced (`font-mono`) for numeric values in budget cells. All other text remains Inter. This is the only Phase 3 exception -- financial figures in the budget editor use the system monospace font for column alignment.

---

## Color

Inherited from Phase 1. No new CSS custom properties. Phase 3 uses existing tokens for new states:

| Token | Phase 3 Usage |
|-------|---------------|
| `--color-status-green` / `bg-[hsl(142_76%_36%)]` | "Listo" document status dot, pipeline pass completed indicator, fresh (non-stale) document badge |
| `--color-status-yellow` / `bg-[hsl(38_92%_50%)]` | "Desactualizado" stale document badge, pipeline incomplete warning, manual-edit indicator on documents |
| `--color-status-red` / `bg-[hsl(0_84%_60%)]` | "Error" document generation failure, pipeline failure indicator |
| `--color-muted-foreground` | "Pendiente" ungenerated document status text, generation timestamps, progress chunk secondary text |
| `--color-primary` | "Generar carpeta" CTA button, "Regenerar" button, active document in list highlight |
| `--color-destructive` | "Regenerar de todos modos" confirmation for manually-edited documents only |
| `bg-muted/50` | Document list panel background (matches existing sidebar and compliance panel pattern) |

**60/30/10 split in Phase 3 views:**
- 60% dominant: white background of document viewer content area and budget editor
- 30% secondary: document list panel (`bg-muted/50`), pipeline progress card backgrounds, budget header row
- 10% accent (primary): "Generar carpeta" button, active document highlight in list, "Regenerar" pass-level button

**No new CSS custom properties required.** All Phase 3 states map to existing `status-green`, `status-yellow`, `status-red`, and shadcn semantic tokens.

---

## Copywriting Contract

All copy in Mexican Spanish per INTK-10 and `directives/politica_idioma.md`. New strings for Phase 3 to be added to `src/locales/es.ts` under a new `generation` key.

### Pipeline Control

| Element | Copy |
|---------|------|
| Primary CTA | Generar carpeta |
| Primary CTA tooltip (disabled, no screenplay analysis) | Primero completa el analisis del guion en la pantalla "Guion" |
| Pipeline in-progress heading | Generando documentos... |
| Pipeline pass labels | Paso 2: Line Producer / Paso 3: Finanzas / Paso 4: Legal / Paso 5: Documentos Combinados |
| Document generating status | Generando {docName}... |
| Document complete status | Listo |
| Pass complete message | Paso {n} completado ({count} documentos) |
| Pipeline complete toast | Carpeta generada exitosamente. {count} documentos listos. |
| Pipeline partial failure heading | Generacion incompleta |
| Pipeline partial failure body | Se completaron {n} de {total} documentos. Los documentos generados se conservaron. |
| Resume CTA | Continuar desde Paso {n} |
| Pipeline failure toast | Error al generar documentos. Los documentos anteriores se conservaron. |

### Document List (organized by EFICINE section per D-08)

| Element | Copy |
|---------|------|
| Page title | Documentos Generados |
| Section A header | Seccion A — Propuesta Artistica |
| Section B header | Seccion B — Equipo de Trabajo |
| Section C header | Seccion C — Aspectos Legales |
| Section D header | Seccion D — Cotizaciones |
| Section E header | Seccion E — Esquema Financiero |
| Extra section header | Documentos Adicionales |
| Document status: pending | Pendiente |
| Document status: generating | Generando... |
| Document status: complete | Listo |
| Document status: stale | Desactualizado |
| Document status: error | Error |
| Document status: edited | Editado manualmente |
| Empty state heading | Sin documentos generados |
| Empty state body | Completa los datos del proyecto y el analisis del guion, luego presiona "Generar carpeta" para producir todos los documentos. |

### Document List Item Labels (mapped to EFICINE IDs)

| EFICINE ID | Document Name |
|------------|---------------|
| A1 | Resumen Ejecutivo (FORMATO 1) |
| A2 | Sinopsis |
| A4 | Propuesta de Direccion |
| A6 | Solidez del Equipo Creativo (FORMATO 2) |
| A7 | Propuesta de Produccion |
| A8a | Plan de Rodaje |
| A8b | Ruta Critica |
| A9a | Presupuesto Resumen |
| A9b | Presupuesto Desglose |
| A9d | Flujo de Efectivo (FORMATO 3) |
| A10 | Propuesta de Exhibicion |
| A11 | Evaluacion Puntos Bonus |
| B3-prod | Contrato Productor |
| B3-dir | Contrato Director |
| C2b | Cesion de Derechos de Guion |
| C3a | Carta Buenas Practicas (FORMATO 6) |
| C3b | Carta PICS (FORMATO 7) |
| C4 | Ficha Tecnica (FORMATO 8) |
| E1 | Esquema Financiero (FORMATO 9) |
| E2 | Carta Aportacion Exclusiva (FORMATO 10) |
| PITCH | Pitch para Contribuyentes |

### Document Viewer

| Element | Copy |
|---------|------|
| Viewer heading | {docName} (shows the current document name from the list above) |
| Edit button | Editar |
| Save edits button | Guardar cambios |
| Cancel edits button | Cancelar |
| Edit mode warning banner | Las ediciones manuales se perderan si regeneras este documento. |
| Manual edit badge (on document list item) | Editado |
| Regenerate confirmation (edited doc) title | Regenerar {docName} |
| Regenerate confirmation (edited doc) body | Este documento tiene ediciones manuales que se perderan si regeneras. ¿Continuar? |
| Regenerate confirmation confirm | Regenerar de todos modos |
| Regenerate confirmation cancel | Conservar ediciones |
| Generation timestamp | Generado: {fecha} |
| Viewer empty (no doc selected) heading | Selecciona un documento |
| Viewer empty (no doc selected) body | Elige un documento de la lista para ver su contenido. |
| Word export button (A4 only) | Exportar plantilla Word |
| Word export tooltip | Esta plantilla la completara el director externamente. |

### Staleness & Regeneration

| Element | Copy |
|---------|------|
| Stale pass banner title | Paso {n} desactualizado |
| Stale pass banner body (upstream data changed) | Los datos de entrada fueron modificados. Regenera este paso para actualizar los documentos. |
| Stale pass banner body (upstream pass regenerated) | El Paso {n-1} fue regenerado. Los documentos de este paso usan datos anteriores. |
| Regenerate pass CTA | Regenerar Paso {n} |
| Regenerate all stale CTA | Regenerar documentos desactualizados |
| Downstream inconsistency warning (budget edit) | {fieldName} actualizado. Los siguientes documentos ahora son inconsistentes: {docList}. |
| Cascade indicator tooltip | Este paso depende de: {dependencies}. |

### Budget Editor

| Element | Copy |
|---------|------|
| Budget editor heading | Presupuesto Desglose |
| Account column header | Cuenta |
| Concept column header | Concepto |
| Unit column header | Unidad |
| Quantity column header | Cantidad |
| Unit cost column header | Costo Unitario |
| Subtotal column header | Subtotal |
| Grand total label | Total General |
| Budget save toast | Presupuesto actualizado |
| Budget validation error (mismatch) | El total del presupuesto ({budgetTotal}) no coincide con el costo total del proyecto ({projectTotal}). Ajusta las partidas o actualiza el costo total en Datos del Proyecto. |

### Error States

| Scenario | Type | Copy |
|----------|------|------|
| Cloud Function timeout (single pass) | Error alert in progress panel | La generacion del Paso {n} tardo demasiado. Los documentos anteriores se conservaron. Intenta de nuevo. |
| Claude API rate limit | Error alert in progress panel | Limite de solicitudes alcanzado. Espera unos minutos e intenta de nuevo. |
| Network error during generation | Toast error | Error de conexion durante la generacion. Verifica tu internet e intenta de nuevo. |
| Firestore write failure | Toast error | Error al guardar el documento generado. Intenta de nuevo. |
| Template variable missing | Error alert on specific document | Error en la plantilla del documento {docName}. Verifica que todos los campos del proyecto esten completos. |

---

## Component Inventory

### New shadcn/ui Components Needed

| Component | Usage | Already Installed? |
|-----------|-------|--------------------|
| Progress | Pipeline progress bar within each pass (shows doc-level completion) | No -- install via `npx shadcn@latest add progress` |
| Table | Budget editor structured table with headers, rows, footer | No -- install via `npx shadcn@latest add table` |
| Textarea | Document edit mode free-text editing for prose documents | No -- install via `npx shadcn@latest add textarea` |
| DropdownMenu | Document list item actions (regenerate, export Word) | No -- install via `npx shadcn@latest add dropdown-menu` |

### Existing Components Reused

| Component | Phase 3 Usage |
|-----------|---------------|
| Button | "Generar carpeta" CTA, "Editar", "Guardar cambios", "Regenerar", all action buttons |
| Card | Pipeline progress card, document viewer container |
| Badge | Document status badges ("Listo", "Desactualizado", "Editado"), EFICINE section labels |
| Separator | Between EFICINE section groups in document list, between viewer header and content |
| Tooltip | Disabled CTA explanation, cascade dependency info, Word export hint |
| Dialog | Regeneration confirmation for edited documents |
| Alert | Staleness warnings, generation errors, budget mismatch, template variable errors |
| Skeleton | Document list loading, viewer content loading |
| Sonner (toast) | Generation success/failure notifications, budget save confirmation |
| ScrollArea | Document list scrolling, viewer content scrolling, budget editor horizontal scroll |
| Input | Budget editor cell editing (numeric values) |
| Label | Budget column headers |

### Custom Components to Build

| Component | Description |
|-----------|-------------|
| `PipelineControl` | "Generar carpeta" button + pipeline progress display. Shows pass-by-pass progress with per-document status updates streamed from Cloud Function. Card container with internal progress states. |
| `PipelineProgress` | Real-time progress visualization within PipelineControl. Shows 4 passes as sequential steps, each with a progress bar and document-level status list. |
| `DocumentList` | Left panel (320px) listing all generated documents organized by EFICINE section (A, B, C, D, E). Each item shows: document name, status dot (green/yellow/red/gray), status label, generation timestamp. Clicking an item selects it in the viewer. |
| `DocumentListItem` | Single item in DocumentList. Shows EFICINE ID badge, document name, status indicator, optional "Editado" badge. Active state highlighted with primary/10 background (matching existing sidebar pattern). |
| `DocumentViewer` | Right panel showing selected document content. Read-only by default. "Editar" button switches to edit mode (Textarea for prose, structured editor for tables). Shows generation metadata footer. |
| `StalenessIndicator` | Inline component showing yellow badge + warning text for stale documents/passes. Used within DocumentListItem and as a banner in DocumentViewer. |
| `RegenerateButton` | Button that triggers pass-level regeneration. Shows confirmation Dialog when the pass contains manually-edited documents. |
| `BudgetEditor` | Spreadsheet-like structured editor for A9b (presupuesto desglose). Table component with IMCINE account structure (100-1200), editable quantity and unit cost cells, auto-calculated subtotals and grand total. Monospaced numbers. |
| `BudgetAccountRow` | Single account row in BudgetEditor. Shows account number, name, subconcepts list, subtotal. Expandable/collapsible subconcepts. |
| `DownstreamWarning` | Alert component that appears when budget edits cause downstream inconsistencies. Lists affected documents by name per D-16. |

---

## Layout Contract

### Screen Focal Points

| Screen | Primary Focal Point |
|--------|-------------------|
| Document Generation (no docs yet) | The "Generar carpeta" CTA button centered in the empty state, as pipeline initiation is the only available action. |
| Document Generation (pipeline running) | The PipelineProgress panel, as real-time progress is the user's primary concern during generation. |
| Document Generation (docs exist) | The document list organized by EFICINE section, as document review and management is the primary workflow. |
| Budget Editor | The grand total row at the bottom of the budget table, as total reconciliation with the project cost is the key validation. |

### Navigation Integration

Phase 3 adds a new screen to the wizard sidebar: "Documentos Generados" (or accessible as a 6th wizard screen). The navigation approach:

- Option A (recommended): New route `/project/{projectId}/generacion` accessible from the wizard sidebar as a 6th item below "Documentos", with its own sidebar entry label "Generacion" and a traffic light indicator.
- The wizard sidebar gains one additional item:

```
+--------+
| Sidebar|
| 240px  |
|        |
| [<- ]  |
| Datos  |  (existing screens 1-5)
| Guion  |
| Equipo |
| Financ |
| Docs   |
| -----  |  (separator)
| Generac|  <- NEW: "Generacion" screen
|        |
+--------+
```

### Document Generation Layout (main view)

```
+--------+--------------------------------------------------+
| Sidebar| Content Area                                     |
| 240px  |                                                  |
|        | "Documentos Generados" (Heading)                 |
|        | [Generar carpeta]  (primary CTA, top-right)      |
|        |                                                  |
|        | +-- Pipeline Progress (when running) ----------+|
|        | | Paso 2: Line Producer  [=====>    ] 3/5       ||
|        | |   [x] A7  [x] A8a  [ ] A8b  [ ] A9a  [ ] A9b||
|        | +----------------------------------------------+|
|        |                                                  |
|        | +-- Two-Panel Layout -------------------------+ |
|        | | Doc List (320px) | Document Viewer          | |
|        | |                  |                          | |
|        | | Seccion A        | [Doc Title]  [Editar]    | |
|        | |  A1 Resumen [ok] | ----------------------- | |
|        | |  A2 Sinopsis[ok] | Document content here... | |
|        | |  ...             |                          | |
|        | | Seccion B        |                          | |
|        | |  B3-prod   [ok]  |                          | |
|        | |  ...             |                          | |
|        | | Seccion E        |                          | |
|        | |  E1 Esquema [!]  | (stale warning banner)   | |
|        | |  E2 Carta   [ok] |                          | |
|        | |                  | Generado: 23 mar 2026    | |
|        | +------------------+--------------------------+ |
+--------+--------------------------------------------------+
```

### Pipeline Progress Detail (within main view, above document list)

```
+-- Pipeline Progress Card (full content width) ---------+
| "Generando documentos..."  (14px semibold)              |
|                                                         |
| Paso 2: Line Producer                    3/5 documentos |
| [========================================>       ] 60%  |
|   [ok] A7 Propuesta de Produccion                       |
|   [ok] A8a Plan de Rodaje                               |
|   [..] A8b Ruta Critica — Generando...                  |
|   [ ] A9a Presupuesto Resumen                           |
|   [ ] A9b Presupuesto Desglose                          |
|                                                         |
| Paso 3: Finanzas                         Pendiente      |
| Paso 4: Legal                            Pendiente      |
| Paso 5: Documentos Combinados            Pendiente      |
+---------------------------------------------------------+
```

- Pipeline progress card shows above the document list during generation
- Each pass shows as an expandable/collapsible section
- The currently active pass is expanded, showing per-document progress
- Pending passes show as single collapsed lines
- Completed passes collapse automatically and show green checkmark
- On completion, the entire progress card collapses (or a dismissible "Completado" summary remains for 10 seconds, then auto-hides)

### Document List Panel (left, 320px)

```
+-- Document List Panel (320px, full height) --+
| [Search/filter placeholder — v2]             |
|                                              |
| SECCION A — PROPUESTA ARTISTICA              |  (12px semibold uppercase muted-foreground)
| +------------------------------------------+|
| | [A1] Resumen Ejecutivo        [ok] Listo ||  (active: bg-primary/10)
| +------------------------------------------+|
| | [A2] Sinopsis                  [ok] Listo||
| | [A4] Propuesta de Direccion    [->] Word ||  (special: export icon)
| | [A6] Solidez del Equipo        [ok] Listo||
| | [A7] Propuesta de Produccion   [ok] Listo||
| | [A8a] Plan de Rodaje           [ok] Listo||
| | [A8b] Ruta Critica             [ok] Listo||
| | [A9a] Presupuesto Resumen      [ok] Listo||
| | [A9b] Presupuesto Desglose     [$$] Edit ||  (special: budget editor link)
| | [A9d] Flujo de Efectivo        [!] Stale ||  (yellow dot + "Desactualizado")
| | [A10] Propuesta de Exhibicion  [ok] Listo||
| | [A11] Evaluacion Puntos Bonus  [ok] Listo||
|                                              |
| SECCION B — EQUIPO DE TRABAJO                |
| | [B3-prod] Contrato Productor   [ok] Listo||
| | [B3-dir]  Contrato Director    [ok] Listo||
|                                              |
| SECCION C — ASPECTOS LEGALES                 |
| | [C2b] Cesion de Derechos       [ok] Listo||
| | [C3a] Carta Buenas Practicas   [ok] Listo||
| | [C3b] Carta PICS               [ok] Listo||
| | [C4]  Ficha Tecnica            [ok] Listo||
|                                              |
| SECCION E — ESQUEMA FINANCIERO               |
| | [E1] Esquema Financiero        [!] Stale ||
| | [E2] Carta Aportacion          [ok] Listo||
|                                              |
| DOCUMENTOS ADICIONALES                       |
| | [PITCH] Pitch Contribuyentes   [ok] Listo||
+----------------------------------------------+
```

- Section headers: 12px, uppercase, semibold, `text-muted-foreground`, with `lg` (24px) top margin between sections
- List items: 14px, left-aligned, full-width clickable rows
- Status dot: 10px circle (same as TrafficLight component, `h-2.5 w-2.5`)
- Active item: `bg-primary/10 text-primary font-semibold` (matches existing wizard sidebar active pattern)
- Scroll: independent ScrollArea, does not scroll with viewer

### Document Viewer Panel (right, fills remaining width)

```
+-- Document Viewer (flex-1) ---------------------------------+
| +-- Header bar (flex, justify-between, border-b, p-4) ----+|
| | "Propuesta de Produccion"  (20px semibold)               ||
| | [Editar]  (outline button, right-aligned)                ||
| +----------------------------------------------------------+|
|                                                              |
| +-- Stale banner (if applicable) -------------------------+ |
| | [!] Paso 2 desactualizado. Los datos de entrada fueron  | |
| |     modificados. [Regenerar Paso 2]                     | |
| +----------------------------------------------------------+|
|                                                              |
| +-- Content area (ScrollArea, p-6) -----------------------+ |
| | Document prose content rendered here.                    | |
| | Markdown-formatted text from Firestore.                  | |
| |                                                          | |
| | For structured documents (budget, cash flow):            | |
| | Table rendering with proper alignment.                   | |
| |                                                          | |
| +----------------------------------------------------------+|
|                                                              |
| +-- Footer (border-t, p-4, text-xs muted-foreground) -----+|
| | Generado: 23 de marzo de 2026, 14:35                     ||
| | Modelo: claude-sonnet-4-5                                 ||
| +----------------------------------------------------------+|
+--------------------------------------------------------------+
```

**Edit mode** (replaces content area when "Editar" is clicked):

```
+-- Edit mode header -------------------------------------------+
| [!] Las ediciones manuales se perderan si regeneras.          |
|                                       [Cancelar] [Guardar]   |
+---------------------------------------------------------------+
| +-- Textarea (full content area) ---------------------------+|
| | Document text content, editable...                         ||
| |                                                            ||
| +------------------------------------------------------------+|
```

### Budget Editor Layout (separate view for A9b)

Clicking A9b in the document list navigates to the budget editor instead of the standard viewer.

```
+--------+--------------------------------------------------+
| Sidebar| Budget Editor (full content width)               |
| 240px  |                                                  |
|        | "Presupuesto Desglose"  (Heading)                |
|        | [<- Volver a documentos]  (text link, top-left)  |
|        |                                                  |
|        | +-- Downstream Warning (if edits made) --------+|
|        | | [!] Subtotal Cuenta 500 actualizado.          ||
|        | | Documentos inconsistentes: Flujo de Efectivo, ||
|        | | Esquema Financiero.                           ||
|        | +----------------------------------------------+|
|        |                                                  |
|        | +-- Budget Table (ScrollArea horizontal) ------+|
|        | | Cuenta | Concepto | Unidad | Cant | C.Unit | Sub |
|        | |--------|----------|--------|------|--------|-----|
|        | | 100 Guion y Musica                    | $XXX  |
|        | |   > Guionista | Global | 1   | $XXX | $XXX  |
|        | |   > Musica    | Global | 1   | $XXX | $XXX  |
|        | |--------|----------|--------|------|--------|-----|
|        | | 200 Produccion                        | $XXX  |
|        | |   > Line producer | Semana | 12 | $XX | $XXX |
|        | |   > ...           |        |    |     |      |
|        | |--------|----------|--------|------|--------|-----|
|        | | ...                                          |
|        | |=============================================|
|        | | TOTAL GENERAL                   | $XX,XXX,XXX|
|        | +----------------------------------------------+|
+--------+--------------------------------------------------+
```

- Account rows (100, 200, ..., 1200): bold, full-width, with subtotal right-aligned
- Subconcept rows: indented 24px, editable quantity and unit cost cells
- Subtotals auto-calculate on cell blur
- Grand total row: bold border-top-2, matches `costo_total_proyecto` from intake
- Numeric cells: right-aligned, `font-mono`, formatted as `$X,XXX,XXX MXN` on blur
- Editable cells: show raw number on focus, formatted on blur (same pattern as Phase 1 MXNInput)

---

## Interaction Contracts

### "Generar carpeta" Button Behavior

1. **Visibility:** Always visible in the generation screen header area, top-right.
2. **Disabled state:** Button renders but is disabled with tooltip when `screenplay_status !== 'analyzed'`. Tooltip: "Primero completa el analisis del guion en la pantalla Guion".
3. **Click action:** Calls the frontend pipeline orchestrator that sequentially invokes Cloud Functions for each pass. Button transitions to disabled state with "Generando..." label.
4. **During generation:** PipelineProgress card appears above the document list. The "Generar carpeta" button changes to disabled "Generando..." state. The document list remains visible and interactive below -- completed documents become clickable in real time.
5. **On full success:** PipelineProgress card auto-collapses after 5 seconds. Toast: "Carpeta generada exitosamente. {count} documentos listos." Button reverts to enabled "Generar carpeta" (for full regeneration if needed).
6. **On partial failure (D-03):** PipelineProgress card stays visible showing which pass failed. Error alert within the failed pass. Button changes to "Continuar desde Paso {n}". Successfully generated documents remain accessible in the list.
7. **Re-generation:** If documents already exist, clicking "Generar carpeta" triggers full regeneration without confirmation (per D-01, both modes necessary). Individual pass regeneration uses the "Regenerar Paso {n}" buttons on stale banners.

### Pipeline Progress Streaming (D-02)

1. Each Cloud Function streams progress chunks via Firebase streaming callable.
2. On receiving a `{ status: "generating", docId }` chunk: document in the list transitions from gray "Pendiente" to animated "Generando..." with a subtle pulse animation on the status dot.
3. On receiving a `{ status: "complete", docId }` chunk: document transitions to green "Listo" status. The item becomes clickable in the list.
4. Progress bar within each pass: fills proportionally as documents complete (`completedCount / totalCount * 100%`).
5. Passes execute sequentially. When Pass N completes, Pass N+1 begins automatically. No user intervention between passes.

### Document Selection and Viewing (D-05)

1. Clicking a document in the list loads its content in the viewer panel.
2. Active document highlighted with `bg-primary/10` (matching existing sidebar pattern).
3. Content renders as formatted prose (for text documents) or structured table (for financial documents).
4. Viewer is read-only by default. No text selection cursor changes, no editable areas.
5. "Editar" button (outline variant) in the viewer header switches to edit mode.
6. On first entering a document that has never been viewed, no special behavior -- the content is available immediately from Firestore.

### Edit Mode (D-05, D-06)

1. Clicking "Editar" in viewer header:
   - Header gains a yellow Alert banner: "Las ediciones manuales se perderan si regeneras este documento."
   - Content area replaces with a full-height Textarea pre-filled with document text.
   - "Editar" button replaced by "Cancelar" (outline) and "Guardar cambios" (primary) buttons.
2. Clicking "Guardar cambios": writes edited content to Firestore, switches back to read-only view. Document gains "Editado" badge in the list (yellow badge, visible permanently until regeneration).
3. Clicking "Cancelar": discards changes, switches back to read-only view.
4. For structured documents (budget, cash flow, esquema financiero): edit mode is NOT a textarea. These use their respective structured editors (BudgetEditor for A9b). The "Editar" button is not shown for A9b -- clicking A9b always opens the BudgetEditor.

### Staleness Detection and Display (D-09, D-10, D-11, D-12)

1. **Instant detection:** When intake data changes, `intake_updated_at` timestamp updates. On next load of the generation screen (or via real-time Firestore listener), the app compares `intake_updated_at > pass_generated_at` for each pass.
2. **Cascade behavior:** If Pass 2 (Line Producer) is stale, Passes 3, 4, and 5 are automatically marked stale too. The document list shows yellow "Desactualizado" status for ALL documents in stale passes.
3. **Visual treatment in document list:** Stale documents show yellow status dot + "Desactualizado" text instead of green "Listo".
4. **Visual treatment in viewer:** When viewing a stale document, a yellow Alert banner appears above the content: "Paso {n} desactualizado. Los datos de entrada fueron modificados. Regenera este paso para actualizar los documentos." with a "Regenerar Paso {n}" primary button.
5. **Edited + stale documents (D-12):** Show both "Editado" and "Desactualizado" badges. The viewer banner includes extra warning: "Este documento tiene ediciones manuales que se perderan si regeneras."

### Regeneration Behavior (D-11, D-12)

1. Regeneration is always at the pass level -- all documents within a pass regenerate together.
2. Clicking "Regenerar Paso {n}": if the pass contains NO manually-edited documents, regeneration starts immediately. Document statuses transition to "Generando..." in real time.
3. Clicking "Regenerar Paso {n}" when the pass contains manually-edited documents: a confirmation Dialog appears:
   - Title: "Regenerar Paso {n}"
   - Body: "Este paso contiene documentos con ediciones manuales que se perderan: {list of edited doc names}. ¿Continuar?"
   - Confirm: "Regenerar de todos modos" (destructive variant)
   - Cancel: "Conservar ediciones" (outline variant)
4. After regeneration completes, documents lose their "Editado" badges and show fresh "Listo" status.
5. Downstream cascade: regenerating Pass 2 automatically marks Passes 3, 4, 5 as stale (but does NOT auto-regenerate them). User must explicitly regenerate downstream passes.

### Budget Editor Behavior (D-14, D-16)

1. Navigating to A9b opens the BudgetEditor view (replaces the standard two-panel layout).
2. Account rows (100-1200) are collapsible. Click the account header to expand/collapse subconcepts.
3. Editable cells: Quantity and Unit Cost columns. User types raw numbers.
4. On cell blur: value formats as `$X,XXX,XXX MXN` (unit cost) or plain integer (quantity). Subtotal auto-recalculates for that account.
5. Grand total auto-recalculates as the sum of all account subtotals.
6. On any edit: DownstreamWarning Alert appears above the table listing affected downstream documents (per D-16). Warning text updates immediately as more edits are made.
7. Budget changes save to Firestore with debounce (same 1500ms auto-save pattern from Phase 1).
8. Navigation: "Volver a documentos" link in the header returns to the standard document list + viewer layout.

### Propuesta de Direccion (A4) Special Behavior (D-07)

1. A4 is not generated by AI -- it's a Word document template exported for the director.
2. In the document list, A4 shows a special "Word" icon instead of the standard status dot.
3. Clicking A4 in the list shows the viewer with a centered empty state: "Este documento es una plantilla que el director completara externamente."
4. Action button: "Exportar plantilla Word" (outline button with Download icon).
5. After the director fills it in and the producer uploads the completed file (via Screen 5 - Documentos), A4 status changes to green "Subido" (not "Listo").

### Loading States

| Element | Loading Behavior |
|---------|-----------------|
| Document list | Skeleton: 6 rows of 200px-wide rectangles (14px height) with 8px gaps |
| Document viewer content | Skeleton: 4 lines of varying width (100%, 80%, 95%, 60%) at 14px height |
| Budget editor | Skeleton: table header row + 5 body rows with cell-sized rectangles |
| Pipeline progress (initial) | Not shown until "Generar carpeta" is clicked |
| Generation screen on first load | Show empty state immediately if no documents exist (no skeleton needed -- Firestore query is fast) |

### Transitions

| Element | Transition |
|---------|-----------|
| Document list status changes | Instant color change on status dot. No fade. |
| Pipeline progress bar | CSS `transition: width 300ms ease` for smooth progress bar fill |
| Pipeline progress card collapse (on completion) | Fade out over 300ms after 5-second delay |
| Document viewer content swap (selecting different doc) | Instant swap. Content area scrolls to top. |
| Edit mode enter/exit | Instant swap between read-only and textarea. |
| Budget cell edit | Instant. No animation on format-on-blur. |
| Stale banner appear | Instant. Consistent with existing Phase 2 Alert pattern. |
| Toast notifications | Existing Sonner behavior (slide in from top-right, auto-dismiss 4s). |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Progress, Table, Textarea, DropdownMenu (new for Phase 3) | not required |

No third-party registries declared. All components from shadcn official registry.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
