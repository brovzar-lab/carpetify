---
status: complete
phase: 01-scaffold-intake-wizard
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md]
started: 2026-03-22T01:00:00Z
updated: 2026-03-22T01:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `npm run dev`. Server boots without errors. Navigate to the local URL. Dashboard renders with "Mis Proyectos" heading.
result: pass

### 2. Project CRUD on Dashboard
expected: Click "+ Nuevo Proyecto" — blank project card appears with default data. Click the clone button on a project — duplicate appears. Click delete — confirmation dialog in Spanish ("Eliminar proyecto") appears, confirming deletes the project.
result: pass

### 3. Wizard Navigation + Auto-Save
expected: Click a project card — navigates to wizard with 5-screen sidebar (Datos del Proyecto, Guion, Equipo Creativo, Estructura Financiera, Documentos). Click any screen freely — no sequential locking. Fill in a field, see "Guardando..." then "Guardado" indicator. Refresh page — data persists.
result: pass

### 4. MXN Formatting + Spanish Dates
expected: In any MXN field (e.g., budget on Screen 1), type "18500000", tab out — field shows "$18,500,000 MXN". Dates display in Spanish format ("15 de julio de 2026" or "Agosto 2026") wherever dates appear.
result: pass

### 5. Co-Production Toggle (Screen 1)
expected: On Screen 1, toggle "Coproduccion internacional" ON — additional fields appear inline: FX conversion rate, territorial spend split (national/foreign), IMCINE recognition upload. Toggle OFF — fields disappear.
result: pass
notes: IMCINE recognition certificate upload routes to Screen 5 (Documentos) instead of inline picker — by design, keeps all uploads centralized.

### 6. Team Members + In-Kind Validation (Screen 3)
expected: Click "+ Agregar miembro", fill in name, role (e.g., "Director"), fee amount, in-kind amount. If in-kind exceeds 50% of fee, validation error appears. Add multiple team members — each has their own collapsible form.
result: pass

### 7. Compliance Panel Real-Time (Screen 4)
expected: On Screen 4, enter ERPI contribution and EFICINE request amount. The always-visible compliance panel on the right shows 6 metrics (ERPI >=20%, EFICINE <=80%, federal <=80%, screenwriter >=3%, in-kind <=10%, EFICINE cap <=25M) with green/red indicators. Changing amounts updates the panel instantly. In-kind total is read-only (from team data on Screen 3).
result: pass

### 8. Document Checklist (Screen 5)
expected: Screen 5 shows a checklist of ~13 required document types with "Faltante" badges. Each document has an upload button. Uploading a file changes status to "Subido" with the filename shown.
result: pass

### 9. Dark Mode
expected: Toggle macOS to dark mode (System Preferences → Appearance → Dark). All pages switch to dark variant — no elements stuck in light mode.
result: pass

### 10. No English Anywhere
expected: Navigate through every screen (dashboard, all 5 wizard screens, ERPI settings). All buttons, labels, placeholders, error messages, tooltips, empty states, and dialog text are in Mexican Spanish. Zero English text visible.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
