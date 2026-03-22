import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { es } from '@/locales/es'
import { cn } from '@/lib/utils'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveIndicatorProps {
  status: SaveStatus
}

/**
 * Subtle auto-save status indicator positioned top-right of wizard content area.
 * Shows "Guardando..." while saving, "Guardado" with checkmark on success
 * (fades after 3 seconds), error message on failure.
 */
export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status === 'saving' || status === 'error') {
      setVisible(true)
    } else if (status === 'saved') {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [status])

  if (!visible) return null

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm transition-opacity duration-300',
        status === 'error' && 'text-destructive',
        status === 'saving' && 'text-muted-foreground',
        status === 'saved' && 'text-[hsl(142_76%_36%)] dark:text-[hsl(142_70%_45%)]',
      )}
    >
      {status === 'saving' && <span>{es.autoSave.saving}</span>}
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>{es.autoSave.saved}</span>
        </>
      )}
      {status === 'error' && <span>{es.autoSave.error}</span>}
    </div>
  )
}
