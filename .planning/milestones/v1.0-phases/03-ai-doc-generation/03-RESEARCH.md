# Phase 3: AI Document Generation Pipeline - Research

**Researched:** 2026-03-22
**Domain:** LLM-powered document generation pipeline with Firebase Cloud Functions, Anthropic Claude API, Firestore structured storage, and staleness tracking
**Confidence:** HIGH

## Summary

This phase builds the core AI document generation engine: 4 sequential passes (Line Producer, Finance Advisor, Legal, Combined) that produce ~20 structured documents from screenplay analysis and project intake data. The critical architectural challenge is orchestrating long-running, sequential AI calls on Firebase Cloud Functions v2 with real-time progress streaming to the client, while enforcing deterministic financial injection (AI never invents monetary figures) and maintaining cross-document consistency.

The project already has a solid foundation from Phase 1: React 19 + Vite 8 frontend, Firestore data layer with Zod schemas for project metadata, team members, financials, ERPI settings, screenplay data, and uploaded documents. All monetary values use integer centavos arithmetic with `formatMXN` at the display layer. Phase 2 (screenplay processing) provides the screenplay analysis output that feeds into this pipeline. The `functions/` directory does not yet exist -- this phase must scaffold Firebase Cloud Functions v2 from scratch.

**Primary recommendation:** Use Firebase Cloud Functions v2 streaming callable functions (`onCall` with `sendChunk`) for real-time progress. Each AI pass is one Cloud Function invocation (not task queue), with 60-minute HTTP callable timeout providing ample headroom. Store generated documents as structured JSON in Firestore subcollections (`projects/{id}/generated/{docId}`), with a dependency graph metadata document tracking staleness. Use Anthropic Claude API with structured outputs (Zod schemas via `output_config`) to guarantee parseable JSON responses for financial/tabular documents, and plain text for prose documents.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AIGEN-01 | Line Producer pass generates A7, A8a, A8b, A9a, A9b | Prompt files exist in `prompts/`. Cloud Function with streaming callable handles execution. Budget uses IMCINE account structure 100-1200 with crew rate tables from `a9_presupuesto.md`. |
| AIGEN-02 | Finance Advisor pass generates A9d/FORMATO 3, E1/FORMATO 9, E2/FORMATO 10 | `documentos_financieros.md` prompt covers all three. Financial figures injected deterministically from Line Producer budget output + intake financials. |
| AIGEN-03 | Legal pass generates C2b, B3 (producer + director contracts), C3a/FORMATO 6, C3b/FORMATO 7 | `documentos_legales.md` prompt covers all. Fee amounts injected from budget, never AI-generated. |
| AIGEN-04 | Combined pass generates A1/FORMATO 1, A2, A6/FORMATO 2, A10, C4/FORMATO 8, A11 bonus assessment | `documentos_combinados.md` + individual prompts (`a1_resumen_ejecutivo.md`, `a2_sinopsis.md`, `a10_propuesta_exhibicion.md`). Depends on all prior pass outputs. |
| AIGEN-05 | All AI prompts loaded from `prompts/` folder with `{{variable}}` substitution | Template engine needed. Prompts are pre-written in Spanish -- code reads `.md` files and substitutes variables. |
| AIGEN-06 | Monetary values deterministically injected, AI never calculates financial figures | Architecture pattern: separate financial computation module (pure TypeScript functions) from AI prose generation. Financial data passed as pre-computed variables. |
| AIGEN-07 | Budget uses IMCINE standard account structure (100-1200) with Mexican market crew rates | Rate tables defined in `a9_presupuesto.md` prompt. Budget computation logic in Cloud Function, rates as configuration data. |
| AIGEN-08 | Generated documents stored as structured data in Firestore, viewable in UI | Firestore subcollection `projects/{id}/generated/{docId}` with structured content fields. Frontend document viewer component. |
| AIGEN-09 | Changing upstream data marks downstream documents as stale | Dependency graph stored in Firestore. `onUpdate` trigger or client-side logic compares timestamps to detect staleness. |
| AIGEN-10 | One-click regeneration of stale documents | Frontend triggers re-run of affected pipeline passes. Cloud Function accepts partial pipeline execution (e.g., re-run pass 3+4 if pass 2 output changed). |
| AIGEN-11 | Pitch para contribuyentes document generation | Covered by `documentos_combinados.md` prompt. Not evaluated by IMCINE but generated in Combined pass. |
| LANG-01 | All generated documents use Mexican Spanish with EFICINE terminology | Language guardrail block appended to every prompt per `politica_idioma.md`. Prompts already 100% Spanish. |
| LANG-04 | Generated prose uses formal non-bureaucratic Mexican Spanish | Prose guidelines embedded in each prompt's `INSTRUCCION DE IDIOMA OBLIGATORIA` section. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-functions | 7.2.2 | Cloud Functions v2 runtime with streaming callable support | Required for Firebase callable functions with `sendChunk` streaming |
| firebase-admin | 13.7.0 | Server-side Firestore/Storage access from Cloud Functions | Required for server-side Firebase operations |
| @anthropic-ai/sdk | 0.80.0 | Anthropic Claude API client with streaming and structured outputs | Official TypeScript SDK, supports `messages.create`, `messages.stream`, `messages.parse` with Zod schemas |
| zod | 4.3.6 | Schema validation for structured AI outputs and shared types | Already used in frontend; share schemas between frontend and functions via a common package or direct import |
| firebase (client SDK) | 12.11.0 | Client-side callable function invocation with streaming | Already installed; provides `httpsCallable` and streaming `.stream()` method |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| handlebars | 4.7.8 | Template engine for `{{variable}}` substitution in prompts | Simple, well-known mustache-style templating matching the existing `{{variable}}` convention in prompt files |
| gray-matter | 4.0.3 | Parse front-matter from prompt `.md` files (optional) | Only if prompts need metadata headers; current prompts are plain markdown |
| date-fns | 4.1.0 | Date formatting in Spanish for generated documents | Already installed in frontend; use same version in functions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| handlebars | Simple string replace | Handlebars handles conditionals (`{{#if}}`, `{{#each}}`) needed in prompts like `documentos_combinados.md` which has `{{#si_es_animacion}}` and `{{#si_es_documental}}` blocks |
| Firebase Cloud Functions streaming | Firestore real-time listeners for progress | Streaming callable is purpose-built for this; Firestore listeners add read costs and complexity |
| Task Queue for pipeline | Single callable per pass | Task queues add complexity (Cloud Tasks setup, separate queue config) without benefit -- each pass is 30-120 seconds, well within callable timeout |

