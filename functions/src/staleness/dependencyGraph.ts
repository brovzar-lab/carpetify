/**
 * Static dependency graph for the generation pipeline.
 * Maps each pass to its upstream data sources and prior passes.
 *
 * Per D-09: staleness tracked per-pass with downstream cascade.
 * Per D-10: compare timestamps -- intake_updated_at > pass_generated_at.
 */

import type { PassId } from '../shared/types.js';

/**
 * Upstream data sources that can trigger staleness.
 * Each maps to a Firestore path containing an updatedAt timestamp.
 */
export type UpstreamSource = 'metadata' | 'screenplay' | 'team' | 'financials' | 'erpi';

/**
 * Static dependency graph: which upstream sources and prior passes
 * each generation pass depends on.
 *
 * If any dependency has a newer timestamp than the pass, the pass is stale.
 * Staleness cascades downstream (if lineProducer is stale, so is everything else).
 */
export const PASS_DEPENDENCIES: Record<PassId, (UpstreamSource | PassId)[]> = {
  lineProducer: ['metadata', 'screenplay'],
  financeAdvisor: ['lineProducer', 'financials'],
  legal: ['lineProducer', 'metadata', 'team'],
  combined: ['lineProducer', 'financeAdvisor', 'legal', 'metadata', 'screenplay', 'team'],
};

/**
 * Maps each UpstreamSource to the Firestore document path
 * where its updatedAt timestamp lives.
 */
export const UPSTREAM_PATHS: Record<UpstreamSource, string> = {
  metadata: 'metadata',                // projects/{id} document level
  screenplay: 'screenplay/analysis',   // projects/{id}/screenplay/analysis
  team: 'team',                        // projects/{id} team subcollection
  financials: 'financials',            // projects/{id} financials field
  erpi: 'erpi',                        // erpi/{erpiId} shared settings
};

/**
 * All 4 passes in execution order.
 */
export const PASS_ORDER: PassId[] = ['lineProducer', 'financeAdvisor', 'legal', 'combined'];
