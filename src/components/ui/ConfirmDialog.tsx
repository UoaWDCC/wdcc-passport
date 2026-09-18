"use client";

import { useEffect, useRef } from "react";

import { PIXEL_PANEL, pixelButton } from "@/components/ui/pixel";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  /** The player-facing pixel-art look, instead of the plain one the admin screens use. */
  pixel?: boolean;
}

export function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Yes",
  cancelLabel = "No",
  pixel = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open && !el.open) {
      el.showModal();
      cancelRef.current?.focus();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-message"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
      className={
        pixel
          ? "m-auto w-[calc(100%-2rem)] max-w-sm border-0 bg-transparent p-0 backdrop:bg-black/60"
          : "m-auto w-full max-w-sm rounded-2xl border-0 bg-white p-0 text-gray-950 shadow-xl backdrop:bg-black/60"
      }
    >
      <div className={pixel ? `p-6 ${PIXEL_PANEL}` : "p-6"}>
        <p
          id="confirm-dialog-message"
          className={pixel ? "text-xs leading-relaxed" : "text-base font-semibold"}
        >
          {message}
        </p>
        <div className={`mt-6 flex justify-end gap-3 ${pixel ? "flex-wrap" : ""}`}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={
              pixel
                ? pixelButton({ size: "sm" })
                : "rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-100"
            }
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              pixel
                ? pixelButton({ variant: "gold", size: "sm" })
                : "rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
