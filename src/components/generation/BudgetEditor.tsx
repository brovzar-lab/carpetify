/**
 * Spreadsheet-like structured budget editor for A9b (presupuesto desglose).
 * Displays IMCINE account structure (100-1200) with editable quantity and unit cost cells.
 * Subtotals auto-recalculate on cell blur, grand total updates as sum of all accounts.
 * Per UI-SPEC "Budget Editor Layout" -- numeric cells use font-mono, right-aligned.
 */
import { ArrowLeft } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useBudgetEditor } from '@/hooks/useBudgetEditor'
import { BudgetAccountRow } from '@/components/generation/BudgetAccountRow'
import { DownstreamWarning } from '@/components/generation/DownstreamWarning'
import { formatMXN } from '@/lib/format'
import { es } from '@/locales/es'

interface BudgetEditorProps {
  projectId: string
  onBack: () => void
}

export function BudgetEditor({ projectId, onBack }: BudgetEditorProps) {
  const {
    accounts,
    grandTotalCentavos,
    loading,
    isDirty,
    changedAccounts,
    affectedDownstreamDocs,
    updateLineItem,
    toggleExpand,
  } = useBudgetEditor(projectId)

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="p-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b shrink-0">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {es.generation.budgetBackLink}
          </button>
          <h1 className="text-xl font-semibold">
            {es.generation.budgetHeading}
          </h1>
        </div>
      </div>

      {/* Downstream warning (D-16) */}
      {isDirty && affectedDownstreamDocs.length > 0 && (
        <DownstreamWarning
          changedField={`Subtotal Cuenta ${[...changedAccounts].join(', ')}`}
          affectedDocs={affectedDownstreamDocs}
        />
      )}

      {/* Budget table with horizontal scroll */}
      <ScrollArea className="flex-1">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  {es.generation.budgetColAccount}
                </TableHead>
                <TableHead>{es.generation.budgetColConcept}</TableHead>
                <TableHead className="w-[100px]">
                  {es.generation.budgetColUnit}
                </TableHead>
                <TableHead className="w-[80px] text-right">
                  {es.generation.budgetColQty}
                </TableHead>
                <TableHead className="w-[150px] text-right">
                  {es.generation.budgetColUnitCost}
                </TableHead>
                <TableHead className="w-[150px] text-right">
                  {es.generation.budgetColSubtotal}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account, accountIdx) => (
                <BudgetAccountRow
                  key={account.numeroCuenta}
                  account={account}
                  onToggleExpand={() => toggleExpand(accountIdx)}
                  onUpdateLineItem={(lineIdx, field, value) =>
                    updateLineItem(accountIdx, lineIdx, field, value)
                  }
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold border-t-2">
                <TableCell colSpan={5}>
                  {es.generation.budgetGrandTotal}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatMXN(grandTotalCentavos)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </ScrollArea>
    </div>
  )
}
