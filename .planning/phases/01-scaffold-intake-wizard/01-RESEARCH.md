# Phase 1: Scaffold + Intake Wizard - Research

**Researched:** 2026-03-21
**Domain:** React + Firebase SPA scaffold with multi-screen Spanish-language intake wizard
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield React + Firebase project scaffold with a 5-screen Spanish-language intake wizard, a project dashboard, shared ERPI settings, and persistent Firestore storage. The stack is fully decided (React 19, Vite 8, Tailwind 4.2, shadcn/ui, Firebase 12.11, Zod 4.3, React Hook Form 7.x, Zustand 5.x, TanStack Query 5.x). All versions have been verified against npm registry as of 2026-03-21.

The critical architectural decisions for Phase 1 center on: (1) establishing single-source-of-truth data patterns in Firestore that prevent financial reconciliation failures downstream, (2) building the auto-save with debounce pattern for a Notion-like editing experience, (3) implementing the shared ERPI settings model separate from per-project data, and (4) setting up the PDF viewer for the screenplay side-by-side view. No authentication is needed (internal single-user tool).

**Primary recommendation:** Build the Firestore data model first with Zod schemas as the single source of truth, then layer the wizard UI on top using React Hook Form + shadcn/ui. Use integer arithmetic (centavos) for all financial calculations from day one.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Free navigation -- all 5 screens accessible anytime via persistent left sidebar. No sequential locking.
- **D-02:** Sidebar shows all 5 wizard screens with traffic light status icons per screen (green complete, yellow partial, red has errors).
- **D-03:** Auto-save with debounce to Firestore as user types. No save button. Like Notion.
- **D-04:** Project cards layout -- one card per project showing: title + genre + period, overall completion %, validation status (blocker/warning counts), budget + EFICINE amount, readiness score, and days until target period closes.
- **D-05:** Projects grouped by EFICINE period under headers (e.g., "Periodo 1 (Ene-Feb 2026)").
- **D-06:** Shared ERPI data -- company info and prior EFICINE project history live in a separate "Datos ERPI" settings area. Entered once, referenced by all projects.
- **D-07:** No project limit enforced -- user can create unlimited projects.
- **D-08:** Quick create -- button creates a blank project, user lands directly in the wizard. No modal.
- **D-09:** Delete with confirmation dialog. Permanent deletion.
- **D-10:** Clone/duplicate button -- copies all project data for resubmission workflow.
- **D-11:** Dashboard is always the home screen. No auto-open of last project.
- **D-12:** Clean and minimal visual style -- Notion/Linear feel. Whitespace, subtle borders, professional.
- **D-13:** Dark mode -- system-preference-aware via Tailwind `dark:` classes.
- **D-14:** Both inline feedback and persistent compliance panel -- inline indicators below each field + always-visible right panel showing ERPI %, EFICINE %, federal %, screenwriter %, in-kind % with green/red status.
- **D-15:** Dynamic contributor list -- "+ Agregar aportante" button adds rows. Each row: name, type, amount, cash/especie. Remove with X.
- **D-16:** Format on blur -- user types raw numbers, formatting to $X,XXX,XXX MXN applies when field loses focus.
- **D-17:** Warning after blur -- EFICINE compliance violations shown after user finishes typing, not while typing.
- **D-18:** Co-production toggle reveals additional fields inline (FX rate, territorial split, IMCINE cert upload) -- no separate sub-screen.
- **D-19:** Gestor de recursos toggle -- "Tiene gestor de recursos?" switch. When on, shows fee field with 4%/5% cap indicator.
- **D-20:** In-kind contributions entered per-person on the creative team screen (Screen 3). Financial screen shows calculated total. Single source of truth is the per-person amount.
- **D-21:** Numbers only for funding breakdown -- no charts.
- **D-22:** Compliance summary panel is always visible (not collapsible) on the financial screen.
- **D-23:** Side-by-side layout -- left: PDF viewer with continuous scroll, right: parsed data in editable fields.
- **D-24:** Both aggregated and detailed view -- summary cards at top with expandable scene-level detail below.
- **D-25:** User can add missing locations/characters and remove false positives from the parsed list.
- **D-26:** Manual entry fallback -- if parser fails, show warning and let user fill all fields manually.
- **D-27:** Replace with warning on re-upload -- "Reemplazar guion borrara el analisis anterior. Continuar?" All other project data preserved.

