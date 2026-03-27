# Phase 14: Document Versioning - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Version history for generated documents: preserve previous versions on regeneration, side-by-side comparison with word-level prose diff and cell-level table diff, one-click revert that triggers staleness cascade. Phase 3 provides the document storage and staleness model. Phase 13 provides activity log integration. This is the "diff preview" that Phase 3 D-12 deferred to v2.

</domain>

<decisions>
## Implementation Decisions

### Version Storage
- **D-01:** Versions stored in subcollection per document: `projects/{projectId}/generated/{docId}/versions/{versionId}`. Each version scoped to its document — querying all versions of the budget is one subcollection read.
- **D-02:** Full content snapshots, not diffs. Each version contains the complete document content as it existed. No diff reconstruction chains. At ~5-50KB per document, 10 versions of the largest doc is <1MB — negligible cost.
- **D-03:** Version metadata per document: `content` (full snapshot), `timestamp`, `triggeredBy` (userId + name + role), `triggerReason` (regeneration / manual_edit / revert), `passNumber` (generation context), `isManuallyEdited` flag. Trigger reason tells the productor WHY this version exists.
- **D-04:** Keep last 10 versions per document, auto-prune oldest when the 11th is created. **CRITICAL: prune must be a batched write — query count first, and if at 10, batch the new version create + oldest version delete together.** Not two separate operations. If create succeeds but delete fails, you silently grow past 10.

### Comparison UI
- **D-05:** Side-by-side layout, not unified diff. Version A on left, version B on right, changes highlighted. Unified diff is unreadable for Spanish prose and financial tables. Side-by-side matches how Word track changes works — the team already understands this format.
- **D-06:** Two separate diff renderers — NO universal abstraction:
  - **Prose documents** (sinopsis, propuesta producción, contracts): word-level highlighting within paragraphs. Green for additions, red for deletions. Uses a diff library (diff-match-patch or jsdiff).
  - **Structured documents** (presupuesto, ficha técnica, flujo de efectivo): cell-level table highlighting. Green if number increased, red if decreased, yellow if text changed. Compare two JSON objects field by field, render in the same table format as the budget editor.
  These are fundamentally different rendering problems. Do NOT try to unify them into one "universal diff component" — it will overengineer and delay the phase.
- **D-07:** **Spanish text testing requirement:** the diff library MUST be tested with Spanish prose early in implementation — accented characters (á, é, ñ, ü) and long compound sentences can trip up word-boundary detection in English-first libraries. Include a Spanish prose diff test case in the implementation plan, not as an afterthought.
- **D-08:** Version selector: dropdown pair "Comparar: [Version A] con [Version B]" above the diff view. Default: current version vs immediately previous. Each dropdown entry shows: "v3 — 22 mar 2026, 14:30 — María (regeneración Pasada 2)". Metadata helps the productor pick the right versions without guessing.

### Revert Behavior
- **D-09:** Copy forward, not pointer. Reverting copies old version's content into a NEW version (N+1) marked with triggerReason "revert". Version timeline is always linear and append-only. Productor sees: v5 (bad regeneration) → v6 (reverted to v3's content). Original v3 stays untouched in history.
- **D-10:** ~~Revert triggers staleness cascade.~~ **OVERRIDDEN (2026-03-26):** Soft cascade — warning only. Revert shows a non-blocking warning listing downstream documents that MAY be affected (e.g., "Documentos que podrían verse afectados: Flujo de Efectivo, Esquema Financiero"), but does NOT force regeneration or mark passes stale. The existing staleness system tracks input-data changes (screenplay, metadata, financials) — document content reverts are a separate concern. The user decides whether to re-run downstream passes after reviewing the warning.
- **D-11:** Reverting a manually-edited document shows warning: "Este documento tiene ediciones manuales. Revertir a la versión 3 reemplazará todo el contenido actual, incluyendo tus ediciones. ¿Continuar?" Same pattern as regeneration warning (Phase 3 D-12). Current content is preserved as a version in history before the revert — nothing is permanently lost.
- **D-12:** Revert logged as distinct activity event: "Carlos revirtió Presupuesto Desglose a versión 3 (generada el 20 mar por María)." References both the reverting user AND the source version (including original creator). No staleness cascade log entry (D-10 override: soft warning only, no forced cascade).

