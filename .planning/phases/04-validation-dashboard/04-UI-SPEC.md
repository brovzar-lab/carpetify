---
phase: 4
slug: validation-dashboard
status: draft
shadcn_initialized: true
preset: base-nova (neutral)
created: 2026-03-23
---

# Phase 4 — UI Design Contract

> Visual and interaction contract for the Validation Engine + Dashboard phase. Phase 4 introduces a dedicated validation dashboard as the primary compliance navigation surface, with per-rule traffic light rows, "Ir al campo" deep links to intake fields, score estimation with AI persona scoring, document expiration alerts at three touchpoints, and real-time validation across 17 rules. All copy in Mexican Spanish.

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

Inherited from Phase 1. Phase 4 uses the same 8-point scale with the following usage specifics:

| Token | Value | Phase 4 Usage |
|-------|-------|---------------|
| xs | 4px | Icon gaps within rule status rows (between status dot and rule name), inline gaps between score badge and label |
| sm | 8px | Rule row internal padding, persona score cell padding, expiration alert internal spacing |
| md | 16px | Default spacing between rule rows, card padding in score estimation, spacing between expiration alert items |
| lg | 24px | Section spacing between severity groups (blockers section to warnings section), score category group padding |
| xl | 32px | Gap between the validation summary header and the rules list, gap between score estimation panel and rules panel |
| 2xl | 48px | Top padding of the validation dashboard page content area |
| 3xl | 64px | Not used in Phase 4 additions |

Exceptions:
- Score estimation panel width: 360px (fixed right panel on desktop, accommodates 5-persona score breakdown table with category names in Spanish)
- Touch target for "Ir al campo" links: minimum 36px height (consistent with Phase 1 interactive element minimum)
- Expiration countdown badge: 28px height (accommodates "45 dias" text at 12px with 8px vertical padding)

---

## Typography

Inherited from Phase 1. No new type roles. Phase 4 additions map to existing roles:

| Role | Size | Weight | Line Height | Phase 4 Usage |
|------|------|--------|-------------|---------------|
| Body | 14px | 400 (regular) | 1.5 | Rule detail explanations, score suggestion body text, expiration alert body, persona score descriptions, validation message text |
| Body (label) | 14px | 600 (semibold) | 1.5 | Rule names in validation rows (e.g., "Conciliacion financiera"), score category names, "Bloqueadores" / "Advertencias" section headers, persona names (Reygadas, Marcopolo, etc.), expiration document names |
| Heading | 20px | 600 (semibold) | 1.2 | "Validacion" page title, "Estimacion de Puntaje" panel heading, expanded rule detail heading |
| Display | 28px | 600 (semibold) | 1.2 | Not used in Phase 4 additions |

**Score value typography:** Score numbers (e.g., "34/38", "52/62") use 14px semibold (600) with `font-mono` for numeric alignment in the score breakdown table. This is the only monospaced usage in Phase 4, consistent with Phase 3 budget cell pattern.

**Small text:** Expiration countdown badges ("45 dias", "Vencido"), rule status labels ("Pasa", "Falla", "Pendiente"), and persona score values use 12px regular (400) -- `text-xs` in Tailwind. This is within the existing Body role scaled down for metadata-level density.

---

## Color

Inherited from Phase 1. No new CSS custom properties. Phase 4 extends the traffic light system established in Phases 1-3:

| Token | Phase 4 Usage |
|-------|---------------|
| `--color-status-green` / `bg-[hsl(142_76%_36%)]` | Passing rule status dot, "Pasa" label, score above threshold (>=90), expiration "Vigente" badge, bonus category met |
| `--color-status-yellow` / `bg-[hsl(38_92%_50%)]` | Warning-level rule status dot, "Advertencia" label, expiration "Proximo a vencer" badge (30 days), score between 85-89 (close to threshold), stale validation "Pendiente de re-validacion" badge |
| `--color-status-red` / `bg-[hsl(0_84%_60%)]` | Blocker rule status dot, "Falla" label, expiration "Vencido" / "<14 dias" badge, score below 85 (far from threshold), project card blocker banner |
| `--color-muted-foreground` | "Omitido" rule status (skip state -- insufficient data), persona names in score table, secondary metadata text, rule detail field references |
| `--color-primary` | "Ir al campo" navigation links, "Evaluar puntaje" CTA button, active tab in score panel, dashboard nav item |
| `--color-destructive` | Not used beyond existing Phase 1 patterns (no destructive actions in validation) |
| `bg-muted/50` | Score estimation panel background, rule detail expanded background, severity section header background |

**60/30/10 split in Phase 4 views:**
- 60% dominant: white background of validation dashboard content area, score estimation white cards
- 30% secondary: severity section backgrounds (`bg-muted/50`), score panel surface, expanded rule detail surfaces, project card expiration banners
- 10% accent (primary): "Ir al campo" links (the highest-value interaction in this phase), "Evaluar puntaje" CTA, active navigation indicator

