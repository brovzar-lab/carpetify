import { es } from '@/locales/es'

interface GenerationScreenProps {
  projectId: string
}

/**
 * Main generation screen — placeholder for Task 1.
 * Full implementation in Task 3.
 */
export function GenerationScreen({ projectId: _projectId }: GenerationScreenProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <h1 className="text-xl font-semibold">{es.generation.pageTitle}</h1>
      </div>
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="font-semibold">{es.generation.emptyHeading}</p>
          <p className="text-sm mt-1">{es.generation.emptyBody}</p>
        </div>
      </div>
    </div>
  )
}
