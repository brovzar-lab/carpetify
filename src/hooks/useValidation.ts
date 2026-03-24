/**
 * Real-time validation hook with tiered rule execution per D-11.
 *
 * Assembles a ProjectDataSnapshot from multiple Firestore sources and runs
 * validation rules in two tiers:
 *   - Instant (12 rules): fire on every data change with 300ms debounce
 *   - Medium (2 rules): fire only when generatedDocs timestamps change
 *
 * Returns a merged ValidationReport, viability scores, and improvement suggestions.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { doc, onSnapshot, collection, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  ProjectDataSnapshot,
  ValidationReport,
  ValidationResult,
} from '@/validation/types'
import { runInstantRules, runMediumRules } from '@/validation/engine'
import {
  computeViabilityScore,
  generateImprovementSuggestions,
} from '@/validation/scoring'
import type {
  ScoreCategory,
  ImprovementSuggestion,
} from '@/validation/scoring'
import { useGeneratedDocs } from '@/hooks/useGeneratedDocs'
import type { GeneratedDocClient } from '@/hooks/useGeneratedDocs'
import type { TeamMember } from '@/schemas/team'
import type { UploadedDocument } from '@/schemas/documents'
import type { ERPISettings } from '@/schemas/erpi'

// ---- Return type ----

export interface UseValidationResult {
  report: ValidationReport | null
  viabilityScore: ScoreCategory[]
  improvements: ImprovementSuggestion[]
  loading: boolean
}

// ---- Helper: merge instant + medium reports ----

function mergeReports(
  instant: ValidationReport,
  medium: ValidationReport | null,
): ValidationReport {
  const allResults: ValidationResult[] = medium
    ? [...instant.results, ...medium.results]
    : [...instant.results]

  return {
    results: allResults,
    blockers: allResults.filter(
      (r) => r.severity === 'blocker' && r.status === 'fail',
    ),
    warnings: allResults.filter(
      (r) => r.severity === 'warning' && r.status === 'fail',
    ),
    passed: allResults.filter((r) => r.status === 'pass'),
    skipped: allResults.filter((r) => r.status === 'skip'),
    canExport:
      allResults.filter((r) => r.severity === 'blocker' && r.status === 'fail')
        .length === 0,
    timestamp: new Date(),
  }
}

// ---- Helper: compute max generatedAt timestamp ----

function getMaxGeneratedTimestamp(docs: GeneratedDocClient[]): number {
  let max = 0
  for (const d of docs) {
    if (d.generatedAt) {
      const t = d.generatedAt.getTime()
      if (t > max) max = t
    }
  }
  return max
}

// ---- Hook ----

export function useValidation(projectId: string): UseValidationResult {
  // -- Firestore data sources --
  const [projectData, setProjectData] = useState<Record<string, unknown> | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const [erpiSettings, setErpiSettings] = useState<ERPISettings | null>(null)
  const [budgetTotalCentavos, setBudgetTotalCentavos] = useState<number | undefined>(undefined)
  const [cashFlowDoc, setCashFlowDoc] = useState<Record<string, unknown> | null>(null)
  const [esquemaDoc, setEsquemaDoc] = useState<Record<string, unknown> | null>(null)
  const [rutaCriticaDoc, setRutaCriticaDoc] = useState<Record<string, unknown> | null>(null)

  // -- Loading states --
  const [projectLoading, setProjectLoading] = useState(true)
  const [teamLoading, setTeamLoading] = useState(true)
  const [docsLoading, setDocsLoading] = useState(true)
  const [erpiLoading, setErpiLoading] = useState(true)
  const [budgetLoading, setBudgetLoading] = useState(true)
  const [cashFlowLoading, setCashFlowLoading] = useState(true)
  const [esquemaLoading, setEsquemaLoading] = useState(true)
  const [rutaCriticaLoading, setRutaCriticaLoading] = useState(true)

  // -- Generated docs (already real-time via existing hook) --
  const { docs: generatedDocs, loading: generatedLoading } = useGeneratedDocs(projectId)

  // -- Medium rule state (persists between instant re-runs) --
  const [mediumReport, setMediumReport] = useState<ValidationReport | null>(null)
  const prevGenTimestampRef = useRef<number>(0)

  // -- Debounce timer --
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ---- Firestore subscriptions ----

  // 1. Project metadata
  useEffect(() => {
    if (!projectId) {
      setProjectData(null)
      setProjectLoading(false)
      return
    }
    return onSnapshot(
      doc(db, `projects/${projectId}`),
      (snap) => {
        setProjectData(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
        setProjectLoading(false)
      },
      () => setProjectLoading(false),
    )
  }, [projectId])

  // 2. Team members subcollection
  useEffect(() => {
    if (!projectId) {
      setTeamMembers([])
      setTeamLoading(false)
      return
    }
    return onSnapshot(
      query(collection(db, `projects/${projectId}/team`)),
      (snap) => {
        const members = snap.docs.map((d) => d.data() as TeamMember)
        setTeamMembers(members)
        setTeamLoading(false)
      },
      () => setTeamLoading(false),
    )
  }, [projectId])

  // 3. Uploaded documents subcollection
  useEffect(() => {
    if (!projectId) {
      setUploadedDocs([])
      setDocsLoading(false)
      return
    }
    return onSnapshot(
      query(collection(db, `projects/${projectId}/documents`)),
      (snap) => {
        const docs = snap.docs.map((d) => {
          const data = d.data()
          return {
            tipo: data.tipo ?? '',
            filename: data.filename ?? '',
            storagePath: data.storagePath ?? '',
            uploadedAt: data.uploadedAt?.toDate?.() ?? new Date(),
            fecha_emision: data.fecha_emision?.toDate?.() ?? undefined,
            status: data.status ?? 'uploaded',
          } as UploadedDocument
        })
        setUploadedDocs(docs)
        setDocsLoading(false)
      },
      () => setDocsLoading(false),
    )
  }, [projectId])

  // 4. ERPI settings (singleton)
  useEffect(() => {
    return onSnapshot(
      doc(db, 'erpiSettings/default'),
      (snap) => {
        setErpiSettings(snap.exists() ? (snap.data() as ERPISettings) : null)
        setErpiLoading(false)
      },
      () => setErpiLoading(false),
    )
  }, [])

  // 5. Budget total from meta/budget_output
  useEffect(() => {
    if (!projectId) {
      setBudgetTotalCentavos(undefined)
      setBudgetLoading(false)
      return
    }
    return onSnapshot(
      doc(db, `projects/${projectId}/meta/budget_output`),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setBudgetTotalCentavos(
            typeof data.totalCentavos === 'number' ? data.totalCentavos : undefined,
          )
        } else {
          setBudgetTotalCentavos(undefined)
        }
        setBudgetLoading(false)
      },
      () => setBudgetLoading(false),
    )
  }, [projectId])

  // 6. Cash flow total from generated/A9d
  useEffect(() => {
    if (!projectId) {
      setCashFlowDoc(null)
      setCashFlowLoading(false)
      return
    }
    return onSnapshot(
      doc(db, `projects/${projectId}/generated/A9d`),
      (snap) => {
        setCashFlowDoc(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
        setCashFlowLoading(false)
      },
      () => setCashFlowLoading(false),
    )
  }, [projectId])

  // 7. Esquema financiero total from generated/E1
  useEffect(() => {
    if (!projectId) {
      setEsquemaDoc(null)
      setEsquemaLoading(false)
      return
    }
    return onSnapshot(
      doc(db, `projects/${projectId}/generated/E1`),
      (snap) => {
        setEsquemaDoc(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
        setEsquemaLoading(false)
      },
      () => setEsquemaLoading(false),
    )
  }, [projectId])

  // 8. Ruta critica content from generated/A8b (for VALD-11)
  useEffect(() => {
    if (!projectId) {
      setRutaCriticaDoc(null)
      setRutaCriticaLoading(false)
      return
    }
    return onSnapshot(
      doc(db, `projects/${projectId}/generated/A8b`),
      (snap) => {
        setRutaCriticaDoc(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
        setRutaCriticaLoading(false)
      },
      () => setRutaCriticaLoading(false),
    )
  }, [projectId])

  // ---- Derived loading state ----

  const loading =
    projectLoading ||
    teamLoading ||
    docsLoading ||
    erpiLoading ||
    budgetLoading ||
    cashFlowLoading ||
    esquemaLoading ||
    generatedLoading ||
    rutaCriticaLoading

  // ---- Extract financial totals from Firestore documents ----

  const cashFlowTotalCentavos = useMemo((): number | undefined => {
    if (!cashFlowDoc) return undefined
    const content = cashFlowDoc.content as Record<string, unknown> | undefined
    if (!content) return undefined
    const structured = content.structured as Record<string, unknown> | undefined
    if (!structured) return undefined
    return typeof structured.grandTotal === 'number'
      ? structured.grandTotal
      : undefined
  }, [cashFlowDoc])

  const esquemaTotalCentavos = useMemo((): number | undefined => {
    if (!esquemaDoc) return undefined
    const content = esquemaDoc.content as Record<string, unknown> | undefined
    if (!content) return undefined
    const structured = content.structured as Record<string, unknown> | undefined
    if (!structured) return undefined
    return typeof structured.total_centavos === 'number'
      ? structured.total_centavos
      : undefined
  }, [esquemaDoc])

  // ---- Assemble ProjectDataSnapshot ----

  const snapshot = useMemo((): ProjectDataSnapshot | null => {
    if (loading || !projectData) return null

    // Extract metadata fields from project document
    const metadata = {
      titulo_proyecto: (projectData.titulo_proyecto as string) ?? '',
      categoria_cinematografica:
        (projectData.categoria_cinematografica as string) ?? '',
      periodo_registro: (projectData.periodo_registro as string) ?? '',
      es_coproduccion_internacional:
        (projectData.es_coproduccion_internacional as boolean) ?? false,
      costo_total_proyecto_centavos:
        (projectData.costo_total_proyecto_centavos as number) ?? 0,
      monto_solicitado_eficine_centavos:
        (projectData.monto_solicitado_eficine_centavos as number) ?? 0,
    }

    // Extract financial structure fields
    const financials = {
      erpiCashCentavos:
        (projectData.aportacion_erpi_efectivo_centavos as number) ?? 0,
      erpiInkindCentavos:
        (projectData.aportacion_erpi_especie_centavos as number) ?? 0,
      thirdPartyCentavos: computeThirdPartyTotal(projectData),
      otherFederalCentavos: 0, // No other federal resources tracked in current data model
      screenwriterFeeCentavos: computeScreenwriterFee(teamMembers),
      totalInkindHonorariosCentavos: computeInkindTotal(teamMembers),
      gestorFeeCentavos: (projectData.gestor_monto_centavos as number) ?? 0,
    }

    return {
      metadata,
      team: teamMembers,
      financials,
      erpiSettings,
      submissionsThisPeriod: 0, // Not tracked in current data model
      projectAttempts: 0, // Not tracked in current data model
      uploadedDocs,
      generatedDocs,
      budgetTotalCentavos,
      cashFlowTotalCentavos,
      esquemaTotalCentavos,
      feesFromContracts: extractFeesFromContracts(generatedDocs),
      feesFromBudget: extractFeesFromBudget(generatedDocs),
      feesFromCashFlow: extractFeesFromCashFlow(generatedDocs),
      cashFlowLineItems: extractCashFlowLineItems(cashFlowDoc),
      rutaCriticaDocContent: rutaCriticaDoc?.content ?? undefined,
      cashFlowDocContent: cashFlowDoc?.content ?? undefined,
    }
  }, [
    loading,
    projectData,
    teamMembers,
    uploadedDocs,
    erpiSettings,
    generatedDocs,
    budgetTotalCentavos,
    cashFlowTotalCentavos,
    esquemaTotalCentavos,
    cashFlowDoc,
    rutaCriticaDoc,
  ])

  // ---- Tiered validation execution ----

  // Track instant report separately for merging
  const [instantReport, setInstantReport] = useState<ValidationReport | null>(null)

  // Run instant rules (debounced 300ms) whenever snapshot changes
  const runInstant = useCallback(
    (snap: ProjectDataSnapshot) => {
      const result = runInstantRules(snap)
      setInstantReport(result)
    },
    [],
  )

  useEffect(() => {
    if (!snapshot) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runInstant(snapshot)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [snapshot, runInstant])

  // Run medium rules only when generatedDocs timestamps change
  useEffect(() => {
    if (!snapshot) return

    const currentTimestamp = getMaxGeneratedTimestamp(generatedDocs)
    if (
      currentTimestamp > 0 &&
      currentTimestamp !== prevGenTimestampRef.current
    ) {
      prevGenTimestampRef.current = currentTimestamp
      const result = runMediumRules(snapshot)
      setMediumReport(result)
    }
  }, [snapshot, generatedDocs])

  // ---- Merge instant + medium into combined report ----

  const report = useMemo((): ValidationReport | null => {
    if (!instantReport) return null
    return mergeReports(instantReport, mediumReport)
  }, [instantReport, mediumReport])

  // ---- Viability scoring ----

  const viabilityScore = useMemo((): ScoreCategory[] => {
    if (!snapshot) return []
    return computeViabilityScore(snapshot)
  }, [snapshot])

  const improvements = useMemo((): ImprovementSuggestion[] => {
    if (!snapshot || viabilityScore.length === 0) return []
    return generateImprovementSuggestions(viabilityScore, snapshot)
  }, [snapshot, viabilityScore])

  // ---- Cleanup debounce on unmount ----

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { report, viabilityScore, improvements, loading }
}

// ---- Data extraction helpers ----

function computeThirdPartyTotal(projectData: Record<string, unknown>): number {
  const terceros = projectData.terceros as
    | Array<{ monto_centavos: number }>
    | undefined
  if (!terceros) return 0
  return terceros.reduce((sum, t) => sum + (t.monto_centavos ?? 0), 0)
}

function computeScreenwriterFee(team: TeamMember[]): number {
  const screenwriters = team.filter((m) => m.cargo === 'Guionista')
  return screenwriters.reduce(
    (sum, m) => sum + (m.honorarios_centavos ?? 0),
    0,
  )
}

function computeInkindTotal(team: TeamMember[]): number {
  return team.reduce(
    (sum, m) => sum + (m.aportacion_especie_centavos ?? 0),
    0,
  )
}

/**
 * Extract fees from C2b (cesion de derechos) generated document.
 * Content structure varies; safely navigate nested objects.
 */
