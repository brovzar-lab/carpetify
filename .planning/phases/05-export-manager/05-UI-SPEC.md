---
phase: 5
slug: export-manager
status: draft
shadcn_initialized: true
preset: base-nova (neutral)
created: 2026-03-24
---

# Phase 5 — UI Design Contract

> Visual and interaction contract for the Export Manager phase. Phase 5 adds the final wizard screen ("Exportar") where the producer clicks a single button to generate a complete carpeta ZIP. The screen presents three sequential stages: pre-export language check, PDF generation with progress, and ZIP download. An export blocker modal prevents export when blocker validations exist. Three internal meta-documents (validation report, score estimate, upload guide) are generated alongside the submission documents. All UI copy in Mexican Spanish. PDF templates use @react-pdf/renderer with NotoSans font for Spanish character support -- PDF styling is utilitarian per D-01 (no branding, no decorative covers).

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

**PDF Font (new for Phase 5):** NotoSans (Regular 400, Bold 700, Italic 400) registered via `Font.register()` from @react-pdf/renderer. TTF files hosted at `/public/fonts/`. Used exclusively for PDF output, not for the web UI.

**Source:** Phase 1 UI-SPEC, confirmed via `components.json` (style: base-nova, baseColor: neutral, iconLibrary: lucide).

---

## Spacing Scale

Inherited from Phase 1. Phase 5 uses the same 8-point scale with the following usage specifics:

| Token | Value | Phase 5 Usage |
|-------|-------|---------------|
| xs | 4px | Icon gaps within progress step rows (between checkmark and step label), inline gaps between file icon and filename in download link |
| sm | 8px | Progress step internal padding, language check finding row padding, export warnings panel item spacing |
| md | 16px | Default spacing between progress steps, card padding in language check results, spacing between export warnings items |
| lg | 24px | Section spacing between export stages (language check to PDF generation to ZIP compilation), padding around the export CTA area |
| xl | 32px | Gap between the export readiness header and the export content area, gap between language check panel and CTA |
| 2xl | 48px | Top padding of the export screen page content area |
| 3xl | 64px | Not used in Phase 5 additions |

Exceptions:
- Export CTA button: 48px height (oversized relative to standard 36px -- this is the most consequential action in the entire app, producing the final submission package)
- Language check results panel: max-width 640px centered (readable width for finding descriptions)
- Re-download link area: 44px height (touch target for the persistent download link)

---

## Typography

Inherited from Phase 1. No new type roles. Phase 5 additions map to existing roles:

| Role | Size | Weight | Line Height | Phase 5 Usage |
|------|------|--------|-------------|---------------|
| Body | 14px | 400 (regular) | 1.5 | Language check finding descriptions, export progress step details, warning dismissal body text, download link filename/size metadata, blocker modal rule descriptions |
| Body (label) | 14px | 600 (semibold) | 1.5 | Export progress step names ("Verificacion de idioma", "Generando PDFs", "Compilando ZIP"), language check category headers ("Anglicismos", "Formatos", "Titulo"), blocker rule names in the export blocked modal, download link label "Descargar de nuevo" |
| Heading | 20px | 600 (semibold) | 1.2 | "Exportar" page title, "Verificacion de idioma" heading in language check results, export blocked modal title "Exportacion bloqueada" |
| Display | 28px | 600 (semibold) | 1.2 | Not used in Phase 5 additions |

**PDF Typography (internal to @react-pdf/renderer, not web UI):**

| Role | Size | Weight | Line Height | PDF Usage |
|------|------|--------|-------------|-----------|
| PDF page header | 8pt | 400 | 1.2 | Project title right-aligned at page top |
| PDF title | 14pt | 700 | 1.2 | Document title centered (e.g., "PRESUPUESTO RESUMEN", "RESUMEN EJECUTIVO") |
| PDF subtitle | 12pt | 700 | 1.2 | Section headings within documents |
| PDF body | 10pt | 400 | 1.5 | Prose content, justified alignment |
| PDF table header | 8pt | 700 | 1.2 | Table column headers with `#f0f0f0` background |
| PDF table cell | 8pt | 400 | 1.2 | Table cell content, right-aligned for amounts |
| PDF landscape table | 7-8pt | 400 | 1.2 | Cash flow (A9d) and dense financial tables in landscape orientation |
| PDF footer | 7pt | 400 | 1.0 | Section label + project title, centered at page bottom |
| PDF legal highlight | 12pt | 700 | 1.4 | Fee amount in contracts, inside yellow highlight box (D-03) |