**Installation (functions directory):**
```bash
cd functions
npm init -y
npm install firebase-functions firebase-admin @anthropic-ai/sdk zod handlebars date-fns
npm install -D typescript @types/node
```

**Installation (frontend -- already present, no new packages needed):**
No new frontend packages required. The Firebase client SDK's `httpsCallable` with streaming is already available in `firebase@12.11.0`.

## Architecture Patterns

### Recommended Project Structure
```
functions/
  src/
    index.ts                    # Cloud Function exports
    pipeline/
      orchestrator.ts           # Pipeline execution coordinator
      passes/
        lineProducer.ts         # Pass 1: A7, A8a, A8b, A9a, A9b
        financeAdvisor.ts       # Pass 2: A9d, E1, E2
        legal.ts                # Pass 3: C2b, B3, C3a, C3b
        combined.ts             # Pass 4: A1, A2, A6, A10, C4, A11, pitch
      promptLoader.ts           # Reads .md files + handlebars substitution
      documentStore.ts          # Writes generated docs to Firestore
    financial/
      budgetComputer.ts         # Deterministic budget calculation (pure math)
      ratesTables.ts            # IMCINE account structure + Mexican crew rates
      cashFlowBuilder.ts        # Flujo de efectivo matrix computation
      financialScheme.ts        # Esquema financiero computation
    staleness/
      dependencyGraph.ts        # Document dependency definitions
      stalenessTracker.ts       # Mark stale, check freshness
    claude/
      client.ts                 # Anthropic API wrapper with retry + error handling
      schemas.ts                # Zod schemas for structured AI outputs
    shared/
      formatters.ts             # MXN formatting, date formatting (mirror frontend)
      types.ts                  # Shared types for generated documents
  package.json
  tsconfig.json

src/
  components/
    generation/
      PipelineControl.tsx       # "Generar carpeta" button + progress UI
      PipelineProgress.tsx      # Real-time pass-by-pass progress display
      DocumentViewer.tsx        # View generated document content
      StalenessIndicator.tsx    # Shows which docs are stale
      RegenerateButton.tsx      # One-click regeneration trigger
  services/
    generation.ts               # Client-side callable function wrappers
  hooks/
    useGeneration.ts            # Hook for pipeline invocation with streaming
    useStaleness.ts             # Hook for staleness detection via Firestore listener
  stores/
    generationStore.ts          # Zustand store for generation state
```

