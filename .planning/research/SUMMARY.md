# Project Research Summary

**Project:** Carpetify (EFICINE Article 189 Submission Dossier Generator)
**Domain:** AI-powered government compliance document generation (Mexican film tax incentive)
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

Carpetify is a sequential document generation pipeline disguised as a wizard-based web app. A Mexican film producer uploads a screenplay and enters project data; the system then generates approximately 30 structured documents in Mexican Spanish via Claude API, validates them against EFICINE's exacting cross-document consistency rules, and exports a ZIP package ready for government upload. The recommended stack is React 19 + Vite 8 + TypeScript on the frontend with Firebase (Firestore, Storage, Cloud Functions) as the backend, and Anthropic's Claude SDK running exclusively server-side in Cloud Functions. This is a well-understood architecture with high confidence across all technology choices.

The critical insight from research is that financial numbers -- not prose -- are where this project will succeed or fail. EFICINE rejects applications where four independently-rendered totals differ by even $1 MXN, where crew fees mismatch between contracts and budgets, or where the screenwriter's 3% minimum is miscalculated. The architecture must treat every monetary value as a single-source-of-truth datum that propagates deterministically through all documents. AI should generate structure and prose around injected numbers, never invent financial figures. This "numbers are code, prose is AI" separation is the foundational design principle.

The top risks are: (1) floating-point rounding cascades breaking the golden equation across budget/cash-flow/financial-scheme, mitigated by integer-centavo arithmetic and a single canonical financial model; (2) AI hallucinating numbers or generating English/generic Spanish, mitigated by strict variable injection and programmatic language guardrails on every API call; and (3) screenplay PDF parsing producing garbage for non-standard formats, mitigated by a manual correction UI and heuristic validation of parse output. All three are addressable with deliberate architecture decisions in Phases 1-2 that prevent the problems rather than trying to detect them later.

## Key Findings

### Recommended Stack

The stack is fully decided with high confidence. React 19 + Vite 8 + TypeScript for the SPA frontend. Tailwind CSS v4 + shadcn/ui v4 for components. Firebase 12.x client SDK with Cloud Functions v2 (Node.js 20+) for the backend. All AI calls go through Cloud Functions using `@anthropic-ai/sdk`, never from the browser.

**Core technologies:**
- **React 19 + Vite 8 + TypeScript**: SPA framework -- no SSR needed for an internal tool, Vite gives sub-2s dev starts
- **React Hook Form + Zod 4**: Form management and validation -- Zod schemas serve triple duty (form validation, Firestore validation, cross-document consistency checks)
- **Firebase (Firestore + Storage + Cloud Functions v2)**: Backend-as-a-service -- real-time listeners for pipeline progress, no server management
- **@react-pdf/renderer**: PDF generation -- declarative React components for 20+ structured document templates, far more maintainable than imperative jsPDF
- **unpdf**: PDF text extraction -- modern replacement for unmaintained pdf-parse, runs in Cloud Functions
- **@anthropic-ai/sdk**: Claude API -- Cloud Functions only, supports streaming for long document generation
- **JSZip + file-saver**: Export packaging -- client-side ZIP creation with organized folder structure

See `.planning/research/STACK.md` for full version matrix, alternatives considered, and installation commands.

### Expected Features

**Must have (table stakes):**
- 5-screen intake wizard (project setup, screenplay upload, team, financials, document uploads) -- all in Mexican Spanish
- Screenplay PDF parsing with manual correction UI
- 4-pass AI document generation pipeline (Line Producer -> Finance -> Legal -> Combined)
- Cross-document financial reconciliation (the "golden equation" -- 4 totals must match exactly)
- Title and fee consistency enforcement across all generated documents
- EFICINE compliance validation (ERPI >= 20%, EFICINE <= 80% and <= $25M, screenwriter >= 3%, in-kind <= 10%)
- Document completeness checklist (missing any document = automatic rejection)
- Traffic light dashboard for per-document and per-rule status
- PDF generation with IMCINE naming convention (15 chars, no accents)
- ZIP export with SHCP-compatible folder structure (A_PROPUESTA/, B_PERSONAL/, etc.)
- Multi-project support (up to 3 per EFICINE period)

**Should have (differentiators):**
- One-click regeneration when upstream data changes (dependency-graph-based staleness tracking)
- Score estimation engine against EFICINE rubric (average winning score: 94.63/100)
- Real-time validation as the user types (not batch at export time)
- Prohibited expenditure scanning (Rule 7 -- flag EFICINE funds on disallowed items)
- Bonus points advisor (+5 points for female director, indigenous director, regional decentralization)
- Budget with Mexican market crew rates (not generic placeholders)
- Date compliance tracking (3-month document expiry window)

