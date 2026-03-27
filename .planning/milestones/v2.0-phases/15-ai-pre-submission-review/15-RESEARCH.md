# Phase 15: AI Pre-Submission Review - Research

**Researched:** 2026-03-26
**Domain:** AI-powered evaluator simulation, streaming Cloud Functions, validation dashboard integration
**Confidence:** HIGH

## Summary

Phase 15 adds an AI-powered "pre-submission review" that simulates what 3 IMCINE evaluators would think of a complete carpeta. Unlike the existing `estimateScore` function (which only evaluates artistic merit from A3/A4/A5 documents), this review covers the ENTIRE carpeta -- all generated documents, financial data, team composition, compliance rules -- from a holistic IMCINE evaluator perspective. The result is per-section scores with specific improvement suggestions in Mexican Spanish.

The existing codebase provides nearly all the infrastructure needed: the `@anthropic-ai/sdk` (v0.80.0) is already in use across 5 evaluator personas and 4 generation passes; Firebase Cloud Functions v2 streaming callables with the `sendChunk`/`response.sendChunk()` pattern are battle-tested; the `loadProjectDataForGeneration` orchestrator already gathers all project data from Firestore; and the validation dashboard has a right panel (`ScoreEstimationPanel`) that already integrates AI results alongside deterministic scores. The new review will add a new Cloud Function, a new prompt file, and a new UI section on the validation dashboard.

**Primary recommendation:** Create a single `runPreSubmissionReview` streaming callable Cloud Function that uses 3 evaluator personas (a subset/evolution of the existing 5 artistic personas, but reviewing the full carpeta), streams progress via `sendChunk`, stores results in Firestore at `projects/{projectId}/meta/pre_submission_review`, and display results in a new tab or expandable section within the existing `ScoreEstimationPanel`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AIGEN-V2-01 | AI pre-submission review simulating 3 IMCINE evaluator personas reviewing the complete carpeta -- produces per-section scores, specific improvement suggestions, and an overall readiness assessment | Existing 5-persona artistic scoring pattern in `scoreHandler.ts` provides the exact template. New prompt covers all 5 EFICINE sections (A-E) not just artistic. `loadProjectDataForGeneration` + `getAllGeneratedDocuments` supply all data. 3 personas run in parallel via `Promise.all` (same as existing 5-persona pattern). |
| AIGEN-V2-02 | User can trigger pre-submission review from the validation dashboard and see results alongside existing score estimation | Existing `ScoreEstimationPanel` with tabs (Viabilidad/Artistico/Bonus) provides the integration point. Add a "Revision Pre-Envio" tab or section. The `httpsCallable().stream()` pattern from `src/services/generation.ts` enables real-time progress. Results persist in Firestore for reload. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | 0.80.0 | Claude API calls for evaluator personas | Already in `functions/package.json`, used by all generation passes and scoreHandler |
| `firebase-functions` | 7.2.2 | Streaming callable Cloud Function with `sendChunk` | Already in use for 4 generation passes, proven streaming pattern |
| `firebase` (client) | 12.11.0 | `httpsCallable().stream()` for real-time progress | Already used by `src/services/generation.ts` for all generation passes |
| `p-limit` | 7.3.0 | Concurrency control for parallel persona calls | Already used by `concurrencyPool.ts` in generation pipeline |
| `zod` | 4.3.6 | Schema validation for structured AI responses | Already used by `claude/client.ts` for `generateStructured` |
| `handlebars` | 4.7.8 | Prompt template variable injection | Already used by `promptLoader.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react` | 19.2.4 | UI components for review results display | Frontend result rendering |
| `zustand` | 5.0.12 | Optional: cache review results in client store | Only if results need cross-component access |
| `sonner` | 2.0.7 | Toast notifications for review completion/failure | Already used project-wide for notifications |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 3 parallel persona calls | Single mega-prompt with all perspectives | Single prompt loses independent evaluation diversity; personas may influence each other. 3 parallel calls match the existing 5-persona pattern |
| Streaming callable | Non-streaming callable | Review takes 60-120s; user needs progress feedback. Streaming is already the project pattern |
| Firestore persistence | Client-only state | User loses results on page reload. Persistence matches existing `generated/` pattern |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure

```
functions/src/
  review/
    preSubmissionReview.ts   # Handler (pure function, no onCall wrapper)
    reviewTypes.ts           # Types for review request/response
src/
  services/
    review.ts               # Client-side callable wrapper with streaming
  components/validation/
    PreSubmissionReviewPanel.tsx  # Main review results UI
    ReviewSectionCard.tsx         # Per-section score card
    ReviewSuggestionList.tsx      # Improvement suggestions
  hooks/
    usePreSubmissionReview.ts    # Hook wrapping review service + Firestore cache
prompts/
  evaluadores/
    revision_integral.md         # New holistic review prompt
```

### Pattern 1: Streaming Callable with Progress Chunks (EXISTING)

**What:** Cloud Function sends progress chunks via `response.sendChunk()` while processing, client consumes via `httpsCallable().stream()`.
**When to use:** For any operation that takes >5s and needs user feedback.
**Example:**
```typescript
// Backend (functions/src/index.ts)
export const runPreSubmissionReview = onCall(
  {
    timeoutSeconds: 540, // 9 min max for callable
    memory: '1GiB',
    region: 'us-central1',
    secrets: [anthropicApiKey],
  },
  async (request, response) => {
    const uid = requireAuth(request);
    const { projectId } = request.data as { projectId: string };
    await requireProjectAccess(uid, projectId);

    initClaudeClient(anthropicApiKey.value());

    const onProgress = (chunk: unknown) => {
      if (request.acceptsStreaming && response) {
        response.sendChunk(chunk);
      }
    };

    return await handlePreSubmissionReview(projectId, onProgress);
  },
);

// Frontend (src/services/review.ts)
export async function runPreSubmissionReview(
  projectId: string,
  onProgress: (chunk: ReviewProgressChunk) => void,
): Promise<ReviewResult> {
  const fn = httpsCallable<
    { projectId: string },
    ReviewResult,
    ReviewProgressChunk
  >(functions, 'runPreSubmissionReview');

  const { stream, data } = await fn.stream({ projectId });

  for await (const chunk of stream) {
    onProgress(chunk);
  }

  return await data;
}
```

### Pattern 2: Handler Extraction (EXISTING)

**What:** Cloud Function `onCall` wrapper is thin -- just auth/access checks. All logic lives in a pure handler function.
**When to use:** Every Cloud Function in this project follows this pattern.
**Example:** See `scoreHandler.ts` -- `handleScoreEstimation` is the pure function; the `estimateScore` export in `index.ts` is the thin wrapper.

### Pattern 3: Parallel Persona Evaluation (EXISTING)

**What:** Multiple AI persona calls run in parallel via `Promise.all`, each with independent prompts and error handling. Failed personas return `null` instead of crashing the whole operation.
**When to use:** When running multiple independent AI evaluations.
**Example:**
```typescript
// From scoreHandler.ts -- exact pattern to replicate
const results = await Promise.all(
  PERSONAS.map(async (persona): Promise<PersonaScoreResult | null> => {
    try {
      return await evaluateWithPersona(persona, userMessage, client);
    } catch (err) {
      errors.push(`${persona.name}: ${err.message}`);
      return null;
    }
  }),
);
```

### Pattern 4: Firestore Result Persistence (EXISTING)

**What:** Store review results in a Firestore document for persistence across page reloads.
**When to use:** Review results are expensive to compute (3 API calls, ~60s); persist so user does not re-run.
**Storage path:** `projects/{projectId}/meta/pre_submission_review`
**Example:**
```typescript
// Store review results in Firestore (backend)
await db.doc(`projects/${projectId}/meta/pre_submission_review`).set({
  reviewedAt: FieldValue.serverTimestamp(),
  personaResults: results.filter(Boolean),
  overallScore: computeOverallScore(results),
  readiness: determineReadiness(results),
  sectionScores: aggregateSectionScores(results),
  suggestions: mergeSuggestions(results),
});
```

### Pattern 5: Prompt Loading with Guardrail (EXISTING)

**What:** Use `loadPrompt()` from `promptLoader.ts` which automatically appends the language guardrail block from `politica_idioma.md`.
**When to use:** Every AI prompt in the system.
**Note for this phase:** The review prompt file should go in `prompts/evaluadores/revision_integral.md` (or similar). The handler can use the `loadPersonaPrompt` pattern from `scoreHandler.ts` (which reads from `prompts/evaluadores/`) if we want 3 separate persona prompts, OR a single holistic prompt loaded via `loadPrompt` with the persona perspective injected as a variable.