### Pattern 1: Streaming Callable Function (Pipeline Orchestrator)

**What:** A single Cloud Function per pipeline pass that streams progress chunks to the client.

**When to use:** For each of the 4 AI passes (Line Producer, Finance, Legal, Combined).

**Server-side example:**
```typescript
// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "us-central1" });

export const runLineProducerPass = onCall(
  {
    timeoutSeconds: 300,    // 5 minutes per pass
    memory: "1GiB",
    secrets: ["ANTHROPIC_API_KEY"],
  },
  async (request) => {
    const { projectId } = request.data;
    if (!projectId) throw new HttpsError("invalid-argument", "projectId required");

    const projectData = await loadProjectData(projectId);
    const screenplayAnalysis = await loadScreenplayAnalysis(projectId);

    // Generate each document in the pass
    const docs = ["A7", "A8a", "A8b", "A9a", "A9b"];
    const results: Record<string, unknown> = {};

    for (const docId of docs) {
      if (request.acceptsStreaming) {
        request.sendChunk({ status: "generating", docId, progress: `Generando ${docId}...` });
      }

      const content = await generateDocument(docId, projectData, screenplayAnalysis);
      await storeGeneratedDocument(projectId, docId, content);
      results[docId] = { status: "complete" };

      if (request.acceptsStreaming) {
        request.sendChunk({ status: "complete", docId });
      }
    }

    // Update staleness metadata
    await updateDependencyTimestamps(projectId, "lineProducer");

    return { success: true, documents: Object.keys(results) };
  }
);
```

**Client-side example:**
```typescript
// src/services/generation.ts
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

export async function runPass(passName: string, projectId: string, onProgress: (chunk: any) => void) {
  const fn = httpsCallable(functions, `run${passName}Pass`);
  const { stream, data } = await fn.stream({ projectId });

  for await (const chunk of stream) {
    onProgress(chunk);
  }

  return await data;
}
```

### Pattern 2: Deterministic Financial Injection

**What:** Financial figures are computed by pure TypeScript functions, NEVER generated by AI. The AI receives pre-computed amounts as template variables.

**When to use:** Budget (A9a, A9b), cash flow (A9d), esquema financiero (E1), contracts (B3, C2b) -- any document containing monetary values.

**Example:**
```typescript
// functions/src/financial/budgetComputer.ts
import { formatMXN } from "../shared/formatters";

interface BudgetInput {
  jornadas: number;
  locaciones: LocationData[];
  equipo: TeamMemberData[];
  costoTotalCentavos: number;
}

interface BudgetOutput {
  cuentas: BudgetAccount[];
  totalCentavos: number;
  totalFormatted: string; // "$18,500,000 MXN"
}

export function computeBudget(input: BudgetInput): BudgetOutput {
  // Pure math -- no AI involved
  const cuentas = computeAccountStructure(input);
  const total = cuentas.reduce((sum, c) => sum + c.subtotalCentavos, 0);

  return {
    cuentas,
    totalCentavos: total,
    totalFormatted: formatMXN(total),
  };
}

// Then in the prompt:
// "PRESUPUESTO TOTAL: {{totalFormatted}}"
// The AI writes prose AROUND the numbers but never generates them
```

### Pattern 3: Staleness Tracking via Dependency Graph

**What:** A metadata document in Firestore tracks generation timestamps and upstream data timestamps. When upstream changes, downstream documents are flagged stale.

**When to use:** AIGEN-09 and AIGEN-10 -- any time intake data, screenplay reparse, or a prior pass is regenerated.