**Skip state visual treatment:** Rules with `status: 'skip'` (not enough data to evaluate) use `text-muted-foreground` for the rule name and a gray dot (`bg-muted-foreground/40`) instead of green/yellow/red. This is distinct from all three traffic light states. Skip text: "Genera los documentos primero para evaluar esta regla." in `text-muted-foreground`.

**Stale validation visual treatment:** Rules marked as "pendiente de re-validacion" (D-14) show the old status dot at 40% opacity (`opacity-40`) with a yellow outline ring, plus a small "Pendiente" badge in yellow. Old status text is dimmed but visible so the user knows what the previous result was.

**No new CSS custom properties required.** All Phase 4 states map to existing `status-green`, `status-yellow`, `status-red`, and shadcn semantic tokens.

---

## Copywriting Contract

All copy in Mexican Spanish per INTK-10 and `directives/politica_idioma.md`. New strings for Phase 4 to be added to `src/locales/es.ts` under a new `validation` key and `scoring` key.

### Validation Dashboard

| Element | Copy |
|---------|------|
| Page title | Validacion |
| Wizard sidebar label | Validacion |
| Summary: can export | Listo para exportar. Sin bloqueadores. |
| Summary: cannot export | {n} bloqueador(es) impiden la exportacion. |
| Summary: warnings exist | {n} advertencia(s) detectada(s). |
| Summary: all rules pass | Todas las reglas de cumplimiento se cumplen. |
| Blocker section header | Bloqueadores |
| Warning section header | Advertencias |
| Passed section header | Cumplidas |
| Skipped section header | Sin evaluar |
| Rule status: pass | Pasa |
| Rule status: fail (blocker) | Falla |
| Rule status: fail (warning) | Advertencia |
| Rule status: skip | Sin datos |
| Stale validation badge | Pendiente de re-validacion |
| "Go to field" link | Ir al campo |
| "Go to document" link | Ver documento |
| Expand rule detail | Ver detalles |
| Collapse rule detail | Ocultar detalles |

### Validation Rule Names (Spanish, per validation_rules.md)

| Rule ID | Rule Name |
|---------|-----------|
| VALD-01 | Conciliacion financiera |
| VALD-02 | Consistencia del titulo |
| VALD-03 | Honorarios cruzados |
| VALD-04 | Vigencia de documentos |
| VALD-05 | Cumplimiento EFICINE |
| VALD-06 | Completitud de documentos |
| VALD-07 | Experiencia minima |
| VALD-08 | Elegibilidad ERPI |
| VALD-09 | Formato de archivos |
| VALD-10 | Gastos prohibidos |
| VALD-11 | Ruta critica vs flujo |
| VALD-12 | Accesibilidad de enlaces |
| VALD-13 | Puntos bonus |
| VALD-17 | Vigencia de documentos cargados |

### Validation Rule Detail Messages (passing state)

| Rule ID | Pass Message |
|---------|-------------|
| VALD-01 | Presupuesto = Flujo de efectivo = Esquema financiero. |
| VALD-02 | El titulo es identico en todos los documentos. |
| VALD-03 | Honorarios de productor, director y guionista coinciden en contratos, presupuesto y flujo. |
| VALD-04 | Todos los documentos estan dentro del plazo de 90 dias. |
| VALD-05 | Todos los porcentajes EFICINE cumplen los limites. |
| VALD-06 | Todos los documentos requeridos (Secciones A-E) estan presentes. |
| VALD-07 | Productor y director cumplen los requisitos minimos de experiencia. |
| VALD-08 | La ERPI es elegible para esta convocatoria. |
| VALD-09 | Todos los archivos cumplen formato PDF, tamano y nomenclatura. |
| VALD-10 | No se detectaron gastos prohibidos con fondos EFICINE. |
| VALD-11 | La ruta critica y el flujo de efectivo estan alineados. |
| VALD-12 | Todos los enlaces son accesibles publicamente. |
| VALD-13 | Categoria de puntos bonus detectada: {categoria}. |
| VALD-17 | Todos los documentos cargados estan vigentes. |

### Validation Rule Detail Messages (failure state)

| Rule ID | Fail Message |
|---------|-------------|
| VALD-01 | Los totales financieros no coinciden: {detail list}. |
| VALD-02 | El titulo no coincide en {n} documento(s): {list}. |
| VALD-03 | Los honorarios no coinciden: {detail list}. |
| VALD-04 | {n} documento(s) exceden el plazo de 90 dias: {list}. |
| VALD-05 | {n} regla(s) EFICINE incumplida(s): {list}. |
| VALD-06 | Faltan {n} documento(s) requerido(s): {list}. |
| VALD-07 | {role} no cumple el requisito minimo de experiencia: {detail}. |
| VALD-08 | La ERPI no es elegible: {reason}. |
| VALD-09 | {n} archivo(s) no cumplen los requisitos de formato: {list}. |
| VALD-10 | Se detectaron gastos prohibidos con fondos EFICINE: {list}. |
| VALD-11 | {n} etapa(s) no coinciden entre ruta critica y flujo: {list}. |
| VALD-12 | {n} enlace(s) no son accesibles: {list}. |
| VALD-13 | No se detecta categoria de puntos bonus elegible. Revisa los requisitos. |
| VALD-17 | {n} documento(s) vencido(s) o proximo(s) a vencer: {list}. |

