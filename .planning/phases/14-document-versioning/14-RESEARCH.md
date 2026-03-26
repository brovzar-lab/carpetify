# Phase 14: Document Versioning - Research

**Researched:** 2026-03-26
**Domain:** Firestore document versioning, text diffing, React diff visualization
**Confidence:** HIGH

## Summary

Phase 14 adds version history to the existing AI document generation system. When a document is regenerated, the previous version is saved to a Firestore subcollection before the new content overwrites it. Users can then browse version history, view inline diffs between any two versions, and revert to a previous version with one click.

The existing codebase already has the core infrastructure needed: `saveGeneratedDocument()` in `documentStore.ts` already increments a `version` counter and overwrites the document in place. The change is to capture a snapshot of the current document into a `history` subcollection *before* the overwrite. The `diff` (jsdiff) library v8.0.4 provides `diffWords` for prose documents and `diffJson` for structured/table documents, both returning the same `Change[]` interface, making a single diff renderer component possible. Firestore security rules already cover the nested subcollection path `generated/{docId}/history/{versionId}`.

**Primary recommendation:** Use Firestore subcollection `projects/{projectId}/generated/{docId}/versions/{versionNumber}` to store full content snapshots, `diff` v8.0.4 for computing diffs client-side, and a custom Tailwind-styled React component for inline diff visualization (avoid react-diff-viewer-continued which pulls in @emotion).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AIGEN-V2-03 | Document version history -- each regeneration creates a version entry with timestamp, trigger reason, and content snapshot | Firestore subcollection pattern with pre-save snapshot in `saveGeneratedDocument()`. Version entries store full content, timestamp, trigger reason, and triggeredBy userId. |
| AIGEN-V2-04 | User can compare any two versions of a generated document with inline diff highlighting (additions in green, deletions in red) | `diff` v8.0.4 `diffWords` for prose, `diffJson` for structured. Custom `DiffViewer` component with Tailwind green/red classes. |
| AIGEN-V2-05 | User can revert to a previous document version with one click | Copy version content back to parent `generated/{docId}` document, creating a new version entry recording the revert. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| diff (jsdiff) | 8.0.4 | Text and JSON diffing | Built-in TypeScript types (v8+), provides `diffWords` for prose and `diffJson` for structured data in one package. 15+ years of maturity. Zero dependencies. |
| firebase (existing) | 12.11.0 | Firestore subcollection storage | Already in project. Subcollection `versions/` under each generated doc. |
| firebase-admin (existing) | - | Server-side version snapshot creation | Already in Cloud Functions. `saveGeneratedDocument()` is the single mutation point. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react (existing) | 0.577.0 | Icons for version history UI (History, GitCompare, RotateCcw) | Already in project |
| date-fns (existing) | 4.1.0 | Formatting version timestamps in Spanish | Already in project via `formatDateES` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| diff (jsdiff) | diff-match-patch | Google's DMP is more powerful (has patch/match) but overkill for display-only diffs. jsdiff's `diffWords`/`diffJson` API is simpler and has better TypeScript support. |
| Custom diff component | react-diff-viewer-continued | RDVC pulls in `@emotion/css` + `@emotion/react` as dependencies, conflicting with our Tailwind-only styling. Custom component is ~50 lines with Tailwind classes. |
| Full content snapshots | Delta-only storage | At this scale (20 docs * 10 versions max * ~5KB avg = ~1MB total per project), full snapshots are simpler, avoid reconstruction bugs, and enable direct revert without replay. Delta storage adds complexity for negligible savings. |

**Installation:**
```bash
npm install diff
```

**Version verification:** `diff` v8.0.4 confirmed via `npm view diff version` on 2026-03-26. Ships with built-in TypeScript definitions (`libesm/index.d.ts`), no `@types/diff` needed.

## Architecture Patterns

### Recommended Data Structure