**Source:** RESEARCH.md shared PDF stylesheet, CONTEXT.md D-01/D-02/D-03.

---

## Color

Inherited from Phase 1. No new CSS custom properties. Phase 5 extends the traffic light system for the export button's three-state design (D-13):

| Token | Phase 5 Usage |
|-------|---------------|
| `--color-status-green` / `bg-[hsl(142_76%_36%)]` | Export button enabled + clean state ("Carpeta lista para exportar"), language check passed indicator, progress step completion checkmark, download-ready state |
| `--color-status-yellow` / `bg-[hsl(38_92%_50%)]` | Export button enabled + warnings state ("2 advertencias -- exportar de todos modos"), language check warning findings (anglicisms flagged, format inconsistencies), dismissable warning indicators |
| `--color-status-red` / `bg-[hsl(0_84%_60%)]` | Export button disabled + blockers state ("3 bloqueadores impiden la exportacion"), language check blocker findings (title mismatch), export blocked modal header accent, progress step error state |
| `--color-muted-foreground` | Noted anglicisms ("Termino tecnico aceptado" gray info), progress step pending state (not yet reached), download metadata (file size, date), language check "industry-accepted" terms indicator |
| `--color-primary` | "Ir al campo" links in export blocker modal (reused from Phase 4 pattern), "Exportar carpeta" CTA text/icon when enabled, active progress step label |
| `--color-destructive` | Not used beyond export button red disabled state (which uses `status-red`, not `destructive`) |
| `bg-muted/50` | Language check results panel background, export progress container background, download link surface |

**PDF Colors (internal to @react-pdf/renderer, not web UI):**

| Token | Hex | PDF Usage |
|-------|-----|-----------|
| Table header bg | `#f0f0f0` | All table header rows (budget, cash flow, ficha tecnica) |
| Table border | `#dddddd` | Table cell bottom borders (0.5pt) |
| Alternating row | `#f9f9f9` | Even rows in dense tables (budget detail, cash flow) per D-02 |
| Fee highlight | `#fff3cd` | Yellow background box for fee amounts in contracts per D-03 |
| Fee highlight border | `#ffc107` | 1pt border around fee highlight box |
| Footer text | `#999999` | Page footer text |
| Header text | `#666666` | Page header text |
| Internal doc stamp | `#dc3545` | Red text for "DOCUMENTO INTERNO -- NO INCLUIR EN LA CARPETA EFICINE" watermark per D-10 |

**60/30/10 split in Phase 5 views:**
- 60% dominant: white background of export screen content area, language check result cards
- 30% secondary: export progress container surface (`bg-muted/50`), language check panel background, download link card background
- 10% accent: export CTA button (the single most important interaction -- colored per state: green/yellow/red), "Ir al campo" links in blocker modal

**Source:** Phase 1 UI-SPEC color contract, CONTEXT.md D-03 (yellow fee highlight), D-13 (export button three-state).

---

## Copywriting Contract

All copy in Mexican Spanish per INTK-10 and `directives/politica_idioma.md`. New strings for Phase 5 to be added to `src/locales/es.ts` under a new `export` key.

### Export Screen

| Element | Copy |
|---------|------|
| Page title | Exportar |
| Wizard sidebar label | Exportar |
| Primary CTA (clean -- no blockers, no warnings) | Exportar carpeta |
| Primary CTA (warnings exist) | Exportar carpeta |
| Primary CTA subtext (warnings exist) | 2 advertencia(s) — exportar de todos modos |
| Primary CTA (disabled -- blockers exist) | Exportar carpeta |
| Primary CTA subtext (disabled) | {n} bloqueador(es) impiden la exportacion |
| Export readiness: clean | Carpeta lista para exportar. Todos los documentos generados y validaciones cumplidas. |
| Export readiness: warnings | {n} advertencia(s) detectada(s). Puedes exportar, pero revisa los avisos. |
| Export readiness: blockers | {n} bloqueador(es) impiden la exportacion. Resuelve los problemas antes de exportar. |
| Empty state heading | Genera los documentos primero |
| Empty state body | Completa los datos del proyecto y genera la carpeta desde la pantalla "Generacion" antes de exportar. |

