import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { es } from '@/locales/es';
import { formatDateES } from '@/lib/format';
import { X } from 'lucide-react';
import type { VersionTriggerReason } from '@/types/versioning';

interface VersionEntry {
  version: number;
  generatedAt: Date | null;
  triggeredBy: string | null;
  triggerReason: VersionTriggerReason;
}

interface VersionSelectorProps {
  versions: VersionEntry[];
  currentVersion: number;
  versionA: number;
  versionB: number;
  onVersionAChange: (v: number) => void;
  onVersionBChange: (v: number) => void;
  onClose: () => void;
}

function getTriggerLabel(reason: VersionTriggerReason): string {
  switch (reason) {
    case 'regeneration':
      return es.versioning.triggerRegeneration;
    case 'manual_revert':
      return es.versioning.triggerRevert;
    case 'pipeline_run':
      return es.versioning.triggerPipeline;
  }
}

function getOptionLabel(entry: VersionEntry, currentVersion: number): string {
  const dateStr = entry.generatedAt ? formatDateES(entry.generatedAt) : '---';
  const userName = entry.triggeredBy ?? 'Sistema';
  const reasonStr = getTriggerLabel(entry.triggerReason);
  const label = es.versioning.entryFormat(entry.version, dateStr, userName, reasonStr);
  if (entry.version === currentVersion) {
    return `${label} ${es.versioning.currentLabel}`;
  }
  return label;
}

export function VersionSelector({
  versions,
  currentVersion,
  versionA,
  versionB,
  onVersionAChange,
  onVersionBChange,
  onClose,
}: VersionSelectorProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm">{es.versioning.compareLabel}</span>

      <Select
        value={versionA}
        onValueChange={(val) => onVersionAChange(val as number)}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {versions.map((entry) => (
            <SelectItem key={entry.version} value={entry.version}>
              {getOptionLabel(entry, currentVersion)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-sm text-muted-foreground">
        {es.versioning.compareSeparator}
      </span>

      <Select
        value={versionB}
        onValueChange={(val) => onVersionBChange(val as number)}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {versions.map((entry) => (
            <SelectItem key={entry.version} value={entry.version}>
              {getOptionLabel(entry, currentVersion)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" size="icon-sm" onClick={onClose}>
        <X className="size-4" />
        <span className="sr-only">{es.versioning.closeCompare}</span>
      </Button>
    </div>
  );
}