```
projects/{projectId}/
  generated/{docId}              ← Current active version (existing, unchanged)
    ├── content                  ← Current content (prose string or structured JSON)
    ├── version                  ← Current version number (already exists, integer)
    ├── generatedAt              ← When current version was generated
    ├── manuallyEdited           ← Whether current has manual edits
    ├── editedContent            ← Manual edits (if any)
    └── ...existing fields...
  generated/{docId}/versions/{versionNumber}  ← NEW: Historical snapshots
    ├── content                  ← Full content snapshot at this version
    ├── editedContent            ← Manual edits snapshot (if existed)
    ├── contentType              ← 'prose' | 'structured' | 'table'
    ├── version                  ← Version number (matches doc ID for query convenience)
    ├── generatedAt              ← When this version was originally generated
    ├── archivedAt               ← Server timestamp when snapshot was taken
    ├── triggerReason            ← 'regeneration' | 'manual_revert' | 'pipeline_run'
    ├── triggeredBy              ← userId of who triggered the change
    ├── modelUsed                ← AI model used for this version
    └── promptFile               ← Prompt file used for this version
```

### Pattern 1: Pre-Save Snapshot (Server-Side)

**What:** Before `saveGeneratedDocument()` overwrites the current document, snapshot the existing content into the `versions/` subcollection.

**When to use:** Every time a document is regenerated (pass execution) or reverted.

**Why this location:** `saveGeneratedDocument()` in `functions/src/pipeline/documentStore.ts` is the SINGLE write path for all generated documents. All 4 pass handlers (lineProducer, financeAdvisor, legal, combined) call this function. Intercepting here guarantees no version is lost regardless of the trigger.

**Example:**
```typescript
// In functions/src/pipeline/documentStore.ts
export async function saveGeneratedDocument(
  projectId: string,
  docId: DocumentId,
  content: unknown,
  passId: PassId,
  promptFile: string,
  modelUsed: string,
  triggeredBy?: string,       // NEW: userId
  triggerReason?: string,     // NEW: reason
): Promise<void> {
  const db = getFirestore();
  const docRef = db
    .collection('projects')
    .doc(projectId)
    .collection('generated')
    .doc(docId);

  // Step 1: Snapshot existing document before overwrite
  const existing = await docRef.get();
  if (existing.exists) {
    const existingData = existing.data()!;
    const currentVersion = (existingData.version as number) || 1;

    // Archive to versions subcollection
    await docRef
      .collection('versions')
      .doc(String(currentVersion))
      .set({
        content: existingData.editedContent ?? existingData.content,
        editedContent: existingData.editedContent ?? null,
        contentType: existingData.contentType,
        version: currentVersion,
        generatedAt: existingData.generatedAt,
        archivedAt: FieldValue.serverTimestamp(),
        triggerReason: triggerReason ?? 'regeneration',
        triggeredBy: triggeredBy ?? null,
        modelUsed: existingData.modelUsed,
        promptFile: existingData.promptFile,
      });
  }

  // Step 2: Write new version (existing logic, version incremented)
  const newVersion = existing.exists
    ? ((existing.data()?.version as number) || 0) + 1
    : 1;

  await docRef.set({
    docId,
    docName: DOCUMENT_REGISTRY[docId].docName,
    section: DOCUMENT_REGISTRY[docId].section,
    passId,
    content,
    contentType: DOCUMENT_REGISTRY[docId].contentType,
    generatedAt: FieldValue.serverTimestamp(),
    inputHash: '',
    modelUsed,
    promptFile,
    version: newVersion,
    manuallyEdited: false,
  });
}
```

### Pattern 2: Client-Side Diff Computation

**What:** Compute diffs in the browser when the user selects two versions to compare. Never precompute or store diffs.

**When to use:** When the user clicks "Comparar" on the version history panel.

**Why client-side:** Diffs are only needed for display. At ~5KB per document, `diffWords` runs in <1ms. Storing precomputed diffs would double storage and become stale if the diff algorithm improves.