**Example:**
```typescript
// Firestore document: projects/{id}/meta/generation_state
interface GenerationState {
  passes: {
    lineProducer: { generatedAt: Timestamp | null; inputHash: string };
    financeAdvisor: { generatedAt: Timestamp | null; inputHash: string };
    legal: { generatedAt: Timestamp | null; inputHash: string };
    combined: { generatedAt: Timestamp | null; inputHash: string };
  };
  upstreamTimestamps: {
    metadata: Timestamp;       // project metadata last changed
    screenplay: Timestamp;     // screenplay analysis last changed
    team: Timestamp;           // team members last changed
    financials: Timestamp;     // financial structure last changed
    erpi: Timestamp;           // ERPI settings last changed
  };
}

// Dependency graph (static, in code)
const PASS_DEPENDENCIES = {
  lineProducer: ["metadata", "screenplay"],
  financeAdvisor: ["lineProducer", "financials"],
  legal: ["lineProducer", "metadata", "team"],
  combined: ["lineProducer", "financeAdvisor", "legal", "metadata", "screenplay", "team"],
} as const;

function getStaleDocuments(state: GenerationState): string[] {
  const stale: string[] = [];
  for (const [pass, deps] of Object.entries(PASS_DEPENDENCIES)) {
    const passState = state.passes[pass as keyof typeof state.passes];
    if (!passState.generatedAt) { stale.push(pass); continue; }

    for (const dep of deps) {
      // Check if dependency is a pass or an upstream data source
      const depTimestamp = dep in state.passes
        ? state.passes[dep as keyof typeof state.passes].generatedAt
        : state.upstreamTimestamps[dep as keyof typeof state.upstreamTimestamps];

      if (depTimestamp && depTimestamp > passState.generatedAt) {
        stale.push(pass);
        break;
      }
    }
  }
  return stale;
}
```

### Pattern 4: Prompt Loading with Handlebars

**What:** Load prompt `.md` files from the `prompts/` directory and substitute `{{variable}}` placeholders with project data.

**When to use:** AIGEN-05 -- all AI calls.

**Example:**
```typescript
// functions/src/pipeline/promptLoader.ts
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import { join } from "path";

const LANGUAGE_GUARDRAIL = `
INSTRUCCION DE IDIOMA OBLIGATORIA:
- Escribe EXCLUSIVAMENTE en espanol mexicano profesional.
- Usa la terminologia oficial de IMCINE y EFICINE sin traducir.
- Los montos van en pesos mexicanos con formato: $X,XXX,XXX MXN.
- Las fechas van en formato: "15 de julio de 2026" o "Agosto 2026".
- NO uses anglicismos innecesarios.
- El tono es profesional, directo y concreto.
`;

export function loadPrompt(promptFile: string, variables: Record<string, unknown>): string {
  const rawContent = readFileSync(join(__dirname, "../../prompts", promptFile), "utf-8");
  const template = Handlebars.compile(rawContent);
  const rendered = template(variables);
  return rendered; // Language guardrail already in each prompt file
}
```

### Pattern 5: Structured Output for Tabular Documents

**What:** Use Anthropic's structured outputs (`output_config` with Zod) for documents that need parseable JSON (budget tables, financial matrices), and plain text for prose documents.

**When to use:** A9a (budget summary), A9b (budget detail), A9d (cash flow matrix), E1 (esquema financiero) -- any document with structured tabular data. Use plain text for A7 (propuesta produccion), A2 (sinopsis), contracts.

**Example:**
```typescript
// Structured output for budget summary
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const BudgetAccountSchema = z.object({
  numero_cuenta: z.number(),
  nombre_cuenta: z.string(),
  subcuentas: z.array(z.object({
    concepto: z.string(),
    unidad: z.string(),
    cantidad: z.number(),
    costo_unitario_centavos: z.number(),
    subtotal_centavos: z.number(),
  })),
  subtotal_centavos: z.number(),
});

const BudgetResponseSchema = z.object({
  cuentas: z.array(BudgetAccountSchema),
  total_centavos: z.number(),
  notas: z.string().optional(),
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.parse({
  model: "claude-sonnet-4-5",  // Cost-effective for structured data
  max_tokens: 16000,
  system: loadPrompt("a9_presupuesto.md", projectData),
  messages: [{ role: "user", content: "Genera el presupuesto resumen y desglose." }],
  output_config: { format: zodOutputFormat(BudgetResponseSchema) },
});

const budget = response.parsed_output; // Fully typed, guaranteed valid JSON
```

### Anti-Patterns to Avoid