### Claude's Discretion
- Loading skeleton design and transitions between screens
- Exact sidebar width, spacing, and typography
- Error state handling for Firestore connectivity issues
- Debounce timing for auto-save
- PDF viewer library choice and configuration
- Form field ordering within each screen (follow schema structure)
- Empty state illustrations and copy

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTK-01 | Create project with title, genre, category, duration, format, aspect ratio, languages, budget, EFICINE amount, ERPI info | Firestore data model with Zod schemas matching modulo_a.json Screen 1 fields. ERPI data from shared settings (D-06). |
| INTK-02 | Select target EFICINE registration period per project | Period selector enum: "2026-P1" (Jan 30-Feb 13) or "2026-P2" (Jul 1-Jul 15). Stored in project metadata. |
| INTK-03 | Manage up to 3 projects simultaneously with isolated data and project selector | Dashboard with project cards (D-04/D-05), Firestore `projects/{id}` collection with subcollections per project. No hard limit (D-07). |
| INTK-04 | Upload screenplay PDF and view parsed breakdown | PDF viewer (react-pdf v10) for display, side-by-side layout (D-23). Parse UI shows scenes, locations, characters, INT/EXT/DAY/NIGHT. Actual parsing logic deferred to Phase 2 -- Phase 1 builds the UI shell and manual entry capability. |
| INTK-05 | Correct/override parsed screenplay data | Editable fields in parsed data panel (D-25), add/remove locations and characters. Manual entry fallback (D-26). |
| INTK-06 | Enter creative team data per role | Team subcollection `projects/{id}/team/{memberId}`. Fields from modulo_b.json. In-kind per-person (D-20). |
| INTK-07 | Enter financial structure | Financial screen with ERPI contribution, dynamic contributor list (D-15), compliance panel (D-14/D-22), format-on-blur (D-16), gestor toggle (D-19). |
| INTK-08 | Upload supporting documents | Document upload to Firebase Storage, metadata in `projects/{id}/documents/{docId}`. Date tracking for 3-month expiration. |
| INTK-09 | Track upload status per document, show missing required uploads | Document checklist derived from export_manager.json requirements. Traffic light status per document type. |
| INTK-10 | Entire wizard UI in Mexican Spanish | Spanish locale constants file (`locales/es.ts`), all labels/buttons/placeholders/errors in Spanish per politica_idioma.md. |
| INTK-11 | International co-production flag with conditional fields | Toggle on Screen 1 or Screen 4 that reveals FX rate, territorial split, IMCINE cert upload fields inline (D-18). |
| LANG-02 | Monetary amounts formatted as $X,XXX,XXX MXN | Single `formatMXN()` utility. Integer arithmetic in centavos. Format on blur (D-16). |
| LANG-03 | Dates in Spanish format | date-fns with `es` locale. Format: "15 de julio de 2026" or "Agosto 2026". |
</phase_requirements>

## Standard Stack

### Core (Phase 1 Scope)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Stable, works with all chosen libraries |
| Vite | 8.0.1 | Build tool / dev server | CRA deprecated, Vite 8 uses Oxc transforms, sub-2s dev starts |
| TypeScript | 5.7+ | Type safety | Non-negotiable for financial/legal compliance tool |
| React Router | 7.13.1 | Client-side routing | v7 merges Remix, single package, SPA mode |
| Tailwind CSS | 4.2.2 | Utility-first CSS | Zero-config, CSS-native, dark mode via `dark:` classes |
| shadcn/ui | v4 CLI | Component library | Copies components into project, Radix primitives, Tailwind v4 compatible |
| Lucide React | 0.577.0 | Icons | Default for shadcn/ui, tree-shakeable |
| firebase | 12.11.0 | Client SDK (Firestore, Storage) | Modular/tree-shakeable API, no Auth needed for v1 |
| React Hook Form | 7.71.2 | Form state management | Uncontrolled components, fewer re-renders, Zod integration |
| @hookform/resolvers | 5.2.2 | Zod-to-RHF bridge | Connects Zod schemas to form validation |
| Zod | 4.3.6 | Schema validation | TypeScript-first, .refine() for EFICINE rules, single source of truth |
| @tanstack/react-query | 5.94.5 | Server state / Firestore caching | Manages Firestore reads, optimistic updates on save |
| Zustand | 5.0.12 | Client state | Wizard step state, active project, UI state |
| date-fns | 4.1.0 | Date formatting | `es` locale for "15 de julio de 2026" format |
| react-pdf | 10.4.1 | PDF viewer (screenplay display) | Displays PDF pages in React, continuous scroll, based on pdf.js |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | latest | Component variants | Required by shadcn/ui |
| clsx | latest | Conditional classes | Used with Tailwind + shadcn/ui |
| tailwind-merge | latest | Merge Tailwind classes | Prevents class conflicts in component composition |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-pdf (viewer) | @react-pdf-viewer/core | react-pdf is lighter, sufficient for read-only screenplay display |
| Zustand | Jotai | Either works; Zustand better for "global project state" pattern |
| date-fns | dayjs | date-fns is tree-shakeable, better TS types |
| React Hook Form | TanStack Form | RHF is battle-tested, larger ecosystem |

