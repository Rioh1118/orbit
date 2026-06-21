import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface DeleteTaskDialogProps {
  open: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Native `<dialog>` delete confirmation (brief §7.12.3) — native Esc / backdrop are
 * preserved; the destructive action uses the danger Button. Cancel is first in DOM
 * order, so showModal() focuses the safe action by default.
 */
export function DeleteTaskDialog({ open, taskTitle, onConfirm, onCancel }: DeleteTaskDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
      aria-labelledby="delete-dialog-title"
      className="m-auto w-[min(92vw,24rem)] rounded-lg border border-border bg-surface p-6 text-ink shadow-lg motion-safe:animate-[moveInBottom_300ms_cubic-bezier(.16,1,.3,1)]"
    >
      <h2 id="delete-dialog-title" className="text-lg text-ink">
        タスクを削除しますか？
      </h2>
      <p className="prose-ledger mt-2 text-sm text-ink-muted">
        「{taskTitle}」を削除します。この操作は取り消せません。
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="subtle" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          削除する
        </Button>
      </div>
    </dialog>
  );
}
