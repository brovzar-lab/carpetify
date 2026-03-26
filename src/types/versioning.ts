/** Client-side version type for display. Mirrors server DocumentVersion. */
export interface DocumentVersion {
  version: number;
  content: unknown;
  editedContent: string | null;
  contentType: 'prose' | 'structured' | 'table';
  passId: string;
  generatedAt: Date | null;
  archivedAt: Date | null;
  triggerReason: VersionTriggerReason;
  triggeredBy: string | null;
  modelUsed: string;
  promptFile: string;
}

export type VersionTriggerReason = 'regeneration' | 'manual_revert' | 'pipeline_run';

/** The "current" version as displayed alongside historical versions */
export interface CurrentDocumentVersion {
  version: number;
  content: unknown;
  editedContent: string | null;
  contentType: 'prose' | 'structured' | 'table';
  passId: string;
  generatedAt: Date | null;
  manuallyEdited: boolean;
  modelUsed: string;
}