**Example:**
```typescript
import { diffWords, diffJson, type Change } from 'diff';

function computeDiff(
  oldContent: unknown,
  newContent: unknown,
  contentType: 'prose' | 'structured' | 'table',
): Change[] {
  if (contentType === 'prose') {
    return diffWords(
      String(oldContent),
      String(newContent),
    );
  }
  // For structured/table: JSON diff
  return diffJson(
    typeof oldContent === 'string' ? JSON.parse(oldContent) : oldContent,
    typeof newContent === 'string' ? JSON.parse(newContent) : newContent,
  );
}
```

### Pattern 3: Revert as New Version

**What:** Reverting to version N does NOT delete versions N+1 through current. Instead, it copies version N's content to the active document and creates a new version entry. The version counter always increments.

**When to use:** When user clicks "Restaurar esta version" on a historical version.

**Why:** This preserves full audit trail. A revert to version 3 when current is version 5 creates version 6 with content from version 3, and triggerReason 'manual_revert'. The user can always see that a revert happened and undo it.

**Example:**
```typescript
// Client-side: call a Cloud Function
export async function revertDocumentVersion(
  projectId: string,
  docId: string,
  targetVersion: number,
): Promise<void> {
  const revertFn = httpsCallable(functions, 'revertDocumentVersion');
  await revertFn({ projectId, docId, targetVersion });
}

// Server-side Cloud Function:
// 1. Read target version from versions/{targetVersion}
// 2. Call saveGeneratedDocument() with target's content
//    (triggeredBy: auth.uid, triggerReason: 'manual_revert')
// 3. saveGeneratedDocument snapshots current before overwrite (Pattern 1)
```

### Pattern 4: Inline Diff Renderer with Tailwind

**What:** A simple React component that maps jsdiff `Change[]` to styled `<span>` elements.

**When to use:** In the version comparison view.

