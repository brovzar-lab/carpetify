# Phase 4: Validation Engine + Dashboard - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

17-rule validation engine with traffic light dashboard, score estimation (deterministic viability + 5-persona AI artistic evaluation), real-time validation with tiered timing, document expiration alerts, and actionable improvement suggestions. Consumes data from Phase 1 (intake), Phase 2 (screenplay analysis), and Phase 3 (generated documents). Feeds Phase 5 (export gating).

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout & Navigation
- **D-01:** Dedicated "Validación" screen/tab in main nav — separate from the intake wizard. Too information-dense for a sidebar panel. Wizard stays focused on data entry, dashboard stays focused on compliance review.
- **D-02:** Primary grouping by severity — all blockers first, then all warnings. Within each severity group, organized by rule type. Producer's #1 question is "can I submit?" — blockers answer that immediately at the top.
- **D-03:** Click any rule to see detailed explanation + specific fields/documents involved + "Ir al campo" link that navigates directly to the exact intake field or document to fix. The whole point is eliminating detective work.
- **D-04:** Project cards (Phase 1 D-04) show summary blocker/warning counts as clickable links. Click "3 bloqueadores" → lands in that project's full validation dashboard filtered to blockers. Project cards = "which project needs attention?", validation dashboard = "what exactly is wrong?"

### Score Estimation
- **D-05:** Full 100+5 score estimate with two scoring methods:
  - **Viability (38 pts):** Calculated deterministically from project data (equipo 2, producción 12, plan rodaje 10, presupuesto 10, exhibición 4)
  - **Artistic (62 pts):** Estimated by 5 AI evaluator personas who independently score against the EFICINE rubric criteria, then averaged per category
  - **Bonus (5 pts):** Auto-detected from intake data with strongest eligible category recommended
- **D-06:** Five named AI evaluator personas, each with a `.md` persona file in `prompts/evaluadores/`:
  - **Reygadas** — Director de cine de arte (auteur/arthouse lens)
  - **Marcopolo** — Productor de cine comercial mexicano (commercial viability)
  - **Pato** — Escritor (narrative/screenplay craft)
  - **Leo** — Productor (production solidity)
  - **Alejandro** — Director de cine comercial mexicano (mainstream direction craft)
- **D-07:** Each persona scores every artistic category independently. App shows individual persona scores AND the averaged result. User can manually override/adjust any artistic score if they disagree with the AI estimate.
- **D-08:** Per-category breakdown presentation — each rubric category shows its score (estimated or deterministic). No single misleading total number. Producer sees "my viability scores 34/38, artistic estimate 52/62, bonus +5" as separate sections.
- **D-09:** Improvement suggestions prioritized by point impact — "fix these 2 things for +6 points" style. Show top 3-5 highest-impact improvements ranked by potential point gain, not an exhaustive list.
- **D-10:** Bonus points auto-detect all eligible categories from intake data, show which requirements are met/unmet for each, and highlight the recommended strongest category. Turns hidden 5 points into easy points.

### Validation Timing
- **D-11:** Three tiers of validation timing based on computational cost:
  - **Instant (real-time):** Financial reconciliation, title consistency, fee matching, EFICINE percentages, experience thresholds, ERPI eligibility, document completeness, date compliance, bonus eligibility — fire as user types/edits
  - **Medium (on generation/edit):** Prohibited expenditure scanning, ruta crítica ↔ cash flow sync — fire when a document is generated or edited
  - **Slow (on-demand):** Hyperlink accessibility — fire once on URL entry, cached with "Verificar de nuevo" button
- **D-12:** Hyperlink validation runs once when user enters a URL, caches the result (green/red), with a "Verificar de nuevo" button for re-checking. No repeated HTTP requests on every dashboard open.
- **D-13:** After document generation, validations run automatically but silently update the dashboard. No interrupting notification. Dashboard reflects new validation state when user navigates to it.
- **D-14:** Stale validations: instant rules immediately re-run on data change. Medium/slow rules marked as "pendiente de re-validación" with old status dimmed, re-run when dashboard is opened or document is regenerated.

### Document Expiration Alerts
- **D-15:** Three-tier alert thresholds: green "vigente" with days remaining, yellow at 30 days, red at 14 days, expired (blocker) after 0 days. Affected documents: insurance quote, CPA quote, bank statements, third-party support letters, in-kind quotes.
- **D-16:** Alerts appear in three places: validation dashboard (alongside other rules), document upload screen (Screen 5, next to each affected document), and project card banner on home view if any document expires within 14 days. Three contextually appropriate touchpoints — warning can't be missed.
- **D-17:** Expired document = strict blocker, no dismissal. IMCINE rejects if a document is dated >3 months before close date. No "it's on its way" option. User must upload the replacement before export. No exceptions.
- **D-18:** Expiration dates auto-recalculate whenever the target EFICINE period changes (INTK-02). Switching from Period 1 (Feb 13) to Period 2 (Jul 15) instantly recalculates all countdowns. No manual "recalcular" step. Consistent with real-time approach.