### Pre-Export Language Check (LANG-05, D-05/D-06/D-07/D-08)

| Element | Copy |
|---------|------|
| Language check heading | Verificacion de idioma |
| Checking state | Verificando idioma y formatos... |
| All passed | Sin problemas detectados |
| Anglicism section header | Anglicismos |
| Format section header | Formatos de montos y fechas |
| Title section header | Consistencia del titulo |
| Anglicism flagged (yellow warning) | Anglicismo detectado: "{word}" en {doc_name}. Sugerencia: usar "{replacement}". |
| Anglicism noted (gray info, D-08) | Termino tecnico aceptado: "{word}". |
| Format issue: currency | Formato de monto inconsistente en {doc_name}: "{found}". Usar "$X,XXX,XXX MXN". |
| Format issue: date | Formato de fecha en ingles en {doc_name}: "{found}". Usar formato espanol. |
| Title match pass | Titulo identico en {n}/{total} documentos. |
| Title mismatch (blocker) | El titulo no coincide en {n} documento(s): {list}. Corrige antes de exportar. |
| Dismiss warning button | Ignorar advertencia |
| Dismiss all warnings | Ignorar todas las advertencias |

### Export Progress (D-15)

| Element | Copy |
|---------|------|
| Step 1 label | Verificacion de idioma |
| Step 1 running | Verificando idioma y formatos... |
| Step 1 complete | Sin problemas de idioma |
| Step 2 label | Generando PDFs |
| Step 2 running | Generando PDFs... ({current}/{total}) |
| Step 2 running detail | {current_filename} |
| Step 2 complete | {total} PDFs generados |
| Step 3 label | Descargando documentos subidos |
| Step 3 running | Descargando archivos... ({current}/{total}) |
| Step 3 complete | {total} archivos descargados |
| Step 4 label | Compilando ZIP |
| Step 4 running | Compilando carpeta... |
| Step 4 complete | Carpeta compilada |
| Final: complete | Listo |
| Final: download prompt | La carpeta se descargo automaticamente. |
| Error state | Error al exportar: {error_message}. Intenta de nuevo. |
| Retry button | Reintentar exportacion |

### Export Download (D-16)

| Element | Copy |
|---------|------|
| Auto-download toast | Carpeta descargada: {filename} |
| Re-download link | Descargar de nuevo |
| Download metadata | {filename} ({size} MB) |
| Re-download note | Generada el {date} |

### Export Blocked Modal (D-14)

| Element | Copy |
|---------|------|
| Modal title | Exportacion bloqueada |
| Modal body | Resuelve los siguientes problemas antes de exportar la carpeta. |
| Blocker row format | {rule_name}: {fail_message} |
| Fix navigation link | Ir al campo |
| Close button | Cerrar |

### Export Warnings Panel

| Element | Copy |
|---------|------|
| Panel heading | Advertencias |
| Panel body | Estas advertencias no bloquean la exportacion, pero revisa antes de enviar a IMCINE. |
| Warning row format | {rule_name}: {warning_message} |
| Dismiss single | Ignorar |
| Dismiss all | Ignorar todas |

### Internal Meta-Documents (D-09/D-10/D-11/D-12)

| Document | Filename | Header Text |
|----------|----------|-------------|
| Validation report | validacion.pdf | Reporte de Validacion |
| Score estimate | estimacion_puntaje.pdf | Estimacion de Puntaje EFICINE |
| Submission guide | guia_carga.pdf | Guia de Carga al Portal SHCP |

**Validation report PDF content (D-09):**

