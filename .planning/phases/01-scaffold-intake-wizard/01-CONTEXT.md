# Phase 1: Scaffold + Intake Wizard - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

React + Firebase project scaffold with a 5-screen Spanish-language intake wizard, multi-project support, shared ERPI settings, and persistent data storage. User can create projects, enter all required data through a guided wizard, upload a screenplay PDF and see parsed breakdown, and upload supporting documents. All UI in Mexican Spanish.

</domain>

<decisions>
## Implementation Decisions

### Wizard Navigation
- **D-01:** Free navigation — all 5 screens accessible anytime via persistent left sidebar. No sequential locking.
- **D-02:** Sidebar shows all 5 wizard screens with traffic light status icons per screen (🟢 complete, 🟡 partial, 🔴 has errors).
- **D-03:** Auto-save with debounce to Firestore as user types. No save button. Like Notion.

### Project Dashboard
- **D-04:** Project cards layout — one card per project showing: title + genre + period, overall completion %, validation status (blocker/warning counts), budget + EFICINE amount, readiness score ("Listo para enviar" / "Faltan X documentos" / "X bloqueadores"), and days until target period closes.
- **D-05:** Projects grouped by EFICINE period under headers (e.g., "Periodo 1 (Ene-Feb 2026)").
- **D-06:** Shared ERPI data — company info (razón social, RFC, legal rep, fiscal domicile) and prior EFICINE project history (for FORMATO 4 / eligibility checks) live in a separate "Datos ERPI" settings area. Entered once, referenced by all projects.
- **D-07:** No project limit enforced — user can create unlimited projects (EFICINE's 3-per-period rule is a soft guideline, not a technical constraint).
- **D-08:** Quick create — button creates a blank project, user lands directly in the wizard. No modal.
- **D-09:** Delete with confirmation dialog. Permanent deletion.
- **D-10:** Clone/duplicate button — copies all project data for resubmission workflow.
- **D-11:** Dashboard is always the home screen. No auto-open of last project.
- **D-12:** Clean and minimal visual style — Notion/Linear feel. Whitespace, subtle borders, professional.
- **D-13:** Dark mode — system-preference-aware via Tailwind `dark:` classes.

### Financial Input UX
- **D-14:** Both inline feedback and persistent compliance panel — inline indicators below each field + always-visible right panel showing ERPI %, EFICINE %, federal %, screenwriter %, in-kind % with green/red status.
- **D-15:** Dynamic contributor list — "+ Agregar aportante" button adds rows. Each row: name, type (donante/coproductor/distribuidor/plataforma), amount, cash/especie. Remove with X.
- **D-16:** Format on blur — user types raw numbers, formatting to $X,XXX,XXX MXN applies when field loses focus.
- **D-17:** Warning after blur — EFICINE compliance violations shown after user finishes typing, not while typing. Less disruptive.
- **D-18:** Co-production toggle reveals additional fields inline (FX rate, territorial split, IMCINE cert upload) — no separate sub-screen.
- **D-19:** Gestor de recursos toggle — "¿Tiene gestor de recursos?" switch. When on, shows fee field with 4%/5% cap indicator.
- **D-20:** In-kind contributions entered per-person on the creative team screen (Screen 3). Financial screen shows calculated total. Single source of truth is the per-person amount.
- **D-21:** Numbers only for funding breakdown — no charts. Compliance panel percentages are sufficient.
- **D-22:** Compliance summary panel is always visible (not collapsible) on the financial screen.

### Screenplay Parse UI
- **D-23:** Side-by-side layout — left: PDF viewer with continuous scroll, right: parsed data in editable fields. User compares visually.
- **D-24:** Both aggregated and detailed view — summary cards at top (scene count, location count, character count, INT/EXT/DAY/NIGHT) with expandable scene-level detail below for corrections.
- **D-25:** User can add missing locations/characters and remove false positives from the parsed list.
- **D-26:** Manual entry fallback — if parser fails, show warning "No se pudo extraer el texto correctamente" and let user fill all fields manually.
- **D-27:** Replace with warning on re-upload — "Reemplazar guión borrará el análisis anterior. ¿Continuar?" All other project data preserved.

### Claude's Discretion
- Loading skeleton design and transitions between screens
- Exact sidebar width, spacing, and typography
- Error state handling for Firestore connectivity issues
- Debounce timing for auto-save
- PDF viewer library choice and configuration
- Form field ordering within each screen (follow schema structure)
- Empty state illustrations and copy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Application architecture
- `directives/app_spec.md` — Full architecture spec: intake screens (Phase 1 section), data model, file naming, processing pipeline overview
- `directives/app_spec.md` §"PHASE 1: INTAKE" — Exact field list for all 5 intake screens

### Language policy
- `directives/politica_idioma.md` — Three-layer language architecture, protected terminology, UI Spanish rules, amount/date formatting, form label examples

### Data model schemas
- `schemas/modulo_a.json` — Section A fields (propuesta cinematográfica) — maps to Screens 1-3
- `schemas/modulo_b.json` — Section B fields (personal creativo) — maps to Screen 3 (team)
- `schemas/modulo_c.json` — Section C fields (ERPI legal) — maps to ERPI settings area
- `schemas/modulo_d.json` — Section D fields (cotizaciones) — maps to Screen 5 (uploads)
- `schemas/modulo_e.json` — Section E fields (esquema financiero) — maps to Screen 4 (financials)
- `schemas/export_manager.json` — File naming rules, modality routing

### Validation rules
- `references/validation_rules.md` — 13 cross-module validation rules. Rules 1-6 (financial, title, fees, dates, experience, ERPI eligibility) affect intake-time validation.

### Research
- `.planning/research/STACK.md` — Technology choices with versions (React 19, Vite 8, Tailwind 4.2, shadcn/ui, Firebase 12.11, Zod 4.3, React Hook Form, unpdf)
- `.planning/research/ARCHITECTURE.md` — Component boundaries, Firestore data model, build order
- `.planning/research/PITFALLS.md` — Single-source-of-truth for financial totals, title consistency enforcement — Phase 1 data model decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield. Phase 1 creates the foundation.

### Established Patterns
- JSON Schema files in `schemas/` define the Firestore data model. Schema field names are in Spanish (e.g., `titulo_proyecto`, `monto_solicitado_eficine_mxn`).
- Enum values use IMCINE terminology exactly: `["Ficción", "Documental", "Animación"]`

### Integration Points
- Firestore `projects/{projectId}` collection with subcollections: `metadata`, `screenplay`, `team/{memberId}`, `financials`, `documents/{docId}`, `generated/{docId}`, `validation`
- Shared ERPI data needs its own Firestore document (e.g., `erpi_settings/default`) separate from per-project data
- `.env` file exists for environment variables (Firebase config, API keys)

</code_context>

<specifics>
## Specific Ideas

- Dashboard should feel like Notion/Linear — clean, minimal, professional. Not data-dense or cluttered.
- The compliance panel on the financial screen is always visible — it's the user's constant reference while entering numbers.
- In-kind contributions are a per-person concept entered on the team screen, not a lump sum on the financial screen. The financial screen just shows the calculated total.
- ERPI data (company info + prior EFICINE history) is a first-class concept in its own settings area, not buried in a project wizard.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-scaffold-intake-wizard*
*Context gathered: 2026-03-21*
