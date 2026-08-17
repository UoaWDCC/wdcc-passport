"use client";

import { ReactNode } from "react";

interface FormModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  pendingMessage: string;
  error: Error | null;
  children: ReactNode;
}

export function FormModal({
  title,
  open,
  onClose,
  onSubmit,
  isPending,
  pendingMessage,
  error,
  children,
}: FormModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={(submitEvent) => {
          submitEvent.preventDefault();
          onSubmit(new FormData(submitEvent.currentTarget));
        }}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-neutral-900 p-6"
      >
        <h2 className="text-lg font-semibold">{title}</h2>

        {children}

        {isPending && <p className="text-sm text-white/60">{pendingMessage}</p>}

        {error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
            {error.message || "Something went wrong."}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-sm text-white/75 transition hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25 disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