### Validation Rule Skip Messages

| Rule ID | Skip Message |
|---------|-------------|
| VALD-01 | Genera el presupuesto, flujo de efectivo y esquema financiero para evaluar. |
| VALD-02 | No se ha definido el titulo del proyecto. |
| VALD-03 | Genera los contratos y el presupuesto para evaluar los honorarios. |
| VALD-04 | No hay documentos cargados con fecha de emision. |
| VALD-05 | Completa la estructura financiera para evaluar. |
| VALD-06 | No hay documentos generados ni cargados. |
| VALD-07 | Agrega la filmografia del productor y director para evaluar. |
| VALD-08 | Completa los datos ERPI para evaluar la elegibilidad. |
| VALD-09 | No hay archivos de salida para validar. Se evaluara al exportar. |
| VALD-10 | Genera el flujo de efectivo para evaluar gastos prohibidos. |
| VALD-11 | Genera la ruta critica y el flujo de efectivo para evaluar. |
| VALD-12 | No hay enlaces registrados para verificar. |
| VALD-13 | Completa los datos del equipo creativo para evaluar puntos bonus. |
| VALD-17 | No hay documentos con fecha de emision para evaluar vigencia. |

### Score Estimation

| Element | Copy |
|---------|------|
| Panel heading | Estimacion de Puntaje |
| CTA button | Evaluar puntaje |
| CTA button (re-evaluate) | Re-evaluar puntaje |
| Evaluating state | Evaluando proyecto... |
| Disclaimer | Estimado basado en completitud y senales medibles. No es una prediccion del resultado del comite evaluador. |
| Viability section | Viabilidad ({n}/38 pts) |
| Artistic section | Merito Artistico ({n}/62 pts) — estimado |
| Bonus section | Puntos Bonus ({n}/5 pts) |
| Total estimated | Puntaje estimado: {n}/100 (+{bonus} bonus) |
| Threshold pass | El proyecto supera el minimo de 90 puntos. |
| Threshold fail | El proyecto no alcanza el minimo de 90 puntos. |
| Threshold close | El proyecto esta cerca del minimo de 90 puntos. |
| Improvement heading | Mejoras sugeridas |
| Improvement item format | +{pts} pts: {suggestion text} |
| Average winner reference | Promedio ganador 2025: 94.63/100 |
| Persona label | Evaluador: {persona name} |

### Score Categories (Spanish names for rubric)

| Category | Label |
|----------|-------|
| Guion o argumento | Guion (40 pts) |
| Propuesta de direccion | Direccion (12 pts) |
| Material visual | Material Visual (10 pts) |
| Solidez equipo | Equipo Creativo (2 pts) |
| Propuesta produccion | Produccion (12 pts) |
| Plan de rodaje + ruta critica | Plan de Rodaje (10 pts) |
| Presupuesto | Presupuesto (10 pts) |
| Propuesta exhibicion | Exhibicion (4 pts) |

### Score Improvement Suggestions (top 5 highest-impact, per D-09)

| Signal | Suggestion Copy |
|--------|----------------|
| No director filmography links | +3 pts: Agrega enlaces a la filmografia del director para mejorar el puntaje de direccion. |
| Plan de rodaje > 5 pages/day | +2 pts: Reduce las paginas por dia de rodaje a un maximo de 5 para mayor viabilidad. |
| No contingency in budget | +2 pts: Agrega una partida de imprevistos al presupuesto (minimo 10% del BTL). |
| Propuesta exhibicion no spectator estimate | +1 pt: Incluye estimacion de espectadores y recaudacion en la propuesta de exhibicion. |
| No safe workplace mention | +1 pt: Menciona el compromiso con un entorno laboral respetuoso en la propuesta de produccion. |
| No festival strategy | +1 pt: Incluye una estrategia de festivales en la propuesta de exhibicion. |
| Ruta critica no monthly detail | +2 pts: Detalla la ruta critica mes a mes para mejorar el puntaje de planeacion. |
| Material visual < 10 pages | +1 pt: Amplia el material visual a minimo 10 paginas para mayor solidez. |

### Bonus Points Detection (per D-10)

| Element | Copy |
|---------|------|
| Bonus heading | Puntos Bonus (+5) |
| Bonus explanation | Solo se aplica UNA categoria. Se recomienda la mas fuerte. |
| Category A label | Directora mujer |
| Category B label | Director/a indigena o afromexicano/a |
| Category C label | Descentralizacion regional |
| Category D label | Equipo creativo 100% calificado |
| Requirement met | Cumplido |
| Requirement not met | No cumplido |
| Recommended category | Categoria recomendada |
| No eligible category | No se detecta categoria elegible. Revisa los requisitos de cada una. |

