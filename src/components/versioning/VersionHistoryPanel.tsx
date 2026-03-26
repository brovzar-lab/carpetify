import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { X, History } from 'lucide-react';
import { es } from '@/locales/es';
import { formatDateES } from '@/lib/format';
import { getDocumentVersions } from '@/services/versionHistory';
import { VersionBadge } from './VersionBadge';
import type { DocumentVersion, CurrentDocumentVersion } from '@/types/versioning';

interface VersionHistoryPanelProps {
  projectId: string;
  docId: string;
  currentVersion: CurrentDocumentVersion | null;
  onCompare: () => void;
  onRevert: (targetVersion: number) => void;
  onClose: () => void;
}

export function VersionHistoryPanel({
  projectId,
  docId,
  currentVersion,
  onCompare,
  onRevert,
  onClose,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchVersions() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDocumentVersions(projectId, docId);
        if (!cancelled) {
          setVersions(result);
        }
      } catch {
        if (!cancelled) {
          setError(es.versioning.fetchError);
          toast.error(es.versioning.fetchError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchVersions();
    return () => {
      cancelled = true;
    };
  }, [projectId, docId]);

  const totalVersions = versions.length + (currentVersion ? 1 : 0);
  const canCompare = totalVersions >= 2;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{es.versioning.panelHeading}</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">{es.versioning.closeHistory}</span>
          </Button>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Empty state: only version 1 exists, no history
  if (versions.length === 0 && currentVersion?.version === 1) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{es.versioning.panelHeading}</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">{es.versioning.closeHistory}</span>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="size-10 text-muted-foreground mb-3" />
          <p className="text-sm font-semibold">{es.versioning.emptyHeading}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {es.versioning.emptyBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{es.versioning.panelHeading}</h3>
        <div className="flex items-center gap-2">
          {canCompare ? (
            <Button variant="default" size="sm" onClick={onCompare}>
              {es.versioning.compareButton}
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <Button variant="default" size="sm" disabled>
                  {es.versioning.compareButton}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{es.versioning.compareMinVersions}</TooltipContent>
            </Tooltip>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">{es.versioning.closeHistory}</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Version list */}
      <ScrollArea className="max-h-[60vh]">
        <div role="list">
          {/* Current version entry */}
          {currentVersion && (
            <div role="listitem" className="hover:bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {es.versioning.versionLabel(currentVersion.version)}{' '}
                    <span className="text-muted-foreground">
                      {es.versioning.currentLabel}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentVersion.generatedAt
                      ? formatDateES(currentVersion.generatedAt)
                      : '---'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Historical versions */}
          {versions.map((ver, idx) => (
            <div key={ver.version}>
              {(idx > 0 || currentVersion) && <Separator />}
              <div role="listitem" className="hover:bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {es.versioning.versionLabel(ver.version)}
                      </p>
                      <VersionBadge triggerReason={ver.triggerReason} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ver.generatedAt ? formatDateES(ver.generatedAt) : '---'}
                      {ver.triggeredBy ? ` — ${ver.triggeredBy}` : ' — Sistema'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRevert(ver.version)}
                  >
                    {es.versioning.restoreButton}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