**Installation:**
```bash
# Initialize project
npm create vite@latest carpetify -- --template react-ts

# Core UI
npm install react-router tailwindcss @tailwindcss/vite lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui (run after project init)
npx shadcn@latest init

# Firebase
npm install firebase

# PDF Viewer (for screenplay display)
npm install react-pdf

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Data Fetching & State
npm install @tanstack/react-query zustand

# Utilities
npm install date-fns

# Dev
npm install -D firebase-tools eslint @eslint/js typescript-eslint prettier prettier-plugin-tailwindcss vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    ui/                 # shadcn/ui components (Button, Dialog, Input, etc.)
    layout/             # Shell, Sidebar, Header
    dashboard/          # ProjectCard, ProjectList, DashboardView
    wizard/             # WizardShell, screen components
      ProjectSetup.tsx          # Screen 1
      ScreenplayUpload.tsx      # Screen 2
      CreativeTeam.tsx          # Screen 3
      FinancialStructure.tsx    # Screen 4
      DocumentUpload.tsx        # Screen 5
    erpi/               # ERPISettings, ERPIForm
    common/             # CompliancePanel, TrafficLight, EmptyState
  hooks/
    useProject.ts       # Active project CRUD
    useAutoSave.ts      # Debounced Firestore persistence
    useERPI.ts          # Shared ERPI data
    useCompliance.ts    # Real-time EFICINE compliance calculations
  lib/
    firebase.ts         # Firebase app init + Firestore/Storage instances
    format.ts           # formatMXN(), formatDateES(), formatPercent()
    constants.ts        # EFICINE rules (caps, percentages, periods)
  schemas/
    project.ts          # Zod schemas for project metadata
    team.ts             # Zod schemas for team members
    financials.ts       # Zod schemas for financial structure
    screenplay.ts       # Zod schemas for parsed screenplay data
    documents.ts        # Zod schemas for uploaded document metadata
    erpi.ts             # Zod schemas for shared ERPI settings
  locales/
    es.ts               # All Spanish UI strings (labels, buttons, errors, tooltips)
  services/
    projects.ts         # Firestore CRUD for projects
    erpi.ts             # Firestore CRUD for ERPI settings
    storage.ts          # Firebase Storage upload/download helpers
  stores/
    wizardStore.ts      # Zustand: active screen, sidebar state
    appStore.ts         # Zustand: active project ID, UI preferences
  types/
    index.ts            # Shared TypeScript types derived from Zod schemas
```

### Pattern 1: Auto-Save with Debounce (Notion-like)
**What:** Form data auto-saves to Firestore as user types, with debounce to avoid excessive writes.
**When to use:** Every wizard screen form.
**Example:**
```typescript
// hooks/useAutoSave.ts
import { useCallback, useRef, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useAutoSave(
  projectId: string,
  path: string,
  debounceMs = 1500
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingRef = useRef(false);

  const save = useCallback(
    (data: Record<string, unknown>) => {
      pendingRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        const ref = doc(db, `projects/${projectId}/${path}`);
        await updateDoc(ref, { ...data, updatedAt: new Date() });
        pendingRef.current = false;
      }, debounceMs);
    },
    [projectId, path, debounceMs]
  );

  // Flush on unmount (screen navigation)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { save, isPending: pendingRef.current };
}
```

