# Phase 2: Screenplay Processing - Research

**Researched:** 2026-03-21
**Domain:** PDF text extraction, screenplay format parsing, Claude API integration via Firebase Cloud Functions
**Confidence:** HIGH

## Summary

Phase 2 transforms an uploaded screenplay PDF into structured data that all downstream AI generation passes consume. The pipeline has three distinct stages: (1) extract raw text from a PDF preserving line breaks, (2) parse the extracted text to identify screenplay elements (scene headers, characters, dialogue, locations, INT/EXT/DAY/NIGHT), and (3) send the parsed data to Claude API via a Cloud Function using the pre-written Spanish prompt at `prompts/analisis_guion.md` for deep production analysis.

The critical insight is that PDF text extraction and screenplay parsing are two separate problems. PDF extraction gives you raw text; screenplay parsing applies domain knowledge about screenplay format conventions (scene headers start with INT./EXT. in ALL CAPS, character names are centered in ALL CAPS before dialogue, etc.). The Claude API call then adds a third layer: production-level analysis (complexity signals, shooting day estimates, character classifications) that a regex parser cannot provide.

The project's existing `STATE.md` flags two known risks: (1) PDF text extraction quality varies across screenplay formats, and (2) Cloud Functions v2 has timeout limits that may be tight for large screenplay analysis. This research addresses both.

**Primary recommendation:** Use `pdf-parse` (v2.4.5) for PDF text extraction in the Cloud Function, implement custom regex-based screenplay parsing for structure detection (scene headers, characters, locations), and use `@anthropic-ai/sdk` with an HTTPS callable Cloud Function (not event-driven) to get the full 60-minute timeout for the Claude API call.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCRN-01 | Extract text from uploaded screenplay PDF preserving structure (scene headers, character names, dialogue) | pdf-parse library for text extraction + custom regex parser for screenplay structure detection |
| SCRN-02 | Parse extracted text to identify scene count, page count, locations, characters, INT/EXT/DAY/NIGHT breakdown | Custom screenplay parser module with regex patterns for Spanish/English scene headers |
| SCRN-03 | Send parsed data to Claude API via Cloud Function using `prompts/analisis_guion.md` | @anthropic-ai/sdk in HTTPS callable Cloud Function with prompt template injection |
| SCRN-04 | Store analysis results in Firestore as structured data for downstream passes | Firestore `projects/{projectId}/screenplay` subcollection matching modulo_a.json schema |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdf-parse | 2.4.5 | Extract raw text from screenplay PDFs | 2M weekly downloads, simple API (buffer in, text out), works in Cloud Functions Node.js runtime, handles UTF-8/Spanish characters well |
| @anthropic-ai/sdk | 0.80.0 | Call Claude API for screenplay analysis | Official Anthropic TypeScript SDK with type safety, retries, streaming support |
| firebase-functions | 7.2.2 | Cloud Function for PDF processing + Claude API call | Required for Firebase Cloud Functions v2 |
| firebase-admin | 13.7.0 | Access Firestore + Storage from Cloud Functions | Required for server-side Firebase operations |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pdfjs-dist | 5.5.207 | Fallback PDF extraction with positioning data | Only if pdf-parse fails on specific screenplay PDFs (scanned, non-standard encoding) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdf-parse | unpdf (1.4.0) | unpdf is more modern/edge-compatible but pdf-parse has 10x adoption, simpler API, and Cloud Functions is Node.js (not edge). unpdf does NOT preserve text positioning either. |
| pdf-parse | pdfjs-dist (5.5.207) | pdfjs-dist exposes full Mozilla PDF.js API with positioning data but requires manual page iteration and much more boilerplate. Only use as fallback. |
| Custom screenplay parser | Existing screenplay parsing libraries | No mature JS/TS screenplay parsing library exists -- fountain.js parses Fountain format (not PDF-extracted text). Custom regex is the standard approach. |

**Installation (Cloud Functions):**
```bash
cd functions
npm install pdf-parse @anthropic-ai/sdk firebase-functions firebase-admin
```

## Architecture Patterns