| Element | Copy |
|---------|------|
| Section: blockers resolved | Bloqueadores resueltos |
| Section: active warnings | Advertencias activas |
| Section: document completeness | Completitud de documentos |
| Completeness format | {n}/{total} generados, {m}/{total_uploads} subidos |
| Financial reconciliation | Conciliacion financiera: Presupuesto = Flujo = Esquema: {amount} |

**Score estimate PDF content (D-10):**

| Element | Copy |
|---------|------|
| Internal stamp (red text) | DOCUMENTO INTERNO -- NO INCLUIR EN LA CARPETA EFICINE |
| Section: viability | Viabilidad ({n}/38 pts) |
| Section: artistic | Merito Artistico ({n}/62 pts) -- estimado |
| Section: bonus | Puntos Bonus ({n}/5 pts) |
| Section: total | Puntaje estimado: {n}/100 (+{bonus} bonus) |
| Section: improvements | Mejoras sugeridas |

**Submission upload guide PDF content (D-11):**

| Element | Copy |
|---------|------|
| Guide title | Guia de Carga al Portal SHCP |
| Guide subtitle | estimulosfiscales.hacienda.gob.mx |
| Step format | Paso {n}: Sube {filename}.pdf en el campo "{portal_field_name}" |
| Folder reference | Ubicacion en la carpeta: {folder}/{filename}.pdf |
| Section A header | Seccion A — Propuesta |
| Section B header | Seccion B — Personal |
| Section C header | Seccion C — ERPI |
| Section D header | Seccion D — Cotizaciones |
| Section E header | Seccion E — Finanzas |
| Section ERPI header | Seccion 00 — Documentos ERPI |
| Note at bottom | Nota: Los documentos de la carpeta _INTERNO/ son de uso personal. No subir al portal. |

### Error States

| Scenario | Type | Copy |
|----------|------|------|
| PDF generation fails for a document | Toast error | Error al generar {doc_name}. La exportacion continua con los demas documentos. |
| Uploaded file fetch fails (CORS/network) | Toast error | No se pudo descargar {filename} de almacenamiento. Verifica tu conexion. |
| ZIP compilation fails (memory/size) | Alert banner | Error al compilar la carpeta. El proyecto puede ser demasiado grande. Intenta de nuevo o contacta soporte. |
| Language check Cloud Function timeout | Toast warning | La verificacion de idioma tardo demasiado. Se omitio. Puedes exportar sin esta verificacion. |
| No generated documents exist | Empty state | Genera los documentos primero. Completa los datos y usa "Generar carpeta" en la pantalla de generacion. |
| All blockers resolved mid-session | Toast success | Todos los bloqueadores resueltos. Ya puedes exportar. |

---

## Component Inventory

### New shadcn/ui Components Needed

No new shadcn/ui components required. Phase 5 reuses components already installed in Phases 1-4.

### Existing Components Reused

| Component | Phase 5 Usage |
|-----------|---------------|
| Button | "Exportar carpeta" CTA (three-state: green/yellow/red via className override), "Ir al campo" links (link variant) in blocker modal, "Reintentar exportacion", "Descargar de nuevo", "Ignorar advertencia" |
| Card | Export readiness summary card, language check results container, download link card |
| Badge | Blocker/warning counts on export readiness summary, language check finding severity badges ("Anglicismo", "Formato", "Termino aceptado"), export stage completion badges |
| Dialog | Export blocker modal (D-14) showing all blockers with "Ir al campo" links -- reuses the Dialog component from Phase 1 |
| Progress | PDF generation progress bar (determinate: {current}/{total} PDFs rendered), ZIP compilation indeterminate progress |
| Alert | Export readiness state banners (green/yellow/red), language check title mismatch blocker alert |
| Separator | Between language check sections, between blocker rules in modal, between export stages |
| Tooltip | Disabled export button explanation, language check "noted" term explanation |
| Sonner (toast) | Auto-download notification, PDF generation per-file errors, file fetch errors, export success |
| ScrollArea | Blocker modal rule list scrolling (when many blockers), language check findings scrolling |
| Skeleton | Export screen loading state while validation data loads |

### Custom Components to Build

