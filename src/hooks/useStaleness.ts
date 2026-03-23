/**
 * Client-side staleness detection for generation passes.
 * Listens to projects/{id}/meta/generation_state in real time
 * and compares upstream data timestamps to pass generation timestamps.
 *
 * Mirrors backend dependency graph from functions/src/staleness/dependencyGraph.ts.
 * Per D-09: staleness tracked per-pass with downstream cascade.
 * Per D-10: compare timestamps -- intake_updated_at > pass_generated_at.
 */
import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { PassId } from '@/services/generation'
import { PASS_NUMBERS } from '@/services/generation'

// ---- Dependency graph (mirrors backend) ----

type UpstreamSource = 'metadata' | 'screenplay' | 'team' | 'financials'

/**
 * Static dependency graph matching functions/src/staleness/dependencyGraph.ts.
 * Each pass depends on upstream data sources and/or prior passes.
 */
const PASS_DEPENDENCIES: Record<PassId, (UpstreamSource | PassId)[]> = {
  lineProducer: ['metadata', 'screenplay'],
  financeAdvisor: ['lineProducer', 'financials'],
  legal: ['lineProducer', 'metadata', 'team'],
  combined: [
    'lineProducer',
    'financeAdvisor',
    'legal',
    'metadata',
    'screenplay',
    'team',
  ],
}

/** All 4 pass IDs */
const ALL_PASSES: PassId[] = [
  'lineProducer',
  'financeAdvisor',
  'legal',
  'combined',
]

/** Map doc IDs to their pass for isDocStale lookup */
const DOC_TO_PASS: Record<string, PassId> = {
  A7: 'lineProducer',
  A8a: 'lineProducer',
  A8b: 'lineProducer',
  A9a: 'lineProducer',
  A9b: 'lineProducer',
  A9d: 'financeAdvisor',
  E1: 'financeAdvisor',
  E2: 'financeAdvisor',
  'B3-prod': 'legal',
  'B3-dir': 'legal',
  C2b: 'legal',
  C3a: 'legal',
  C3b: 'legal',
  A1: 'combined',
  A2: 'combined',
  A4: 'combined',
  A6: 'combined',
  A10: 'combined',
  A11: 'combined',
  C4: 'combined',
  PITCH: 'combined',
}

// ---- Types ----

interface GenerationState {
  /** Timestamps when each pass was last generated */
  passGeneratedAt: Record<string, Date | null>
  /** Timestamps when each upstream source was last updated */
  upstreamUpdatedAt: Record<string, Date | null>
}

export interface StalenessInfo {
  /** List of stale pass IDs */
  stalePasses: PassId[]
  /** Check if a specific document is stale */
  isDocStale: (docId: string) => boolean
  /** Get Spanish explanation for why a pass is stale */
  staleReason: (passId: PassId) => string
  /** Loading state -- true while initial snapshot hasn't arrived */
  loading: boolean
}

// ---- Staleness computation (pure function) ----

function computeStalePasses(state: GenerationState): PassId[] {
  const stale = new Set<PassId>()

  for (const passId of ALL_PASSES) {
    const passGenAt = state.passGeneratedAt[passId]
    if (!passGenAt) continue // Never generated -- not stale, just ungenerated

    const deps = PASS_DEPENDENCIES[passId]
    for (const dep of deps) {
      // Check if dependency is an upstream source
      if (dep in state.upstreamUpdatedAt) {
        const upstreamAt = state.upstreamUpdatedAt[dep]
        if (upstreamAt && upstreamAt > passGenAt) {
          stale.add(passId)
          break
        }
      }
      // Check if dependency is a prior pass that is stale (cascade)
      if (stale.has(dep as PassId)) {
        stale.add(passId)
        break
      }
      // Check if dependency is a prior pass that was regenerated after this pass
      if (dep in state.passGeneratedAt) {
        const depGenAt = state.passGeneratedAt[dep]
        if (depGenAt && depGenAt > passGenAt) {
          stale.add(passId)
          break
        }
      }
    }
  }

  return Array.from(stale)
}

// ---- Hook ----

export function useStaleness(projectId: string): StalenessInfo {
  const [stalePasses, setStalePasses] = useState<PassId[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setStalePasses([])
      setLoading(false)
      return
    }

    // Listen to projects/{id}/meta/generation_state for pass and upstream timestamps
    const unsub = onSnapshot(
      doc(db, `projects/${projectId}/meta/generation_state`),
      (snap) => {
        if (!snap.exists()) {
          setStalePasses([])
          setLoading(false)
          return
        }
        const data = snap.data()

        // Parse Firestore timestamps into Dates
        const passGeneratedAt: Record<string, Date | null> = {}
        const upstreamUpdatedAt: Record<string, Date | null> = {}

        if (data.passGeneratedAt) {
          for (const [key, val] of Object.entries(data.passGeneratedAt)) {
            passGeneratedAt[key] =
              val && typeof (val as { toDate?: () => Date }).toDate === 'function'
                ? (val as { toDate: () => Date }).toDate()
                : null
          }
        }

        if (data.upstreamUpdatedAt) {
          for (const [key, val] of Object.entries(data.upstreamUpdatedAt)) {
            upstreamUpdatedAt[key] =
              val && typeof (val as { toDate?: () => Date }).toDate === 'function'
                ? (val as { toDate: () => Date }).toDate()
                : null
          }
        }

        const computed = computeStalePasses({
          passGeneratedAt,
          upstreamUpdatedAt,
        })
        setStalePasses(computed)
        setLoading(false)
      },
      () => {
        // On error (e.g., document doesn't exist), treat as no staleness
        setStalePasses([])
        setLoading(false)
      },
    )

    return unsub
  }, [projectId])

  const isDocStale = useCallback(
    (docId: string): boolean => {
      const passId = DOC_TO_PASS[docId]
      if (!passId) return false
      return stalePasses.includes(passId)
    },
    [stalePasses],
  )

  const staleReason = useCallback(
    (passId: PassId): string => {
      // Determine reason: upstream data changed or upstream pass regenerated
      const deps = PASS_DEPENDENCIES[passId]
      for (const dep of deps) {
        // If a prior pass is stale, the reason is cascade
        if (stalePasses.includes(dep as PassId)) {
          const depNumber = PASS_NUMBERS[dep as PassId]
          if (depNumber) {
            return `El Paso ${depNumber} fue regenerado. Los documentos de este paso usan datos anteriores.`
          }
        }
      }
      // Default: upstream data changed
      return 'Los datos de entrada fueron modificados. Regenera este paso para actualizar los documentos.'
    },
    [stalePasses],
  )

  return { stalePasses, isDocStale, staleReason, loading }
}
