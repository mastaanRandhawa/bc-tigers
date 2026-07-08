import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  pendingLabel?: string;
  onConfirm: () => Promise<void> | void;
  /** When false, callers handle errors inside onConfirm. Default true. */
  showErrorToast?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  confirmVariant = "destructive",
  pendingLabel,
  onConfirm,
  showErrorToast = true,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const handle = async () => {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      if (showErrorToast) {
        toast.error(getApiErrorMessage(err, "Action failed"));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={handle}
            disabled={pending}
          >
            {pending
              ? (pendingLabel ??
                (confirmLabel === "Delete" ? "Deleting…" : `${confirmLabel}…`))
              : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}