| Component | Description |
|-----------|-------------|
| `ExportScreen` | Main export wizard screen (8th sidebar item). Three zones: (1) export readiness summary at top, (2) language check results panel (shown after first export attempt), (3) export progress + download area at bottom. Full-width layout without max-width constraint, consistent with generacion/validacion screens. |
| `ExportReadinessCard` | Summary card showing current export readiness. Three visual states per D-13: green border + checkmark when clean, yellow border + warning icon when only warnings, red border + X icon when blockers exist. Shows blocker/warning counts. Contains the "Exportar carpeta" CTA button. |
| `ExportCTAButton` | Oversized button (48px height) with dynamic styling per D-13. Green background when clean (`bg-status-green text-white`), yellow background when warnings (`bg-status-yellow text-white`), red background + disabled when blockers (`bg-status-red/50 text-white cursor-not-allowed`). Click triggers export pipeline or opens ExportBlockedDialog if blockers exist. |
| `ExportBlockedDialog` | Modal listing every blocker validation that prevents export per D-14. Each blocker row shows rule name (semibold), failure message (regular), and "Ir al campo" link (primary color, link variant). Reuses the IrAlCampoLink pattern from Phase 4. Scrollable when many blockers. Cannot be dismissed to proceed -- user must fix blockers. |
| `ExportWarningsPanel` | Collapsible panel showing non-blocking warnings. Each warning row has rule name, message, and "Ignorar" dismiss button. "Ignorar todas" bulk dismiss. Warnings do not prevent export per EXPRT-04. |
| `LanguageCheckResults` | Panel displaying pre-export language scan results per D-05/D-07. Three sections: Anglicismos, Formatos, Titulo. Each finding shows the word/issue, document name, and severity (flagged=yellow, noted=gray, blocker=red). Anglicism findings show suggested replacement. Title mismatches are blockers (cannot dismiss). Format and anglicism warnings are dismissable. |
| `LanguageCheckFindingRow` | Single finding within LanguageCheckResults. Shows: severity icon (AlertTriangle for warning, Info for noted, XCircle for blocker), finding text, document reference, and dismiss button (for dismissable findings only). |
| `ExportProgressView` | Step-by-step progress display per D-15. Four sequential stages, each showing: step number, label, spinner/checkmark, and detail text. Current step shows Progress bar (determinate for PDF rendering, indeterminate for ZIP compilation). Completed steps show green checkmark. Future steps show gray. |
| `ExportProgressStep` | Single step within ExportProgressView. States: pending (gray circle + gray label), active (spinner + primary label + Progress bar + detail text), complete (green checkmark + green label + completion text), error (red X + red label + error detail). |
| `DownloadCard` | Persistent card shown after successful export per D-16. Shows: green checkmark, "Listo" heading, filename with size ("carpeta_UNLOVED_2026-03-23.zip (28.4 MB)"), export date, and "Descargar de nuevo" link. Stays visible on the export screen indefinitely for re-downloads. |

### PDF Template Components (non-interactive, @react-pdf/renderer)

These are React components consumed by `pdf().toBlob()` during export. They do NOT appear in the web UI -- they render directly to PDF binary output.

| Template | Documents | Layout |
|----------|-----------|--------|
| `ProseDocument` | A2, A7, A8a, A10, A11 | Portrait LETTER, title + justified prose body, page footer |
| `ResumenEjecutivo` | A1 (FORMATO 1) | Portrait LETTER, structured table with project metadata fields per FORMATO 1 |
| `SolidezEquipo` | A6 (FORMATO 2) | Portrait LETTER, team member grid with filmography per FORMATO 2 |
| `BudgetSummary` | A9a | Portrait LETTER, summary table (account number, concept, subtotal) |
| `BudgetDetail` | A9b | Landscape LETTER, detailed budget with partidas per account, alternating row colors |
| `CashFlowTable` | A9d (FORMATO 3) | Landscape LETTER, monthly columns with per-source rows, 7-8pt font |
| `RutaCritica` | A8b | Landscape LETTER, monthly timeline with production stages |
| `FinancialScheme` | E1 (FORMATO 9) | Portrait LETTER, source-of-funds table with percentages |
| `ContractDocument` | B3-prod, B3-dir, C2b | Portrait LETTER, numbered clauses, formal headings, yellow highlighted fee box (D-03) |
| `CartaCompromiso` | C3a (FORMATO 6), C3b (FORMATO 7) | Portrait LETTER, formal letter format with signature line |
| `CartaAportacion` | E2 (FORMATO 10) | Portrait LETTER, letter format with contribution amount table |
| `FichaTecnica` | C4 (FORMATO 8) | Portrait LETTER, two-column key-value grid with project metadata |
| `ValidationReport` | _INTERNO/validacion.pdf | Portrait LETTER, checklist format with checkmarks, reconciliation summary |
| `ScoreEstimate` | _INTERNO/estimacion_puntaje.pdf | Portrait LETTER, score breakdown tables, "DOCUMENTO INTERNO" red stamp |
| `SubmissionGuide` | _INTERNO/guia_carga.pdf | Portrait LETTER, numbered steps with filename-to-portal-field mapping |

