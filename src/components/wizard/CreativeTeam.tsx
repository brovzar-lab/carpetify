import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  TeamMemberForm,
  type TeamMemberFormData,
} from '@/components/wizard/TeamMemberForm'
import { AutoSaveIndicator } from '@/components/common/AutoSaveIndicator'
import { useAutoSave } from '@/hooks/useAutoSave'
import { es } from '@/locales/es'

interface CreativeTeamProps {
  projectId: string
}

interface TeamMemberEntry {
  id: string
  data: Partial<TeamMemberFormData>
}

let nextId = 1
function generateId() {
  return `member-${nextId++}-${Date.now()}`
}

/**
 * Screen 3: Equipo Creativo
 * Dynamic list of team members with expandable per-member forms.
 * Each member saves independently via auto-save.
 */
export function CreativeTeam({ projectId }: CreativeTeamProps) {
  const [members, setMembers] = useState<TeamMemberEntry[]>([])
  const { save, status: saveStatus } = useAutoSave(projectId, 'team')

  const handleAddMember = useCallback(() => {
    setMembers((prev) => [...prev, { id: generateId(), data: {} }])
  }, [])

  const handleRemoveMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const handleSaveMember = useCallback(
    (id: string, data: TeamMemberFormData) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, data } : m)),
      )
      // Save team member data to Firestore
      save({ [`members.${id}`]: data } as Record<string, unknown>)
    },
    [save],
  )

  return (
    <div className="space-y-6">
      {/* Screen title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{es.screen3.title}</h1>
          {members.length === 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {es.screen3.emptyStateBody}
            </p>
          )}
        </div>
        <AutoSaveIndicator status={saveStatus} />
      </div>

      <Separator />

      {/* Team member list */}
      <div className="space-y-3">
        {members.map((member, index) => (
          <TeamMemberForm
            key={member.id}
            index={index}
            defaultValues={member.data}
            onSave={(data) => handleSaveMember(member.id, data)}
            onRemove={() => handleRemoveMember(member.id)}
          />
        ))}
      </div>

      {/* Add member button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddMember}
        className="w-full"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        {es.screen3.addMember}
      </Button>
    </div>
  )
}
