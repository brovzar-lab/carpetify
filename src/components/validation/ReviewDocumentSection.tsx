/**
 * Collapsible section per document showing persona findings.
 * Per UI-SPEC Document Drill-Down Section Visual Spec.
 */
import { useState } from 'react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'
import { es } from '@/locales/es'
import { ReviewFindingItem } from './ReviewFindingItem'
import type { ReviewFinding } from '@/services/review'

interface ReviewDocumentSectionProps {
  documentId: string
  documentName: string
  findings: ReviewFinding[]
  onToggle: (findingIndex: number) => void
}

export function ReviewDocumentSection({
  documentName,
  findings,
  onToggle,
}: ReviewDocumentSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-2">
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
        <span className="text-sm font-semibold">{documentName}</span>
        <Badge variant="outline" className="text-xs border-transparent">
          {es.review.findingCount(findings.length)}
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-2 pl-6">
          {findings.map((finding, index) => (
            <ReviewFindingItem
              key={`${finding.personaId}-${index}`}
              finding={finding}
              onToggle={() => onToggle(index)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