function extractFeesFromContracts(
  docs: GeneratedDocClient[],
): ProjectDataSnapshot['feesFromContracts'] {
  // Fees from contracts will be wired when document content is available
  // in the generated docs payload. Currently generatedDocs only contains
  // metadata (docId, docName, etc.), not full content.
  const _hasContracts = docs.some(
    (d) => d.docId === 'C2b' || d.docId === 'B3-prod' || d.docId === 'B3-dir',
  )
  return undefined
}

/**
 * Extract fees from A9b budget content.
 */
function extractFeesFromBudget(
  _docs: GeneratedDocClient[],
): ProjectDataSnapshot['feesFromBudget'] {
  // Budget fees will be extracted from budget_output content
  // when the validation engine receives full document content.
  return undefined
}

/**
 * Extract fees from A9d cash flow content.
 */
function extractFeesFromCashFlow(
  _docs: GeneratedDocClient[],
): ProjectDataSnapshot['feesFromCashFlow'] {
  // Cash flow fees will be extracted from A9d content
  // when the validation engine receives full document content.
  return undefined
}

/**
 * Extract cash flow line items for prohibited expenditure check (VALD-10).
 */
function extractCashFlowLineItems(
  cashFlowDoc: Record<string, unknown> | null,
): ProjectDataSnapshot['cashFlowLineItems'] {
  if (!cashFlowDoc) return undefined
  const content = cashFlowDoc.content as Record<string, unknown> | undefined
  if (!content) return undefined
  const structured = content.structured as Record<string, unknown> | undefined
  if (!structured) return undefined
  const lineItems = structured.lineItems as
    | Array<{ category: string; source: string; amount: number }>
    | undefined
  return lineItems ?? undefined
}
