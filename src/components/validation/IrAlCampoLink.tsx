/**
 * Navigation link from validation error to the wizard field that needs fixing.
 * Uses react-router useNavigate to deep-link to the target screen with
 * field highlight and optional member index query params.
 */
import { useNavigate, useParams } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'
import type { NavigateTo } from '@/validation/types'

interface IrAlCampoLinkProps {
  navigateTo: NavigateTo
  label?: string
}

export function IrAlCampoLink({ navigateTo, label }: IrAlCampoLinkProps) {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  const handleClick = () => {
    if (!projectId) return

    let url = `/project/${projectId}/${navigateTo.screen}`
    const params = new URLSearchParams()

    if (navigateTo.fieldId) {
      params.set('highlight', navigateTo.fieldId)
    }
    if (navigateTo.memberIndex !== undefined) {
      params.set('member', String(navigateTo.memberIndex))
    }

    const qs = params.toString()
    if (qs) url += `?${qs}`

    navigate(url)
  }

  return (
    <Button
      variant="link"
      size="sm"
      className="h-9 min-h-[36px] gap-1 px-0 text-primary"
      onClick={handleClick}
    >
      {label ?? es.validation.goToField}
      <ArrowRight className="size-3.5" />
    </Button>
  )
}
