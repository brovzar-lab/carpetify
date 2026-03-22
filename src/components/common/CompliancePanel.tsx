import type { ComplianceResult } from '@/hooks/useCompliance'
import { formatMXN } from '@/lib/format'
import { EFICINE_MAX_MXN_CENTAVOS } from '@/lib/constants'
import { es } from '@/locales/es'

interface CompliancePanelProps {
  result: ComplianceResult
}

interface MetricRowProps {
  label: string
  isOk: boolean
}

function MetricRow({ label, isOk }: MetricRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
          isOk
            ? 'bg-[hsl(142_76%_36%)] dark:bg-[hsl(142_70%_45%)]'
            : 'bg-[hsl(0_84%_60%)] dark:bg-[hsl(0_62%_30%)]'
        }`}
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/**
 * Always-visible compliance panel, 280px wide, fixed right side of Screen 4.
 * Displays 6 EFICINE compliance metrics with green/red status indicators.
 * Per D-14, D-22.
 */
export function CompliancePanel({ result }: CompliancePanelProps) {
  const {
    erpiPct,
    eficinePct,
    federalPct,
    screenwriterPct,
    inkindPct,
    eficineMonto,
    violations,
  } = result

  return (
    <div className="w-[280px] shrink-0 rounded-md border bg-muted/50 p-4">
      <h3 className="mb-4 text-sm font-semibold">
        {es.screen4.complianceTitle}
      </h3>

      <div className="space-y-3">
        {/* ERPI >= 20% */}
        <MetricRow
          label={es.screen4.complianceERPI(erpiPct.toFixed(1))}
          isOk={erpiPct >= 20}
        />

        {/* EFICINE <= 80% */}
        <MetricRow
          label={es.screen4.complianceEFICINE(eficinePct.toFixed(1))}
          isOk={eficinePct <= 80}
        />

        {/* Federal <= 80% */}
        <MetricRow
          label={es.screen4.complianceFederal(federalPct.toFixed(1))}
          isOk={federalPct <= 80}
        />

        {/* Screenwriter >= 3% */}
        <MetricRow
          label={es.screen4.complianceScreenwriter(
            screenwriterPct.toFixed(1),
          )}
          isOk={screenwriterPct >= 3}
        />

        {/* In-kind <= 10% */}
        <MetricRow
          label={es.screen4.complianceInkind(inkindPct.toFixed(1))}
          isOk={inkindPct <= 10}
        />

        {/* EFICINE cap <= $25M */}
        <MetricRow
          label={es.screen4.complianceEFICINECap(formatMXN(eficineMonto))}
          isOk={eficineMonto <= EFICINE_MAX_MXN_CENTAVOS}
        />
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-3">
          <p className="text-xs font-semibold text-destructive">
            Violaciones ({violations.length})
          </p>
          {violations.map((v, i) => (
            <p key={i} className="text-xs text-destructive">
              {v.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