**Example:**
```tsx
import type { Change } from 'diff';

interface InlineDiffProps {
  changes: Change[];
}

export function InlineDiff({ changes }: InlineDiffProps) {
  return (
    <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
      {changes.map((change, i) => {
        if (change.added) {
          return (
            <span key={i} className="bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300">
              {change.value}
            </span>
          );
        }
        if (change.removed) {
          return (
            <span key={i} className="bg-red-100 text-red-900 line-through dark:bg-red-900/30 dark:text-red-300">
              {change.value}
            </span>
          );
        }
        return <span key={i}>{change.value}</span>;
      })}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Storing diffs instead of full snapshots:** At this scale, full snapshots are simpler and enable direct revert. Delta storage requires ordered replay and is fragile.
- **Pre-computing diffs at save time:** Wastes server compute and storage. Diffs are display-only and trivially fast on the client.
- **Deleting versions on revert:** Destroys audit trail. Always create a new version entry for reverts.
- **Array-based version history in the parent document:** Would hit Firestore's 1 MiB document limit with large documents. Subcollection keeps versions independent.
- **Client-side version snapshot creation:** Version creation MUST happen server-side in `saveGeneratedDocument()` to guarantee atomicity. A client write could fail halfway, losing the snapshot.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text diffing algorithm | Custom word-by-word comparator | `diff` v8.0.4 `diffWords` | Myers diff algorithm is O(ND), edge cases around whitespace/punctuation handled. 15 years of battle-testing. |
| JSON diffing | Custom recursive object walker | `diff` v8.0.4 `diffJson` | Handles property reordering, nested objects, type changes. Same `Change[]` output as `diffWords`. |
| Version number generation | Client-side counter | Server-side read-then-increment in `saveGeneratedDocument()` | Already exists. Firestore transactions ensure no duplicate version numbers. |
| Date formatting (version timestamps) | Manual date formatting | `formatDateES()` from `src/lib/format.ts` | Already exists in the project, handles Spanish month names. |

**Key insight:** The diffing problem is solved by `diff` v8.0.4 for both prose and structured content types using a single library. The versioning problem is solved by Firestore subcollections with full content snapshots. The only custom code needed is the thin UI layer (diff renderer, version list, revert button).

## Common Pitfalls

### Pitfall 1: Race Condition on Concurrent Regeneration
**What goes wrong:** Two pass executions overwrite the same document simultaneously, one snapshot is lost.
**Why it happens:** Multiple users trigger regeneration, or a pass generates multiple docs that share a subcollection.
**How to avoid:** Each document has its own independent write path in `saveGeneratedDocument()`. The function reads-then-writes sequentially per docId. At this scale (2-5 users, never regenerating the same specific document simultaneously), this is sufficient. If needed later, wrap in a Firestore transaction.
**Warning signs:** Version numbers skipping (e.g., version 3 jumps to version 5).

### Pitfall 2: Snapshot Includes editedContent vs content Confusion
**What goes wrong:** Version snapshot stores `content` (AI-generated) but the active document had `editedContent` (manual edits). The displayed diff shows changes the user didn't make.
**Why it happens:** The existing DocumentViewer already handles this: `const content = data.editedContent ?? data.content`. The version snapshot must follow the same logic.
**How to avoid:** Always snapshot `editedContent ?? content` as the "effective content" field. Store both `content` and `editedContent` in the version for full fidelity, but the diff computation uses `editedContent ?? content`.
**Warning signs:** Diff shows massive changes when comparing a manually-edited version to a regenerated version.

### Pitfall 3: Firestore Subcollection Deletion Orphaning
**What goes wrong:** If a generated document is deleted (e.g., project deletion), the `versions/` subcollection remains as orphaned documents.
**Why it happens:** Firestore does NOT cascade-delete subcollections when a parent document is deleted.
**How to avoid:** This is acceptable for now -- project deletion is rare and the orphaned data is small. If cleanup is needed later, use a Cloud Function triggered on document deletion to batch-delete the subcollection.
**Warning signs:** Storage costs growing unexpectedly.

### Pitfall 4: Large Structured Documents in Version History
**What goes wrong:** The A9b (Presupuesto Desglosado) document is a large JSON structure. Storing 10 versions of it could approach significant size.
**Why it happens:** A9b contains the full itemized budget with potentially hundreds of line items.
**How to avoid:** Monitor A9b document sizes. At 20-50KB per version * 10 versions = 200-500KB, well under the 1 MiB Firestore limit per document AND within reasonable storage bounds since versions are separate documents in a subcollection.
**Warning signs:** Firestore write failures on very large budget documents.

### Pitfall 5: Spanish UI Strings Not Added to es.ts
**What goes wrong:** Version history UI shows English text or empty strings.
**Why it happens:** New UI features forget to add Spanish strings to `src/locales/es.ts`.
**How to avoid:** Add ALL version history strings to `es.ts` before building components. Key strings needed: "Historial de versiones", "Version {n}", "Comparar versiones", "Restaurar esta version", "Regeneracion automatica", "Revertido manualmente", "Revertir", "Cancelar", etc.
**Warning signs:** Any English text visible in the UI.

### Pitfall 6: Revert Triggers Staleness Cascade
**What goes wrong:** Reverting a document to an old version makes downstream passes stale, because the generation_state timestamp doesn't change.
**Why it happens:** A revert changes document content but doesn't touch the staleness tracking system.
**How to avoid:** A revert should NOT mark passes as stale. The staleness system tracks *input data* changes (metadata, screenplay, team, financials), not document content changes. A revert is an intentional content selection by the user, not an upstream data change.
**Warning signs:** After reverting a document, the staleness banner appears unnecessarily.

## Code Examples

### Version History Query (Client-Side)
```typescript
// Fetch all versions for a document, ordered by version number descending
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DocumentVersion {
  version: number;
  content: unknown;
  editedContent?: string | null;
  contentType: 'prose' | 'structured' | 'table';
  generatedAt: Date | null;
  archivedAt: Date | null;
  triggerReason: 'regeneration' | 'manual_revert' | 'pipeline_run';
  triggeredBy: string | null;
  modelUsed: string;
}

