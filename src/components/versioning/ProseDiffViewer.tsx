import { useMemo } from 'react';
import { diffWords } from 'diff';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProseDiffViewerProps {
  oldContent: string;
  newContent: string;
  oldLabel: string;
  newLabel: string;
}

export function ProseDiffViewer({
  oldContent,
  newContent,
  oldLabel,
  newLabel,
}: ProseDiffViewerProps) {
  const changes = useMemo(
    () => diffWords(oldContent, newContent),
    [oldContent, newContent],
  );

  return (
    <div className="grid grid-cols-2 gap-8 min-w-[600px]">
      {/* Left column: Version A with deletions */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">{oldLabel}</p>
        <ScrollArea className="max-h-[60vh]">
          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {changes.map((change, i) => {
              if (change.added) return null;
              if (change.removed) {
                return (
                  <span
                    key={i}
                    className="bg-red-100 text-red-900 line-through dark:bg-red-900/30 dark:text-red-300"
                    aria-label={`texto eliminado: ${change.value}`}
                  >
                    {change.value}
                  </span>
                );
              }
              return <span key={i}>{change.value}</span>;
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right column: Version B with additions */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">{newLabel}</p>
        <ScrollArea className="max-h-[60vh]">
          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {changes.map((change, i) => {
              if (change.removed) return null;
              if (change.added) {
                return (
                  <span
                    key={i}
                    className="bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300"
                    aria-label={`texto agregado: ${change.value}`}
                  >
                    {change.value}
                  </span>
                );
              }
              return <span key={i}>{change.value}</span>;
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
