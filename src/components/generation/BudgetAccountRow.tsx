/**
 * Single IMCINE account row (100-1200) with collapsible subconcepts.
 * Account header row: bold, full-width, with subtotal right-aligned.
 * Subconcept rows: indented 24px, editable quantity and unit cost cells.
 * Numeric cells: right-aligned, font-mono, formatted as $X,XXX,XXX MXN on blur.
 */
import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { formatMXN, parseMXNInput } from '@/lib/format'
import type { BudgetAccount } from '@/hooks/useBudgetEditor'

interface BudgetAccountRowProps {
  account: BudgetAccount
  onToggleExpand: () => void
  onUpdateLineItem: (
    lineIdx: number,
    field: 'cantidad' | 'costoUnitarioCentavos',
    value: number,
  ) => void
}

/**
 * Inline editable cell for budget numeric values.
 * Shows raw number on focus, formatted value on blur (same pattern as MXNInput).
 */
function EditableCell({
  value,
  isCurrency,
  onChange,
}: {
  value: number
  isCurrency: boolean
  onChange: (value: number) => void
}) {
  const [focused, setFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')

  const displayValue = focused
    ? rawInput
    : isCurrency
      ? formatMXN(value)
      : String(value)

  const handleFocus = useCallback(() => {
    setFocused(true)
    if (isCurrency) {
      const pesos = Math.round(value / 100)
      setRawInput(pesos > 0 ? String(pesos) : '')
    } else {
      setRawInput(value > 0 ? String(value) : '')
    }
  }, [value, isCurrency])

  const handleBlur = useCallback(() => {
    setFocused(false)
    if (rawInput.trim() === '') {
      onChange(0)
    } else if (isCurrency) {
      const centavos = parseMXNInput(rawInput)
      onChange(centavos)
    } else {
      const parsed = parseInt(rawInput, 10)
      onChange(isNaN(parsed) ? 0 : parsed)
    }
  }, [rawInput, isCurrency, onChange])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^\d]/g, '')
      setRawInput(val)
    },
    [],
  )

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="w-full text-right font-mono bg-transparent border-0 outline-none focus:bg-muted/50 focus:ring-1 focus:ring-ring rounded px-1 py-0.5 text-sm"
    />
  )
}

export function BudgetAccountRow({
  account,
  onToggleExpand,
  onUpdateLineItem,
}: BudgetAccountRowProps) {
  return (
    <>
      {/* Account header row */}
      <TableRow
        className="cursor-pointer bg-muted/30 hover:bg-muted/50"
        onClick={onToggleExpand}
      >
        <TableCell className="font-semibold">
          <div className="flex items-center gap-1">
            {account.isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            {account.numeroCuenta}
          </div>
        </TableCell>
        <TableCell colSpan={4} className="font-semibold">
          {account.nombreCuenta}
        </TableCell>
        <TableCell className="text-right font-mono font-semibold">
          {formatMXN(account.subtotalCentavos)}
        </TableCell>
      </TableRow>

      {/* Subconcept rows (visible when expanded) */}
      {account.isExpanded &&
        account.partidas.map((line, lineIdx) => (
          <TableRow key={`${account.numeroCuenta}-${lineIdx}`}>
            <TableCell />
            <TableCell className="pl-8">{line.concepto}</TableCell>
            <TableCell className="text-muted-foreground">
              {line.unidad}
            </TableCell>
            <TableCell className="text-right">
              <EditableCell
                value={line.cantidad}
                isCurrency={false}
                onChange={(val) =>
                  onUpdateLineItem(lineIdx, 'cantidad', val)
                }
              />
            </TableCell>
            <TableCell className="text-right">
              <EditableCell
                value={line.costoUnitarioCentavos}
                isCurrency={true}
                onChange={(val) =>
                  onUpdateLineItem(lineIdx, 'costoUnitarioCentavos', val)
                }
              />
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatMXN(line.subtotalCentavos)}
            </TableCell>
          </TableRow>
        ))}
    </>
  )
}
