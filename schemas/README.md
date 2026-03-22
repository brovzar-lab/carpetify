# Carpetify JSON Schemas — EFICINE Art. 189 (2026)

> **Source of truth:** Lineamientos y Requisitos para la Evaluación de los Proyectos de EFICINE Producción, enero 2026 (IMCINE). All rules, caps, and scoring verified against the official PDF published at imcine.gob.mx.

## Schema Map

| File | EFICINE Section | Covers |
|------|----------------|--------|
| `modulo_a.json` | Capítulo IV, Sección I, Apartado A | Propuesta Cinematográfica: resumen ejecutivo, sinopsis, propuesta dirección, material visual, propuesta producción, plan de rodaje, ruta crítica, presupuesto, flujo de efectivo, propuesta exhibición, puntos adicionales |
| `modulo_b.json` | Capítulo IV, Sección I, Apartado B | Personal Creativo: CVs (FORMATO 2), nationality credentials, contracts producer/director |
| `modulo_c.json` | Capítulo IV, Sección I, Apartado C | ERPI: prior project status (FORMATO 4), INDAUTOR rights, chain of title (FORMATO 5), cartas compromiso (FORMATOS 6, 7), ficha técnica (FORMATO 8) |
| `modulo_d.json` | Capítulo IV, Sección I, Apartado D | Cotizaciones: insurance + CPA quotes |
| `modulo_e.json` | Capítulo IV, Sección I, Apartado E | Esquema Financiero: financing structure (FORMATO 9), ERPI contribution letter (FORMATO 10), donor docs, coproducer docs, proof of funds |
| `export_manager.json` | Reglas Generales + Lineamientos Ch. II | File compilation: naming, size, format, ERPI general requirements |

## How Claude Code Should Use These

1. Read `BOOTSTRAP.md` for overall app architecture and workflow
2. Load the relevant `modulo_X.json` when building each section's data model and UI
3. Load `../validation/rules.md` for cross-module validation logic
4. Load `../references/scoring_rubric.md` for the self-scoring engine

## Corrections Log (vs. original NotebookLM schemas)

| Issue | Original (Wrong) | Corrected (2026 Lineamientos) |
|-------|-------------------|-------------------------------|
| Scoring: Dirección | 15 pts | **12 pts** |
| Scoring: Material Visual | 10 pts separate | **10 pts combined** with propuestas personal creativo |
| Scoring: Solidez equipo | not listed separately | **2 pts** |
| Scoring: Propuesta producción | 10 pts | **12 pts** |
| Scoring: Exhibición | 5 pts | **4 pts** |
| Material visual max pages | 20 cuartillas | **30 cuartillas** |
| Sinopsis max length | "5 líneas" / "6,200 chars" | **3 cuartillas** (the 6,200 char limit is FOCINE, not EFICINE) |
| EFICINE per-project cap | $20M MXN in some places | **$25M MXN** (2026 rules) |
| Screenwriter payment option B | "Opción de Compra" | **10% profit participation** in INDAUTOR-registered contract |
| 32-D requirement | User uploads | **SAT provides directly** to Comité about contribuyente, not ERPI |
| Director filmography links | max 2 | **minimum** 1 feature or 2 shorts, links required, plus additional hyperlinks allowed |
| Propuesta dirección for animation | 5 cuartillas | **3 cuartillas** (same as fiction; animation adds technique description within those 3) |