### Claude's Discretion
- Validation engine architecture (rule registry pattern, execution order, dependency between rules)
- Dashboard component design (cards, tables, expandable rows)
- How "Ir al campo" navigation works technically (deep linking to wizard fields)
- Score estimation UI layout (gauges, bars, tables)
- AI evaluator prompt engineering for persona scoring consistency
- How to run 5 persona evaluations efficiently (parallel Cloud Functions, batching)
- Stale validation visual treatment (dimmed, strikethrough, badge)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Validation rules (primary reference)
- `references/validation_rules.md` — All 13 cross-module validation rules with pseudocode. 10 blockers + 3 warnings. This is the specification for the validation engine.

### Scoring rubric
- `references/scoring_rubric.md` — EFICINE evaluation criteria: 62 pts artistic (guion 40, dirección 12, material visual 10) + 38 pts viability (equipo 2, producción 12, plan rodaje 10, presupuesto 10, exhibición 4) + 5 bonus. Minimum 90/100 to pass. Average winning score 94.63/100.

### Data model schemas
- `schemas/modulo_a.json` — Section A fields validated by rules 1-3, 5, 8
- `schemas/modulo_b.json` — Section B fields validated by rules 3, 5, 8
- `schemas/modulo_c.json` — Section C fields validated by rules 2, 4, 6, 8
- `schemas/modulo_d.json` — Section D fields validated by rules 3, 4, 8
- `schemas/modulo_e.json` — Section E fields validated by rules 1, 8
- `schemas/export_manager.json` — File naming/format rules for rule 9

### Language policy
- `directives/politica_idioma.md` — All validation messages, dashboard labels, and improvement suggestions in Mexican Spanish

### Prior phase decisions
- `.planning/phases/01-scaffold-intake-wizard/01-CONTEXT.md` — D-02: traffic light per wizard screen. D-04: project card counts. D-14/D-17/D-22: real-time financial compliance panel (Phase 4 extends this pattern). D-05: projects grouped by EFICINE period (affects expiration calculation).
- `.planning/phases/02-screenplay-processing/02-CONTEXT.md` — D-09: screenplay analysis at `projects/{projectId}/screenplay/analysis`. Feeds artistic scoring.
- `.planning/phases/03-ai-doc-generation/03-CONTEXT.md` — D-08: docs organized by EFICINE section. D-09/D-10: staleness cascade and immediate detection. D-13: financial figures as structured Firestore data. D-15: fees from intake as single source of truth.

### AI generation prompts (for persona scoring reference)
- `prompts/` — All prompt files define what "good" output looks like per document. Persona evaluators need to assess generated content against rubric criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 1 financial compliance panel (D-14, D-22) — pattern for real-time validation display. Extend to all 17 rules.
- Phase 1 traffic light icons (D-02) — reuse green/yellow/red visual language across the validation dashboard.
- Phase 3 staleness detection via timestamps (D-10) — same pattern applies to stale validations.
- Phase 2 Cloud Function pattern — extend for AI persona scoring calls (5 parallel calls).

### Established Patterns
- Real-time Firestore listeners for instant UI updates (Phase 1 auto-save)
- Per-pass timestamps for change detection (Phase 3 D-10)
- Structured financial data in Firestore (Phase 3 D-13) — validation engine reads these directly
- Severity classification: blocker vs warning (consistent across all phases)

### Integration Points
- Intake data from Phase 1 → feeds rules 1-8 (financial, title, fees, dates, experience, ERPI, prohibited, completeness)
- Generated documents from Phase 3 → feeds rules 2, 3, 7, 11 (title in docs, fee cross-matching, prohibited expenditures, ruta crítica sync)
- Uploaded documents from Phase 1 Screen 5 → feeds rules 4, 8, 9, 10 (date compliance, completeness, file format, hyperlinks)
- Validation results → feed Phase 5 export gating (blocker = blocked, warning = flagged but exportable)
- Score estimation → included in Phase 5 export package (EXPRT-03)
- Document expiration → driven by target period from INTK-02

</code_context>

<specifics>
## Specific Ideas

- The 5-persona AI scoring system mimics how the real EFICINE council works — multiple evaluators with different perspectives averaging scores. Using named personas (Reygadas, Marcopolo, Pato, Leo, Alejandro) with distinct filmmaker archetypes produces score variance that's more realistic than a single AI evaluation. The user sees which personas scored high/low and why, giving them actionable insight into how different types of evaluators might receive their project.
- Document expiration is a silent killer in real EFICINE submissions — producers discover at upload time that their insurance quote expired 2 weeks ago and have to scramble. Three-tier alerts at three touchpoints (dashboard, upload screen, project card) make this impossible to miss.
- "Ir al campo" navigation from validation errors to the exact intake field is the single highest-value UX feature in this phase. Without it, the dashboard is just a list of problems. With it, every problem has a one-click fix path.

</specifics>

<deferred>
## Deferred Ideas

- AI-powered pre-submission review simulating full evaluator perspective (AIGEN-V2-01) — v2, overlaps with persona scoring but with deeper analysis
- Historical score calibration against actual EFICINE results — would improve persona accuracy but requires submission outcome data
- Validation rule customization for different EFICINE modalities (postproducción, previamente autorizado) — v2 modality support

</deferred>

---

*Phase: 04-validation-dashboard*
*Context gathered: 2026-03-23*
