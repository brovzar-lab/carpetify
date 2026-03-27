# Phase 15: AI Pre-Submission Review - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-powered qualitative review of the complete carpeta simulating EFICINE evaluator perspectives. Produces section-level critiques per document against the rubric, cross-document coherence checks for narrative/tonal contradictions, and actionable improvement suggestions. Extends Phase 4's numeric score estimation UI with drill-down critique panels. Phase 4 answers "what's my score?" — Phase 15 answers "how do I make it better, specifically?"

</domain>

<decisions>
## Implementation Decisions

### Review Scope & Depth
- **D-01:** Review covers all evaluator-scored documents (~10): resumen ejecutivo (A1), sinopsis (A2), propuesta dirección (A4), material visual (A5), solidez equipo (A6), propuesta producción (A7), plan de rodaje + ruta crítica (A8), presupuesto (A9), propuesta exhibición (A10). Skip compliance docs (contracts, commitment letters, ficha técnica, financial scheme) — those are pass/fail, handled by validation.
- **D-02:** Section-level critique per document, not paragraph-level. "Your risk identification section is weak — 3 challenges listed but only 2 have mitigation strategies." Mirrors how evaluators actually read: check whether each rubric criterion is covered, not line-by-line copyediting.
- **D-03:** Cross-document coherence checks for narrative and tonal contradictions. "Sinopsis presents an intimate drama but propuesta exhibición projects 400 screens." "Propuesta producción promises respectful work but the shooting schedule has 14-hour days for 6 weeks." Highest-value check that no other system performs.
- **D-04:** Rubric alignment verification per document — explicitly check whether every criterion from `references/scoring_rubric.md` is addressed. "Your propuesta de producción addresses 5 of 6 criteria. Missing: crew organization per stage." Turns the rubric into a verifiable checklist.
- **D-05:** **Two-pass architecture (CRITICAL — do NOT stuff all docs into one call):**
  - **Pass 1:** Each persona reviews their assigned documents individually against the rubric. ~12 API calls (per B2 persona-document mapping). Produces per-document findings.
  - **Pass 2:** Takes summaries from Pass 1 plus key excerpts and runs the cross-document coherence check. 1 API call. Produces deduplicated contradiction list.
  - Total: ~13 API calls, NOT 50. Do not overbuild queue/batching infrastructure for this volume.

### Persona Integration
- **D-06:** Reuse the same 5 Phase 4 personas (Reygadas, Marcopolo, Pato, Leo, Alejandro) in "critique mode" instead of "scoring mode." Same voices, different output format. The productor already knows each persona's perspective — leverage that familiarity.
- **D-07:** Each persona reviews only documents relevant to their expertise:
  - **Reygadas** (director cine de arte): propuesta dirección (A4), material visual (A5)
  - **Marcopolo** (productor comercial): propuesta exhibición (A10), presupuesto (A9)
  - **Pato** (escritor): sinopsis (A2), guión alignment
  - **Leo** (productor): propuesta producción (A7), plan de rodaje + ruta crítica (A8)
  - **Alejandro** (director comercial): resumen ejecutivo (A1), solidez equipo (A6)
  This avoids redundant reviews. ~12 persona-document pairs in Pass 1.
- **D-08:** Each persona produces 2-3 specific findings per document. Each finding has: the section/criterion it relates to, what's weak, and a concrete improvement suggestion. Concise and actionable — not review essays. Example: "**Reygadas sobre A4:** Criterio: lenguaje cinematográfico. Debilidad: describes camera movement but not color palette or sound design. Sugerencia: add 2-3 sentences about color grading approach and diegetic vs non-diegetic sound."
- **D-09:** Cross-document coherence panel (Pass 2) outputs a single unified list of contradictions, NOT five separate opinions on the same issue. Each contradiction attributed to whichever persona spotted it. "Marcopolo: Tu sinopsis presenta un drama íntimo pero la propuesta de exhibición proyecta 400 pantallas — esto no es coherente." One finding, one voice, no duplication.

### Presentation & Workflow
- **D-10:** Review appears as a drill-down from Phase 4's existing score breakdown — NOT a separate page or route. Click on a score category (e.g., "Propuesta de Dirección: 9/12") to expand and see the persona critiques below that row. **Extends the Phase 4 score component, does not duplicate it.**
- **D-11:** Two views on the score page: (1) summary checklist at the top showing all findings as a flat list with checkboxes ("12 sugerencias de mejora — 4 resueltas, 8 pendientes"), (2) drill-down per document with detailed per-persona findings. Checklist is the "work-through" surface; drill-down is the "understand the problem" surface.
- **D-12:** Manual checkbox per finding to mark as addressed. No auto-detection of whether a suggestion was implemented — would require re-running the review after every edit (expensive, slow). The checklist is a team coordination tool. Producer checks it off when satisfied the fix was made.
- **D-13:** Explicit "Re-evaluar carpeta" button, not automatic. Review costs API money (~13 calls) and takes 1-2 minutes. Run when the team thinks they've addressed findings. Confirmation: "Esto generará una nueva evaluación. Las marcas de progreso actuales se reiniciarán. ¿Continuar?" Resets the checklist and produces fresh findings.
- **D-14:** Findings tagged with the relevant role based on the document they affect (role pill: "Line Producer" next to budget findings, "Director" next to propuesta dirección findings). NOT formally assigned with notifications or due dates. The tool flags who should fix it; the team coordinates verbally or via the activity log. Formal task assignment is project management scope, not a review tool.