### Pattern 2: Single-Source Financial Data with Integer Arithmetic
**What:** All monetary values stored as integers (centavos). Single canonical location per financial datum. Derived values computed, never stored independently.
**When to use:** All financial fields -- budget, EFICINE amount, fees, contributions.
**Example:**
```typescript
// lib/format.ts
export function formatMXN(centavos: number): string {
  const pesos = Math.round(centavos / 100);
  return `$${pesos.toLocaleString('es-MX')} MXN`;
}

export function parseMXN(input: string): number {
  // Strip everything except digits
  const digits = input.replace(/[^0-9]/g, '');
  return parseInt(digits, 10) * 100; // Store as centavos
}
```

### Pattern 3: Spanish Locale Constants (No i18n Library)
**What:** Single `es.ts` file with all UI strings. No react-intl or i18next -- overkill for single-locale app.
**When to use:** Every UI label, button, placeholder, error message, tooltip.
**Example:**
```typescript
// locales/es.ts
export const es = {
  dashboard: {
    title: 'Mis Proyectos',
    newProject: '+ Nuevo Proyecto',
    period1: 'Periodo 1 (Ene-Feb 2026)',
    period2: 'Periodo 2 (Jul 2026)',
    readyToSubmit: 'Listo para enviar',
    missingDocs: (n: number) => `Faltan ${n} documentos`,
    blockers: (n: number) => `${n} bloqueadores`,
    daysRemaining: (n: number) => `${n} dias restantes`,
  },
  wizard: {
    screen1: 'Datos del Proyecto',
    screen2: 'Guion',
    screen3: 'Equipo Creativo',
    screen4: 'Estructura Financiera',
    screen5: 'Documentos',
  },
  // ... etc
} as const;
```

### Pattern 4: Zod Schemas as Single Source of Truth
**What:** Define Zod schemas that mirror the JSON schemas in `schemas/`. Use for form validation, Firestore document typing, and TypeScript type inference.
**When to use:** Every data structure in the app.
**Example:**
```typescript
// schemas/project.ts
import { z } from 'zod';

export const projectMetadataSchema = z.object({
  titulo_proyecto: z.string().min(1).max(100),
  categoria_cinematografica: z.enum(['Ficcion', 'Documental', 'Animacion']),
  categoria_director: z.enum(['Opera Prima', 'Segundo largometraje y subsecuentes']),
  duracion_estimada_minutos: z.number().int().min(60),
  formato_filmacion: z.string(),
  relacion_aspecto: z.string(),
  idiomas: z.array(z.string()).min(1),
  costo_total_proyecto_centavos: z.number().int().positive(),
  monto_solicitado_eficine_centavos: z.number().int().positive().max(2500000000), // $25M in centavos
  periodo_registro: z.enum(['2026-P1', '2026-P2']),
  es_coproduccion_internacional: z.boolean().default(false),
});

export type ProjectMetadata = z.infer<typeof projectMetadataSchema>;
```

### Pattern 5: Firestore Data Model
**What:** Subcollection-based model to avoid 1MB document limit and enable granular reads/writes.

```
users/
  {userId}/                     # Future-proofing, currently single user
    erpi_settings: {            # Shared ERPI data (D-06)
      razon_social, rfc, representante_legal, domicilio_fiscal,
      proyectos_previos_eficine: [...],
      apoyos_imcine_previos: [...]
    }

projects/
  {projectId}/
    metadata: {                 # Screen 1 data
      titulo_proyecto, categoria_cinematografica, categoria_director,
      duracion_estimada_minutos, formato_filmacion, relacion_aspecto,
      idiomas, costo_total_proyecto_centavos, monto_solicitado_eficine_centavos,
      periodo_registro, es_coproduccion_internacional,
      // Co-production conditional fields
      tipo_cambio_fx?, fecha_tipo_cambio?, desglose_territorial?,
      createdAt, updatedAt,
      screenplay_status: "pending" | "uploaded" | "parsed" | "error"
    }

    screenplay: {               # Screen 2 parsed data
      raw_text_hash?,
      num_paginas, num_escenas,
      escenas: [{numero, int_ext, dia_noche, locacion, personajes, complejidad}],
      locaciones: [{nombre, tipo, frecuencia}],
      personajes: [{nombre, num_escenas, es_protagonista}],
      complejidad: {stunts, vfx, agua, animales, ninos, noche_pct},
      dias_rodaje_estimados?,
      parsedAt?, uploaded_file_path?
    }

    team/
      {memberId}: {             # Screen 3 per-member
        nombre_completo, cargo, nacionalidad,
        filmografia: [{titulo, anio, cargo_en_obra, formato, exhibicion, enlace}],
        formacion, premios: [], enlaces: [],
        honorarios_centavos,
        aportacion_especie_centavos,  # In-kind per person (D-20)
        es_mujer?, es_indigena_afromexicano?,
        es_socio_erpi?  # Producer only
      }

    financials: {               # Screen 4
      aportacion_erpi_efectivo_centavos,
      aportacion_erpi_especie_centavos,
      terceros: [{nombre, tipo, monto_centavos, efectivo_o_especie}],
      monto_eficine_centavos,
      tiene_gestor, gestor_nombre?, gestor_monto_centavos?,
      // Computed (derived from team + above, never independently entered):
      total_especie_honorarios_centavos,
      // Co-production fields:
      tipo_cambio_fx?, desglose_territorial?
    }

    documents/
      {docId}: {                # Screen 5 uploaded docs
        tipo,                   # e.g., "acta_constitutiva", "indautor", "seguro"
        filename,
        storagePath,
        uploadedAt,
        fecha_emision?,         # Issue date for 3-month expiration tracking
        status: "uploaded" | "verified" | "expired"
      }
```

