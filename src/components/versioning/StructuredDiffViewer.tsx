import { useMemo } from 'react';
import { diffJson } from 'diff';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { ProseDiffViewer } from './ProseDiffViewer';

interface StructuredDiffViewerProps {
  oldContent: unknown;
  newContent: unknown;
  oldLabel: string;
  newLabel: string;
}

/**
 * Flatten a nested object into key-value pairs for table display.
 * Handles one level of nesting with dot notation keys.
 */
function flattenToEntries(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
        result[`${key}.${subKey}`] = subValue;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Parse content into a record. Handles string (JSON.parse) or object input.
 */
function parseContent(content: unknown): Record<string, unknown> | null {
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  if (typeof content === 'object' && content !== null) {
    return content as Record<string, unknown>;
  }
  return null;
}

/**
 * Determine the cell highlight class based on value comparison.
 */
function getCellHighlight(oldVal: unknown, newVal: unknown): string {
  if (oldVal === newVal) return '';

  const oldNum = typeof oldVal === 'number' ? oldVal : Number(oldVal);
  const newNum = typeof newVal === 'number' ? newVal : Number(newVal);

  if (!isNaN(oldNum) && !isNaN(newNum) && typeof oldVal !== 'undefined' && typeof newVal !== 'undefined') {
    if (newNum > oldNum) {
      return 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300';
    }
    if (newNum < oldNum) {
      return 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300';
    }
    return '';
  }

  // Text changed (non-numeric)
  return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300';
}

export function StructuredDiffViewer({
  oldContent,
  newContent,
  oldLabel,
  newLabel,
}: StructuredDiffViewerProps) {
  const { rows, fallback } = useMemo(() => {
    const oldObj = parseContent(oldContent);
    const newObj = parseContent(newContent);

    // If either side can't be parsed as an object, fall back to prose diff
    if (!oldObj || !newObj) {
      return { rows: null, fallback: true };
    }

    const oldFlat = flattenToEntries(oldObj);
    const newFlat = flattenToEntries(newObj);
    const allKeys = Array.from(
      new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)]),
    );

    // Also compute a quick JSON diff to confirm there are actual differences
    diffJson(oldObj, newObj);

    const tableRows = allKeys.map((key) => {
      const oldVal = oldFlat[key];
      const newVal = newFlat[key];
      const highlight = getCellHighlight(oldVal, newVal);
      const isNumeric =
        typeof oldVal === 'number' || typeof newVal === 'number';

      return { key, oldVal, newVal, highlight, isNumeric };
    });

    return { rows: tableRows, fallback: false };
  }, [oldContent, newContent]);

  if (fallback || !rows) {
    return (
      <ProseDiffViewer
        oldContent={String(oldContent ?? '')}
        newContent={String(newContent ?? '')}
        oldLabel={oldLabel}
        newLabel={newLabel}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campo</TableHead>
          <TableHead>{oldLabel}</TableHead>
          <TableHead>{newLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {row.key}
            </TableCell>
            <TableCell
              className={`font-mono text-xs ${row.isNumeric ? 'text-right' : ''} ${row.highlight && row.oldVal !== row.newVal ? getCellHighlight(row.newVal, row.oldVal) : ''}`}
            >
              {String(row.oldVal ?? '—')}
            </TableCell>
            <TableCell
              className={`font-mono text-xs ${row.isNumeric ? 'text-right' : ''} ${row.highlight}`}
            >
              {String(row.newVal ?? '—')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
