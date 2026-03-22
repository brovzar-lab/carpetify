# Phase 2: Screenplay Processing - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend pipeline for screenplay PDF processing: text extraction from digital-native PDFs, structural parsing (scene headers, characters, dialogue), Claude API analysis via Cloud Function, and structured Firestore storage. The UI for viewing, correcting, and re-uploading was decided in Phase 1 (D-23 through D-27). Phase 2 delivers the backend that powers that UI.

</domain>

<decisions>
## Implementation Decisions

### PDF Text Extraction
- **D-01:** Digital-native PDFs only. Supported formats: Final Draft exports (FDX → PDF), WriterSolo, Highland, Word-to-PDF. No scanned images.
- **D-02:** Attempt structural parsing using formatting cues (caps, indentation, scene header patterns like INT./EXT.). Pass both the structured breakdown AND the raw text to the analysis prompt — structured data for the UI, raw text as fallback context for Claude.
- **D-03:** If extraction produces garbled text, show warning and let user paste text manually. No auto-retry with a second library. Keep it simple.
- **D-04:** No OCR. If a scanned PDF is uploaded, treat it as a parse failure and trigger the manual fallback.
- **D-05:** Hard upload limits: reject PDFs over 200 pages or 15MB. Show a clear error rather than risk Cloud Function timeout or surprise API bill.

### Cloud Function Architecture
- **D-06:** Two separate Cloud Functions — one for extraction, one for Claude analysis. Extraction can fail independently from the API call. Retry Claude analysis without re-extracting the PDF. Extraction is fast and cheap; API call is slow and costs money.
- **D-07:** API key via Secret Manager. Firebase-recommended, most secure. No .env files.
- **D-08:** Claude Sonnet model for analysis. Structured data extraction (scenes, characters, locations), not creative writing. ~$0.50-0.80 per 120-page screenplay vs $3+ on Opus.

### Firestore Data Model
- **D-09:** Single document for analysis results — `projects/{projectId}/screenplay/analysis`. Full JSON blob, one read. Phase 3 passes need the whole analysis as prompt context anyway. Even 120 scenes fit within Firestore's 1MB document limit.
- **D-10:** Validate Claude's response against expected schema and transform field names to match `modulo_a.json` before storing. If validation fails, retry the API call once, then surface error to user. Always keep a `raw_response` backup field for debugging.
- **D-11:** Overwrite on re-analysis with `last_analyzed` timestamp. No version history. Single-user internal tool. Timestamp enables staleness detection for Phase 3.

### Processing Flow
- **D-12:** Two-step trigger: extraction runs on upload → user reviews/corrects parsed structure → clicks "Analizar guión" → Claude runs on corrected data. Don't burn an API call on uncorrected parser output.
- **D-13:** Simple spinner during Claude analysis: "Analizando guión... esto puede tomar hasta 30 segundos." No fake multi-step progress bar — can't track real progress inside a single Cloud Function call. Honest spinner with time estimate.
- **D-14:** Auto-retry Claude API call once silently on failure. If second attempt fails, show error with "Reintentar" button. Don't auto-retry more than once.
- **D-15:** Partial success supported: if extraction succeeds but analysis fails, show extracted text + parsed structure. User can review, correct, and retry analysis when ready. Don't throw away successful extraction.

### Claude's Discretion
- Extraction library choice (unpdf vs pdfjs-dist) based on research findings
- Structural parsing regex patterns for scene headers, character cues, dialogue blocks
- Cloud Function memory allocation and timeout configuration
- Response validation schema design (what constitutes "valid enough" vs retry)
- Debounce or queue strategy if user triggers multiple analyses

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Screenplay analysis prompt
- `prompts/analisis_guion.md` — The exact system prompt for Claude analysis. Defines 6 output sections: general data, per-scene breakdown, locations, characters, complexity analysis, shooting day estimates. Output must be JSON with field names matching `modulo_a.json`.

### Data model
- `schemas/modulo_a.json` — Section A fields including screenplay analysis fields. Analysis JSON field names must match this schema.
- `schemas/export_manager.json` — Modality routing that affects which analysis fields are required

### Application architecture
- `directives/app_spec.md` — Screenplay Analysis Engine section: processing pipeline overview, data flow
- `directives/app_spec.md` §"PHASE 1: INTAKE" — Screen 2 (screenplay) UI that this backend powers

### Language policy
- `directives/politica_idioma.md` — All error messages and status text in Mexican Spanish

### Phase 1 UI decisions
- `.planning/phases/01-scaffold-intake-wizard/01-CONTEXT.md` — D-23 through D-27 define the screenplay UI: side-by-side layout, summary cards + detail, manual corrections, manual fallback, re-upload warning. Phase 2 backend must support these UI behaviors.

### Research
- `.planning/research/STACK.md` — Technology choices, library versions
- `.planning/research/PITFALLS.md` — unpdf extraction quality concerns, Cloud Functions timeout limits

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code yet — Phase 1 builds the scaffold that Phase 2 extends.
- JSON Schema files in `schemas/` define field names and validation rules for the analysis output.

### Established Patterns
- Phase 1 establishes: React + Vite + Tailwind + shadcn/ui frontend, Firebase + Firestore backend, auto-save with debounce
- Schema field names in Spanish matching EFICINE terminology
- Firestore structure: `projects/{projectId}` with subcollections

### Integration Points
- Phase 1 UI (Screen 2) calls the extraction Cloud Function on PDF upload and the analysis Cloud Function on "Analizar guión" click
- Extraction result populates the side-by-side correction UI (D-23, D-24, D-25)
- Analysis result stored at `projects/{projectId}/screenplay/analysis` — consumed by Phase 3 generation passes
- `last_analyzed` timestamp enables Phase 3 staleness detection (AIGEN-09)

</code_context>

<deferred>
## Deferred Ideas

- OCR support for scanned PDFs — evaluate if user demand exists after v1 launch
- Multi-library extraction fallback chain (auto-retry with pdfjs-dist if unpdf fails) — revisit if extraction failures are common in practice

</deferred>

---

*Phase: 02-screenplay-processing*
*Context gathered: 2026-03-21*
