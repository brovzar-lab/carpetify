import { ProjectCard } from './ProjectCard'
import type { ProjectMetadata } from '@/schemas/project'

interface ProjectWithId {
  id: string
  metadata: ProjectMetadata
}

interface PeriodGroupProps {
  period: string
  projects: ProjectWithId[]
  onDelete: (id: string) => void
  onClone: (id: string) => void
}

export function PeriodGroup({ period, projects, onDelete, onClone }: PeriodGroupProps) {
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
            onDelete={onDelete}
            onClone={onClone}
          />
        ))}
      </div>
    </section>
  )
}
