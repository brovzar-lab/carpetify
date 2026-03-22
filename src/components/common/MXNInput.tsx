import { useState, useCallback, type InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMXN, parseMXNInput } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MXNInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'type'
  > {
  /** Value in centavos (integer) */
  value: number
  /** Called with new value in centavos */
  onChange: (centavos: number) => void
  label?: string
  error?: string
}

/**
 * Reusable currency input component for MXN monetary fields.
 * Format on blur: user types raw digits, display shows $X,XXX,XXX MXN.
 * Internal value is always centavos (integer).
 */
export function MXNInput({
  value,
  onChange,
  label,
  error,
  className,
  id,
  ...inputProps
}: MXNInputProps) {
  const [focused, setFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')

  const displayValue = focused ? rawInput : value > 0 ? formatMXN(value) : ''

  const handleFocus = useCallback(() => {
    setFocused(true)
    // Show raw pesos (strip formatting) for editing
    const pesos = Math.round(value / 100)
    setRawInput(pesos > 0 ? String(pesos) : '')
  }, [value])

  const handleBlur = useCallback(() => {
    setFocused(false)
    if (rawInput.trim() === '') {
      onChange(0)
    } else {
      const centavos = parseMXNInput(rawInput)
      onChange(centavos)
    }
  }, [rawInput, onChange])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow only digits while typing
      const val = e.target.value.replace(/[^\d]/g, '')
      setRawInput(val)
    },
    [],
  )

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <Input
        id={inputId}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(error && 'border-destructive', className)}
        {...inputProps}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
