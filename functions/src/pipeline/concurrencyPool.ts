/**
 * Concurrency limiter for parallel within-pass document generation.
 * Per D-04: cap at 3 simultaneous Claude API calls to avoid
 * Anthropic rate limits and Cloud Function cost spikes.
 *
 * Uses p-limit for a simple, proven concurrency control mechanism.
 */

import pLimit from 'p-limit';

/**
 * Create a concurrency pool for parallel document generation.
 *
 * @param concurrency - Maximum number of concurrent tasks (default 3 per D-04)
 * @returns Pool object with run(), pendingCount, and activeCount
 */
export function createConcurrencyPool(concurrency: number = 3) {
  const limit = pLimit(concurrency);

  return {
    /** Run a task within the concurrency pool */
    run: <T>(fn: () => Promise<T>): Promise<T> => limit(fn),
    /** Number of tasks waiting to run */
    get pendingCount(): number {
      return limit.pendingCount;
    },
    /** Number of tasks currently running */
    get activeCount(): number {
      return limit.activeCount;
    },
  };
}