### Anti-Patterns to Avoid

- **Storing ERPI data inside each project:** ERPI is shared across all projects. Store once, reference everywhere. Duplication causes inconsistency.
- **Floating-point arithmetic for money:** Use integer centavos. `0.1 + 0.2 !== 0.3` in JavaScript. A $1 difference in the golden equation = rejection.
- **Duplicating financial totals:** The total budget lives in `metadata.costo_total_proyecto_centavos`. Compliance percentages are always computed from this single number, never stored independently.
- **English text in UI components:** Even developer-facing placeholders in JSX must be Spanish. Use the `es.ts` constants file for everything the user sees.
- **Sequential wizard locking:** Decision D-01 explicitly requires free navigation. All screens accessible from sidebar at all times.
- **Save buttons:** Decision D-03 requires auto-save on debounce. The only user indication is a subtle "Guardando..." / "Guardado" status indicator.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF display in browser | Custom canvas rendering | react-pdf v10 (wojtekmaj/react-pdf) | Handles pdf.js worker, page rendering, continuous scroll |
| Form state + validation | Custom useState per field | React Hook Form + Zod | Uncontrolled components, declarative validation, less re-renders |
| Component primitives | Custom dialogs, dropdowns, tabs | shadcn/ui (Radix-based) | Accessible, keyboard-navigable, dark mode compatible |
| Date formatting in Spanish | Custom string concatenation | date-fns with `es` locale | Handles locale-aware month names, ordinals, edge cases |
| Dark mode toggle | Custom CSS variable system | Tailwind `dark:` + system preference detection | Built-in with Tailwind v4, class-based toggling |
| File upload handling | Raw input[type=file] + fetch | Firebase Storage SDK + shadcn/ui file input | Handles resumable uploads, progress tracking, error recovery |
| Debounced auto-save | Naive setTimeout | Custom hook with useCallback + cleanup | Pattern is simple but must handle unmount, screen transitions, and concurrent saves |

## Common Pitfalls

### Pitfall 1: Financial Rounding Cascade
**What goes wrong:** JavaScript floating-point arithmetic causes budget total, cash flow total, esquema financiero total, and presupuesto to differ by $1-$100 MXN. EFICINE rejects any discrepancy.
**Why it happens:** `0.1 + 0.2 !== 0.3` in JS. Rounding at different stages creates drift.
**How to avoid:** Use integer arithmetic in centavos from day one. Round only at the display layer (`formatMXN()`). The golden equation (4-way total match) must be structurally impossible to violate because all totals derive from the same source numbers.
**Warning signs:** Any financial field stored as a float, any place where a total is computed independently rather than derived from the canonical source.

### Pitfall 2: Title Stored in Multiple Places
**What goes wrong:** Project title appears in 12+ documents. Any character difference (accent, capitalization, spelling) triggers rejection.
**Why it happens:** Title gets copied into multiple Firestore fields, AI prompts, generated docs. Each copy can diverge.
**How to avoid:** Store `titulo_proyecto` ONCE in `projects/{id}/metadata`. Every other usage reads from this single field. File naming sanitization (no accents, 15 chars) is a SEPARATE computed value, never the display title.
**Warning signs:** Any Firestore field that duplicates the title rather than referencing the canonical one.