### Recommended Project Structure
```
functions/
  src/
    index.ts                    # Cloud Function exports
    screenplay/
      extractText.ts            # PDF -> raw text extraction
      parseStructure.ts         # Raw text -> structured screenplay data
      analyzeWithClaude.ts      # Structured data -> Claude API analysis
      types.ts                  # TypeScript interfaces for screenplay data
    utils/
      promptLoader.ts           # Load and inject variables into prompt templates
```

### Pattern 1: Two-Phase Processing (Upload + Analyze)

**What:** Separate PDF upload/parsing from Claude API analysis into two distinct operations.
**When to use:** Always -- the user uploads a PDF (fast), sees a quick parse preview (scene count, locations), then triggers AI analysis (slow, costs money).

```typescript
// Phase A: Upload + Quick Parse (triggered on upload or explicitly)
// 1. User uploads PDF to Firebase Storage
// 2. Cloud Function extracts text with pdf-parse
// 3. Cloud Function runs regex screenplay parser
// 4. Store parsed structure in Firestore
// 5. Return quick stats to UI (scene count, page count, locations, characters)

// Phase B: AI Analysis (user-triggered, separate call)
// 1. User reviews/corrects parsed data, then clicks "Analizar guion"
// 2. Cloud Function loads prompt from prompts/analisis_guion.md
// 3. Injects parsed text + project metadata into {{variables}}
// 4. Calls Claude API
// 5. Stores structured analysis in Firestore
```

**Why:** Separating these operations means the user gets instant feedback from parsing (2-5 seconds) before committing to an API call that takes 30-90 seconds and costs money. It also allows the user to correct parse errors (INTK-05) before the AI analysis runs on bad data.

### Pattern 2: HTTPS Callable Function (not event-driven)

**What:** Use `onCall` (callable) Cloud Functions for both the parse and analyze operations, not Storage-triggered event functions.
**When to use:** Always for this phase.

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const analyzeScreenplay = onCall(
  {
    timeoutSeconds: 540,  // 9 minutes for AI analysis
    memory: "1GiB",       // Screenplay PDFs + parsed text in memory
    region: "us-central1",
  },
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debe iniciar sesion.");
    }
    // ... processing logic
  }
);
```

**Why:** Event-driven functions (onObjectFinalized) have a 540s max timeout and trigger automatically on any upload -- problematic if the user uploads non-screenplay files. Callable functions give explicit user control and the same 540s timeout is sufficient (Claude API calls for screenplay analysis typically complete in 30-90 seconds). Note: HTTPS functions support up to 3600s timeout if needed, but 540s is adequate.

### Pattern 3: Prompt Template Injection

**What:** Load the prompt markdown file, replace `{{variables}}`, and send as system message.
**When to use:** For every Claude API call.

```typescript
import { readFileSync } from "fs";
import path from "path";

function loadPrompt(
  promptFile: string,
  variables: Record<string, string>
): string {
  const templatePath = path.join(__dirname, "../../prompts", promptFile);
  let template = readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(variables)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }

  return template;
}

// Usage:
const systemPrompt = loadPrompt("analisis_guion.md", {
  texto_guion: extractedText,
  titulo_proyecto: projectTitle,
  categoria_cinematografica: genre,
});
```

### Pattern 4: Screenplay Regex Parser for Scene Headers

**What:** Parse extracted text to identify screenplay structural elements using regex.
**When to use:** After PDF text extraction, before Claude API analysis.

```typescript
// Scene header pattern - handles both English and Spanish conventions
// Standard: "INT. LOCATION - DAY" or "EXT. LOCATION - NIGHT"
// Spanish screenplays may use: "INT. LOCACION - DIA" or "EXT. LOCACION - NOCHE"
const SCENE_HEADER_REGEX =
  /^(INT\.?|EXT\.?|INT\.?\/EXT\.?|INT\.?-EXT\.?)\s+(.+?)\s*[-–—]\s*(DI[AÍ]|NOCHE|ATARDECER|AMANECER|DAY|NIGHT|DAWN|DUSK|LATER|CONTINUOUS|CONT\.?)$/im;

