"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
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
      className="m-auto w-full max-w-sm rounded-2xl border-0 bg-white p-0 text-gray-950 shadow-xl backdrop:bg-black/60"
    >
      <div className="p-6">
        <p id="confirm-dialog-message" className="text-base font-semibold">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-100"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Yes
          </button>
        </div>
      </div>
    </dialog>
  );
}
