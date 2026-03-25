# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — EFICINE Carpeta Generator

**Shipped:** 2026-03-25
**Phases:** 9 | **Plans:** 31 | **Tasks:** 64

### What Was Built
- 5-screen Spanish intake wizard with multi-project support, auto-save, compliance panel, dark mode
- Screenplay PDF processing pipeline (upload → extract → Claude analysis)
- 4-pass AI document generation producing 21 documents with staleness tracking and one-click regeneration
- 17-rule validation engine with real-time traffic lights, viability + artistic scoring
- Export manager: 15 PDF templates, IMCINE file naming, language check, ZIP packaging
- Full data wiring: all validation rules receive correct Firestore data, scoring signals populated

### What Worked
- **Phase-by-phase data dependency chain** — each phase cleanly consumed the prior phase's output, enabling parallel development within phases
- **Tiered validation (D-11)** — instant/medium/all tiers kept the UI responsive while running 17 rules
- **TDD for validation rules** — RED→GREEN approach caught bugs early in Phases 4, 6, 9
- **Milestone audit + gap closure cycle** — the audit after Phase 6 caught 4 cross-phase wiring gaps that per-phase verification missed; phases 7-9 closed them systematically
- **Pre-written AI prompts** — Handlebars template injection with `{{variables}}` produced consistent, domain-accurate documents

### What Was Inefficient
- **3 gap closure phases (7-9)** — per-phase verification passed but cross-phase integration had namespace mismatches, stub functions, and role name inconsistencies. Earlier integration testing would have caught these during the original phases
- **Phase 01 VERIFICATION.md never re-verified** — LANG-03 gap was fixed by Phase 06 but the verification file still shows `gaps_found`
- **Pre-existing TS errors accumulated** — 30 TypeScript errors built up across phases 3-5 and weren't fixed until a quick task at the end

### Patterns Established
- **Centavos-only financial arithmetic** — all money stored as integer centavos, formatted only at display via `formatMXN()`
- **Locale-first strings** — all UI strings in `src/locales/es.ts`, never hardcoded in components
- **Validation as pure functions** — each rule is a testable pure function; engine orchestrates, hook subscribes
- **EXPORT_FILE_MAP as source of truth** — single registry maps docId → filename template → PDF template → folder
- **`useAutoSave` with debounce + retry** — 1500ms debounce, 3 retries with exponential backoff, flush on unmount

### Key Lessons
1. **Cross-phase integration needs testing at milestone level, not just per-phase** — the namespace mismatch (VALD-06) was invisible to per-phase verification because the writer (Phase 1) and reader (Phase 4) were verified independently
2. **Stubs should be flagged as explicit TODOs with tracking** — `extractLinks()` returning `[]` and `outputFiles` never populated were silent failures that only surfaced in the milestone audit
3. **Fix TS errors continuously, not in batches** — accumulating 30 errors across phases creates a cleanup task; fixing per-commit keeps the build green

### Cost Observations
- Model mix: ~70% Opus (planning, execution), ~25% Sonnet (verification, checking), ~5% Haiku (Claude API in Cloud Functions)
- 5-day build from scaffold to shipped v1.0
- Gap closure phases (7-9) added ~1 day but were essential for production readiness

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 9 |
| Plans | 31 |
| Tasks | 64 |
| Requirements | 49 |
| Tests | 313 |
| LOC | ~30K |
| Duration | 5 days |
| Gap closure phases | 3 |
