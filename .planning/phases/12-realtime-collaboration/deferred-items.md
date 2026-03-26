# Deferred Items - Phase 12

## Pre-existing Build Errors (Out of Scope)

1. **`src/hooks/useProjectAccess.ts:40`** - TS2739: Return type missing `collaborators` and `ownerId` properties in the loading/error early return. Pre-existing, not caused by Plan 12-03 changes.

2. **`src/components/ui/scroll-area.tsx:1`** - TS6133: Unused `React` import. Pre-existing, shadcn-managed file (do not edit manually per CLAUDE.md).