### Claude's Discretion
- Diff library selection (diff-match-patch vs jsdiff — evaluate with Spanish text samples)
- Version list UI within the document viewer (sidebar panel, dropdown, or dedicated versions tab)
- How to handle diffing the structured budget editor (JSON field comparison strategy)
- Copy-forward Cloud Function implementation (create new version + update current doc + trigger staleness + log activity — all in one batch)
- How the revert confirmation dialog previews what will change before the user confirms

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Document storage
- `src/services/documents.ts` (or equivalent) — Generated document CRUD in `projects/{projectId}/generated/{docId}`
- `.planning/phases/03-ai-doc-generation/03-CONTEXT.md` — D-05/D-06: document viewer with read-only preview + edit mode. D-09: per-pass staleness with cascade. D-11: regenerate entire pass. D-12: manual edit warning before regeneration. D-14: budget as structured spreadsheet editor.

### Staleness cascade
- `.planning/phases/03-ai-doc-generation/03-CONTEXT.md` — D-09: per-pass with downstream cascade. D-10: immediate detection via timestamps. D-16: budget edits trigger instant inconsistency warnings.

### Activity log
- `.planning/phases/13-activity-tracking/13-CONTEXT.md` — D-02: significant actions logged. D-03: generation events per pass. D-10: activity subcollection at `projects/{projectId}/activity/{eventId}`. D-11: client-side logging for saves, Cloud Functions for server actions (revert is a Cloud Function action).

### Language policy
- `directives/politica_idioma.md` — All version labels, revert warnings, diff UI in Mexican Spanish. Spanish prose diff testing critical.

### Prior phase decisions
- `.planning/phases/11-rbac-access-control/11-CONTEXT.md` — D-02: permission matrix determines who can revert (same as who can edit the document).
- `.planning/phases/12-realtime-collaboration/12-CONTEXT.md` — D-02: per-document locking. Revert requires a lock on the document.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 3 document viewer — add version selector and diff view alongside existing read-only preview
- Phase 3 budget structured editor — reuse table rendering for structured diff
- Phase 3 staleness cascade logic — reuse for revert-triggered cascade
- Phase 13 activity log write pattern — reuse for revert events
- `src/locales/es.ts` — All new UI strings (version labels, revert warnings, diff descriptions)

### Established Patterns
- Firestore subcollections per project (versions fit naturally as sub-subcollection)
- Batched writes via Cloud Functions for atomic multi-document operations
- Manual edit warning pattern from Phase 3 D-12 (reuse for revert warning)
- `onSnapshot` real-time listeners — version list updates when someone else creates a version

### Integration Points
- Regeneration Cloud Functions → create version snapshot BEFORE overwriting current content
- Manual edit saves → create version snapshot if content changed (debounced, not per-keystroke)
- Revert Cloud Function → create new version (copy forward) + update current doc + trigger staleness cascade + write activity event — all in one batch
- Document viewer → add version selector dropdown pair + diff panel
- Budget editor → structured cell-level diff renderer
- Phase 12 locking → revert requires document lock (prevents concurrent revert + edit)

</code_context>

<specifics>
## Specific Ideas

- The most common revert scenario: the productor regenerates the budget after changing financial numbers, but the new budget allocates money poorly (e.g., AI overweighted VFX for a drama). They revert to the previous budget, manually adjust just the changed line items, and move on. Copy-forward ensures this workflow is clean — revert, then edit, and the history shows the full trail.
- Two separate diff renderers is non-negotiable. A prose diff of the sinopsis showing word-level changes is fundamentally different from a table diff of the presupuesto showing cell-level number changes. Any attempt to unify them will produce a mediocre result for both.
- Spanish text in diff libraries is a real risk. "producción" and "produccion" (missing accent) might be treated as the same word or different words depending on the library's Unicode handling. Test early with real screenplay analysis output.

</specifics>

<deferred>
## Deferred Ideas

- Three-way merge (combine changes from two different versions) — unnecessary with section locking, only one person edits at a time
- Version branching (fork from an old version and maintain parallel tracks) — adds complexity with no clear use case for EFICINE workflows
- Automatic version comparison summary ("this regeneration changed 3 budget accounts and rewrote paragraph 2 of the sinopsis") — v2.1 nice-to-have

</deferred>

---

*Phase: 14-document-versioning*
*Context gathered: 2026-03-26*
