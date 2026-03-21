# Carpetify — Conventions

## Project Status
**Pre-code / Specification phase.** Conventions are defined in specification documents but no code exists to demonstrate them yet.

## Language Architecture (Three Layers)

This is the most critical convention — defined in `directives/politica_idioma.md`:

| Layer | Language | Scope |
|-------|----------|-------|
| Code infrastructure | English | React components, Firebase functions, utility code, git, technical comments |
| Domain model | Spanish | Schema field names, enum values, data labels, validation messages, EFICINE/IMCINE terms |
| UI + Generated docs | Spanish | 100% Mexican Spanish — labels, buttons, errors, tooltips, AI prompts, PDF output |

### Protected Terminology
EFICINE/IMCINE terms are **never translated** — they retain their Spanish form even in English code comments. Examples: ERPI, presupuesto desglosado, flujo de efectivo, esquema financiero, cesión de derechos, ruta crítica, cuartilla, jornada.

### Formatting Rules
- **Currency:** `$X,XXX,XXX MXN` (comma thousands, no decimals, peso sign, MXN suffix)
- **Dates:** `15 de julio de 2026` or `Agosto 2026` (never ISO, never English months)
- **Percentages:** `20%` with explicit context (`el 20% del presupuesto total`)

## Schema Conventions

### JSON Schema Files (`schemas/`)
- **Standard:** JSON Schema draft-07
- **Field naming:** Spanish, matching EFICINE document terminology
  - `titulo_proyecto` (not `project_title`)
  - `monto_solicitado_eficine_mxn` (not `eficine_requested_amount`)
- **Descriptions:** Bilingual — technical context in English for developers, user-facing text in Spanish
- **Enums:** Spanish EFICINE terms exactly as published in Lineamientos
  - `["Ficción", "Documental", "Animación"]`
  - `["Efectivo", "Especie"]`
  - `["Preproducción", "Producción (Rodaje)", "Postproducción"]`
- **Validation:** Embedded in schema via `minimum`, `maximum`, `maxLength`, `enum`, `pattern`
- **Cross-references:** Documented via `description` fields pointing to related schemas/rules

### Schema Organization
- One file per EFICINE section (A through E) + one for export rules
- Nested objects mirror EFICINE document hierarchy (e.g., `a9_presupuesto.a9a_resumen`)
- Required fields specified at each level
- Validation rules embedded where possible, cross-module rules in `references/validation_rules.md`

## AI Prompt Conventions (`prompts/`)

- **Language:** 100% Spanish (system prompt, user data, format instructions, output)
- **Variable injection:** `{{variable}}` placeholders replaced at runtime by app code
- **Mandatory suffix:** Every prompt appends the language guardrail block from `politica_idioma.md`
- **Structure:** Each prompt follows a 7-part pattern:
  1. ROL (persona definition in Spanish)
  2. CONTEXTO EFICINE (requirement citation from Lineamientos)
  3. CRITERIOS DE EVALUACIÓN (what evaluators look for)
  4. DATOS DEL PROYECTO (injected project data)
  5. INSTRUCCIONES DE FORMATO (max length, structure, required elements)
  6. GUARDARRAÍLES DE IDIOMA (explicit Spanish language reminder)
  7. EJEMPLO DE TONO (model fragment of expected register)
- **Execution order:** Sequential — each prompt depends on outputs from prior passes

## Planned Code Conventions

### Component Naming (React)
- English PascalCase for components: `BudgetSummary`, `ScreenplayParser`, `ValidationEngine`
- English camelCase for functions: `calculatePercentage`, `validateDateRange`

### Error Handling
- User-facing errors in Spanish with context: `"El monto de EFICINE no puede exceder el 80% del costo total"`
- Validation errors classified as BLOCKER (stops export) or WARNING (flagged but exportable)
- Traffic light UI: 🟢 complete, 🟡 needs attention, 🔴 missing/blocking

### Data Flow
- Firestore as single source of truth
- Real-time validation on data entry (not just at export)
- One-click regeneration when upstream data changes
- Document versioning via timestamps in `generated/{docId}`

## Git Conventions
- **Commits:** English
- **Branch naming:** TBD (not yet established)
- **PR descriptions:** English