**Defer (v2+):**
- Co-production rules engine (only needed for international co-productions)
- Hyperlink accessibility checker (producer can verify their own links)
- Ruta critica / cash flow timeline sync validation (warning-level, not blocker)

See `.planning/research/FEATURES.md` for full feature dependency graph, anti-features list, and MVP phasing recommendation.

### Architecture Approach

The system is a pipeline with six components connected through Firestore as a shared state machine. User input flows into Firestore via the intake wizard; the screenplay parser writes structured breakdown data; the AI generation pipeline runs 6 sequential passes through Cloud Functions writing each document to `projects/{id}/generated/{docId}`; the validation engine runs 13 rules producing traffic-light results; and the export manager renders PDFs and compiles the ZIP. The client uses Firestore `onSnapshot` listeners for real-time progress during the 5-15 minute generation pipeline. Documents are stored as structured JSON, not PDFs -- PDF rendering happens only at export time.

**Major components:**
1. **Intake Wizard** -- 5-screen form collecting project metadata, team, financials, uploads; persists to Firestore per screen
2. **Screenplay Parser** -- Cloud Function triggered by Storage upload; extracts scenes, locations, characters via unpdf + Claude analysis
3. **AI Generation Pipeline** -- 6-pass Cloud Function chain; each pass reads prior outputs, substitutes variables into prompt templates, stores structured results
4. **Validation Engine** -- 13 rules split between client-side (real-time during intake) and server-side (post-generation); pure functions returning blocker/warning status
5. **Dashboard** -- Traffic light grid with real-time Firestore listeners; shows pipeline progress, document status, validation results, score estimate
6. **Export Manager** -- Renders structured content to PDF via @react-pdf/renderer, applies naming convention, assembles folder structure, creates ZIP

**Key architectural patterns:**
- Firestore as pipeline state machine (no custom pub/sub needed)
- Invalidation DAG for regeneration (upstream changes mark downstream docs stale)
- Prompt-as-code (templates versioned in git, deployed with Cloud Functions)
- Single formatting utility for all MXN amounts

See `.planning/research/ARCHITECTURE.md` for full Firestore data model, component deep dives, anti-patterns, and build order rationale.

### Critical Pitfalls

1. **Financial rounding cascades** -- JavaScript floating-point arithmetic causes the four budget totals to diverge by $1+. Use integer centavo arithmetic and derive all totals from a single canonical financial model. Never compute the same total in two code paths.

2. **AI-generated numbers are hallucinated** -- Claude invents plausible but wrong financial figures. All monetary values MUST come through `{{variable}}` injection. Post-process every AI output to extract and validate all dollar amounts against the canonical model.

3. **Title inconsistency across 12+ documents** -- AI may normalize, re-capitalize, or strip accents from the project title. Store the canonical title once, inject it as a literal string with explicit "do not modify" guardrails, and run character-by-character verification post-generation.

4. **Fee cross-matching failures** -- Producer/director/screenwriter fees diverge between contracts, budget, and cash flow because they are generated independently. Store each fee once; budget, contracts, and flujo all read from that single source.

5. **Screenplay PDF parsing produces garbage** -- Non-standard formats, scanned PDFs, and unusual fonts cause the parser to miscount scenes or misidentify locations. Build a manual correction UI (not just a confirmation button), validate parse output against heuristics, and reject scanned PDFs early.

6. **AI generates English or generic Spanish** -- Claude defaults to anglicisms or Peninsular Spanish. Programmatically append the `GUARDARRAILES_IDIOMA` language block to every API call and run an automated anglicism scan post-generation.

See `.planning/research/PITFALLS.md` for 18 pitfalls total (7 critical, 7 moderate, 4 minor), phase-specific warnings, and EFICINE rejection trigger mapping.

## Implications for Roadmap

Based on combined research, the build order is strictly dictated by data dependencies: each component needs the previous component's outputs to function. The critical path is 5 phases deep with no shortcuts.

### Phase 1: Scaffold + Data Model + Intake Wizard
**Rationale:** Everything depends on the data model. The wizard is the entry point for all data. Without persisted project data in Firestore, no other component can function. The financial data model decisions made here (integer centavos, single-source fees, single-source title) prevent the top 4 critical pitfalls.
**Delivers:** React project scaffold, Firebase config, Firestore schema with subcollections, 5-screen intake wizard (Spanish UI), multi-project support, basic routing.
**Addresses:** Table stakes features 1, 13, 14, 15 (wizard, multi-project, Spanish UI, amount/date formatting).
**Avoids:** Pitfalls 1 (rounding -- by choosing integer arithmetic), 3 (title -- by establishing single source), 4 (fees -- by establishing single source), 12 (in-kind -- by explicit modeling), 18 (Firestore limits -- by using subcollections).
**Stack:** React 19, Vite 8, TypeScript, Tailwind v4, shadcn/ui, React Hook Form, Zod, Firebase client SDK, React Router v7, Zustand, date-fns.

