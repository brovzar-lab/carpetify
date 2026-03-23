/**
 * Alert component showing which downstream documents are inconsistent after budget edits (D-16).
 * Appears above the budget table when any cell has been modified.
 */
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { es } from '@/locales/es'

interface DownstreamWarningProps {
  changedField: string
  affectedDocs: string[]
}

export function DownstreamWarning({
  changedField,
  affectedDocs,
}: DownstreamWarningProps) {
  return (
    <Alert className="m-4 mb-0 border-[hsl(38_92%_50%)] bg-[hsl(38_92%_50%)]/10">
      <AlertTriangle className="h-4 w-4 text-[hsl(38_92%_50%)]" />
      <AlertDescription>
        {es.generation.downstreamWarning(changedField, affectedDocs.join(', '))}
      </AlertDescription>
    </Alert>
  )
}