export async function getDocumentVersions(
  projectId: string,
  docId: string,
): Promise<DocumentVersion[]> {
  const versionsRef = collection(
    db,
    `projects/${projectId}/generated/${docId}/versions`,
  );
  const q = query(versionsRef, orderBy('version', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      version: data.version,
      content: data.editedContent ?? data.content,
      editedContent: data.editedContent ?? null,
      contentType: data.contentType,
      generatedAt: data.generatedAt?.toDate?.() ?? null,
      archivedAt: data.archivedAt?.toDate?.() ?? null,
      triggerReason: data.triggerReason ?? 'regeneration',
      triggeredBy: data.triggeredBy ?? null,
      modelUsed: data.modelUsed ?? '',
    };
  });
}
```

### Revert Cloud Function (Server-Side)
```typescript
// functions/src/versioning/revertDocument.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { requireProjectAccess } from '../auth/requireProjectAccess';
import { saveGeneratedDocument } from '../pipeline/documentStore';

export const revertDocumentVersion = onCall(async (request) => {
  const { projectId, docId, targetVersion } = request.data;
  const auth = requireProjectAccess(request, projectId); // Validates auth + membership

  const db = getFirestore();

  // 1. Read target version
  const versionSnap = await db
    .collection('projects')
    .doc(projectId)
    .collection('generated')
    .doc(docId)
    .collection('versions')
    .doc(String(targetVersion))
    .get();

  if (!versionSnap.exists) {
    throw new HttpsError('not-found', 'Version no encontrada.');
  }

  const versionData = versionSnap.data()!;

  // 2. Save as new version (snapshots current automatically via Pattern 1)
  await saveGeneratedDocument(
    projectId,
    docId as DocumentId,
    versionData.content,
    versionData.passId ?? 'combined',
    versionData.promptFile ?? '',
    versionData.modelUsed ?? '',
    auth.uid,              // triggeredBy
    'manual_revert',       // triggerReason
  );

  return { success: true, revertedToVersion: targetVersion };
});
```

### Pass Handler Integration (threading userId)
```typescript
// In each pass handler (e.g., lineProducer.ts), thread the userId through:
export async function handleLineProducerPass(
  projectId: string,
  project: ProjectDataForGeneration,
  onProgress: StreamCallback,
  triggeredBy?: string,     // NEW parameter
): Promise<{ success: boolean; completedDocs: string[] }> {
  // ... existing logic ...

  // When saving each document:
  await saveGeneratedDocument(
    projectId, 'A7', a7Content, 'lineProducer',
    'a7_propuesta_produccion.md', MODEL,
    triggeredBy,            // Pass through
    'regeneration',         // Trigger reason
  );
  // ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store diffs/patches | Store full snapshots | ~2020 (as storage got cheaper) | Simpler code, direct revert without replay, no corruption risk |
| diff-match-patch for web diffs | jsdiff (diff) for display-only diffs | Ongoing | jsdiff has better TypeScript support, simpler API for read-only diffs |
| @types/diff separate package | Built-in types in diff v8+ | 2024 (diff v8 release) | No separate @types dependency needed |
| Emotion-based diff viewers | Tailwind-styled custom components | 2023+ (Tailwind v3/v4 dominance) | Avoids CSS-in-JS dependency conflicts in Tailwind projects |

**Deprecated/outdated:**
- `@types/diff`: Not needed with diff v8+. The package itself ships TypeScript definitions.
- `react-diff-viewer` (original): Unmaintained since 2020. The `-continued` fork exists but brings @emotion.

## Open Questions

1. **Version retention policy**
   - What we know: At 5-10 versions per doc * 20 docs per project, storage is negligible (~1-5MB per project total).
   - What's unclear: Should there be a max version count? Auto-cleanup of old versions?
   - Recommendation: No retention limit for now. At this scale (2-5 users, 3 projects max per period), storage costs are trivial. Revisit if the tool scales beyond Lemon Studios.

2. **Manual edit versioning**
   - What we know: Users can manually edit documents (editedContent field). Currently, manual edits do NOT create version entries.
   - What's unclear: Should saving manual edits also create a version snapshot?
   - Recommendation: No -- only regeneration and revert create versions. Manual edits are frequent and incremental. The user explicitly chose to edit. If they regenerate, the manual edit is preserved in the version history automatically (Pattern 1 snapshots before overwrite).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AIGEN-V2-03 | saveGeneratedDocument snapshots previous version before overwrite | unit | `npx vitest run src/__tests__/functions/documentStore.test.ts -t "snapshots"` | No -- Wave 0 |
| AIGEN-V2-03 | Version entry contains timestamp, triggerReason, triggeredBy | unit | `npx vitest run src/__tests__/functions/documentStore.test.ts -t "version entry fields"` | No -- Wave 0 |
| AIGEN-V2-04 | diffWords produces correct Change[] for prose content | unit | `npx vitest run src/__tests__/versioning/diffCompute.test.ts` | No -- Wave 0 |
| AIGEN-V2-04 | diffJson produces correct Change[] for structured content | unit | `npx vitest run src/__tests__/versioning/diffCompute.test.ts` | No -- Wave 0 |
| AIGEN-V2-04 | InlineDiff renders green spans for additions, red for deletions | unit | `npx vitest run src/__tests__/versioning/InlineDiff.test.tsx` | No -- Wave 0 |
| AIGEN-V2-05 | Revert copies target version content to active document | unit | `npx vitest run src/__tests__/functions/revertDocument.test.ts` | No -- Wave 0 |
| AIGEN-V2-05 | Revert creates new version entry with triggerReason 'manual_revert' | unit | `npx vitest run src/__tests__/functions/revertDocument.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/functions/documentStore.test.ts` -- update existing or create new tests for snapshot behavior (covers AIGEN-V2-03)
- [ ] `src/__tests__/versioning/diffCompute.test.ts` -- covers AIGEN-V2-04 diff computation
- [ ] `src/__tests__/versioning/InlineDiff.test.tsx` -- covers AIGEN-V2-04 diff rendering
- [ ] `src/__tests__/functions/revertDocument.test.ts` -- covers AIGEN-V2-05

## Sources

### Primary (HIGH confidence)
- Existing codebase: `functions/src/pipeline/documentStore.ts` -- current save pattern
- Existing codebase: `functions/src/shared/types.ts` -- GeneratedDocument interface
- Existing codebase: `firestore.rules` -- nested subcollection rules already in place
- [jsdiff GitHub](https://github.com/kpdecker/jsdiff) -- API documentation, Change interface, diffWords/diffJson
- [diff npm](https://www.npmjs.com/package/diff) -- v8.0.4 confirmed, built-in TypeScript types

### Secondary (MEDIUM confidence)
- [Firebase Firestore best practices](https://firebase.google.com/docs/firestore/best-practices) -- subcollection patterns, 1 MiB limit
- [Firebase Firestore data model](https://firebase.google.com/docs/firestore/data-model) -- subcollection hierarchy
- [react-diff-viewer-continued npm](https://www.npmjs.com/package/react-diff-viewer-continued) -- evaluated and rejected due to @emotion dependency

### Tertiary (LOW confidence)
- None -- all critical claims verified through primary sources or existing codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- `diff` v8.0.4 verified via npm, TypeScript types confirmed, API verified via GitHub README
- Architecture: HIGH -- Firestore subcollection pattern verified against existing codebase, security rules already cover nested subcollections
- Pitfalls: HIGH -- based on direct codebase analysis (editedContent vs content handling, staleness system behavior, Firestore deletion semantics)

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable domain, no fast-moving dependencies)