### Anti-Patterns to Avoid
- **Do NOT create a new client initialization pattern.** Use `initClaudeClient` / `getClaudeClient` singleton from `claude/client.ts`.
- **Do NOT use non-streaming callable.** The review takes 60-120s; the user needs progress feedback. Follow the existing streaming pattern.
- **Do NOT build the review as a separate page.** It must integrate into the existing `ValidationDashboard` / `ScoreEstimationPanel`.
- **Do NOT send the entire raw Firestore data to Claude.** Build a curated text summary (like `buildUserMessage` in `scoreHandler.ts`) that provides context without token waste.
- **Do NOT generate review results without persisting.** Store in Firestore so the user sees results on return.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Concurrency control | Custom semaphore/queue | `createConcurrencyPool(3)` from `pipeline/concurrencyPool.ts` | Already proven, uses p-limit |
| JSON extraction from AI response | Custom regex parser | `parsePersonaResponse` pattern from `scoreHandler.ts` | Handles markdown code blocks, validates structure |
| Prompt variable injection | `String.replace` or template literals | `loadPrompt` from `pipeline/promptLoader.ts` | Handles Handlebars templates + auto-appends language guardrail |
| Client-side streaming | Custom EventSource/WebSocket | `httpsCallable().stream()` from Firebase SDK | Already integrated, handles auth, used by all generation passes |
| Progress notification UI | Custom progress bar | Reuse the `RefreshCw` spinner + `Skeleton` loading pattern from `ScoreEstimationPanel` | Consistent UX with existing evaluation flow |
| Score clamping | Manual Math.min/Math.max | Follow `parsePersonaResponse` clamp pattern: `Math.max(0, Math.min(max, Math.round(score)))` | Proven edge case handling |

**Key insight:** This phase is essentially a broader version of the existing `estimateScore` feature. The existing `scoreHandler.ts` is the architectural template -- the new review just evaluates more dimensions (all 5 sections, not just 3 artistic categories) and produces richer output (section-level scores + text suggestions instead of just numeric scores + rationales).

## Common Pitfalls

### Pitfall 1: Token Budget Explosion
**What goes wrong:** Sending all 21 generated documents plus all project data to Claude blows past the context window and costs significant API fees per review.
**Why it happens:** The temptation is to dump everything for "complete" review. A full carpeta can easily be 50,000+ tokens of content.
**How to avoid:** Build a curated summary message that extracts the RELEVANT scoring signals from each section. For Section A (artistic), include prose excerpts. For Sections B-E (viability), include structured data points (amounts, names, dates) not full prose. Use the rubric criteria from `scoring_rubric.md` to guide what to extract. Target ~15,000-20,000 tokens for the user message.
**Warning signs:** API costs >$0.50 per review call, response time >120s per persona.

### Pitfall 2: Review-Scoring Disagreement Confusion
**What goes wrong:** The AI review gives different scores than the deterministic viability scoring, confusing the user.
**Why it happens:** The deterministic scoring is binary signal-based (document exists = points), while the AI review evaluates quality/content. They WILL disagree.
**How to avoid:** Frame the UI clearly: deterministic scores measure "completeness and compliance" while the AI review measures "evaluator perception of quality." Use distinct visual treatment. The two are complementary, not competing.
**Warning signs:** User feedback like "the scores don't match" -- this means the framing is unclear.

### Pitfall 3: Streaming Timeout on Long Reviews
**What goes wrong:** If 3 persona calls run sequentially instead of in parallel, total time may exceed the 540s callable timeout.
**Why it happens:** Each persona call with a large context can take 60-90s. Sequential = 180-270s. With retries or slow responses, this can timeout.
**How to avoid:** Run all 3 personas in parallel (like existing 5-persona pattern). Send progress chunks as each persona completes: "Evaluador 1 de 3 completado", etc. Set Cloud Function timeout to 540s (max for callable).
**Warning signs:** Function timeout errors in production logs.

