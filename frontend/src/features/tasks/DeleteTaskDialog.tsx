import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface DeleteTaskDialogProps {
  open: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Native `<dialog>` delete confirmation (brief §7.12.3). Mirrors the FrictionModal
 * pattern: a single close path (`onClose`) driven by dlg.close(), backdrop click
 * (target === dialog, content lives in a padded child), native Esc, and the
 * destructive action in a danger Button. Cancel is first in DOM order, so
 * showModal() focuses the safe action by default.
 */
export function DeleteTaskDialog({ open, taskTitle, onConfirm, onClose }: DeleteTaskDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      aria-labelledby={headingId}
      className="m-auto w-[min(92vw,24rem)] rounded-lg border border-border bg-surface p-0 text-ink shadow-lg motion-safe:animate-[moveInBottom_300ms_cubic-bezier(.16,1,.3,1)]"
    >
      <div className="p-6">
        <h2 id={headingId} className="text-lg text-ink">
          タスクを削除しますか？
        </h2>
        <p className="prose-ledger mt-2 text-sm text-ink-muted">
          「{taskTitle}」を削除します。この操作は取り消せません。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => ref.current?.close()}>
            キャンセル
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              onConfirm();
              ref.current?.close();
            }}
          >
            削除する
          </Button>
        </div>
      </div>
    </dialog>
  );
}
