import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface ScreenplayViewerProps {
  fileUrl: string | null
}

/**
 * PDF viewer for screenplay display using react-pdf v10.
 * Continuous scroll through all pages wrapped in shadcn ScrollArea.
 */
export function ScreenplayViewer({ fileUrl }: ScreenplayViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [error, setError] = useState(false)

  if (!fileUrl) return null

  function onDocumentLoadSuccess({ numPages: total }: { numPages: number }) {
    setNumPages(total)
    setError(false)
  }

  function onDocumentLoadError() {
    setError(true)
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No se pudo cargar el PDF</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="space-y-4 p-4">
            <Skeleton className="h-[600px] w-full" />
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            width={500}
            className="mb-2"
            loading={<Skeleton className="h-[600px] w-full" />}
          />
        ))}
      </Document>
    </ScrollArea>
  )
}