### Pitfall 4: Missing Generated Documents
**What goes wrong:** User triggers review before running the full generation pipeline, resulting in empty sections.
**Why it happens:** The generation pipeline is 4 passes that must complete before a meaningful review can happen.
**How to avoid:** Pre-check that all 4 generation passes have completed (check `generation_state` in Firestore). Show a clear gate: "Genera todos los documentos antes de solicitar la revision pre-envio." Disable the review button if generation is incomplete.
**Warning signs:** Review results that say "(No disponible)" for most sections.

### Pitfall 5: Non-Spanish AI Output
**What goes wrong:** Despite the language guardrail, the AI occasionally responds in English or mixed language when the system prompt is complex.
**Why it happens:** Long system prompts with lots of structured criteria can cause language drift.
**How to avoid:** Append the `INSTRUCCION DE IDIOMA OBLIGATORIA` guardrail (same as all other prompts). Use `loadPrompt` or manually append via `loadPersonaPrompt` pattern. Include explicit language instruction in the JSON response schema: `"rationale": "string - en espanol mexicano"`.
**Warning signs:** English text in review suggestions shown to the user.

### Pitfall 6: Stale Review Results After Regeneration
**What goes wrong:** User regenerates documents after running a review, but the old review results still display.
**Why it happens:** Review results in Firestore are not automatically invalidated when upstream documents change.
**How to avoid:** Store a `generatedDocsTimestamp` (max timestamp of all generated docs at review time) in the review result. On the frontend, compare with current max timestamp. If stale, show a yellow "Resultados desactualizados" badge and prompt re-review. This mirrors the existing staleness tracking pattern in `staleness/stalenessTracker.ts`.
**Warning signs:** Review says "excelente presupuesto" but the budget was regenerated with different amounts.

## Code Examples

### Example 1: Review Handler Structure (Backend)

```typescript
// functions/src/review/preSubmissionReview.ts
// Pattern matches scoreHandler.ts but covers full carpeta

import { loadPersonaPrompt } from './promptLoader.js';
import { getAllGeneratedDocuments } from '../pipeline/documentStore.js';
import { loadProjectDataForGeneration } from '../pipeline/orchestrator.js';
import { initClaudeClient, getClaudeClient } from '../claude/client.js';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type Anthropic from '@anthropic-ai/sdk';

interface ReviewPersona {
  id: string;
  name: string;
  promptFile: string;
}

// 3 personas per AIGEN-V2-01
const REVIEW_PERSONAS: ReviewPersona[] = [
  { id: 'evaluador_artistico', name: 'Evaluador Artistico', promptFile: 'revision_artistico.md' },
  { id: 'evaluador_viabilidad', name: 'Evaluador Viabilidad', promptFile: 'revision_viabilidad.md' },
  { id: 'evaluador_normativo', name: 'Evaluador Normativo', promptFile: 'revision_normativo.md' },
];

export interface ReviewSectionScore {
  sectionId: string;       // 'A', 'B', 'C', 'D', 'E'
  sectionName: string;     // 'Propuesta Cinematografica', etc.
  score: number;
  maxScore: number;
  strengths: string[];     // In Spanish
  weaknesses: string[];    // In Spanish
  suggestions: string[];   // Specific actionable improvements in Spanish
}

export interface PersonaReviewResult {
  personaId: string;
  personaName: string;
  sections: ReviewSectionScore[];
  overallAssessment: string;  // Spanish prose paragraph
  readinessLevel: 'lista' | 'casi_lista' | 'necesita_trabajo' | 'no_lista';
  estimatedScore: number;     // 0-100
}

export interface ReviewResult {
  success: boolean;
  personaResults: (PersonaReviewResult | null)[];
  aggregated: {
    overallReadiness: string;  // 'lista' | 'casi_lista' | 'necesita_trabajo' | 'no_lista'
    estimatedScore: number;
    sectionScores: ReviewSectionScore[];  // Averaged across personas
    topSuggestions: string[];             // Top 5 merged suggestions
  };
  reviewedAt: string;
  errors?: string[];
}

export type ReviewProgressChunk = {
  type: 'progress';
  step: 'loading_data' | 'evaluating' | 'persona_complete' | 'saving';
  personaId?: string;
  personaName?: string;
  completedCount?: number;
  totalCount?: number;
  message: string;
};
```

### Example 2: User Message Builder (Curated Summary)

