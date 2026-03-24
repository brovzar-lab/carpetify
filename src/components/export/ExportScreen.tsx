/**
 * Main export wizard screen.
 * Full implementation in Task 2 -- this is a minimal version for Task 1 integration.
 */
import { es } from '@/locales/es'

interface ExportScreenProps {
  projectId: string
}

export function ExportScreen({ projectId: _projectId }: ExportScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-xl font-semibold">{es.export.pageTitle}</h1>
    </div>
  )
}
