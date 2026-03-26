import { Badge } from '@/components/ui/badge';
import { es } from '@/locales/es';
import type { VersionTriggerReason } from '@/types/versioning';

interface VersionBadgeProps {
  triggerReason: VersionTriggerReason;
}

const badgeConfig: Record<VersionTriggerReason, { className: string; label: string }> = {
  regeneration: {
    className: 'bg-primary/10 text-primary',
    label: es.versioning.triggerRegeneration,
  },
  manual_revert: {
    className: 'bg-destructive/10 text-destructive',
    label: es.versioning.triggerRevert,
  },
  pipeline_run: {
    className: 'bg-muted text-muted-foreground',
    label: es.versioning.triggerPipeline,
  },
};

export function VersionBadge({ triggerReason }: VersionBadgeProps) {
  const config = badgeConfig[triggerReason];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