```typescript
// Build curated project summary -- NOT raw document dump
function buildReviewUserMessage(
  project: ProjectDataForGeneration,
  generatedDocs: GeneratedDocument[],
): string {
  const sections: string[] = [];

  // Project identity
  sections.push(`PROYECTO: ${project.metadata.titulo_proyecto}`);
  sections.push(`CATEGORIA: ${project.metadata.categoria_cinematografica}`);
  sections.push(`PRESUPUESTO TOTAL: ${formatMXN(project.metadata.costo_total_proyecto_centavos)}`);
  sections.push(`MONTO EFICINE SOLICITADO: ${formatMXN(project.metadata.monto_solicitado_eficine_centavos)}`);
  sections.push('');

  // Section A: Extract prose summaries from generated docs
  for (const docId of ['A1', 'A2', 'A7', 'A10']) {
    const doc = generatedDocs.find(d => d.docId === docId);
    if (doc) {
      const prose = extractProse(doc.content);
      if (prose) {
        sections.push(`--- ${doc.docName} (${docId}) ---`);
        // Truncate to ~2000 chars per doc to control token budget
        sections.push(prose.substring(0, 2000));
        sections.push('');
      }
    }
  }

  // Section B: Team composition
  sections.push('--- EQUIPO CREATIVO ---');
  for (const member of project.team) {
    sections.push(`${member.cargo}: ${member.nombre_completo}`);
  }
  sections.push('');

  // Section E: Financial structure summary
  sections.push('--- ESTRUCTURA FINANCIERA ---');
  sections.push(`ERPI efectivo: ${formatMXN(project.financials.aportacion_erpi_efectivo_centavos)}`);
  sections.push(`ERPI especie: ${formatMXN(project.financials.aportacion_erpi_especie_centavos)}`);
  sections.push(`EFICINE: ${formatMXN(project.financials.monto_eficine_centavos)}`);

  return sections.join('\n');
}
```

### Example 3: Frontend Integration with Existing Panel

```typescript
// In ScoreEstimationPanel.tsx, add a new tab
<TabsTrigger value="revision" className="flex-1 text-xs">
  Revision
</TabsTrigger>

<TabsContent value="revision">
  <PreSubmissionReviewPanel
    projectId={projectId}
    generationComplete={allPassesComplete}
  />
</TabsContent>
```

### Example 4: Review Progress Display