---

## Layout Contract

### Screen Focal Points

| Screen State | Primary Focal Point |
|--------------|-------------------|
| Export screen (blockers exist) | ExportReadinessCard showing red "{n} bloqueadores impiden la exportacion" with the disabled red CTA. Clicking the CTA opens ExportBlockedDialog. User's first question: "Why can't I export?" |
| Export screen (warnings exist, no blockers) | ExportCTAButton in yellow with "{n} advertencias" subtext. The CTA is enabled -- user can export despite warnings. User's question: "Should I fix these first?" |
| Export screen (clean, ready) | ExportCTAButton in green "Exportar carpeta". Single clear action. User's question: "Am I ready?" Answer: yes, click. |
| Export screen (exporting in progress) | ExportProgressView showing the current stage with real-time progress. CTA is disabled during export. User watches stages complete sequentially. |
| Export screen (export complete) | DownloadCard showing green "Listo" with the ZIP filename, size, and "Descargar de nuevo" link. ZIP already auto-downloaded. |
| Export screen (no generated documents) | Empty state centered: "Genera los documentos primero" with direction to the generacion screen. |

### Navigation Integration

Phase 5 adds a new screen to the wizard sidebar: "Exportar". The sidebar gains one additional item below the Phase 4 "Validacion" entry:

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
| Generac|  (Phase 3)
| Valid.  |  (Phase 4)
| Export  |  <- NEW: "Exportar" screen
|        |
+--------+
```

The export screen uses the same full-width layout as generacion and validacion (no max-width constraint, no outer padding wrapper). Add `'exportar'` to the `isFullWidth` and dedicated-layout conditions in WizardShell.

### Export Screen Layout

```
+-----------------------------------------------------------+
| [Export Readiness Card]                                     |
| "Carpeta lista para exportar" / "N bloqueadores..."        |
|                                                            |
|        [ Exportar carpeta ]  (CTA button, 48px)            |
|        "2 advertencias - exportar de todos modos"          |
+-----------------------------------------------------------+
|                                                            |
| [Language Check Results]  (visible after first attempt)    |
| +-------------------------------------------------------+ |
| | Anglicismos                                           | |
| |   warning: "shooting" en A7 -> usar "rodaje"         | |
| |   info: "catering" - termino tecnico aceptado        | |
| | Formatos                                              | |
| |   pass: Sin problemas de formato                     | |
| | Titulo                                                | |
| |   pass: Titulo identico en 18/18 documentos          | |
| +-------------------------------------------------------+ |
|                                                            |
| [Export Progress]  (visible during/after export)           |
| +-------------------------------------------------------+ |
| | 1. Verificacion de idioma        [checkmark]          | |
| | 2. Generando PDFs...  (12/20)    [=======>   ]        | |
| |    A9_PRES_UNL.pdf                                    | |
| | 3. Descargando archivos          [pending]            | |
| | 4. Compilando ZIP                [pending]            | |
| +-------------------------------------------------------+ |
|                                                            |
| [Download Card]  (visible after completion)                |
| +-------------------------------------------------------+ |
| | [checkmark] Listo                                     | |
| | carpeta_UNL_2026-03-24.zip (28.4 MB)                 | |
| | Generada el 24 de marzo de 2026                       | |
| | [Descargar de nuevo]                                  | |
| +-------------------------------------------------------+ |
+-----------------------------------------------------------+
```

### ZIP Folder Structure (D-12)

```
carpeta_{PROJ}/
  00_ERPI/
    {user-uploaded ERPI documents, renamed to IMCINE convention}
  A_PROPUESTA/
    A1_RE_{PROJ}.pdf
    A2_SIN_{PROJ}.pdf
    A7_PP_{PROJ}.pdf
    A8_PR_{PROJ}.pdf
    A8_RC_{PROJ}.pdf
    A9_PRES_{PROJ}.pdf
    A9_DEG_{PROJ}.pdf
    A9_FE_{PROJ}.pdf
    A10_EXH_{PROJ}.pdf
    A11_BP_{PROJ}.pdf
  B_PERSONAL/
    B3_CP_{PROJ}.pdf
    B3_CD_{PROJ}.pdf
    {user-uploaded CVs, IDs}
  C_ERPI/
    C2_CES_{PROJ}.pdf
    C3_BPC_{PROJ}.pdf
    C3_PIC_{PROJ}.pdf
    C4_FT_{PROJ}.pdf
    {user-uploaded INDAUTOR certs}
  D_COTIZ/
    {user-uploaded insurance, CPA, equipment quotes}
  E_FINANZAS/
    E1_EF_{PROJ}.pdf
    E2_CAE_{PROJ}.pdf
    {user-uploaded bank statements, support letters}
  _INTERNO/
    validacion.pdf
    estimacion_puntaje.pdf
    guia_carga.pdf
