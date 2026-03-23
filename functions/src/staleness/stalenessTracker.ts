/**
 * Staleness tracker for generation passes.
 *
 * Per D-09: Staleness tracked per-pass with downstream cascade.
 * Per D-10: Compare timestamps -- intake_updated_at > pass_generated_at.
 *
 * A pass is stale if:
 * 1. It has never been generated (generatedAt is null), OR
 * 2. Any upstream data source was modified after the pass was generated, OR
 * 3. Any pass it depends on is stale (cascade propagation)
 */

import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { PassId, GenerationState, PassState } from '../shared/types.js';
import { PASS_DEPENDENCIES, PASS_ORDER, type UpstreamSource } from './dependencyGraph.js';

// ---- Pure computation (testable without Firestore) ----

export interface TimestampMap {
  passes: Record<PassId, Date | null>;
  upstream: Record<UpstreamSource, Date | null>;
}

/**
 * Determine which passes are stale based on timestamp comparisons.
 * Pure function -- no Firestore access.
 *
 * Algorithm:
 * 1. For each pass (in order), check if any upstream source has a newer timestamp
 * 2. If a pass is stale, mark all downstream passes as stale too (cascade)
 * 3. A pass with generatedAt=null is always stale
 */
export function getStalePasses(timestamps: TimestampMap): PassId[] {
  const staleSet = new Set<PassId>();

  // Process passes in order so cascades propagate correctly
  for (const passId of PASS_ORDER) {
    if (staleSet.has(passId)) continue; // Already marked stale by cascade

    const passGeneratedAt = timestamps.passes[passId];

    // Null means never generated -- always stale
    if (passGeneratedAt === null) {
      markStaleWithCascade(passId, staleSet);
      continue;
    }

    // Check each dependency
    const dependencies = PASS_DEPENDENCIES[passId];
    let isStale = false;

    for (const dep of dependencies) {
      if (isPassId(dep)) {
        // Dependency on another pass -- check if that pass is stale
        if (staleSet.has(dep)) {
          isStale = true;
          break;
        }
      } else {
        // Dependency on upstream data source -- compare timestamps
        const upstreamUpdatedAt = timestamps.upstream[dep];
        if (upstreamUpdatedAt !== null && upstreamUpdatedAt > passGeneratedAt) {
          isStale = true;
          break;
        }
      }
    }

    if (isStale) {
      markStaleWithCascade(passId, staleSet);
    }
  }

  return PASS_ORDER.filter((p) => staleSet.has(p));
}

/**
 * Mark a pass as stale and cascade to all downstream passes.
 */
function markStaleWithCascade(passId: PassId, staleSet: Set<PassId>): void {
  staleSet.add(passId);

  // Find all passes that depend on this one and mark them stale
  for (const otherPass of PASS_ORDER) {
    if (staleSet.has(otherPass)) continue;
    if (PASS_DEPENDENCIES[otherPass].includes(passId)) {
      markStaleWithCascade(otherPass, staleSet);
    }
  }
}

/**
 * Type guard: is a dependency a PassId (vs UpstreamSource)?
 */
function isPassId(dep: string): dep is PassId {
  return ['lineProducer', 'financeAdvisor', 'legal', 'combined'].includes(dep);
}

// ---- Firestore operations ----

/**
 * Get the current generation state for a project.
 */
export async function getGenerationState(
  projectId: string,
): Promise<GenerationState | null> {
  const db = getFirestore();
  const snapshot = await db
    .collection('projects')
    .doc(projectId)
    .collection('meta')
    .doc('generation_state')
    .get();

  if (!snapshot.exists) return null;
  return snapshot.data() as GenerationState;
}

/**
 * Initialize generation state for a new project.
 */
export async function initGenerationState(
  projectId: string,
): Promise<void> {
  const db = getFirestore();
  const initialState: GenerationState = {
    passes: {
      lineProducer: { generatedAt: null, status: 'pending' },
      financeAdvisor: { generatedAt: null, status: 'pending' },
      legal: { generatedAt: null, status: 'pending' },
      combined: { generatedAt: null, status: 'pending' },
    },
    lastPipelineRun: null,
    pipelineStatus: 'idle',
    failedAtPass: null,
  };

  await db
    .collection('projects')
    .doc(projectId)
    .collection('meta')
    .doc('generation_state')
    .set(initialState);
}

/**
 * Mark a pass as complete with current server timestamp.
 */
export async function markPassComplete(
  projectId: string,
  passId: PassId,
): Promise<void> {
  const db = getFirestore();
  await db
    .collection('projects')
    .doc(projectId)
    .collection('meta')
    .doc('generation_state')
    .update({
      [`passes.${passId}.generatedAt`]: FieldValue.serverTimestamp(),
      [`passes.${passId}.status`]: 'complete',
    });
}

/**
 * Mark a pass as stale.
 */
export async function markPassStale(
  projectId: string,
  passId: PassId,
): Promise<void> {
  const db = getFirestore();
  await db
    .collection('projects')
    .doc(projectId)
    .collection('meta')
    .doc('generation_state')
    .update({
      [`passes.${passId}.status`]: 'stale',
    });
}
