import { ProjectCard } from './ProjectCard'
import type { ProjectMetadata } from '@/schemas/project'
import type { ProjectRole } from '@/lib/permissions'

interface ProjectWithId {
  id: string
  metadata: ProjectMetadata
  ownerId?: string
  collaborators?: Record<string, string>
}

interface PeriodGroupProps {
  period: string
  projects: ProjectWithId[]
  userId: string | undefined
  onDelete: (id: string) => void
  onClone: (id: string) => void
}

export function PeriodGroup({ period, projects, userId, onDelete, onClone }: PeriodGroupProps) {
  function getUserRole(project: ProjectWithId): ProjectRole | null {
    if (!userId) return null
    if (project.ownerId === userId) return 'productor'
    if (project.collaborators && userId in project.collaborators) {
      return project.collaborators[userId] as ProjectRole
    }
    return null
  }

  return (
    <section className="space-y-4">
      <h2 className="text-[20px] font-semibold leading-[1.2]">
        {period}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            id={project.id}
            metadata={project.metadata}
            userRole={getUserRole(project)}
            onDelete={onDelete}
            onClone={onClone}
          />
        ))}
      </div>
    </section>
  )
}