### Pitfall 3: In-Kind Double-Counting
**What goes wrong:** In-kind contributions counted as both expense AND separate funding source, inflating total budget and breaking percentage calculations.
**Why it happens:** In-kind occupies both sides: it is part of the fee (expense) AND a funding source. Confusing data model leads to double-counting.
**How to avoid:** Per decision D-20, in-kind is entered per-person on Screen 3. The financial screen shows the CALCULATED total. Each team member has `honorarios_centavos` (full fee, appears in budget) and `aportacion_especie_centavos` (in-kind portion, appears in esquema financiero as funding source). Budget total = sum of all expenses (including full fees). In-kind does NOT increase the budget total.
**Warning signs:** `total_budget !== sum_of_all_funding_sources`. If these diverge, in-kind is being handled wrong.

### Pitfall 4: Auto-Save Race Conditions
**What goes wrong:** User types fast, switches screens before debounce fires, data lost. Or two screens save simultaneously and overwrite each other.
**Why it happens:** Debounced saves are async. Screen transitions can interrupt pending saves. Firestore `updateDoc` on the same document from two tabs can cause overwrites.
**How to avoid:** (1) Flush pending saves on screen unmount. (2) Each screen writes to its own Firestore path (metadata, screenplay, financials) -- no cross-screen writes to the same document. (3) Use `updateDoc` with specific fields, never full document overwrites.
**Warning signs:** Data disappearing after quick screen switches. Timestamps showing unexpected overwrite patterns.

### Pitfall 5: Compliance Panel Showing Stale Percentages
**What goes wrong:** The always-visible compliance panel (D-14/D-22) shows percentages that don't match current field values because the computation is not reactive.
**Why it happens:** Panel reads from Firestore (which lags behind debounce) instead of from current form state.
**How to avoid:** The compliance panel must compute from CURRENT FORM VALUES (React Hook Form watch()), not from Firestore. Firestore is the persistence layer; the UI reads from form state for real-time calculations. After save completes, both sources agree.
**Warning signs:** Compliance panel values changing only after a delay rather than immediately on keystroke.

### Pitfall 6: Missing ERPI Data Reference in Projects
**What goes wrong:** ERPI data (razon social, RFC, etc.) is needed in project metadata for validation and display, but the shared ERPI settings area is disconnected from per-project data.
**Why it happens:** ERPI data lives in a separate Firestore document (D-06). Projects need to reference it for the compliance panel (ERPI name in generated docs, RFC for validation).
**How to avoid:** Each project stores a reference to the ERPI settings (not a copy). The UI reads ERPI data from the shared settings document. When ERPI data changes, all projects automatically reflect the change because they reference the same source.
**Warning signs:** ERPI company name differing between the settings area and project-level displays.

## Code Examples

### MXN Amount Formatting
```typescript
// lib/format.ts
// Source: CLAUDE.md rule 3 + politica_idioma.md

export function formatMXN(centavos: number): string {
  const pesos = Math.round(centavos / 100);
  return `$${pesos.toLocaleString('es-MX')} MXN`;
}

export function parseMXNInput(input: string): number {
  // Strip formatting, return centavos
  const cleaned = input.replace(/[$,\sMXN]/g, '');
  const pesos = parseInt(cleaned, 10);
  if (isNaN(pesos)) return 0;
  return pesos * 100;
}

// Format-on-blur pattern (D-16)
function handleBlur(e: React.FocusEvent<HTMLInputElement>, onChange: (v: number) => void) {
  const centavos = parseMXNInput(e.target.value);
  onChange(centavos);
  e.target.value = formatMXN(centavos);
}
```

### Spanish Date Formatting
```typescript
// lib/format.ts
// Source: CLAUDE.md rule 4 + politica_idioma.md
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDateES(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  // Output: "15 de julio de 2026"
}

export function formatMonthYearES(date: Date): string {
  return format(date, "MMMM yyyy", { locale: es });
  // Output: "Agosto 2026" (capitalize first letter manually if needed)
}
```