### Phase 2: Screenplay Parser
**Rationale:** The screenplay analysis is the foundation for ALL AI generation passes. Building this second validates the Cloud Functions + Claude API integration pattern that the entire pipeline will reuse. It is the highest-risk parsing component and needs early validation.
**Delivers:** PDF upload to Storage, Cloud Function for text extraction + Claude analysis, parsed breakdown stored in Firestore, manual correction UI for user to review/fix scene data.
**Addresses:** Table stakes feature 2 (screenplay parsing).
**Avoids:** Pitfall 5 (garbage parsing -- manual correction UI and heuristic validation built in from the start).
**Stack:** unpdf (Cloud Functions), @anthropic-ai/sdk (Cloud Functions), Firebase Storage triggers.

### Phase 3: AI Document Generation Pipeline
**Rationale:** This is the core value of the application. It must come before validation (which validates generated docs) and before export (which packages them). The pipeline architecture -- idempotent per-document generation, status tracking, dependency graph, prompt variable injection -- is the most complex component and the highest-risk phase.
**Delivers:** Pipeline orchestrator Cloud Function, all 6 generation passes, prompt template loading + variable substitution, pipeline progress tracking via Firestore, staleness detection.
**Addresses:** Table stakes features 3, 5, 6 (AI generation, title enforcement, fee matching). Differentiator feature 1 (one-click regeneration foundation).
**Avoids:** Pitfalls 2 (hallucinated numbers -- strict variable injection), 6 (language -- programmatic guardrails), 8 (stale dependencies -- DAG tracking), 9 (prohibited expenditures -- deterministic source assignment), 14 (API failures -- idempotent generation with per-document retry).
**Stack:** @anthropic-ai/sdk, Firebase Cloud Functions v2, prompt templates from `prompts/`.

### Phase 4: Validation Engine + Dashboard
**Rationale:** Validation needs both user data (Phase 1) AND generated documents (Phase 3). Building it after generation means testing against real outputs. Client-side validators for intake forms can be backfilled for the wizard screens built in Phase 1.
**Delivers:** All 13 validation rules (blocker + warning classification), client-side real-time validators for intake, server-side post-generation validators, traffic light dashboard, score estimation engine, document completeness checklist.
**Addresses:** Table stakes features 4, 7, 8, 9 (financial reconciliation, compliance, completeness, dashboard). Differentiators 2, 3, 4, 5, 8 (score estimation, real-time validation, prohibited scanning, bonus advisor, date compliance).
**Avoids:** Pitfalls 7 (document expiration -- date tracking), 10 (screenwriter 3% -- correct calculation with IVA), 12 (in-kind caps), 13 (gestor cap), 16 (bonus eligibility).
**Stack:** Zod refinements, TanStack React Query for Firestore reads, Firestore onSnapshot for real-time dashboard.

### Phase 5: Export Manager
**Rationale:** Final step. Needs everything upstream working: project data, generated docs, uploaded docs, validation status. PDF generation and ZIP packaging are well-understood problems with low technical risk.
**Delivers:** PDF rendering from structured content, IMCINE file naming sanitization, organized folder structure, ZIP compilation, download flow, final pre-export validation sweep.
**Addresses:** Table stakes features 10, 11, 12 (PDF generation, ZIP export, upload management integration).
**Avoids:** Pitfall 11 (accent stripping in filenames -- separate sanitization function from content handling).
**Stack:** @react-pdf/renderer, JSZip, file-saver.

### Phase Ordering Rationale