- **AI calculates financial figures:** NEVER let Claude compute monetary amounts. All financial math happens in `budgetComputer.ts` and friends. The AI writes prose around pre-injected numbers.
- **Single monolithic Cloud Function for entire pipeline:** Each pass should be a separate callable function. This allows partial re-execution when only some passes are stale.
- **Storing generated documents as flat strings:** Store as structured JSON with metadata fields (generatedAt, passId, version, inputHash). This enables cross-document validation in Phase 4.
- **Hardcoding prompts in TypeScript:** Prompts live in `prompts/*.md` files. The code loads them at runtime. This matches CLAUDE.md's explicit instruction: "prompts in `prompts/` are the EXACT system prompts to use."
- **Re-running the entire pipeline when one field changes:** Use the dependency graph to determine which passes need re-execution. If only team data changes, only Legal + Combined passes need re-running, not Line Producer or Finance.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template variable substitution | Custom regex replacer for `{{var}}` | Handlebars | Prompts use `{{#si_es_animacion}}` and `{{#cada_fuente}}` conditional/loop blocks that need a real template engine |
| Structured JSON from LLM | Manual JSON.parse with try/catch and retries | Anthropic structured outputs with Zod (`output_config` + `zodOutputFormat`) | Guarantees valid JSON through constrained decoding, zero parse errors |
| MXN formatting | New formatter in functions | Port existing `formatMXN` from `src/lib/format.ts` | Already working correctly with centavos integer arithmetic |
| Firestore batch writes | Manual sequential writes | Firestore `writeBatch` or `bulkWriter` | Atomic writes for multi-document generation results |
| Retry logic for API calls | Custom retry with backoff | Anthropic SDK built-in retries (default: 2 retries with exponential backoff) | SDK handles rate limits (429) and server errors (500+) automatically |
| Real-time progress UI | Polling endpoint or custom WebSocket | Firebase streaming callable `sendChunk` + client `.stream()` | Purpose-built for exactly this use case, zero infrastructure |

**Key insight:** The Anthropic SDK handles retries and rate limiting internally. The Firebase streaming callable handles real-time progress. The Zod structured outputs handle JSON validation. None of these should be reimplemented.

## Common Pitfalls

### Pitfall 1: Financial Figure Drift
**What goes wrong:** AI generates a budget with figures that don't match the pre-computed financial data, causing cross-document inconsistencies that fail EFICINE validation rule #1 (golden equation).
**Why it happens:** Even with instructions not to, LLMs will adjust numbers to "look reasonable" or round differently.
**How to avoid:** NEVER include financial computation in AI prompts. All amounts are computed in `budgetComputer.ts`, formatted with `formatMXN`, and injected as literal strings into prompts. The AI writes prose contextualizing these numbers but cannot change them.
**Warning signs:** Any `$` amount in AI output that wasn't in the input template variables.

### Pitfall 2: Cloud Function Timeout on Full Pipeline
**What goes wrong:** Running all 4 passes sequentially in one function times out.
**Why it happens:** Each pass involves 3-7 Claude API calls. At 10-30 seconds per call, a full pipeline could take 5-15 minutes.
**How to avoid:** Each pass is a separate Cloud Function callable (300-second timeout each). The frontend orchestrates sequential execution: call Pass 1, wait for completion, call Pass 2, etc. This also enables partial re-execution.
**Warning signs:** STATE.md already flags this: "Cloud Functions v2 has 540-second timeout -- full AI pipeline may exceed this." HTTP callables support up to 3600 seconds (60 minutes), but separate functions are still better for partial re-execution.

### Pitfall 3: Prompt Template Variables Not Matching
**What goes wrong:** `{{titulo_proyecto}}` in the prompt file doesn't match the key name in the data object, producing "undefined" in generated documents.
**Why it happens:** Prompt files use Spanish variable names; code uses English or different Spanish names.
**How to avoid:** Create a `PromptDataMapper` that explicitly maps project data fields to prompt template variable names. Type it with TypeScript so missing mappings cause compile errors. Add a pre-render validation step that checks all `{{variables}}` in the prompt have corresponding values.
**Warning signs:** The string "undefined" or "[object Object]" appearing in generated document text.

### Pitfall 4: Title Inconsistency Across Documents
**What goes wrong:** The project title gets subtly different across generated documents (extra space, different accent, different casing), causing EFICINE rejection per validation rule #2.
**Why it happens:** Title gets re-typed or reformatted in different prompt contexts, or AI "corrects" the title.
**How to avoid:** Store the canonical title once. Inject it as a literal value in every prompt. Include explicit instruction: "El titulo del proyecto es EXACTAMENTE: [title]. No modifiques ni una letra." Post-generation, run automated title consistency check.
**Warning signs:** Any document where the title string is not byte-identical to the canonical title.

### Pitfall 5: Handlebars vs Mustache Syntax Mismatch
**What goes wrong:** Prompt files use `{{#si_es_animacion}}` and `{{/si_es_animacion}}` which look like Handlebars block helpers but are actually custom conditional syntax.
**Why it happens:** The prompt files were written with a pseudo-mustache syntax that doesn't exactly match any template engine.
**How to avoid:** Register custom Handlebars helpers that map these conventions. `si_es_animacion` becomes a helper that checks a boolean. `cada_fuente` becomes an `#each` wrapper. Alternatively, pre-process prompts to convert pseudo-syntax to standard Handlebars before compilation.
**Warning signs:** Template compilation errors or empty conditional blocks.