### AI Persona Names and Descriptions

| Persona | Label | Description |
|---------|-------|-------------|
| Reygadas | Reygadas — Cine de arte | Perspectiva autoral y artistica |
| Marcopolo | Marcopolo — Cine comercial | Viabilidad comercial mexicana |
| Pato | Pato — Escritura | Calidad narrativa y guion |
| Leo | Leo — Produccion | Solidez de produccion |
| Alejandro | Alejandro — Direccion comercial | Craft de direccion mainstream |

### Document Expiration Alerts (per D-15, D-16, D-17)

| Element | Copy |
|---------|------|
| Expiration section heading | Vigencia de Documentos |
| Status: valid (green) | Vigente — {n} dias restantes |
| Status: approaching (yellow, <=30 days) | Proximo a vencer — {n} dias restantes |
| Status: critical (red, <=14 days) | Vence pronto — {n} dias restantes |
| Status: expired (red, 0 days) | Vencido — requiere reemplazo |
| Project card banner (<=14 days) | {n} documento(s) vence(n) pronto |
| Upload screen inline alert | Este documento vence en {n} dias. Sube una version actualizada antes del cierre de registro. |
| Upload screen expired alert | Este documento esta vencido. Sube una version actualizada para continuar. |
| Period change recalculation toast | Vigencias recalculadas para {period label}. |

### Hyperlink Verification (per D-12)

| Element | Copy |
|---------|------|
| Verify button | Verificar enlace |
| Re-verify button | Verificar de nuevo |
| Link accessible | Enlace accesible |
| Link not accessible | Enlace no accesible. Verifica que sea publico y no requiera contrasena. |
| Checking state | Verificando... |

### "Ir al campo" Navigation Targets

| Rule | Target Screen | Target Field |
|------|--------------|-------------|
| VALD-01 | Screen 4 (Estructura Financiera) | Financial structure section |
| VALD-02 | Screen 1 (Datos del Proyecto) | titulo_proyecto field |
| VALD-03 | Screen 3 (Equipo Creativo) | Honorarios field of relevant team member |
| VALD-04 | Screen 5 (Documentos) | Affected document row |
| VALD-05 | Screen 4 (Estructura Financiera) | Financial compliance panel |
| VALD-06 | Screen 5 (Documentos) | Missing document row |
| VALD-07 | Screen 3 (Equipo Creativo) | Filmografia section of relevant team member |
| VALD-08 | ERPI Settings | Proyectos previos section |
| VALD-09 | (Phase 5 concern -- no navigation target in Phase 4) | N/A |
| VALD-10 | Generation screen | Flujo de efectivo document |
| VALD-11 | Generation screen | Ruta critica document |
| VALD-12 | Screen 3 (Equipo Creativo) | Enlaces field of relevant team member |
| VALD-13 | Screen 3 (Equipo Creativo) | Team member demographics / Screen 1 for regional data |
| VALD-17 | Screen 5 (Documentos) | Affected expiring document row |

### Project Card Updates (per D-04)

| Element | Copy |
|---------|------|
| Blocker count (clickable) | {n} bloqueador(es) |
| Warning count (clickable) | {n} advertencia(s) |
| All passing | Sin bloqueadores |
| Expiration banner (<=14 days) | {n} documento(s) vence(n) pronto |

### Error States

| Scenario | Type | Copy |
|----------|------|------|
| Score estimation Cloud Function timeout | Toast error | La evaluacion de puntaje tardo demasiado. Intenta de nuevo. |
| Score estimation API rate limit | Toast error | Limite de solicitudes alcanzado. Espera unos minutos e intenta de nuevo. |
| Hyperlink verification network error | Inline error | No se pudo verificar el enlace. Verifica tu conexion e intenta de nuevo. |
| Validation data load failure | Alert banner | No se pudieron cargar los datos del proyecto para validar. Recarga la pagina. |

---

## Component Inventory

### New shadcn/ui Components Needed

| Component | Usage | Already Installed? |
|-----------|-------|--------------------|
| Accordion | Expandable/collapsible rule detail rows in the validation dashboard. Each rule row expands to show detail explanation, affected fields, and "Ir al campo" links. | No -- install via `npx shadcn@latest add accordion` |
| Collapsible | Collapsible severity sections (Bloqueadores, Advertencias, Cumplidas, Sin evaluar) for progressive disclosure on the dashboard. | No -- install via `npx shadcn@latest add collapsible` |

### Existing Components Reused