```typescript
// Progress chunks during review
const PROGRESS_MESSAGES = {
  loading_data: 'Cargando datos del proyecto...',
  evaluating: 'Evaluando carpeta...',
  persona_complete: (name: string, n: number, total: number) =>
    `${name} completo (${n}/${total})`,
  saving: 'Guardando resultados...',
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Non-streaming callable | Streaming callable with `sendChunk` | Firebase Functions v2 (late 2024) | Real-time progress feedback; already adopted by this project |
| Single monolithic prompt | Multi-persona parallel evaluation | Established pattern in this project (Phase 4) | More diverse, independent evaluations; fault-tolerant (one failure does not block all) |
| Claude Sonnet 3.5 | Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) | 2025 | Already in use as DEFAULT_MODEL in `claude/client.ts` |

**Deprecated/outdated:**
- The project's `DEFAULT_MODEL` is `claude-sonnet-4-5-20250929` -- use this, not an older model.
- Non-streaming callables -- all AI-heavy functions in this project use streaming.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AIGEN-V2-01 | 3 personas evaluate full carpeta, produce per-section scores and suggestions | unit | `npx vitest run src/__tests__/functions/preSubmissionReview.test.ts -x` | Wave 0 |
| AIGEN-V2-01 | Review response JSON schema validates correctly | unit | `npx vitest run src/__tests__/functions/preSubmissionReview.test.ts -x` | Wave 0 |
| AIGEN-V2-01 | Failed persona returns null without crashing review | unit | `npx vitest run src/__tests__/functions/preSubmissionReview.test.ts -x` | Wave 0 |
| AIGEN-V2-02 | Review results persist in Firestore at correct path | unit | `npx vitest run src/__tests__/functions/preSubmissionReview.test.ts -x` | Wave 0 |
| AIGEN-V2-02 | Review button disabled when generation incomplete | unit | `npx vitest run src/__tests__/components/PreSubmissionReviewPanel.test.tsx -x` | Wave 0 |
| AIGEN-V2-02 | Stale review detected after document regeneration | unit | `npx vitest run src/__tests__/components/PreSubmissionReviewPanel.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/functions/preSubmissionReview.test.ts` -- covers AIGEN-V2-01 handler logic (persona parallel execution, JSON parsing, error isolation)
- [ ] `src/__tests__/components/PreSubmissionReviewPanel.test.tsx` -- covers AIGEN-V2-02 UI integration (button states, progress display, stale detection)
- [ ] Mock fixture: extend `mockClaudeClient.ts` with review-specific response mocks

## Open Questions

1. **3 vs 5 Personas for Full Review**
   - What we know: AIGEN-V2-01 specifies "3 IMCINE evaluator personas." The existing artistic scoring uses 5 personas, but those only evaluate A3/A4/A5. For a full carpeta review, 3 perspectives (artistic, viability, compliance) map cleanly to the EFICINE rubric's two main sections (62 pts artistic + 38 pts viability) plus a normative/compliance check.
   - What's unclear: Whether the user expects the same 5 named personas or 3 new ones.
   - Recommendation: Use 3 new personas with distinct evaluation perspectives: (1) artistic merit evaluator, (2) production viability evaluator, (3) regulatory compliance evaluator. These map to the actual EFICINE evaluation structure better than reusing the 5 artistic-only personas.

2. **How Deep Should the Review Go**
   - What we know: A full review of all ~21 documents at quality level could consume 30,000+ tokens per persona call. At Sonnet pricing, that is ~$0.10-0.15 per persona, $0.30-0.45 per review.
   - What's unclear: Cost tolerance per review run.
   - Recommendation: Build a curated summary (~15,000 tokens) rather than sending full documents. Extract scoring-relevant signals from each document. This keeps cost reasonable (~$0.10-0.15 per review total) and keeps within comfortable response time.

3. **Results Storage Schema**
   - What we know: The review produces per-section scores, suggestions, and an overall readiness assessment. This needs to persist in Firestore.
   - What's unclear: Whether to store in `meta/pre_submission_review` (matches `meta/budget_output` pattern) or as a new subcollection.
   - Recommendation: Store as a single document at `projects/{projectId}/meta/pre_submission_review`. This follows the existing `meta/` pattern and avoids subcollection complexity for what is essentially a single review snapshot.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `functions/src/scoreHandler.ts` -- existing 5-persona evaluation pattern, JSON response parsing, error isolation
- Codebase analysis: `functions/src/index.ts` -- all Cloud Function registration patterns, streaming callable setup
- Codebase analysis: `functions/src/pipeline/orchestrator.ts` -- project data loading for generation (reusable)
- Codebase analysis: `src/services/generation.ts` -- client-side `httpsCallable().stream()` consumption pattern
- Codebase analysis: `src/components/validation/ScoreEstimationPanel.tsx` -- existing score display with tabs, AI evaluation trigger
- Codebase analysis: `src/hooks/useValidation.ts` -- validation dashboard data flow
- Codebase analysis: `functions/src/claude/client.ts` -- Anthropic SDK usage, `generateProse`/`generateStructured` helpers
- Codebase analysis: `prompts/evaluadores/*.md` -- 5 existing evaluator persona prompts (artistic focus)
- Codebase analysis: `references/scoring_rubric.md` -- EFICINE evaluation criteria (the rubric the AI review simulates)
- Codebase analysis: `references/validation_rules.md` -- 13 cross-module validation rules (compliance dimension)

### Secondary (MEDIUM confidence)
- `functions/package.json` -- verified `@anthropic-ai/sdk` v0.80.0, `firebase-functions` v7.2.2
- `package.json` -- verified `firebase` v12.11.0, no new dependencies needed

### Tertiary (LOW confidence)
- None. All findings are based on direct codebase analysis.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use; no new dependencies
- Architecture: HIGH - Every pattern (streaming callable, persona parallel eval, handler extraction, prompt loading) is already implemented and proven in the codebase
- Pitfalls: HIGH - Pitfalls identified from analysis of existing similar features (estimateScore, generation pipeline) and EFICINE domain constraints

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- existing patterns unlikely to change)
