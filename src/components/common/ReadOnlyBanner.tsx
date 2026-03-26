import { Lock } from 'lucide-react'
import { es } from '@/locales/es'

interface ReadOnlyBannerProps {
  productorName?: string
}

/**
 * Subtle banner shown at the top of wizard screens the user cannot edit.
 * Per D-04: "Solo lectura -- contacta a [Productor Name] para editar."
 * Uses the productor's actual name, or "al productor" as fallback.
 */
export function ReadOnlyBanner({ productorName }: ReadOnlyBannerProps) {
  const name = productorName || 'al productor'

  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 py-2 px-4 text-sm text-amber-800 dark:text-amber-200 mb-4">
      <Lock className="h-4 w-4 shrink-0" />
      <span>{es.rbac.readOnly.banner(name)}</span>
    </div>
  )
}