- **Strictly sequential because of data dependencies:** Each phase's output is the next phase's input. You cannot generate documents without parsed screenplay data (Phase 2 before 3). You cannot validate documents that do not exist yet (Phase 3 before 4). You cannot export unvalidated documents (Phase 4 before 5).
- **Financial architecture decisions front-loaded:** The top 4 critical pitfalls all relate to financial data consistency. Phase 1's data model must make independent computation of the same total structurally impossible. This is cheaper to build correctly than to fix later.
- **AI integration validated early in Phase 2:** The screenplay parser is a smaller, self-contained Cloud Function + Claude integration. Success here de-risks the much larger Phase 3 pipeline. If Claude API integration has issues, you discover them on one function, not twenty.
- **Validation split from generation:** Validation rules are pure functions that can be unit-tested against mock data during Phase 3 development, then integrated with real data in Phase 4.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Screenplay Parser):** PDF text extraction quality varies wildly across screenplay formats. Need to test unpdf against real Mexican screenplay PDFs (Final Draft, WriterSolo, Word exports). The 75% text / 13% structure recovery stat from research is concerning. May need fallback to pdfjs-dist with coordinate-based extraction.
- **Phase 3 (AI Generation Pipeline):** Cloud Functions v2 has a 540-second timeout. Full pipeline may exceed this. Need to validate the chained-function approach vs. a single checkpointed function. Also need to test Claude's behavior with 30K+ token screenplay contexts and Spanish-only generation quality.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffold + Intake):** React + Firebase + multi-step wizard is an extremely well-documented pattern. shadcn/ui provides wizard components. No research needed.
- **Phase 4 (Validation Engine):** Pure Zod validation functions. Well-understood pattern. The rules themselves are documented in `references/validation_rules.md`.
- **Phase 5 (Export Manager):** @react-pdf/renderer + JSZip is straightforward. File naming sanitization is a deterministic utility function. Standard patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are established, well-documented, and compatible. Versions verified current as of March 2026. Only MEDIUM confidence on unpdf (newer library, may need pdfjs-dist fallback). |
| Features | HIGH | Feature list derived from first-party project documentation (app_spec.md, validation_rules.md, scoring_rubric.md). EFICINE rules are government-published and stable. |
| Architecture | HIGH | Standard React + Firebase patterns. Pipeline architecture is well-documented in the project spec. Firestore data model matches the domain structure naturally. |
| Pitfalls | HIGH | Pitfalls derived from first-party EFICINE rejection triggers in app_spec.md, supplemented by general LLM/PDF research. The financial consistency pitfalls are the most critical and the most well-documented. |

**Overall confidence:** HIGH

### Gaps to Address

- **unpdf vs pdfjs-dist for screenplay parsing:** MEDIUM confidence on unpdf handling screenplay-specific formatting (scene headers, character names in ALL CAPS). Test with real screenplay PDFs early in Phase 2. Have pdfjs-dist as a validated fallback.
- **Claude API token limits with full screenplay context:** Each generation pass sends prior outputs as context, compounding token usage. Need to measure actual token counts with a real 120-page screenplay and verify they fit within Claude's context window with room for the prompt template.
- **Cloud Functions v2 timeout for full pipeline:** The 540-second limit may be tight for 15+ sequential API calls. Need to validate whether chained functions or a single checkpointed function is the better pattern. Test in Phase 2 with the screenplay parser as a proxy.
- **@react-pdf/renderer with complex Mexican Spanish text:** Need to verify that the library correctly renders accented characters (a, e, i, o, u with tildes, enes) and handles the table-heavy FORMATO layouts (cash flow matrix, financial scheme). Test early with a prototype FORMATO in Phase 1.
- **No authentication in v1:** The app has no auth. This is fine for an internal single-user tool, but Firebase security rules must still be configured to prevent accidental public access to Firestore/Storage. Use IP allowlisting or a simple environment check.

## Sources

### Primary (HIGH confidence)
- `directives/app_spec.md` -- Full application specification, document map, 14 rejection triggers, pipeline architecture
- `references/validation_rules.md` -- 13 cross-module validation rules with severity classifications
- `references/scoring_rubric.md` -- EFICINE scoring criteria and rubric signals
- `directives/politica_idioma.md` -- Language policy, protected terms, prose quality guidelines
- `schemas/*.json` -- Firestore data model schemas

### Secondary (MEDIUM confidence)
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) -- Build tool capabilities
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS framework changes
- [React Router v7](https://reactrouter.com/) -- Routing capabilities
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) -- PDF generation API
- [unpdf on GitHub](https://github.com/unjs/unpdf) -- PDF text extraction
- [unpdf vs pdf-parse vs pdfjs-dist comparison (2026)](https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026)

### Tertiary (LOW confidence)
- [The PDF Problem: Why AI Struggles to Read Documents (2026)](https://medium.com/@umesh382.kushwaha/the-pdf-problem-why-ai-struggles-to-read-the-documents-that-run-your-business-173673150c05) -- PDF parsing challenges (general, not screenplay-specific)
- [Long-Form Generation with LLMs](https://brics-econ.org/long-form-generation-with-large-language-models-how-to-keep-structure-coherence-and-facts-accurate) -- LLM consistency issues (general research)

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
