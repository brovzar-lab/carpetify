import { useNavigate, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createProject, deleteProject, cloneProject, listProjects } from '@/services/projects'
import { PERIODOS_EFICINE } from '@/lib/constants'
import { es } from '@/locales/es'
import { PeriodGroup } from './PeriodGroup'
import { EmptyState } from './EmptyState'
import type { ProjectMetadata } from '@/schemas/project'

interface ProjectWithId {
  id: string
  metadata: ProjectMetadata
  createdAt: Date
}

function groupByPeriod(projects: ProjectWithId[]) {
  const groups: Record<string, ProjectWithId[]> = {}

  for (const project of projects) {
    const periodo = project.metadata.periodo_registro
    const periodInfo = PERIODOS_EFICINE[periodo as keyof typeof PERIODOS_EFICINE]
    const key = periodInfo?.label ?? 'Sin periodo asignado'
    if (!groups[key]) groups[key] = []
    groups[key].push(project)
  }

  return groups
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/project/${newId}/datos`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const cloneMutation = useMutation({
    mutationFn: cloneProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(es.dashboard.cloneToast)
    },
  })

  const handleCreate = () => {
    createMutation.mutate()
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleClone = (id: string) => {
    cloneMutation.mutate(id)
  }

  const grouped = projects ? groupByPeriod(projects) : {}
  const isEmpty = !isLoading && (!projects || projects.length === 0)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          {/* Header row */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[28px] font-semibold leading-[1.2]">
              {es.dashboard.title}
            </h1>
            <div className="flex items-center gap-3">
              <Link
                to="/erpi"
                className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                {es.erpi.title}
              </Link>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {es.dashboard.newProject}
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading && <SkeletonCards />}

          {isEmpty && <EmptyState onCreateProject={handleCreate} />}

          {!isLoading && !isEmpty && (
            <div className="space-y-8">
              {Object.entries(grouped).map(([period, periodProjects]) => (
                <PeriodGroup
                  key={period}
                  period={period}
                  projects={periodProjects}
                  onDelete={handleDelete}
                  onClone={handleClone}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