```

---

## Interaction Contracts

### Export Button State Machine (D-13)

```
[blockers_exist] -> Red disabled button
  onClick -> open ExportBlockedDialog

[warnings_only] -> Yellow enabled button
  onClick -> start export pipeline

[clean] -> Green enabled button
  onClick -> start export pipeline

[exporting] -> Gray disabled button with spinner
  no interaction allowed

[complete] -> Green "Listo" state
  shows DownloadCard instead of CTA

[error] -> Red error state
  shows "Reintentar exportacion" button
```

### Export Pipeline Sequence (D-06/D-15)

```
1. User clicks "Exportar carpeta"
2. Language check runs (Cloud Function or client-side)
   -> If title mismatch BLOCKER found: halt, show findings, user must fix
   -> If warnings found: show findings, user can dismiss + continue
   -> If clean: auto-proceed to step 3
3. Generate PDFs sequentially (3-4 at a time to avoid memory pressure)
   -> Show progress: "{current}/{total}" with current filename
   -> If individual PDF fails: log error, continue with remaining
4. Fetch uploaded files from Firebase Storage
   -> Show progress: "{current}/{total}"
5. Compile ZIP with JSZip
   -> Indeterminate progress bar
6. Auto-download ZIP via file-saver saveAs()
   -> Show DownloadCard with re-download link
```

### Language Check Finding Dismissal (D-07/D-08)

- Title mismatches: NOT dismissable (blocker -- red XCircle icon)
- Anglicisms flagged: dismissable (warning -- yellow AlertTriangle icon, "Ignorar" button)
- Anglicisms noted: no action needed (info -- gray Info icon, no dismiss button)
- Format inconsistencies: dismissable (warning -- yellow AlertTriangle icon)
- After dismissing all warnings, export proceeds automatically

### PDF Contract Highlight (D-03)

Fee amounts in contracts (B3-prod, B3-dir, C2b) are rendered inside a highlighted box:
- Background: `#fff3cd` (warm yellow)
- Border: 1pt solid `#ffc107`
- Padding: 8pt vertical, 12pt horizontal
- Text: 12pt bold, centered
- Content: `$X,XXX,XXX MXN` formatted fee amount

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Button, Card, Badge, Dialog, Progress, Alert, Separator, Tooltip, Sonner, ScrollArea, Skeleton | not required |
| Third-party | none | not applicable |

No third-party registries used in Phase 5. All PDF rendering uses @react-pdf/renderer (npm package, not a shadcn registry).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
