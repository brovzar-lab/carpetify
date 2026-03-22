import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'

interface EmptyStateProps {
  onCreateProject: () => void
}

export function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h2 className="text-[20px] font-semibold leading-[1.2] mb-2">
        {es.dashboard.emptyStateHeading}
      </h2>
      <p className="text-[14px] text-muted-foreground max-w-md text-center mb-6">
        {es.dashboard.emptyStateBody}
      </p>
      <Button onClick={onCreateProject}>
        {es.dashboard.emptyStateCTA}
      </Button>
    </div>
  )
}
