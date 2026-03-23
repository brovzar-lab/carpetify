// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  PASS_DEPENDENCIES,
  type UpstreamSource,
} from '@functions/staleness/dependencyGraph';
import {
  getStalePasses,
  type TimestampMap,
} from '@functions/staleness/stalenessTracker';
import type { PassId } from '@functions/shared/types';

// Helper to create a date N minutes ago
function minutesAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 1000);
}

// Helper to create a fresh TimestampMap where all passes are recent
function freshTimestamps(): TimestampMap {
  const recent = minutesAgo(5); // 5 minutes ago
  const older = minutesAgo(30); // 30 minutes ago -- upstream data is older

  return {
    passes: {
      lineProducer: recent,
      financeAdvisor: recent,
      legal: recent,
      combined: recent,
    },
    upstream: {
      metadata: older,
      screenplay: older,
      team: older,
      financials: older,
      erpi: older,
    },
  };
}

describe('PASS_DEPENDENCIES', () => {
  it('should map lineProducer to ["metadata", "screenplay"]', () => {
    expect(PASS_DEPENDENCIES.lineProducer).toContain('metadata');
    expect(PASS_DEPENDENCIES.lineProducer).toContain('screenplay');
    expect(PASS_DEPENDENCIES.lineProducer).toHaveLength(2);
  });

  it('should map financeAdvisor to ["lineProducer", "financials"]', () => {
    expect(PASS_DEPENDENCIES.financeAdvisor).toContain('lineProducer');
    expect(PASS_DEPENDENCIES.financeAdvisor).toContain('financials');
    expect(PASS_DEPENDENCIES.financeAdvisor).toHaveLength(2);
  });

  it('should map legal to ["lineProducer", "metadata", "team"]', () => {
    expect(PASS_DEPENDENCIES.legal).toContain('lineProducer');
    expect(PASS_DEPENDENCIES.legal).toContain('metadata');
    expect(PASS_DEPENDENCIES.legal).toContain('team');
    expect(PASS_DEPENDENCIES.legal).toHaveLength(3);
  });

  it('should map combined to all upstream sources and prior passes', () => {
    expect(PASS_DEPENDENCIES.combined).toContain('lineProducer');
    expect(PASS_DEPENDENCIES.combined).toContain('financeAdvisor');
    expect(PASS_DEPENDENCIES.combined).toContain('legal');
    expect(PASS_DEPENDENCIES.combined).toContain('metadata');
    expect(PASS_DEPENDENCIES.combined).toContain('screenplay');
    expect(PASS_DEPENDENCIES.combined).toContain('team');
    expect(PASS_DEPENDENCIES.combined).toHaveLength(6);
  });
});

describe('getStalePasses', () => {
  it('should return empty array when all passes are fresh', () => {
    const ts = freshTimestamps();
    const stale = getStalePasses(ts);
    expect(stale).toEqual([]);
  });

  it('should return all 4 passes when metadata changes (cascade from lineProducer)', () => {
    const ts = freshTimestamps();
    // Metadata changed 1 minute ago -- newer than all passes generated 5 min ago
    ts.upstream.metadata = minutesAgo(1);

    // Actually, passes were generated 5 min ago but metadata is 1 min ago (newer),
    // so lineProducer is stale -> cascades to financeAdvisor, legal, combined
    // Wait, actually 1 minute ago is MORE recent than 5 minutes ago.
    // So metadata was updated AFTER passes were generated -> stale.
    const stale = getStalePasses(ts);
    expect(stale).toContain('lineProducer');
    expect(stale).toContain('financeAdvisor');
    expect(stale).toContain('legal');
    expect(stale).toContain('combined');
    expect(stale).toHaveLength(4);
  });

  it('should return ["financeAdvisor", "combined"] when financials change', () => {
    const ts = freshTimestamps();
    // Financials changed 1 minute ago -- newer than passes
    ts.upstream.financials = minutesAgo(1);

    const stale = getStalePasses(ts);
    expect(stale).toContain('financeAdvisor');
    expect(stale).toContain('combined');
    // lineProducer doesn't depend on financials
    expect(stale).not.toContain('lineProducer');
    // legal doesn't depend on financials directly
    expect(stale).not.toContain('legal');
  });

  it('should return ["legal", "combined"] when team data changes', () => {
    const ts = freshTimestamps();
    // Team changed 1 minute ago
    ts.upstream.team = minutesAgo(1);

    const stale = getStalePasses(ts);
    expect(stale).toContain('legal');
    expect(stale).toContain('combined');
    // lineProducer doesn't depend on team
    expect(stale).not.toContain('lineProducer');
    // financeAdvisor doesn't depend on team
    expect(stale).not.toContain('financeAdvisor');
  });

  it('should mark a pass with generatedAt=null as stale', () => {
    const ts = freshTimestamps();
    // lineProducer never generated
    ts.passes.lineProducer = null;

    const stale = getStalePasses(ts);
    expect(stale).toContain('lineProducer');
    // Cascade: financeAdvisor, legal, and combined depend on lineProducer
    expect(stale).toContain('financeAdvisor');
    expect(stale).toContain('legal');
    expect(stale).toContain('combined');
  });
});