### EFICINE Compliance Calculator
```typescript
// hooks/useCompliance.ts
// Source: validation_rules.md rules 1.2, 1.4, 1.5

interface ComplianceResult {
  erpiPct: number;
  eficinePct: number;
  federalPct: number;
  screenwriterPct: number;
  inkindPct: number;
  gestorPct: number;
  violations: { rule: string; message: string; severity: 'blocker' | 'warning' }[];
}

export function calculateCompliance(
  totalBudgetCentavos: number,
  erpiCashCentavos: number,
  erpiInkindCentavos: number,
  thirdPartyCentavos: number, // donations that count toward ERPI's 20%
  eficineCentavos: number,
  otherFederalCentavos: number,
  screenwriterFeeCentavos: number,
  totalInkindHonorariosCentavos: number,
  gestorFeeCentavos: number
): ComplianceResult {
  const total = totalBudgetCentavos;
  if (total === 0) return emptyResult();

  const erpiTotal = erpiCashCentavos + erpiInkindCentavos + thirdPartyCentavos;
  const erpiPct = (erpiTotal / total) * 100;
  const eficinePct = (eficineCentavos / total) * 100;
  const federalPct = ((eficineCentavos + otherFederalCentavos) / total) * 100;
  const screenwriterPct = (screenwriterFeeCentavos / total) * 100;
  const inkindPct = (totalInkindHonorariosCentavos / total) * 100;

  const gestorCap = eficineCentavos > 1000000000 ? 0.04 : 0.05; // $10M threshold
  const gestorPct = eficineCentavos > 0 ? (gestorFeeCentavos / eficineCentavos) * 100 : 0;

  const violations: ComplianceResult['violations'] = [];

  if (erpiPct < 20) violations.push({
    rule: '1.2', message: `ERPI debe aportar minimo 20%. Actual: ${erpiPct.toFixed(1)}%`, severity: 'blocker'
  });
  if (eficinePct > 80) violations.push({
    rule: '1.2', message: `EFICINE no puede exceder 80%. Actual: ${eficinePct.toFixed(1)}%`, severity: 'blocker'
  });
  if (eficineCentavos > 2500000000) violations.push({
    rule: '1.2', message: `EFICINE no puede exceder $25,000,000 MXN`, severity: 'blocker'
  });
  if (federalPct > 80) violations.push({
    rule: '1.2', message: `Recursos federales no pueden exceder 80%. Actual: ${federalPct.toFixed(1)}%`, severity: 'blocker'
  });
  if (screenwriterPct < 3) violations.push({
    rule: '1.3', message: `Honorarios de guionista deben ser minimo 3% del costo total (con IVA). Actual: ${screenwriterPct.toFixed(1)}%`, severity: 'blocker'
  });
  if (inkindPct > 10) violations.push({
    rule: '1.4', message: `Aportaciones en especie no pueden exceder 10%. Actual: ${inkindPct.toFixed(1)}%`, severity: 'blocker'
  });
  if (gestorPct > gestorCap * 100) violations.push({
    rule: '1.5', message: `Gestor excede el ${(gestorCap * 100).toFixed(0)}% permitido. Actual: ${gestorPct.toFixed(1)}%`, severity: 'blocker'
  });

  return { erpiPct, eficinePct, federalPct, screenwriterPct, inkindPct, gestorPct, violations };
}
```