| Component | Phase 4 Usage |
|-----------|---------------|
| Button | "Evaluar puntaje" CTA, "Ir al campo" navigation links (link variant), "Verificar enlace", "Verificar de nuevo" |
| Card | Score estimation panel container, validation summary card, bonus points card |
| Badge | Rule status badges ("Pasa", "Falla", "Advertencia", "Sin datos"), expiration countdown badges ("45 dias", "Vencido"), persona score badges, bonus category status |
| Separator | Between severity sections, between score categories, between validation summary and rules list |
| Tooltip | Stale validation indicator explanation, persona description hover, bonus requirement detail |
| Alert | Expiration warnings on upload screen (Screen 5), project card expiration banner, validation data load failure |
| Progress | Score estimation progress bar (overall score as filled bar towards 90/100 threshold), per-category score bars in breakdown |
| Skeleton | Dashboard loading state (rule rows), score estimation loading state |
| Sonner (toast) | Score evaluation success/failure, period change recalculation notification, hyperlink verification result |
| Table | Persona score breakdown table (5 personas x N categories), document expiration table |
| ScrollArea | Validation rules list scrolling (independent from score panel) |
| Tabs | Score estimation panel: "Viabilidad" / "Artistico" / "Bonus" tabs for category breakdown |

### Custom Components to Build

| Component | Description |
|-----------|-------------|
| `ValidationDashboard` | Main page component. Two-panel layout: left panel (validation rules list) + right panel (score estimation). Summary header at top showing blocker/warning counts. Navigated to via "Validacion" sidebar item. |
| `ValidationSummary` | Header card showing export readiness: green "Listo para exportar" or red "{n} bloqueadores impiden la exportacion" plus warning count. Acts as at-a-glance compliance status. |
| `RuleStatusRow` | Single validation rule row within the Accordion. Shows: status dot (green/yellow/red/gray), rule name (14px semibold), status label badge, severity badge. Expandable to show detail message, affected items list, and "Ir al campo" link buttons. |
| `RuleDetailPanel` | Expanded content within RuleStatusRow. Shows: explanation message, bullet list of specific issues (e.g., which documents have mismatched titles), "Ir al campo" link for each issue pointing to the exact wizard field. |
| `ScoreEstimationPanel` | Right panel (360px) showing EFICINE score breakdown. Tabbed: Viabilidad (deterministic scores), Artistico (AI persona estimates), Bonus (auto-detected categories). Shows total at top with threshold comparison. "Evaluar puntaje" CTA triggers AI evaluation. |
| `ViabilityScoreCard` | Per-category card within viability tab. Shows category name, score bar (Progress component), current/max points. Deterministic -- computed from project data. |
| `ArtisticScoreCard` | Per-category card within artistic tab. Shows averaged AI persona score + individual persona breakdown. Each persona shows their score for that category. User can click to override/adjust any persona's score. |
| `PersonaScoreRow` | Row within ArtisticScoreCard showing persona icon, name, score, and brief rationale. Overridable via inline number input. |
| `BonusPointsCard` | Card showing 4 bonus categories with met/unmet requirements per category. Highlights the recommended strongest category. |
| `ExpirationAlert` | Reusable alert component for document expiration. Three-tier visual (green/yellow/red) with days remaining countdown. Used in three places: validation dashboard, upload screen (Screen 5), project card banner. |
| `ExpirationBadge` | Compact badge showing days remaining with color-coded background (green >30, yellow <=30, red <=14, solid red for expired). Used inline next to document names. |
| `IrAlCampoLink` | Button (link variant, primary color) that navigates to the exact wizard screen and field relevant to a validation issue. Uses react-router navigation with hash/query params for field-level targeting. Text: "Ir al campo" with an ArrowRight icon. |
| `HyperlinkVerifier` | Inline component next to URL fields showing verification status (green check / red X) with "Verificar de nuevo" button. Caches result per D-12. |
| `ValidationProjectCardBadge` | Extension to existing ProjectCard showing clickable blocker/warning counts. Click navigates to the validation dashboard filtered to that severity. Shows expiration banner when any document <=14 days. |

---

## Layout Contract

### Screen Focal Points

| Screen | Primary Focal Point |
|--------|-------------------|
| Validation Dashboard (blockers exist) | The ValidationSummary header showing red "{n} bloqueadores impiden la exportacion" with the blocker section expanded below, as the user's first question is "can I submit?" |
| Validation Dashboard (all passing) | The ScoreEstimationPanel on the right showing the total estimated score and threshold comparison, as the user's next question is "will I win?" |
| Validation Dashboard (score not yet evaluated) | The "Evaluar puntaje" CTA button in the score panel, as running the AI score estimation is the primary available action. |
| Project Card (with validation data) | The clickable blocker/warning counts at the bottom of the card, as "which project needs attention?" drives project selection. |

### Navigation Integration

