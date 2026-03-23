import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { formatMXN } from '@/lib/format'
import { toast } from 'sonner'
import { es } from '@/locales/es'

export interface BudgetLineItem {
  concepto: string
  unidad: string
  cantidad: number
  costoUnitarioCentavos: number
  subtotalCentavos: number
}

export interface BudgetAccount {
  numeroCuenta: number
  nombreCuenta: string
  partidas: BudgetLineItem[]
  subtotalCentavos: number
  isExpanded: boolean
}

interface BudgetOutput {
  cuentas: Array<Omit<BudgetAccount, 'isExpanded'>>
  totalCentavos: number
  totalFormatted: string
}

/**
 * Hook for managing the structured budget editor (IMCINE accounts 100-1200).
 * Auto-saves with 1500ms debounce to BOTH generated/A9b AND meta/budget_output.
 * CRITICAL: Writes FULL BudgetOutput (including partidas arrays) to meta/budget_output
 * so that downstream passes (financeAdvisor, legal, combined) via loadBudgetOutput()
 * receive the complete structure that computeBudget() would produce.
 */
export function useBudgetEditor(projectId: string) {
  const [accounts, setAccounts] = useState<BudgetAccount[]>([])
  const [grandTotalCentavos, setGrandTotalCentavos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [changedAccounts, setChangedAccounts] = useState<Set<number>>(new Set())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Load budget data from Firestore projects/{id}/generated/A9b
  useEffect(() => {
    const loadBudget = async () => {
      try {
        const docRef = doc(db, `projects/${projectId}/generated/A9b`)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          const budgetData = data.content as {
            cuentas: Array<Omit<BudgetAccount, 'isExpanded'>>
            totalCentavos: number
          }
          setAccounts(
            budgetData.cuentas.map((c) => ({ ...c, isExpanded: false })),
          )
          setGrandTotalCentavos(budgetData.totalCentavos)
        }
      } catch {
        toast.error(es.errors.firestoreConnection)
      }
      setLoading(false)
    }
    loadBudget()
  }, [projectId])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Auto-save with 1500ms debounce (matching Phase 1 useAutoSave pattern).
  // CRITICAL: Writes FULL BudgetOutput including partidas arrays to BOTH locations.
  // meta/budget_output is read by downstream generation passes (financeAdvisor, legal, combined)
  // via loadBudgetOutput(). If we only wrote account totals without partidas, those passes
  // would receive an incomplete BudgetOutput and fail or produce incorrect documents.
  const scheduleAutoSave = useCallback(
    (updatedAccounts: BudgetAccount[], updatedTotal: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          // Strip UI-only isExpanded field for storage
          const cleanAccounts = updatedAccounts.map(
            ({ isExpanded: _, ...rest }) => rest,
          )
          const fullBudgetOutput: BudgetOutput = {
            cuentas: cleanAccounts,
            totalCentavos: updatedTotal,
            totalFormatted: formatMXN(updatedTotal),
          }

          // Write to generated/A9b (the document itself)
          const docRef = doc(db, `projects/${projectId}/generated/A9b`)
          await updateDoc(docRef, {
            content: fullBudgetOutput,
            manuallyEdited: true,
          })

          // Write FULL BudgetOutput to meta/budget_output for downstream passes.
          // This MUST include the complete cuentas array with ALL partidas
          // (not just account totals) so that loadBudgetOutput() returns
          // the same structure that computeBudget() produces.
          const metaRef = doc(db, `projects/${projectId}/meta/budget_output`)
          await setDoc(
            metaRef,
            {
              ...fullBudgetOutput,
              updatedAt: Timestamp.now(),
            },
            { merge: true },
          )

          setIsDirty(false)
          setChangedAccounts(new Set())
          toast.success(es.generation.budgetSaved)
        } catch {
          toast.error(es.errors.firestoreConnection)
        }
      }, 1500)
    },
    [projectId],
  )

  const updateLineItem = useCallback(
    (
      accountIdx: number,
      lineIdx: number,
      field: 'cantidad' | 'costoUnitarioCentavos',
      value: number,
    ) => {
      setAccounts((prev) => {
        const updated = [...prev]
        const account = { ...updated[accountIdx] }
        const partidas = [...account.partidas]
        const line = { ...partidas[lineIdx] }

        line[field] = value
        line.subtotalCentavos = line.cantidad * line.costoUnitarioCentavos
        partidas[lineIdx] = line
        account.partidas = partidas
        account.subtotalCentavos = partidas.reduce(
          (sum, p) => sum + p.subtotalCentavos,
          0,
        )
        updated[accountIdx] = account

        const newGrandTotal = updated.reduce(
          (sum, a) => sum + a.subtotalCentavos,
          0,
        )
        setGrandTotalCentavos(newGrandTotal)
        setChangedAccounts(
          (prev) => new Set(prev).add(account.numeroCuenta),
        )
        setIsDirty(true)

        // Schedule auto-save with the FULL updated data
        scheduleAutoSave(updated, newGrandTotal)

        return updated
      })
    },
    [scheduleAutoSave],
  )

  const toggleExpand = useCallback((accountIdx: number) => {
    setAccounts((prev) => {
      const updated = [...prev]
      updated[accountIdx] = {
        ...updated[accountIdx],
        isExpanded: !updated[accountIdx].isExpanded,
      }
      return updated
    })
  }, [])

  // Downstream affected documents when budget changes (D-16)
  const affectedDownstreamDocs = isDirty
    ? [
        'Flujo de Efectivo (FORMATO 3)',
        'Esquema Financiero (FORMATO 9)',
        'Contrato Productor',
        'Contrato Director',
      ]
    : []

  return {
    accounts,
    grandTotalCentavos,
    loading,
    isDirty,
    changedAccounts,
    affectedDownstreamDocs,
    updateLineItem,
    toggleExpand,
  }
}
