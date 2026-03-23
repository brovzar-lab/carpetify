---
status: partial
phase: 02-screenplay-processing
source: [02-VERIFICATION.md]
started: 2026-03-22T00:00:00Z
updated: 2026-03-22T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-End Extraction Flow
expected: Upload a real Spanish-format screenplay PDF (80-120 pages). Extraction completes within 15-30 seconds; right panel populates with scene count, location list, and character list; `screenplay_status` shows `parsed`.
result: [pending]

### 2. Claude Analysis Call and Response
expected: After extraction, click "Analizar guion". Loading spinner appears; analysis badge on success; shooting day estimates display three numbers (baja/media/alta); complexity badges reflect screenplay content.
result: [pending]

### 3. Stale Warning After Re-upload
expected: Upload a screenplay, analyze it, then upload a different screenplay. Stale warning appears; previous analysis marked as outdated; re-analysis produces fresh results.
result: [pending]

### 4. Error and Retry Flow
expected: With invalid/missing API key, click "Analizar guion". Error message in Spanish appears; retry option available; no crash or blank screen.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