### Pitfall 6: Centavos vs Pesos Confusion in Contract Amounts
**What goes wrong:** Contracts display "$500,000.00 (quinientos mil pesos 00/100 M.N.)" but the budget shows "$500,000 MXN" with no centavos -- inconsistent formatting.
**Why it happens:** Legal documents (B3, C2b) require amounts "en numero Y letra" with `.00` suffix per Mexican legal convention, while EFICINE budget format uses no decimals.
**How to avoid:** Two formatters: `formatMXN` (no decimals, for budgets) and `formatMXNLegal` (with decimals + word representation, for contracts). Both derive from the same centavos integer.
**Warning signs:** Evaluator sees `$500,000 MXN` in the budget and `$500,000.00 M.N.` in the contract and questions whether they match.

### Pitfall 7: Prompt File Loading in Deployed Functions
**What goes wrong:** `readFileSync` fails in deployed Cloud Functions because prompt `.md` files weren't included in the deployment.
**Why it happens:** Firebase Functions deploy only the compiled JS in `lib/` (or `dist/`). Resource files must be explicitly included.
**How to avoid:** Include `prompts/` directory in the functions deployment. In `firebase.json`, the `functions.source` includes the directory. Copy prompt files to the functions output directory in the build step, or bundle them as string constants at build time.
**Warning signs:** `ENOENT: no such file or directory` errors only in production, never in local emulator.

## Code Examples

### Firebase Cloud Functions v2 Streaming Callable Setup
```typescript
// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "us-central1" });

export const runLineProducerPass = onCall(
  {
    timeoutSeconds: 300,
    memory: "1GiB",
    secrets: ["ANTHROPIC_API_KEY"],
  },
  async (request) => {
    const { projectId } = request.data;
    if (!projectId) {
      throw new HttpsError("invalid-argument", "Se requiere projectId");
    }

    // Load all needed data
    const project = await getProjectForGeneration(projectId);

    // Generate documents sequentially within this pass
    const documents = [
      { id: "A7", prompt: "a7_propuesta_produccion.md" },
      { id: "A8a", prompt: "a8_plan_rodaje_y_ruta_critica.md" },  // plan de rodaje section
      { id: "A8b", prompt: "a8_plan_rodaje_y_ruta_critica.md" },  // ruta critica section
      { id: "A9a", prompt: "a9_presupuesto.md" },                 // resumen
      { id: "A9b", prompt: "a9_presupuesto.md" },                 // desglose
    ];

    for (const doc of documents) {
      if (request.acceptsStreaming) {
        request.sendChunk({
          type: "progress",
          docId: doc.id,
          status: "generating",
          message: `Generando ${doc.id}...`,
        });
      }

      const content = await generateWithClaude(doc.prompt, project);
      await saveGeneratedDocument(projectId, doc.id, content, "lineProducer");

      if (request.acceptsStreaming) {
        request.sendChunk({
          type: "progress",
          docId: doc.id,
          status: "complete",
        });
      }
    }

    await markPassComplete(projectId, "lineProducer");
    return { success: true, completedDocs: documents.map(d => d.id) };
  }
);
```

### Client-Side Streaming Consumption
```typescript
// src/hooks/useGeneration.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { useState, useCallback } from "react";

interface ProgressChunk {
  type: "progress";
  docId: string;
  status: "generating" | "complete";
  message?: string;
}

export function useGeneration(projectId: string) {
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);

  const runPass = useCallback(async (passName: string) => {
    setIsRunning(true);
    const functions = getFunctions();
    const fn = httpsCallable(functions, `run${passName}Pass`);

    try {
      const { stream, data } = await fn.stream({ projectId });

      for await (const chunk of stream) {
        const typed = chunk as ProgressChunk;
        setProgress(prev => ({ ...prev, [typed.docId]: typed.status }));
      }

      return await data;
    } finally {
      setIsRunning(false);
    }
  }, [projectId]);

  const runFullPipeline = useCallback(async () => {
    const passes = ["LineProducer", "FinanceAdvisor", "Legal", "Combined"];
    for (const pass of passes) {
      await runPass(pass);
    }
  }, [runPass]);

  return { progress, isRunning, runPass, runFullPipeline };
}
```