// Character name pattern - ALL CAPS on its own line, possibly with (V.O.) or (O.S.)
const CHARACTER_NAME_REGEX =
  /^([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s.]{1,40})(?:\s*\((?:V\.O\.|O\.S\.|OFF|CONT(?:'D)?|VO)\))?$/m;

interface ParsedScene {
  sceneNumber: number;
  intExt: "INT" | "EXT" | "INT/EXT";
  location: string;
  timeOfDay: string;
  characters: string[];
  pageStart: number;
  rawText: string;
}
```

### Anti-Patterns to Avoid

- **Sending raw PDF bytes to Claude:** Claude cannot read PDF binary data via the Messages API text input. Always extract text first, then send the text. (Claude does support PDF via the `document` content block type, but for screenplay parsing we need the intermediate parsed structure for the UI preview in SCRN-02.)
- **Parsing screenplay format with Claude alone:** Using Claude to identify scene headers, character names, and locations from raw text is wasteful and slow. Regex parsing is instant and deterministic -- save Claude for the production analysis that requires judgment.
- **Single monolithic Cloud Function:** Combining upload, parse, and analyze in one function means the user waits 60+ seconds with no feedback. Split into parse (fast) and analyze (slow).
- **Hardcoding prompts in code:** The prompts live in `prompts/*.md` files and must be loaded at runtime with variable injection. Never inline prompt text in TypeScript source.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF parser | pdf-parse library | PDF format is extraordinarily complex (fonts, encodings, CMap tables, ToUnicode). Even "simple" text extraction has edge cases with ligatures, custom encodings, and Spanish diacritics. |
| Claude API client | Raw fetch() calls to API | @anthropic-ai/sdk | SDK handles retries, rate limiting, streaming, type safety, and error classification. Hand-rolling loses all of this. |
| Firebase file uploads | Custom upload endpoint | Firebase Storage client SDK (frontend) | Firebase Storage handles resumable uploads, progress tracking, auth integration, and security rules out of the box. |
| Prompt variable injection | Complex template engine | Simple string.replaceAll() | The prompts use `{{variable}}` placeholders. A simple replaceAll loop is sufficient -- no need for Handlebars, Mustache, or any template engine. |

**Key insight:** The only thing that should be custom-built is the screenplay structure parser (regex-based), because no mature library exists for parsing PDF-extracted screenplay text. Everything else has a battle-tested library.

## Common Pitfalls

### Pitfall 1: PDF Text Extraction Loses Line Breaks and Formatting

**What goes wrong:** pdf-parse returns text as a single string where screenplay formatting (centered character names, indented dialogue, scene headers) is flattened. Scene headers become indistinguishable from dialogue.
**Why it happens:** PDF stores text as positioned glyphs, not semantic lines. The text extraction heuristic may merge lines or lose whitespace.
**How to avoid:** After extraction, normalize the text: split on `\n`, trim each line, collapse multiple blank lines into one. Test with 3+ real screenplay PDFs (different authoring tools: Final Draft, WriterSolo, Celtx, Highland). If pdf-parse produces unusable output for a specific PDF, fall back to pdfjs-dist which provides per-item positioning data that can reconstruct lines more accurately.
**Warning signs:** Scene count comes back as 0, or character names contain dialogue text on the same line.

### Pitfall 2: Spanish Diacritics in PDF Text

**What goes wrong:** Characters like a, e, i, o, u, n come through as garbled text or ligatures (fi, fl become single characters).
**Why it happens:** PDF fonts may use custom encoding where codepoints don't map to standard Unicode. Some PDF authoring tools embed subset fonts without a ToUnicode CMap.
**How to avoid:** After extraction, validate that the text contains expected Spanish characters. If diacritics are missing or garbled, log a warning and present it to the user for manual review. The Claude API analysis will work better with correct text, so this is a quality gate.
**Warning signs:** Extracted text contains `?` or `\ufffd` replacement characters where accented vowels should be.

### Pitfall 3: Cloud Function Timeout on Large Screenplays

**What goes wrong:** A 120-page screenplay generates ~50,000+ words of text. The Claude API call with this much input plus the detailed analysis prompt can take 60-120 seconds.
**Why it happens:** Claude needs time to process large context windows and generate a comprehensive structured analysis.
**How to avoid:** Set the Cloud Function timeout to 540 seconds (maximum for callable functions). Use a non-streaming call for simplicity since the result goes to Firestore, not directly to the UI. If 540s proves insufficient (unlikely for a single screenplay), consider chunking the screenplay by acts or using streaming to write partial results.
**Warning signs:** Function logs show "Function execution took X ms, finished with status: timeout."

### Pitfall 4: Claude Returns Inconsistent JSON Structure

**What goes wrong:** The analysis prompt asks for JSON output, but Claude occasionally wraps it in markdown code fences, adds preamble text, or varies field names.
**Why it happens:** LLMs are not deterministic. Even with explicit JSON format instructions, output format can vary.
**How to avoid:** (1) Strip markdown code fences from the response before parsing. (2) Use a JSON schema validator to verify the response structure. (3) If parsing fails, retry once with a more explicit "respond ONLY with valid JSON" instruction. (4) Define the expected TypeScript interface and validate against it.
**Warning signs:** `JSON.parse()` throws, or downstream passes get `undefined` for expected fields.

### Pitfall 5: Screenplay Upload Replaces Previous Analysis

**What goes wrong:** User uploads a new version of the screenplay, but the old analysis results remain in Firestore. Downstream documents reference stale data.
**Why it happens:** No invalidation mechanism when the source data changes.
**How to avoid:** When a new screenplay is uploaded and parsed, mark all existing analysis data as stale (add `stale: true` flag and `superseded_by` timestamp). This aligns with AIGEN-09 (downstream staleness tracking). The UI should show a clear indicator that re-analysis is needed.
**Warning signs:** Generated documents reference a different scene count or location list than the current screenplay.

## Code Examples

### PDF Text Extraction with pdf-parse

```typescript
// Source: pdf-parse npm documentation + project requirements
import pdfParse from "pdf-parse";

interface ExtractionResult {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    creator?: string;
  };
}

async function extractTextFromPdf(
  pdfBuffer: Buffer
): Promise<ExtractionResult> {
  const result = await pdfParse(pdfBuffer);

  return {
    text: result.text,
    numPages: result.numpages,
    metadata: {
      title: result.info?.Title,
      author: result.info?.Author,
      creator: result.info?.Creator,
    },
  };
}
```

### Screenplay Structure Parser

```typescript
// Custom parser for screenplay format detection
// Handles both English and Spanish screenplay conventions

interface ScreenplayBreakdown {
  totalScenes: number;
  totalPages: number;
  scenes: ParsedScene[];
  locations: LocationSummary[];
  characters: CharacterSummary[];
  intExtBreakdown: { int: number; ext: number; intExt: number };
  dayNightBreakdown: { day: number; night: number; other: number };
}

interface ParsedScene {
  sceneNumber: number;
  intExt: "INT" | "EXT" | "INT/EXT";
  location: string;
  timeOfDay: string;
  characters: string[];
  rawText: string;
}

interface LocationSummary {
  name: string;
  intExt: "INT" | "EXT" | "INT/EXT";
  sceneCount: number;
}

interface CharacterSummary {
  name: string;
  sceneCount: number;
}

const SCENE_HEADER_PATTERN =
  /^(INT\.?|EXT\.?|INT\.?\s*[\/\-]\s*EXT\.?)\s+(.+?)\s*[-–—]\s*(.+)$/i;

const CHARACTER_PATTERN =
  /^([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s.]{1,40})(?:\s*\(.*?\))?$/;

function parseScreenplay(rawText: string, totalPages: number): ScreenplayBreakdown {
  const lines = rawText.split("\n").map((l) => l.trim());
  const scenes: ParsedScene[] = [];
  let currentScene: ParsedScene | null = null;
  const charactersByScene = new Map<number, Set<string>>();

  for (const line of lines) {
    const sceneMatch = line.match(SCENE_HEADER_PATTERN);
    if (sceneMatch) {
      // Save previous scene
      if (currentScene) {
        scenes.push(currentScene);
      }

      const intExtRaw = sceneMatch[1].replace(/\s/g, "").replace("-", "/");
      let intExt: "INT" | "EXT" | "INT/EXT" = "INT";
      if (intExtRaw.includes("/")) intExt = "INT/EXT";
      else if (intExtRaw.startsWith("EXT")) intExt = "EXT";

      currentScene = {
        sceneNumber: scenes.length + 1,
        intExt,
        location: sceneMatch[2].trim(),
        timeOfDay: sceneMatch[3].trim().toUpperCase(),
        characters: [],
        rawText: "",
      };
      charactersByScene.set(currentScene.sceneNumber, new Set());
      continue;
    }

    // Detect character names (ALL CAPS line, not a scene header)
    if (currentScene && line.length > 0) {
      const charMatch = line.match(CHARACTER_PATTERN);
      if (charMatch && !SCENE_HEADER_PATTERN.test(line)) {
        const charName = charMatch[1].trim();
        // Filter out common false positives
        const falsePositives = [
          "FADE IN", "FADE OUT", "CUT TO", "CORTE A",
          "DISOLVENCIA", "FUNDIDO", "CONTINUACION",
        ];
        if (!falsePositives.includes(charName)) {
          charactersByScene.get(currentScene.sceneNumber)?.add(charName);
        }
      }
      currentScene.rawText += line + "\n";
    }
  }

  // Don't forget the last scene
  if (currentScene) scenes.push(currentScene);

  // Populate character lists per scene
  for (const scene of scenes) {
    scene.characters = Array.from(
      charactersByScene.get(scene.sceneNumber) || []
    );
  }

  // Build summaries
  const locationMap = new Map<string, LocationSummary>();
  const characterMap = new Map<string, number>();

  for (const scene of scenes) {
    const locKey = scene.location.toUpperCase();
    if (!locationMap.has(locKey)) {
      locationMap.set(locKey, {
        name: scene.location,
        intExt: scene.intExt,
        sceneCount: 0,
      });
    }
    locationMap.get(locKey)!.sceneCount++;

    for (const char of scene.characters) {
      characterMap.set(char, (characterMap.get(char) || 0) + 1);
    }
  }

  const dayKeywords = ["DIA", "DÍA", "DAY"];
  const nightKeywords = ["NOCHE", "NIGHT"];

  return {
    totalScenes: scenes.length,
    totalPages: totalPages,
    scenes,
    locations: Array.from(locationMap.values()),
    characters: Array.from(characterMap.entries()).map(([name, count]) => ({
      name,
      sceneCount: count,
    })),
    intExtBreakdown: {
      int: scenes.filter((s) => s.intExt === "INT").length,
      ext: scenes.filter((s) => s.intExt === "EXT").length,
      intExt: scenes.filter((s) => s.intExt === "INT/EXT").length,
    },
    dayNightBreakdown: {
      day: scenes.filter((s) =>
        dayKeywords.some((k) => s.timeOfDay.includes(k))
      ).length,
      night: scenes.filter((s) =>
        nightKeywords.some((k) => s.timeOfDay.includes(k))
      ).length,
      other: scenes.filter(
        (s) =>
          !dayKeywords.some((k) => s.timeOfDay.includes(k)) &&
          !nightKeywords.some((k) => s.timeOfDay.includes(k))
      ).length,
    },
  };
}
```

### Claude API Call with Prompt Injection

```typescript
// Source: @anthropic-ai/sdk documentation + project prompt architecture
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import path from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function loadAndInjectPrompt(
  filename: string,
  variables: Record<string, string>
): string {
  const filepath = path.join(__dirname, "../../prompts", filename);
  let template = readFileSync(filepath, "utf-8");
  for (const [key, value] of Object.entries(variables)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }
  return template;
}

async function analyzeScreenplayWithClaude(
  screenplayText: string,
  projectTitle: string,
  genre: string
): Promise<Record<string, unknown>> {
  const systemPrompt = loadAndInjectPrompt("analisis_guion.md", {
    texto_guion: screenplayText,
    titulo_proyecto: projectTitle,
    categoria_cinematografica: genre,
  });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: systemPrompt,
      },
    ],
  });

  // Extract text content from response
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return text content");
  }

  // Strip markdown code fences if present
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(jsonText);
}
```

### Firestore Data Storage Pattern

```typescript
// Store parsed + analyzed screenplay data in Firestore
import { getFirestore } from "firebase-admin/firestore";

interface ScreenplayDocument {
  // Quick parse results (SCRN-01, SCRN-02)
  raw_text: string;
  num_paginas: number;
  num_escenas: number;
  locaciones: Array<{
    nombre: string;
    tipo: string;
    num_escenas: number;
  }>;
  personajes: Array<{
    nombre: string;
    num_escenas: number;
  }>;
  desglose_int_ext: {
    int: number;
    ext: number;
    int_ext: number;
  };
  desglose_dia_noche: {
    dia: number;
    noche: number;
    otro: number;
  };
  // Status tracking
  parsed_at: FirebaseFirestore.Timestamp;
  parse_version: number;

  // Claude analysis results (SCRN-03, SCRN-04)
  analisis_claude?: Record<string, unknown>;
  analyzed_at?: FirebaseFirestore.Timestamp;
  analysis_version?: number;
  analysis_stale?: boolean;
}

async function storeScreenplayData(
  projectId: string,
  data: ScreenplayDocument
): Promise<void> {
  const db = getFirestore();
  await db
    .collection("projects")
    .doc(projectId)
    .update({
      screenplay: data,
    });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse v1.x (single function, callback) | pdf-parse v2.4.5 (TypeScript, Promise-based) | 2024 | Cleaner async/await usage, TypeScript types |
| Cloud Functions v1 (max 540s for all) | Cloud Functions v2 (up to 3600s for HTTPS) | 2023 | HTTPS/callable functions get 60-min timeout; event-driven stays at 540s |
| Anthropic SDK pre-1.0 patterns | @anthropic-ai/sdk 0.80.x | Ongoing | Stable Messages API, structured content blocks, built-in retries |
| Firebase Functions with require() | Firebase Functions with ESM imports | 2024 | Use `import` syntax, configure `"type": "module"` in functions/package.json |

**Deprecated/outdated:**
- `firebase-functions` v1 API (`functions.https.onCall`): Use v2 API (`onCall` from `firebase-functions/v2/https`) for better timeout control and memory configuration.
- Anthropic completions API: Fully replaced by Messages API. All SDK usage should go through `client.messages.create()`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Vite-based React projects) |
| Config file | None -- Wave 0 must create `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCRN-01 | PDF text extraction preserves scene headers and character names | unit | `npx vitest run tests/screenplay/extractText.test.ts -t "extraction"` | No -- Wave 0 |
| SCRN-02 | Regex parser identifies correct scene count, locations, characters, INT/EXT/DAY/NIGHT | unit | `npx vitest run tests/screenplay/parseStructure.test.ts -t "parsing"` | No -- Wave 0 |
| SCRN-03 | Claude API call uses correct prompt with variable injection | integration | `npx vitest run tests/screenplay/analyzeWithClaude.test.ts -t "analysis"` | No -- Wave 0 |
| SCRN-04 | Analysis results stored as structured Firestore data | integration | `npx vitest run tests/screenplay/storage.test.ts -t "firestore"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/screenplay/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- framework configuration
- [ ] `tests/screenplay/extractText.test.ts` -- PDF extraction tests with sample PDFs
- [ ] `tests/screenplay/parseStructure.test.ts` -- Regex parser tests with known screenplay text
- [ ] `tests/screenplay/analyzeWithClaude.test.ts` -- Claude API integration test (mocked)
- [ ] `tests/screenplay/storage.test.ts` -- Firestore write verification
- [ ] `tests/fixtures/sample-screenplay.pdf` -- Test fixture (small, known-structure screenplay)
- [ ] `tests/fixtures/sample-screenplay-text.txt` -- Expected extraction output for comparison
- [ ] Framework install: `npm install -D vitest` in both root and functions directories

## Open Questions

1. **Prompt file deployment to Cloud Functions**
   - What we know: Prompts live at `prompts/analisis_guion.md` in the repo root. Cloud Functions deploy from the `functions/` directory.
   - What's unclear: Whether prompt files should be bundled into the functions deployment, read from Storage at runtime, or stored in Firestore.
   - Recommendation: Copy prompt files into `functions/prompts/` at build time (via a predeploy script in `firebase.json`), keeping `prompts/` in the repo root as the source of truth. This avoids runtime Storage reads and keeps prompts version-controlled.

2. **Which Claude model to use for screenplay analysis**
   - What we know: The prompt expects detailed JSON output with per-scene breakdowns, character classifications, and shooting day estimates. This requires strong instruction following and structured output.
   - What's unclear: Whether claude-sonnet-4-20250514 is sufficient or claude-opus-4-6 is needed for accuracy on 100+ page screenplays.
   - Recommendation: Start with claude-sonnet-4-20250514 (faster, cheaper). Upgrade to Opus only if analysis quality is insufficient in testing. Make the model configurable via environment variable.

3. **Screenplay text size vs. Claude context window**
   - What we know: A 120-page screenplay is roughly 25,000-30,000 words (~40,000-50,000 tokens). The analysis prompt adds ~1,000 tokens. The expected JSON output is ~3,000-5,000 tokens.
   - What's unclear: Whether total token count (input + output) stays within model limits.
   - Recommendation: Claude Sonnet has a 200K token context window. A 120-page screenplay (~50K tokens) + prompt (~1K) + output (~5K) = ~56K tokens, well within limits. No chunking needed.

4. **Phase 1 dependency**
   - What we know: Phase 1 (Scaffold + Intake Wizard) has not been built yet. There is no `package.json`, no `src/` directory, no Firebase configuration.
   - What's unclear: The exact Phase 1 output structure (component library, routing, Firebase config).
   - Recommendation: Phase 2 planning should assume Phase 1 delivers: a working React app with Firebase config, Firestore security rules, Firebase Storage setup, and the intake wizard with screenplay upload UI (Screen 2). Phase 2 adds the Cloud Functions backend processing.

## Sources

### Primary (HIGH confidence)
- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse) - API, version 2.4.5 verified
- [@anthropic-ai/sdk npm](https://www.npmjs.com/package/@anthropic-ai/sdk) - Version 0.80.0 verified
- [Firebase Cloud Functions quotas](https://firebase.google.com/docs/functions/quotas) - Timeout limits confirmed (540s event, 3600s HTTPS)
- [Firebase Cloud Functions management](https://firebase.google.com/docs/functions/manage-functions) - Configuration options
- [Anthropic Client SDKs docs](https://platform.claude.com/docs/en/api/client-sdks) - TypeScript SDK patterns
- Project files: `prompts/analisis_guion.md`, `schemas/modulo_a.json`, `directives/app_spec.md`

### Secondary (MEDIUM confidence)
- [PkgPulse: unpdf vs pdf-parse vs pdfjs-dist 2026](https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026) - Library comparison
- [unpdf GitHub](https://github.com/unjs/unpdf) - API reference and capabilities
- [Strapi: 7 PDF Parsing Libraries 2025](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025) - Ecosystem overview

### Tertiary (LOW confidence)
- Screenplay format regex patterns -- derived from screenplay format documentation (storysense.com, screencraft.org) and adapted for Spanish conventions. Needs validation against real Mexican screenplay PDFs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All library versions verified via npm registry, APIs confirmed via official docs
- Architecture: HIGH - Two-phase pattern (parse + analyze) is standard for AI processing pipelines; Firebase patterns well-documented
- Pitfalls: HIGH - PDF encoding issues are well-documented; timeout limits confirmed via Firebase docs; JSON parsing issues are universal with LLM output
- Screenplay parsing: MEDIUM - Regex patterns based on format standards but not tested against real Mexican screenplay PDFs. Spanish-language screenplays may have formatting variations.

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- stack is stable, Anthropic SDK version may increment but API patterns are stable)