### Claude's Discretion
- Persona critique prompt engineering (how to get concise, rubric-aligned, actionable findings in Spanish)
- Pass 2 prompt design for cross-document coherence (key excerpt selection, deduplication strategy)
- How to extend Phase 4 score table component with expandable critique rows
- Checklist state storage (Firestore field on the project? Separate subcollection?)
- How to handle the propuesta dirección (A4) which is user-uploaded, not AI-generated — the review still reads and critiques it
- Whether to run Pass 1 persona calls in parallel (yes, same concurrency cap as Phase 3 D-04: 3 simultaneous)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scoring rubric (primary reference for review criteria)
- `references/scoring_rubric.md` — EFICINE evaluation criteria per document. The review checks every criterion is addressed. 62 pts artistic + 38 pts viability. Per-document point allocations drive which findings have highest impact.

### Phase 4 score estimation (UI to extend)
- `.planning/phases/04-validation-dashboard/04-CONTEXT.md` — D-05 to D-10: 5-persona scoring system, per-category breakdown presentation, improvement suggestions. Phase 15 adds qualitative drill-down beneath each score row.

### AI generation prompts (context for what "good" looks like)
- `prompts/a7_propuesta_produccion.md` — What the rubric expects from propuesta producción (12 pts)
- `prompts/a8_plan_rodaje_y_ruta_critica.md` — Plan de rodaje + ruta crítica criteria (10 pts)
- `prompts/a9_presupuesto.md` — Budget evaluation criteria (10 pts)
- `prompts/a10_propuesta_exhibicion.md` — Exhibition strategy criteria (4 pts)
- `prompts/a1_resumen_ejecutivo.md` — Resumen ejecutivo structure
- `prompts/a2_sinopsis.md` — Sinopsis criteria (context for 40-pt screenplay evaluation)
- `prompts/documentos_combinados.md` — Combined docs including solidez equipo, ficha técnica

### Persona files
- `prompts/evaluadores/*.md` — 5 persona definition files (Reygadas, Marcopolo, Pato, Leo, Alejandro). Created in Phase 4, reused here in critique mode.

### Language policy
- `directives/politica_idioma.md` — All review findings, checklist labels, and persona critiques in Mexican Spanish.

### Prior phase decisions
- `.planning/phases/03-ai-doc-generation/03-CONTEXT.md` — D-04: parallel generation with concurrency cap of 3. Apply same cap to Pass 1 persona calls.
- `.planning/phases/05-export-manager/05-CONTEXT.md` — D-10: score estimate included in export as internal PDF. Phase 15 findings should also appear in this PDF.
- `.planning/phases/11-rbac-access-control/11-CONTEXT.md` — D-02: permission matrix. Only productor and line_producer can trigger generation (D-03). Review trigger likely same permission.
- `.planning/phases/13-activity-tracking/13-CONTEXT.md` — D-02: significant actions logged. Review triggered/completed should be logged as activity event.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 4 score estimation component — extend with expandable rows for critique drill-down
- Phase 4 persona scoring Cloud Functions — reuse persona prompt pattern, switch to critique output format
- Phase 3 parallel generation with concurrency cap (D-04) — same pattern for Pass 1 parallel persona calls
- `prompts/evaluadores/*.md` — persona definition files already exist
- `src/locales/es.ts` — all new UI strings

### Established Patterns
- Cloud Functions `onCall` with `HttpsError` for API calls
- Parallel execution with concurrency limit of 3 (Phase 3 D-04)
- Real-time Firestore listeners for progress updates
- Activity log integration for significant actions (Phase 13)

### Integration Points
- Phase 4 score table component → add expandable critique rows + checklist summary
- Phase 4 persona scoring → reuse persona definitions, switch prompt from "score" to "critique"
- Phase 5 export internal PDF → include review findings alongside score estimate
- Phase 13 activity log → log "review triggered" and "review completed" events
- Phase 12 presence → show review progress status to other team members viewing the dashboard
- Phase 11 permissions → review trigger permission (productor + line_producer)

</code_context>

<specifics>
## Specific Ideas

- The two-pass architecture is the single most important implementation decision. Pass 1 (per-document, per-persona) is embarrassingly parallel — 12 independent API calls capped at 3 concurrent. Pass 2 (cross-document coherence) is sequential and depends on Pass 1 summaries. This maps cleanly to a Cloud Function that runs Pass 1 in parallel, collects summaries, then runs Pass 2.
- The persona-to-document mapping (D-07) ensures each document gets reviewed by the most relevant expert. Reygadas critiquing the budget would produce generic feedback; Marcopolo critiquing the budget produces "your VFX allocation is 18% of ATL budget — for a drama with 3 VFX scenes, evaluators will question this."
- The deduplicated cross-document panel (D-09) prevents the worst UX outcome: 5 personas all saying "your exhibition projections don't match your genre" in slightly different words. One finding, one voice, attributed to whoever spotted it.
- The summary checklist + drill-down pattern (D-11) mirrors how the productor works: morning standup, scan the checklist ("4 of 12 addressed"), assign work ("María, handle the budget findings, Carlos take the legal ones"), check back in the afternoon.

</specifics>

<deferred>
## Deferred Ideas

- Auto-re-run review when upstream documents change (expensive, run on-demand only for v2.0)
- Historical review comparison ("compare this review with last week's review to see progress") — v2.1
- Review findings as formal tasks assignable to team members with notifications — v2.1 (requires task management scope)
- Calibration against actual EFICINE outcomes (track whether the review's predictions matched real evaluator feedback) — v2.1, requires outcome data

</deferred>

---

*Phase: 15-ai-pre-submission-review*
*Context gathered: 2026-03-26*
