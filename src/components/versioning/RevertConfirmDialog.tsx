import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { es } from '@/locales/es';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface RevertConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetVersion: number;
  targetDate: string | null;
  isManuallyEdited: boolean;
  onConfirm: () => void;
  isLoading: boolean;
  affectedDocuments?: string[];
}

export function RevertConfirmDialog({
  open,
  onOpenChange,
  targetVersion,
  isManuallyEdited,
  onConfirm,
  isLoading,
  affectedDocuments,
}: RevertConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{es.versioning.revertDialogTitle}</DialogTitle>
          <DialogDescription>
            {es.versioning.revertDialogBody(targetVersion)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Manual edit warning per D-11 */}
          {isManuallyEdited && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>
                {es.versioning.manualEditWarning}
              </AlertDescription>
            </Alert>
          )}

          {/* Soft downstream warning per D-10 override */}
          {affectedDocuments && affectedDocuments.length > 0 && (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertDescription>
                {es.versioning.downstreamWarning(affectedDocuments.join(', '))}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {es.versioning.revertDialogCancel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {es.versioning.revertDialogConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
