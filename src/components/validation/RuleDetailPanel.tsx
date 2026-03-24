/**
 * Expanded detail content for a validation rule row.
 * Shows the rule's explanation message, bullet list of specific issues,
 * and IrAlCampoLink for navigable issues.
 */
import { IrAlCampoLink } from './IrAlCampoLink'
import type { ValidationResult } from '@/validation/types'

interface RuleDetailPanelProps {
  result: ValidationResult
}

export function RuleDetailPanel({ result }: RuleDetailPanelProps) {
  return (
    <div className="rounded-md bg-muted/50 px-4 py-3 space-y-2">
      {/* Explanation message */}
      <p className="text-sm text-foreground">{result.message}</p>

      {/* Bullet list of specific issues */}
      {result.details && result.details.length > 0 && (
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {result.details.map((detail, i) => (
            <li key={i}>{detail}</li>
          ))}
        </ul>
      )}

      {/* Navigation link to the field that needs fixing */}
      {result.navigateTo && (
        <div className="pt-1">
          <IrAlCampoLink navigateTo={result.navigateTo} />
        </div>
      )}
    </div>
  )
}