### PDF Viewer for Screenplay (Side-by-Side)
```typescript
// components/wizard/ScreenplayViewer.tsx
// Using react-pdf v10 for continuous scroll PDF display
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function ScreenplayViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);

  return (
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      loading={<ScreenplaySkeleton />}
    >
      {Array.from({ length: numPages }, (_, i) => (
        <Page key={i + 1} pageNumber={i + 1} width={500} />
      ))}
    </Document>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite 8 with Oxc transforms | CRA deprecated 2023, Vite 8 released late 2025 | Sub-2s dev starts, no Babel |
| Tailwind v3 (PostCSS) | Tailwind v4 (CSS-native, zero-config) | Jan 2025 | No tailwind.config.js, @property for dark mode |
| React Router v6 | React Router v7 (merged Remix) | Late 2025 | Single package, SPA mode, no react-router-dom |
| Zod 3.x | Zod 4.3 | 2025 | Better error messages, faster parsing |
| Firebase v9 compat | Firebase v12 modular | Incremental upgrades | Tree-shakeable, smaller bundles |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` (Wave 0 -- create with Vite integration) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTK-01 | Create project with all required fields | unit | `npx vitest run src/schemas/__tests__/project.test.ts -t "project metadata validation"` | Wave 0 |
| INTK-02 | Period selection enum validation | unit | `npx vitest run src/schemas/__tests__/project.test.ts -t "period selection"` | Wave 0 |
| INTK-03 | Multiple projects isolated in Firestore | integration | `npx vitest run src/services/__tests__/projects.test.ts` | Wave 0 |
| INTK-06 | Team member CRUD with required fields | unit | `npx vitest run src/schemas/__tests__/team.test.ts` | Wave 0 |
| INTK-07 | Financial compliance calculations correct | unit | `npx vitest run src/hooks/__tests__/useCompliance.test.ts` | Wave 0 |
| INTK-10 | All UI strings are Spanish (no English) | unit | `npx vitest run src/locales/__tests__/es.test.ts` | Wave 0 |
| INTK-11 | Co-production toggle adds/removes fields | unit | `npx vitest run src/schemas/__tests__/project.test.ts -t "coprod"` | Wave 0 |
| LANG-02 | MXN formatting: $X,XXX,XXX MXN | unit | `npx vitest run src/lib/__tests__/format.test.ts -t "formatMXN"` | Wave 0 |
| LANG-03 | Spanish date formatting | unit | `npx vitest run src/lib/__tests__/format.test.ts -t "formatDate"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest config with Vite integration
- [ ] `src/lib/__tests__/format.test.ts` -- formatMXN, parseMXNInput, formatDateES tests
- [ ] `src/schemas/__tests__/project.test.ts` -- Zod schema validation tests
- [ ] `src/schemas/__tests__/team.test.ts` -- Team member schema tests
- [ ] `src/hooks/__tests__/useCompliance.test.ts` -- EFICINE compliance calculator tests
- [ ] `src/locales/__tests__/es.test.ts` -- Verify no English strings in locale file
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`

## Open Questions

1. **react-pdf worker configuration with Vite 8**
   - What we know: react-pdf v10 requires pdf.js worker. Vite handles web workers differently than webpack.
   - What's unclear: Exact worker configuration needed for Vite 8 + react-pdf 10. May need `?worker` import or manual worker setup.
   - Recommendation: Test during implementation. If issues arise, use the CDN-hosted worker as fallback: `pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@VERSION/build/pdf.worker.min.mjs'`.

2. **shadcn/ui v4 + Tailwind v4 compatibility**
   - What we know: shadcn/ui v4 CLI was released to support Tailwind v4. The init command should work.
   - What's unclear: Whether all components work perfectly with Tailwind v4's CSS-native approach (no tailwind.config.js).
   - Recommendation: Run `npx shadcn@latest init` early and verify a few components render correctly before building all screens.

3. **Firestore offline persistence for auto-save**
   - What we know: Firestore has offline persistence that queues writes when offline.
   - What's unclear: Whether enabling persistence causes issues with the auto-save debounce pattern (e.g., stale reads during reconnection).
   - Recommendation: Enable Firestore persistence (`enableIndexedDbPersistence`) for resilience, but test the auto-save flow with simulated offline/online transitions.

## Sources

### Primary (HIGH confidence)
- `directives/app_spec.md` -- Phase 1 intake screen field lists, architecture, document map
- `directives/politica_idioma.md` -- Language policy, protected terms, UI Spanish rules, formatting rules
- `schemas/modulo_a.json` through `schemas/export_manager.json` -- Firestore data model fields
- `references/validation_rules.md` -- 13 cross-module validation rules (rules 1.2-1.5, 5, 6 relevant to Phase 1 intake-time validation)
- `.planning/research/STACK.md` -- Technology choices with versions
- `.planning/research/ARCHITECTURE.md` -- Component boundaries, Firestore data model, build order
- `.planning/research/PITFALLS.md` -- Financial rounding, title consistency, in-kind double-counting
- npm registry (2026-03-21) -- All package versions verified against current published versions

### Secondary (MEDIUM confidence)
- [react-pdf npm](https://www.npmjs.com/package/react-pdf) -- PDF viewer for screenplay display
- [How to build a React PDF viewer with react-pdf (2026)](https://www.nutrient.io/blog/how-to-build-a-reactjs-pdf-viewer-with-react-pdf/) -- react-pdf usage patterns

### Tertiary (LOW confidence)
- react-pdf + Vite 8 worker configuration -- needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, stack decided in prior research
- Architecture: HIGH -- Firestore data model derived from JSON schemas and CONTEXT.md decisions
- Pitfalls: HIGH -- financial rounding and title consistency are domain-specific risks documented in project specs

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- stable stack, no fast-moving dependencies)