### Anthropic Client with Structured Outputs
```typescript
// functions/src/claude/client.ts
import Anthropic from "@anthropic-ai/sdk";
import { z, ZodSchema } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return clientInstance;
}

// For prose documents (A7, A2, A10, contracts, etc.)
export async function generateProse(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 8000,
): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const textBlock = response.content.find(b => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in response");
  }
  return textBlock.text;
}

// For structured documents (budget tables, cash flow matrices, etc.)
export async function generateStructured<T>(
  systemPrompt: string,
  userMessage: string,
  schema: ZodSchema<T>,
  maxTokens: number = 16000,
): Promise<T> {
  const client = getClient();
  const response = await client.messages.parse({
    model: "claude-sonnet-4-5",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    output_config: { format: zodOutputFormat(schema) },
  });
  return response.parsed_output;
}
```

### Generated Document Firestore Schema
```typescript
// functions/src/shared/types.ts
import { Timestamp } from "firebase-admin/firestore";

export interface GeneratedDocument {
  docId: string;           // e.g., "A7", "A9a", "C2b"
  docName: string;         // e.g., "Propuesta de Produccion"
  passId: string;          // "lineProducer" | "financeAdvisor" | "legal" | "combined"
  content: unknown;        // Structured JSON or prose string
  contentType: "prose" | "structured" | "table";
  generatedAt: Timestamp;
  inputHash: string;       // Hash of input data for staleness detection
  modelUsed: string;       // e.g., "claude-sonnet-4-5"
  promptFile: string;      // e.g., "a7_propuesta_produccion.md"
  version: number;         // Incremented on regeneration
}

// Firestore path: projects/{projectId}/generated/{docId}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tool use hack for structured output | Native `output_config` with Zod schema | Nov 2025 (beta), GA Feb 2026 | No more `tool_choice` workaround; guaranteed valid JSON |
| Firebase Functions v1 (540s max) | Firebase Functions v2 (HTTP callable: 3600s) | 2023+ | Eliminates timeout concern for individual passes |
| Polling for function progress | Streaming callable with `sendChunk` | Mar 2025 | Real-time progress without Firestore write costs or WebSockets |
| `anthropic-beta` header for structured outputs | `output_config.format` parameter (GA) | Feb 2026 | No beta header needed; use `messages.parse` with Zod directly |

**Deprecated/outdated:**
- `output_format` parameter: Deprecated in favor of `output_config.format`. Still works during transition.
- `anthropic-beta: structured-outputs-2025-11-13` header: No longer required for structured outputs.
- Firebase Functions v1 `functions.https.onCall`: Still works but v2 import path (`firebase-functions/v2/https`) provides better features.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AIGEN-05 | Prompt loading + variable substitution | unit | `npx vitest run functions/src/pipeline/__tests__/promptLoader.test.ts -x` | Wave 0 |
| AIGEN-06 | Financial values deterministically injected | unit | `npx vitest run functions/src/financial/__tests__/budgetComputer.test.ts -x` | Wave 0 |
| AIGEN-07 | IMCINE account structure (100-1200) with rates | unit | `npx vitest run functions/src/financial/__tests__/ratesTables.test.ts -x` | Wave 0 |
| AIGEN-08 | Generated docs stored as structured data | integration | `npx vitest run functions/src/pipeline/__tests__/documentStore.test.ts -x` | Wave 0 |
| AIGEN-09 | Staleness detection when upstream changes | unit | `npx vitest run functions/src/staleness/__tests__/stalenessTracker.test.ts -x` | Wave 0 |
| AIGEN-01-04 | Each pass generates correct documents | integration | Manual -- requires Claude API key + Firestore emulator | manual-only (API costs) |
| AIGEN-10 | One-click regeneration of stale docs | integration | Manual -- requires running pipeline then modifying data | manual-only |
| LANG-01 | Generated docs in Mexican Spanish | manual | Manual review of output text | manual-only |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `functions/vitest.config.ts` -- test config for functions directory (separate from frontend)
- [ ] `functions/src/pipeline/__tests__/promptLoader.test.ts` -- prompt loading + variable substitution
- [ ] `functions/src/financial/__tests__/budgetComputer.test.ts` -- deterministic budget computation
- [ ] `functions/src/financial/__tests__/ratesTables.test.ts` -- IMCINE account structure validation
- [ ] `functions/src/staleness/__tests__/stalenessTracker.test.ts` -- dependency graph + staleness logic
- [ ] Functions directory initial setup: `functions/package.json`, `functions/tsconfig.json`

## Open Questions

1. **Which Claude model to use for each document type?**
   - What we know: Claude Sonnet 4.5 is cost-effective ($3/$15 per M tokens) and supports structured outputs. Claude Opus 4.6 is more capable ($5/$25 per M tokens) but may be overkill for template-guided generation.
   - What's unclear: Whether Sonnet produces sufficient quality for complex prose documents (A7 propuesta, A10 exhibicion) or if the premium models are needed for nuanced Mexican Spanish.
   - Recommendation: Start with Sonnet 4.5 for all documents. Upgrade specific documents to Opus only if quality is insufficient during testing. This is a configuration choice, not an architecture choice.

2. **Prompt file mapping: README lists 6 passes vs Requirements' 4 passes**
   - What we know: `prompts/README.md` lists 6 passes (Analisis Guion, Line Producer, Finanzas, Legal, Combinados, Validacion Cruzada). Requirements (AIGEN-01 through AIGEN-04) define 4 passes. Screenplay analysis (Pass 1 in README) is Phase 2's responsibility. Cross-validation (Pass 6) is Phase 4 (Validation Engine).
   - What's unclear: Whether `documentos_financieros.md` covers all Finance Advisor docs or needs splitting.
   - Recommendation: Map to 4 Cloud Functions matching the 4 AIGEN requirements. Screenplay analysis is a prerequisite from Phase 2, not a pass in this pipeline.

3. **Shared types between frontend and functions**
   - What we know: Frontend uses Zod schemas in `src/schemas/`. Functions need compatible types for reading/writing the same Firestore documents.
   - What's unclear: Whether to create a shared package, duplicate schemas, or use path aliases.
   - Recommendation: Copy essential Zod schemas to `functions/src/shared/` for now. A monorepo shared package adds build complexity that isn't warranted for v1.

4. **Budget computation: AI-assisted or fully deterministic?**
   - What we know: AIGEN-06 says "AI never calculates or invents financial numbers." The prompt `a9_presupuesto.md` contains crew rate tables and expects AI to generate the full budget.
   - What's unclear: Whether the budget should be 100% computed by code (deterministic) or whether AI can generate line items (quantities, specific crew positions) as long as it uses the provided rate ranges.
   - Recommendation: Hybrid approach. The budget STRUCTURE (which accounts, which crew positions) is AI-generated based on screenplay complexity. The AMOUNTS use the rate tables and are computed/validated by code. Cross-check: budget total must equal `costo_total_proyecto_centavos` from intake.

## Sources

### Primary (HIGH confidence)
- Anthropic TypeScript SDK v0.80.0 -- npm registry version verified
- [Structured Outputs - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- GA output_config with Zod, messages.parse
- [Firebase Cloud Functions Streaming](https://firebase.blog/posts/2025/03/streaming-cloud-functions-genkit/) -- sendChunk, acceptsStreaming pattern
- [Firebase Functions v2 Quotas](https://firebase.google.com/docs/functions/quotas) -- HTTP callable 3600s timeout
- [Firebase Callable Functions](https://firebase.google.com/docs/functions/callable) -- streaming client-side .stream() method
- Project prompt files: `prompts/*.md` (10 prompt files read in full)
- Project schemas: `src/schemas/*.ts` (6 schema files read in full)
- Project services: `src/services/projects.ts`, `src/lib/format.ts`, `src/lib/constants.ts`

### Secondary (MEDIUM confidence)
- [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing) -- Sonnet 4.5 at $3/$15 per M tokens, verified via multiple sources
- [Firebase Task Queue Functions](https://firebase.google.com/docs/functions/task-functions) -- evaluated but not recommended for this use case

### Tertiary (LOW confidence)
- Budget computation hybrid approach -- based on analysis of prompt content and AIGEN-06 requirement tension; needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified at npm registry, Anthropic structured outputs verified at official docs
- Architecture: HIGH -- streaming callable pattern verified at Firebase blog and docs, staleness tracking pattern is standard Firestore
- Pitfalls: HIGH -- financial drift and title consistency pitfalls derived directly from EFICINE validation rules in `references/validation_rules.md`
- Prompt loading: MEDIUM -- Handlebars suitability depends on exact prompt syntax matching; `{{#si_es_animacion}}` needs custom helper registration

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days -- stable stack, no fast-moving dependencies)