Phase 4 adds a new screen to the wizard sidebar: "Validacion". The sidebar gains one additional item below the Phase 3 "Generacion" entry:

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
| Valid.  |  <- NEW: "Validacion" screen
|        |
+--------+
```

Route: `/project/{projectId}/validacion`

The validation dashboard traffic light indicator on the sidebar reflects:
- Green: 0 blockers, 0 warnings
- Yellow: 0 blockers, 1+ warnings
- Red: 1+ blockers

### Validation Dashboard Layout (main view)

```
+--------+--------------------------------------------------+
| Sidebar| Content Area                                     |
| 240px  |                                                  |
|        | "Validacion"  (Heading, 20px semibold)            |
|        |                                                  |
|        | +-- Validation Summary Card (full width) ------+|
|        | | [red dot] 3 bloqueadores impiden la exportac. ||
|        | | [yellow dot] 2 advertencias detectadas.       ||
|        | +----------------------------------------------+|
|        |                                                  |
|        | +-- Two-Panel Layout -------------------------+ |
|        | | Rules List         | Score Estimation       | |
|        | | (flex-1)           | Panel (360px)          | |
|        | |                    |                        | |
|        | | BLOQUEADORES (3)   | Estimacion de Puntaje  | |
|        | | [red] VALD-01 ... | [Evaluar puntaje]      | |
|        | |   > detail...     |                        | |
|        | | [red] VALD-02 ... | Viabilidad | Artistico | |
|        | | [red] VALD-06 ... | --------------------   | |
|        | |                    | Equipo: 2/2           | |
|        | | ADVERTENCIAS (2)   | Produccion: 10/12     | |
|        | | [yel] VALD-11 ... | Plan Rodaje: 8/10     | |
|        | | [yel] VALD-13 ... | Presupuesto: 9/10     | |
|        | |                    | Exhibicion: 3/4       | |
|        | | CUMPLIDAS (8)      |                        | |
|        | | [grn] VALD-03 ... | Mejoras sugeridas:     | |
|        | | [grn] VALD-04 ... | +2 pts: Reduce pag... | |
|        | | ...                | +1 pt: Incluye est... | |
|        | |                    |                        | |
|        | | SIN EVALUAR (1)    | Puntaje estimado:      | |
|        | | [gry] VALD-09 ... | 86/100 (+5 bonus)      | |
|        | |                    | [===========>    ] 90  | |
|        | +--------------------+------------------------+ |
+--------+--------------------------------------------------+
```

- Rules list panel: `flex-1`, scrollable via ScrollArea
- Score estimation panel: 360px fixed width, scrollable independently
- On screens narrower than 1024px: panels stack vertically (score panel below rules list)
- Summary card spans full content width above both panels

### Validation Rule Row (expanded)

```
+-- Rule Row (Accordion Item) ----------------------------------+
| [red dot] Conciliacion financiera    [BLOQUEADOR] [Falla]     |
+---------------------------------------------------------------+
| Los totales financieros no coinciden:                          |
|                                                                |
|  - Presupuesto ($15,200,000 MXN) != Flujo ($15,150,000 MXN)  |
|  - Presupuesto ($15,200,000 MXN) != Esquema ($15,200,000 MXN)|
|                                                                |
| [Ir al campo ->] Estructura Financiera                         |
+----------------------------------------------------------------+
```

- Collapsed: single row, 48px height, status dot + name + severity badge + status badge
- Expanded: detail panel with explanation, itemized issues, and "Ir al campo" links
- Status dot: 10px circle (same `h-2.5 w-2.5` as TrafficLight component)
- Severity badge: "BLOQUEADOR" in red Badge variant, "ADVERTENCIA" in yellow Badge variant
- Status badge: "Pasa" green / "Falla" red / "Advertencia" yellow / "Sin datos" gray Badge variants

### Score Estimation Panel

```
+-- Score Estimation Panel (360px, border-l) --+
| "Estimacion de Puntaje"  (20px semibold)     |
|                                               |
| Puntaje estimado: 86/100 (+5 bonus)          |
| [========================================>  ] |
|  ^-- threshold marker at 90                   |
|                                               |
| "Promedio ganador 2025: 94.63/100"  (12px)   |
|                                               |
| [Viabilidad] [Artistico] [Bonus]  (Tabs)     |
| -------------------------------------------- |
|                                               |
| Equipo Creativo (2 pts)                       |
| [====================] 2/2                    |
|                                               |
| Produccion (12 pts)                           |
| [=================>  ] 10/12                  |
|                                               |
| Plan de Rodaje (10 pts)                       |
| [===============>    ] 8/10                   |
|                                               |
| ...                                           |
|                                               |
| -------------------------------------------- |
| Mejoras sugeridas:                            |
| +2 pts: Agrega partida de imprevistos...     |
| +1 pt: Incluye estimacion de espectadores... |
|                                               |
| [Re-evaluar puntaje]  (outline button)       |
|                                               |
| (12px muted) Estimado basado en completitud  |
| y senales medibles. No es una prediccion del |
| resultado del comite evaluador.              |
+-----------------------------------------------+
```

### Score Estimation -- Artistic Tab (with AI personas)

```
+-- Artistic Tab --------------------------------+
| Guion (40 pts) — Estimado: 34/40              |
| +-----------------------------------------+   |
| | Reygadas  | Marcopolo | Pato  | Leo | Alej||
| | 35        | 32        | 36    | 33  | 34  ||
| +-----------------------------------------+   |
| Promedio: 34/40                                |
| [Ajustar] (text link to override)             |
|                                                |
| Direccion (12 pts) — Estimado: 10/12          |
| +-----------------------------------------+   |
| | Reygadas  | Marcopolo | Pato  | Leo | Alej||
| | 11        | 9         | 10    | 10  | 10  ||
| +-----------------------------------------+   |
| Promedio: 10/12                                |
| [Ajustar]                                      |
|                                                |
| Material Visual (10 pts) — Estimado: 8/10     |
| ...                                            |
+------------------------------------------------+
```

- Persona scores in a compact horizontal table (5 columns)
- "Ajustar" link opens inline number input to override the averaged score per category
- Override value stored locally, not sent to AI -- purely for the user's "what if" exploration

### Document Expiration in Upload Screen (Screen 5)

```
+-- Document Row (Screen 5) --------------------------------+
| [upload icon] Cotizacion de Seguro        [Subido]        |
|   [yellow badge] Proximo a vencer — 22 dias restantes     |
|   Sube una version actualizada antes del cierre.          |
+------------------------------------------------------------+
```

- Expiration badge appears below the document name/status row
- Uses ExpirationBadge component with color-coded background
- Alert text in `text-muted-foreground` at 12px

### Project Card with Validation Data

```
+-- Project Card (existing + Phase 4 additions) ------+
| "La Ultima Frontera"                                  |
| [Ficcion] [Periodo 1 (Ene-Feb 2026)]                |
| [=======================>      ] 75%                  |
| $15,200,000 MXN                                      |
| EFICINE: $8,000,000 MXN                              |
|                                                       |
| +-- Validation Summary Row -----------------------+ |
| | [red] 3 bloqueadores  [yellow] 2 advertencias   | |
| +--------------------------------------------------+|
|                                                       |
| +-- Expiration Banner (if any <=14 days) ---------+ |
| | [!] 1 documento vence pronto                    | |
| +--------------------------------------------------+|
|                                                       |
| [Clone] [Delete]                                      |
+-------------------------------------------------------+
```

- Validation summary row replaces the current placeholder `es.dashboard.blockers(0)`
- Blocker count in red, clickable -- navigates to `/project/{id}/validacion?filter=blockers`
- Warning count in yellow, clickable -- navigates to `/project/{id}/validacion?filter=warnings`
- Expiration banner in red/yellow background, shown only when any document <=14 days from expiration (D-16)

---

## Interaction Contracts

### Validation Dashboard Real-Time Updates (D-11, D-13, D-14)

1. **Data flow:** `useValidation` hook composes existing data hooks (`useAutoSave` for metadata, `useGeneratedDocs` for generated documents, Firestore `onSnapshot` for uploaded documents and team data). When any upstream data changes, the validation engine re-runs.
2. **Debouncing:** Validation re-runs are debounced by 300ms after the last data change to prevent dashboard flickering during typing (Pitfall 6 from RESEARCH.md).
3. **Silent updates (D-13):** After document generation, validations run automatically but do NOT trigger interruptive notifications. The dashboard reflects the new state when the user navigates to it. No toast for validation status changes.
4. **Stale validations (D-14):** Instant rules re-run immediately on data change. Medium/slow rules (prohibited expenditure scan, ruta critica sync, hyperlink checks) show "Pendiente de re-validacion" badge with old status at 40% opacity. They re-run when the dashboard is opened or the relevant document is regenerated.

### "Ir al campo" Navigation (D-03)

1. Clicking "Ir al campo" on a validation detail navigates to the exact wizard screen containing the problematic field.
2. Navigation uses react-router `navigate()` with query parameter `?highlight={fieldId}` to identify the target field.
3. The target screen reads the `highlight` query parameter and applies a temporary highlight effect: `ring-2 ring-primary/50` on the target field for 3 seconds, then fades.
4. For rules pointing to team members (VALD-03, VALD-07, VALD-12), the link includes the team member index so the correct member form is scrolled into view.
5. For rules pointing to documents (VALD-04, VALD-06, VALD-17), the link navigates to Screen 5 and scrolls to the relevant document row.
6. "Ir al campo" links use the Button component with `variant="link"` and primary color, with an ArrowRight icon suffix.

### Score Estimation Behavior (D-05, D-06, D-07, D-08, D-09)

1. **Initial state:** Score panel shows "Evaluar puntaje" CTA. No scores displayed until explicitly triggered.
2. **Viability scoring (D-05):** Runs client-side as a pure function. Computed deterministically from project data. Updates in real time as data changes. No CTA needed -- always up to date.
3. **Artistic scoring (D-06):** Triggered by "Evaluar puntaje" button. Calls Cloud Function that runs 5 AI persona evaluations in parallel. Shows "Evaluando proyecto..." with a Progress bar during evaluation. Results persist in Firestore for the project.
4. **After evaluation:** Viability tab shows real-time deterministic scores. Artistic tab shows AI-estimated scores with per-persona breakdown. Bonus tab shows auto-detected eligible categories.
5. **Re-evaluation:** "Re-evaluar puntaje" button (outline variant) appears after first evaluation. Triggers new AI evaluation that overwrites previous results.
6. **Manual override (D-07):** User can click "Ajustar" on any artistic category to enter a manual score override. Override is stored locally (not in Firestore). The total recalculates with the override. This is a "what if" tool, not a permanent adjustment.
7. **Improvement suggestions (D-09):** Appear below the score breakdown, sorted by point impact descending. Show top 5 highest-impact improvements. Each suggestion shows the estimated point gain and a concrete action.

### Document Expiration Behavior (D-15, D-16, D-17, D-18)

1. **Three-tier thresholds (D-15):**
   - Green "Vigente" + days remaining: >30 days until 90-day deadline
   - Yellow "Proximo a vencer" + days remaining: <=30 days
   - Red "Vence pronto" + days remaining: <=14 days
   - Solid red "Vencido": 0 days (past 90-day window relative to period close date)
2. **Three touchpoints (D-16):**
   - Validation dashboard: ExpirationAlert within the VALD-17 rule detail, listing each document with its countdown
   - Upload screen (Screen 5): ExpirationBadge inline next to each affected document (seguro, contador, estado de cuenta, carta de apoyo, cotizacion especie)
   - Project card: Banner "1 documento vence pronto" shown only when any document <=14 days
3. **Expired = strict blocker (D-17):** Expired documents produce a VALD-17 blocker (not warning). No dismiss option. User must upload a replacement.
4. **Period change recalculation (D-18):** When the user changes the target EFICINE period (INTK-02 on Screen 1), all expiration countdowns recalculate immediately. Toast: "Vigencias recalculadas para {period label}." No manual "recalcular" step required.

### Hyperlink Verification (D-12)

1. URLs in team member profiles (`enlaces` field) are verified once when entered.
2. Verification result cached: green checkmark (accessible) or red X (not accessible).
3. "Verificar de nuevo" button appears next to cached results for manual re-check.
4. During verification: "Verificando..." spinner replaces the button.
5. Verification is a client-side HEAD request to the URL. If CORS blocks, show yellow "No se pudo verificar automaticamente" with a link to open in new tab.
6. VALD-12 dashboard row shows aggregate: "2 de 4 enlaces verificados como accesibles."

### Project Card Validation Integration (D-04)

1. ProjectCard component receives validation summary data (blocker count, warning count, expiration status).
2. Blocker count rendered as clickable red text: "3 bloqueadores" -- click navigates to `/project/{id}/validacion?filter=blockers`.
3. Warning count rendered as clickable yellow text: "2 advertencias" -- click navigates to `/project/{id}/validacion?filter=warnings`.
4. When `filter` query param is present on the validation dashboard, only that severity section is expanded by default. Others are collapsed.
5. Expiration banner shown below the validation summary row when any document <=14 days. Uses Alert component with yellow/red background.

### Loading States

| Element | Loading Behavior |
|---------|-----------------|
| Validation rules list | Skeleton: 6 rows of full-width rectangles (48px height each) with 8px gaps |
| Score estimation panel | Skeleton: heading + 3 progress bars of varying width + 2 text lines |
| AI persona evaluation | Progress bar with "Evaluando proyecto..." text. Duration ~15-30 seconds for 5 parallel evaluations |
| Validation dashboard on first load | Show rules list immediately (validation engine runs client-side, no server fetch). Score panel shows "Evaluar puntaje" CTA immediately. |
| Expiration data | No separate loading -- computed from already-loaded document metadata |

### Transitions

| Element | Transition |
|---------|-----------|
| Rule row expand/collapse | Accordion default animation (200ms ease). Content slides down. |
| Severity section collapse/expand | Collapsible default animation (200ms ease). |
| Score evaluation completion | Scores fade in (`opacity 0->1, 300ms ease`). Progress bar transitions to final width. |
| Validation status dot color change | Instant color swap. No transition. Consistent with existing TrafficLight behavior. |
| "Ir al campo" field highlight | `ring-2 ring-primary/50` applied immediately, fades out via `transition-opacity 3s ease` after 3 seconds. |
| Expiration badge appearance | Instant. No animation. |
| Toast notifications | Existing Sonner behavior (slide in from top-right, auto-dismiss 4s). |
| Dashboard filter from project card | Instant navigation. Target severity section scrolled into view. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Accordion, Collapsible (new for Phase 4) | not required |

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
