# Domain Pitfalls

**Domain:** EFICINE Article 189 submission dossier generator (Mexican government film tax incentive)
**Researched:** 2026-03-21

---

## Critical Pitfalls

Mistakes that cause application rejection, data corruption, or full rewrites.

---

### Pitfall 1: Financial Rounding Cascades Break the Golden Equation

**What goes wrong:** The four totals that MUST be identical (presupuesto resumen, presupuesto desglose, flujo de efectivo, esquema financiero) drift apart because rounding is applied at different stages of calculation. AI generates a budget with line items that round independently; when those line items flow into the flujo de efectivo or esquema financiero, subtotals diverge by $1-$100 MXN. EFICINE rejects applications where these numbers differ by even $1.

**Why it happens:** JavaScript floating-point arithmetic (`0.1 + 0.2 !== 0.3`), rounding at line-item level vs. subtotal level, AI generating approximate numbers, and multiple code paths computing the same total independently.

**Consequences:** Validation Rule #1 (BLOCKER) fires. Application rejected without evaluation.

**Prevention:**
- Use integer arithmetic in centavos (multiply all MXN amounts by 100, compute in integers, divide only for display). Or use a decimal library like `decimal.js`.
- Establish a SINGLE source of truth for every financial number. Budget line items are the canonical source; all other documents (flujo, esquema, contracts) DERIVE from them, never compute independently.
- Round only at the final display step, never at intermediate calculation steps.
- Build the golden equation assertion as an invariant that runs on every save, not just at export time.

**Detection:** Run the 4-way equality check after every financial data change, not just at validation time. If it fails during development, the architecture is wrong.

**Phase:** Phase 3 (Validation Engine) must enforce this, but the architecture decision belongs in Phase 1 (Data Model). The financial data model must be designed so independent computation of the same total is structurally impossible.

---

### Pitfall 2: AI-Generated Numbers Are Hallucinated, Not Calculated

**What goes wrong:** Claude generates budget line items, crew rates, or fee amounts that look plausible but are invented. A "line producer persona" prompt asks for a budget breakdown, and the LLM outputs numbers that don't sum correctly, use stale crew rates, or contradict the financial structure the user entered. Worse: the AI might generate a budget total of $18,500,000 when the user entered $19,200,000 as their estimated total.

**Why it happens:** LLMs are text generators, not calculators. They pattern-match numbers from training data. Even with explicit instructions to "make sure numbers add up," outputs routinely contain arithmetic errors. Stanford/MIT research (2025) found 60%+ of LLM outputs over 3,000 words contain internal contradictions.

