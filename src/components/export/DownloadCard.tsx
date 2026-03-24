/**
 * Persistent download card shown after successful export per D-16.
 *
 * Shows green checkmark, filename, size, export date, and re-download link.
 * Stays visible on the export screen indefinitely for re-downloads.
 */
import { CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'

interface DownloadCardProps {
  filename: string
  sizeMB: string
  date: string
  onRedownload: () => void
}

export function DownloadCard({
  filename,
  sizeMB,
  date,
  onRedownload,
}: DownloadCardProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-6 text-[hsl(142_76%_36%)]" />
        <h3 className="text-lg font-semibold">{es.export.progressComplete}</h3>
      </div>

      <div className="space-y-1 pl-9">
        <p className="text-sm font-medium">
          {es.export.downloadMeta(filename, sizeMB)}
        </p>
        <p className="text-xs text-muted-foreground">
          {es.export.downloadDate(date)}
        </p>
      </div>

      <div className="pl-9">
        <Button
          variant="link"
          className="gap-1.5 px-0 text-primary"
          onClick={onRedownload}
        >
          <Download className="size-4" />
          {es.export.downloadRedownload}
        </Button>
      </div>
    </div>
  )
}
