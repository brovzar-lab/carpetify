/**
 * Contextual expiration alert for the document upload screen (Screen 5).
 * Shows a warning or error alert below expirable documents with
 * actionable copy about uploading a replacement.
 *
 * Returns null for vigente documents (no alert needed).
 */
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { es } from '@/locales/es'

interface ExpirationAlertProps {
  docType: string
  daysRemaining: number
  status: 'vigente' | 'proximo' | 'critico' | 'vencido'
}

export function ExpirationAlert({
  status,
  daysRemaining,
}: ExpirationAlertProps) {
  if (status === 'vigente') return null

  if (status === 'vencido') {
    return (
      <Alert variant="destructive" className="mt-1.5">
        <AlertCircle className="size-4" />
        <AlertDescription>
          {es.validation.expirationUploadExpired}
        </AlertDescription>
      </Alert>
    )
  }

  // proximo or critico
  return (
    <Alert
      variant={status === 'critico' ? 'destructive' : 'default'}
      className="mt-1.5"
    >
      <AlertTriangle className="size-4" />
      <AlertDescription>
        {es.validation.expirationUploadAlert(daysRemaining)}
      </AlertDescription>
    </Alert>
  )
}
