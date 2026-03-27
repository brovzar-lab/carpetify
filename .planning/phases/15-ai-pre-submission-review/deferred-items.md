# Phase 15 — Deferred Items

## Pre-existing Build Errors

1. **`src/hooks/useProjectAccess.ts:40`** — `tsc -b` reports TS2739: Type missing `collaborators` and `ownerId` properties from `ProjectAccessData`. This is a pre-existing error not caused by Phase 15 changes. `tsc --noEmit` passes cleanly, suggesting the error manifests only during incremental build mode.