**Consequences:** Every downstream document inherits wrong numbers. The fee cross-matching rules (#3) fail. The financial reconciliation (#1) fails. The 3% screenwriter rule (#1.3) may be violated. Entire regeneration cascade needed.

**Prevention:**
- NEVER trust AI-generated numbers as final values. Use AI for structure and prose only; all financial figures must come from deterministic code.
- Build a calculation engine that takes user-input totals and percentage rules, then generates exact line items. AI fills in the prose around those numbers.
- Use `{{variable}}` injection for every monetary value in AI prompts. The prompt templates already support this pattern -- enforce it rigorously.
- Post-process every AI output: extract all `$X,XXX,XXX MXN` patterns and validate each against the canonical financial model.

**Detection:** Automated test: generate a document, extract all monetary figures with regex, compare against the financial model. Any mismatch = pipeline bug.

**Phase:** Phase 4 (AI Document Generation) is where this hits hardest. The prompt architecture in `prompts/` already uses `{{variable}}` placeholders -- the implementation must ensure ALL numbers come via injection, never from AI completion.

---

### Pitfall 3: Title Inconsistency Across 12+ Documents

**What goes wrong:** The project title appears in 12+ documents (see Validation Rule #2). A single character difference -- an accent missing, a subtitle dropped, a different capitalization -- triggers rejection. AI-generated documents may subtly alter the title ("El Godin de los Cielos" vs "El Godín de los Cielos" vs "EL GODIN DE LOS CIELOS").

**Why it happens:** Title is entered once but rendered in many contexts. AI may "normalize" or "improve" the title. PDF generation may strip diacritics. File naming convention (no accents, max 15 chars) creates a sanitized version that could leak into document content. Copy-paste across prompts introduces variation.

**Consequences:** Validation Rule #2 (BLOCKER). Application rejected.

**Prevention:**
- Store the canonical title ONCE in Firestore. Every document generation pulls from this single field -- never from user re-entry or AI completion.
- The AI prompts must inject the title as a literal string that the model is instructed to reproduce exactly, with explicit guardrails: "Do NOT modify, abbreviate, capitalize differently, or remove accents from the project title."
- Build a title-consistency checker that extracts the title from every generated document and does character-by-character comparison against the canonical version.
- File naming sanitization (no accents, 15 chars) is a SEPARATE field from the display title. Never confuse the two.

**Detection:** Post-generation scan: regex-extract title occurrences from all generated documents, assert exact match against canonical title.

**Phase:** Phase 1 (Data Model) must establish the single-source title. Phase 4 (AI Generation) must inject it literally. Phase 3 (Validation) must verify it across all outputs.

---

### Pitfall 4: Fee Cross-Matching Failures Between Contracts and Budget

**What goes wrong:** The producer's fee in contract B3 says $500,000 but the budget line A9b says $450,000. The screenwriter's fee in the cesion de derechos (C2b) doesn't match the budget. The director's fee in the contract doesn't match the flujo de efectivo. These triple- and quadruple-matches (Validation Rules #3.1-3.4) are the second most common rejection trigger after financial reconciliation.

**Why it happens:** Fees are entered or generated in multiple places: the creative team form (Screen 3), the budget generator (AI Pass 1), the contract generator (AI Pass 3). If these are generated independently, they WILL diverge. A user might update a fee in the intake wizard without triggering contract regeneration.

**Consequences:** Validation Rule #3 (BLOCKER). Multiple documents must be regenerated, potentially cascading to flujo and esquema.

**Prevention:**
- Each person's fee is stored ONCE in the data model. The budget, contracts, and flujo all read from this single source.
- Implement reactive regeneration: when a fee changes, flag all documents that reference it as stale. The "one-click regeneration" requirement in PROJECT.md is specifically for this.
- Never allow AI to invent fees. Fees come from user input, period.

**Detection:** Validation Rule #3 should run continuously, not just at export. Show a real-time warning the moment any fee diverges.

**Phase:** Phase 1 (Data Model) -- fees as single-source fields. Phase 3 (Validation) -- continuous cross-matching. Phase 4 (AI Generation) -- inject fees, never generate them.

---

### Pitfall 5: Screenplay PDF Parsing Produces Garbage

**What goes wrong:** The uploaded screenplay PDF uses non-standard formatting, is a scan rather than digital text, uses unusual fonts, or was exported from software that creates PDFs with mangled text layers. The parser extracts garbled scene headings, miscounts scenes, merges characters, or misidentifies INT/EXT/DAY/NIGHT. All downstream AI generation (budget, schedule, propuesta de produccion) is based on this parse, so garbage in = garbage everywhere.

**Why it happens:** Screenplays come in wildly varying formats. Industry-standard software (Final Draft, WriterSolo, Fade In, Highland, Celtx) each produce different PDF structures. Mexican screenwriters also use Word, Google Docs, or LaTeX. 2025 benchmarks show PDF parsers scoring 75% on text extraction but only 13% on structure recovery. Scanned PDFs from older scripts have no text layer at all.

**Consequences:** Wrong scene count leads to wrong budget (wrong number of shooting days). Wrong location list leads to wrong propuesta de produccion. Wrong character list leads to incomplete ficha tecnica. User loses trust in the tool when obvious errors appear.

**Prevention:**
- Build the parser to handle the 80% case (Final Draft / Fountain format PDFs with clean text layers) and provide a manual correction UI for the 20%.
- Screen 2 (Screenplay Upload) already specifies "user confirms/corrects breakdown data" -- this MUST be a real editing interface, not just a confirmation button.
- Use `pdf-parse` or `pdf.js` for text extraction, then apply screenplay-specific regex patterns for scene headings (`INT.`, `EXT.`, `INT./EXT.`), character names (ALL CAPS lines before dialogue), and transitions.
- For scanned PDFs: detect the absence of a text layer and prompt the user to upload a digital version rather than attempting OCR.
- Validate parse output against heuristics: a feature screenplay should have 60-150 scenes, 5-40 speaking characters, and scene headings should contain location + time-of-day.

**Detection:** If the parser returns fewer than 30 scenes or more than 200, or zero INT/EXT markers, flag it as likely failed. Show the user a preview of parsed data BEFORE proceeding to generation.

**Phase:** Phase 2 (Screenplay Parser). This is a standalone phase specifically because it's hard and must be reliable before any AI generation depends on it.

---

### Pitfall 6: AI Generates English or Neutral Spanish Instead of Mexican Spanish

**What goes wrong:** Claude's default behavior generates text that sounds like translation from English, uses Peninsular Spanish conventions ("vosotros", "ordenador"), or inserts English terms ("el shooting schedule", "el budget"). Generated documents read as corporate-generic rather than as a professional Mexican film producer would write. Evaluators at IMCINE read hundreds of carpetas and immediately spot AI-generated boilerplate.

**Why it happens:** Claude's training data is predominantly English. Even with Spanish system prompts, the model can code-switch, especially for technical/financial terms. The `politica_idioma.md` explicitly lists dozens of terms that must NEVER be translated, but the AI may still default to anglicisms.

**Consequences:** Documents feel inauthentic. Evaluators penalize vague, generic prose (the politica_idioma examples show exactly what bad vs. good looks like). In extreme cases, English text in a submitted document is a rejection trigger (Gotcha #11).

**Prevention:**
- The prompts in `prompts/` already include a mandatory language instruction block. This MUST be appended to every prompt, not just some.
- Post-generation validation: scan all generated text for common anglicisms (`budget`, `schedule`, `cast`, `location`, `shooting`, `deadline`, `timeline`). Flag any occurrences.
- Use the tone examples from `politica_idioma.md` as few-shot examples in prompts. The difference between "La pelicula sera filmada en diversas locaciones" (bad) and the specific, concrete alternative is what separates a 70-point score from a 95-point score.
- Include a `GUARDARRAILES_IDIOMA` constant that is programmatically appended to every AI call. Never rely on developers remembering to add it manually.

**Detection:** Automated anglicism detector: maintain a blocklist of English words that should never appear in generated documents. Run it post-generation.

**Phase:** Phase 4 (AI Document Generation). The language guardrails must be built into the generation pipeline infrastructure, not added per-prompt.

---

### Pitfall 7: Document Expiration Dates Not Tracked

**What goes wrong:** The user uploads an insurance quote dated November 2025 for a Period 1 submission (closes February 13, 2026). That's 3+ months old at close date -- rejected. The user doesn't realize the document expired because the app didn't warn them. This applies to insurance quotes, CPA quotes, bank statements, bank letters, third-party support letters, and in-kind quotes.

**Why it happens:** Document uploads are treated as static files rather than time-sensitive artifacts. The app stores the file but doesn't extract or track the issue date. The 3-month window is easy to miss because the registration period is known in advance but documents are gathered over weeks/months.

**Consequences:** Validation Rule #4 (BLOCKER). Documents must be re-obtained, which may take days or weeks (insurance companies, CPAs, banks all have their own timelines).

**Prevention:**
- When a user uploads a dated document (insurance, CPA, bank), require them to enter the issue date as metadata.
- Calculate and display the expiration date based on the selected registration period's close date.
- Show countdown warnings: "This document expires in X days for Period 1" or "This document is already expired for Period 1."
- On the dashboard, flag any document that will expire before the registration period closes.

**Detection:** Traffic light dashboard: any dated document within 2 weeks of expiration = yellow. Already expired = red.

**Phase:** Phase 1 (Data Model -- date fields on uploaded documents), Phase 3 (Validation -- date compliance checks), Phase 5 (Export -- final expiration check before ZIP).

---

## Moderate Pitfalls

---

### Pitfall 8: AI Generation Pipeline Ordering Creates Stale Dependencies

**What goes wrong:** The 4-pass AI pipeline (Line Producer -> Finance -> Legal -> Combined) creates a dependency chain. If the user changes data after Pass 1 runs but before Pass 4, the combined documents reference stale data from Pass 1. Worse: if the user regenerates Pass 1, Passes 2-4 are now stale but the app doesn't invalidate them.

**Why it happens:** Document generation is treated as a one-shot process rather than a reactive dependency graph. Each pass's output feeds the next, but there's no mechanism to track which outputs depend on which inputs.

**Prevention:**
- Model document dependencies as a DAG (directed acyclic graph). Each generated document tracks which input data and which prior documents it depends on.
- When any input changes, mark all downstream documents as "stale" and show this visually on the dashboard.
- Implement the "one-click regeneration" as a cascade: changing the budget triggers re-generation of flujo, esquema, contracts, and all combined docs.
- Store a hash of the inputs used for each generation. Compare current inputs against stored hash to detect staleness.

**Detection:** Visual indicator on each document: "Generated with current data" (green) vs. "Data has changed since generation" (amber).

**Phase:** Phase 4 (AI Document Generation) -- dependency tracking must be built into the pipeline architecture from the start.

---

### Pitfall 9: EFICINE Prohibited Expenditure Items Leak Into Budget

**What goes wrong:** The AI-generated budget includes line items that EFICINE funds cannot legally pay for: pre-production expenses before receiving the stimulus, distribution costs, carpeta preparation, completion bonds, mark-ups on production services, or fixed asset purchases. The flujo de efectivo then shows EFICINE money flowing to these items.

**Why it happens:** The AI generates a "realistic" film budget that includes items any production would need, but doesn't know which funding SOURCE each item is assigned to. The mapping of expenditure categories to funding sources is a business logic problem, not a prose generation problem.

**Consequences:** Validation Rule #7 (BLOCKER). Requires restructuring the entire flujo de efectivo.

**Prevention:**
- Maintain a hardcoded list of prohibited EFICINE expenditure categories (from Validation Rule #7 and app_spec). This is deterministic business logic, not AI territory.
- When generating the flujo de efectivo, the code (not AI) assigns funding sources to line items. EFICINE funds are automatically excluded from prohibited categories.
- Post-generation scan: check every line item where `source == "EFICINE"` against the prohibited list.

**Detection:** Automated validation rule that fires on every flujo save, not just at export.

**Phase:** Phase 3 (Validation) for the check, Phase 4 (AI Generation) for ensuring the flujo generation respects the prohibited list.

---

### Pitfall 10: Screenwriter 3% Rule Miscalculated

**What goes wrong:** The screenwriter fee appears to meet the 3% threshold, but the calculation is wrong because: (a) IVA (16% tax) was not included when it should have been, (b) adaptation rights, script doctor fees, or consultant payments were incorrectly counted toward the 3%, or (c) the 3% was calculated against the wrong base (EFICINE amount instead of total budget).

**Why it happens:** The 3% rule has specific exclusions (Validation Rule #1.3): only FINAL SCREENPLAY AUTHORSHIP counts. Adaptation rights, script doctors, consultants, translations, and readings are explicitly excluded. Additionally, the fee must be calculated "con IVA" (with tax), which changes the math.

**Consequences:** Validation Rule #1.3 (BLOCKER). Screenwriter underpayment = rejected (Gotcha #8).

**Prevention:**
- Separate "screenwriter final authorship fee" from "other writing-related payments" in the data model. Only the authorship fee counts toward 3%.
- Always calculate with IVA included (multiply by 1.16 for standard IVA rate).
- Show the user the exact calculation: `$AMOUNT x 1.16 = $AMOUNT_CON_IVA >= 3% of $TOTAL_BUDGET`.
- If the fee is below 3%, make it a hard blocker that prevents export, with a clear message explaining exactly how much more is needed.

**Detection:** Real-time calculation on the financial structure screen. Warn as soon as the entered screenwriter fee is below threshold.

**Phase:** Phase 1 (Data Model -- separate fee fields), Phase 3 (Validation -- 3% check with correct calculation), Phase 4 (AI Generation -- cesion de derechos contract must reflect the exact fee).

---

### Pitfall 11: PDF Export Mangles Accents and Special Characters in File Names

**What goes wrong:** Generated PDF files are named with accents ("A1_Resumen_Ejecutivo_Pelicula.pdf"), tildes ("A7_PP_Ninos.pdf"), or exceed 15 characters. The SHCP upload system silently rejects or corrupts these files. Alternatively, the sanitization strips accents from file names but accidentally strips them from file CONTENT too, producing documents where "produccion" appears instead of "produccion" -- wait, or "produccion" instead of "produccion" with accent.

**Why it happens:** File naming sanitization and document content generation share code paths or the sanitization function is applied too broadly. JavaScript's `normalize('NFD').replace(/[\u0300-\u036f]/g, '')` strips accents perfectly for file names but is catastrophic for document content.

**Consequences:** Validation Rule #9 (BLOCKER) if file names are wrong. Document quality degradation if content accents are stripped. Both are rejection triggers.

**Prevention:**
- File name sanitization is a COMPLETELY SEPARATE function from document content handling. Never share string-processing utilities between the two.
- Build the file naming function to: (1) strip accents, (2) remove all non-alphanumeric except underscore, (3) truncate to 15 chars, (4) ensure `.pdf` extension. Test it with the worst-case project title: "Los Ninos de la Montana: Una Historia de Amor y Revolucion."
- The export_manager.json schema already defines naming rules -- implement them as a dedicated utility with comprehensive tests.

**Detection:** Unit tests for file naming with edge cases: accents, enes, long titles, special characters. Integration test: generate a full package, check every file name matches the regex `^[A-Za-z0-9_]{1,15}\.pdf$`.

**Phase:** Phase 5 (Export Manager). But the file naming utility should be built and tested early, potentially in Phase 1, since it's a deterministic function.

---

### Pitfall 12: In-Kind Contribution Double-Counting

**What goes wrong:** An in-kind contribution (crew member donating part of their fee) is counted toward the budget total AND counted as a separate contribution, inflating the total budget and changing all percentage calculations. Or: in-kind is counted correctly in the budget but the 10% cap check uses the wrong denominator.

**Why it happens:** In-kind contributions occupy a confusing space: they're both an EXPENSE (the person's full fee appears in the budget) and a SOURCE (the donated portion appears in the esquema financiero). The validation rules (#1.4) require: total in-kind via honorarios <= 10% of total budget, AND each person's in-kind <= 50% of their total fee.

**Consequences:** Validation Rules #1.4 (BLOCKER). Budget appears inflated, percentage calculations are wrong, EFICINE compliance thresholds shift.

**Prevention:**
- Model in-kind contributions explicitly: each team member has `total_fee` and `inkind_portion`. The budget always shows `total_fee`. The esquema financiero shows `inkind_portion` as a funding source.
- The total budget is the sum of all expenses (not the sum of funding sources). In-kind doesn't change the budget total; it changes how the budget is FUNDED.
- Build percentage calculations that clearly distinguish "% of budget" from "% of funding."

**Detection:** Assert: sum of all funding sources (cash + in-kind from all parties) == total budget. If these diverge, in-kind is being double-counted.

**Phase:** Phase 1 (Data Model -- explicit in-kind modeling), Phase 3 (Validation -- cap checks).

---

### Pitfall 13: Gestor de Recursos Fee Cap Miscalculated

**What goes wrong:** The gestor (resource manager / fundraiser) fee exceeds the allowed cap: 5% of EFICINE amount for requests up to $10M, or 4% for requests over $10M. Additionally, the gestor fee must come from ERPI's own contribution, NOT from EFICINE funds.

**Why it happens:** The threshold is a step function ($10M boundary), not a simple percentage. Developers may apply the wrong cap or fail to enforce the funding source restriction. The gestor fee is also sometimes buried in "administrative costs" in the budget rather than broken out as a separate line.

**Consequences:** Validation Rule #1.5 (BLOCKER).

**Prevention:**
- Require explicit gestor fee entry as a separate field (not hidden in admin costs).
- Implement the step function clearly: `if eficine_request > 10_000_000 then max 4% else max 5%`.
- In the flujo de efectivo, programmatically ensure the gestor fee line item's source is "ERPI" never "EFICINE."

**Detection:** Real-time validation on the financial structure screen.

**Phase:** Phase 3 (Validation), Phase 4 (flujo de efectivo generation must respect the source restriction).

---

### Pitfall 14: Claude API Rate Limits and Timeout During 4-Pass Generation

**What goes wrong:** The 4-pass document generation pipeline involves 10+ sequential API calls to Claude, each potentially processing a full screenplay plus context. A single timeout, rate limit, or API error mid-pipeline leaves the project in an inconsistent state: Pass 1 completed, Pass 2 partially completed, Passes 3-4 not started.

**Why it happens:** Anthropic API has rate limits (tokens per minute, requests per minute). A full screenplay can be 20,000-40,000 tokens. Each pass sends prior outputs as context, compounding token usage. Network interruptions happen.

**Consequences:** Partially generated documents that reference each other inconsistently. User confusion about what's complete and what's not. Wasted API credits on retries.

**Prevention:**
- Make each document generation IDEMPOTENT. Store results per-document in Firestore. If a pass fails, retry that specific document, not the entire pipeline.
- Implement a generation queue with status tracking: `pending -> generating -> complete -> error`. Show status per document on the dashboard.
- Use Firebase Cloud Functions (not client-side) for API calls to avoid browser timeouts.
- Implement exponential backoff with jitter for rate limit errors.
- Set realistic timeouts (2-3 minutes per document, given 200K+ token context windows).

**Detection:** Generation status dashboard showing each document's state. If any document is stuck in "generating" for more than 5 minutes, flag it.

**Phase:** Phase 4 (AI Document Generation) -- pipeline architecture must handle partial failure gracefully from day one.

---

## Minor Pitfalls

---

### Pitfall 15: Ruta Critica and Flujo de Efectivo Timeline Desync

**What goes wrong:** The ruta critica says rodaje happens in Month 3, but the flujo de efectivo shows production spending in Month 5. This isn't a hard rejection trigger (it's Validation Rule #11, a WARNING), but evaluators notice and it signals a poorly planned project.

**Prevention:** Derive both the ruta critica timeline and the flujo de efectivo spending timeline from the SAME underlying schedule model. Don't generate them independently.

**Phase:** Phase 4 (AI Generation) -- Pass 1 (schedule) must feed Pass 2 (financial) with explicit timeline data.

---

### Pitfall 16: Bonus Points Category Selection Errors

**What goes wrong:** The user selects a bonus points category (e.g., "directora mujer") but the director is co-directing with a man, which disqualifies the bonus. Or: the user claims "descentralizacion regional" but the ERPI's fiscal domicile is in CDMX metro area. Bonus categories are non-cumulative (only ONE can apply), and each has specific eligibility criteria.

**Prevention:** Auto-evaluate bonus eligibility based on entered data. Don't let the user freely select a category; instead, show which categories they QUALIFY for and which they don't, with explanations.

**Phase:** Phase 3 (Validation) -- bonus eligibility is a rule check, not a user choice.

---

### Pitfall 17: Co-Production Rules Silently Ignored

**What goes wrong:** The project is flagged as an international co-production but the app doesn't enforce the special rules: IMCINE prior recognition certificate, territorial budget split (national vs. foreign spend), foreign currency conversion with exchange rate at registration date, and justification of Mexican creative participation.

**Prevention:** When `es_coproduccion_internacional == True`, activate a separate validation pathway (Rule #12) that adds these as BLOCKER requirements. Don't bury co-production rules in the general flow.

**Phase:** Phase 1 (Data Model -- conditional fields), Phase 3 (Validation -- conditional rule activation).

---

### Pitfall 18: Firebase Firestore Document Size Limits

**What goes wrong:** A generated document (especially the presupuesto desglosado with hundreds of line items, or the flujo de efectivo as a multi-dimensional matrix) exceeds Firestore's 1MB document size limit. The save fails silently or throws an opaque error.

**Prevention:** Structure the Firestore data model with subcollections for large datasets. Budget line items should be a subcollection of the budget document, not embedded arrays. The flujo de efectivo matrix should be stored as a collection of rows, not a single nested object.

**Detection:** Monitor document sizes during development. If any document approaches 500KB, restructure.

**Phase:** Phase 1 (Data Model) -- must be designed with Firestore limits in mind from the start.

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Data Model | Single-source principle not enforced for financial data, titles, and fees | Design the schema so every datum has ONE canonical location. Other documents reference it, never duplicate it. |
| Phase 1: Data Model | Firestore document size limits for complex financial matrices | Use subcollections for budget line items, flujo rows, and team members. |
| Phase 2: Screenplay Parser | Non-standard PDF formats produce garbage parse results | Build a robust manual correction UI. Detection heuristics for failed parses. Reject scanned PDFs early. |
| Phase 3: Validation | Validation rules run only at export time instead of continuously | Implement real-time validation that fires on every data change. The traffic light dashboard must be live. |
| Phase 3: Validation | 3% screenwriter rule calculated without IVA or with wrong fee components | Separate authorship fee from other writing payments. Always calculate con IVA. |
| Phase 4: AI Generation | AI invents numbers instead of using injected values | All monetary values MUST come through `{{variable}}` injection. Post-generation extraction and validation of all figures. |
| Phase 4: AI Generation | AI generates English, Peninsular Spanish, or generic boilerplate | Append `GUARDARRAILES_IDIOMA` to every prompt programmatically. Post-generation anglicism scan. |
| Phase 4: AI Generation | Pipeline partial failure leaves inconsistent document state | Idempotent per-document generation with status tracking. Firebase Functions for API calls. |
| Phase 4: AI Generation | Stale dependencies between passes not tracked | DAG-based dependency model. Hash inputs per document. Visual staleness indicator. |
| Phase 5: Export | File naming sanitization bleeds into document content | Completely separate string-processing functions for names vs. content. |
| Phase 5: Export | Expired documents not caught before final export | Final date-compliance sweep with hard block on expired documents. |

---

## EFICINE-Specific Rejection Triggers (from app_spec.md)

The app_spec documents 14 specific rejection triggers. Each maps to pitfalls above:

| Rejection Trigger | Related Pitfall | Severity |
|---|---|---|
| 1. Any missing document | #7 (completeness), Validation Rule #8 | CRITICAL |
| 2. Title mismatch | #3 (title inconsistency) | CRITICAL |
| 3. Fee mismatches | #4 (fee cross-matching) | CRITICAL |
| 4. INDAUTOR title mismatch | #3 (title inconsistency) | CRITICAL |
| 5. Expired documents | #7 (date tracking) | CRITICAL |
| 6. Screenshots as bank proof | UX -- reject screenshot uploads, require official bank letters | MODERATE |
| 7. Missing e.firma | UX -- checklist item, app cannot generate | MODERATE |
| 8. Screenwriter underpayment | #10 (3% rule miscalculation) | CRITICAL |
| 9. In-kind over 10% | #12 (in-kind double-counting) | CRITICAL |
| 10. File naming violations | #11 (accent/character stripping) | CRITICAL |
| 11. Documents not in Spanish | #6 (AI language issues) | CRITICAL |
| 12. Prohibited EFICINE expenditures | #9 (prohibited items in budget) | CRITICAL |
| 13. ERPI paying itself | Business logic check -- persona fisica ERPI cannot receive EFICINE compensation | MODERATE |
| 14. 4th submission attempt | UX -- track submission history per project | LOW |

---

## Sources

- [The PDF Problem: Why AI Struggles to Read Documents (2026)](https://medium.com/@umesh382.kushwaha/the-pdf-problem-why-ai-struggles-to-read-the-documents-that-run-your-business-173673150c05) -- PDF parsing challenges
- [Long-Form Generation with LLMs: Structure, Coherence, and Facts](https://brics-econ.org/long-form-generation-with-large-language-models-how-to-keep-structure-coherence-and-facts-accurate) -- LLM consistency issues in document generation
- [Best Practices for Financial Reporting: Eliminate Rounding Errors](https://blog.fhblackinc.com/best-practices-financial-reporting-eliminate-rounding-errors) -- Financial calculation consistency
- [Testing Financial Apps for Accuracy and Compliance](https://www.softwaretestingmagazine.com/knowledge/testing-financial-apps-for-accuracy-and-compliance/) -- Financial software testing patterns
- `directives/app_spec.md` -- 14 rejection triggers, document map, pipeline architecture (HIGH confidence, primary source)
- `references/validation_rules.md` -- 13 cross-module validation rules (HIGH confidence, primary source)
- `directives/politica_idioma.md` -- Language policy and protected terminology (HIGH confidence, primary source)
