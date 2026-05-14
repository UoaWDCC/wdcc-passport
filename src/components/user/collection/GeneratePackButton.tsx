"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { generateRandomPack } from "@/app/user/collection/actions";

export default function GeneratePackButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await generateRandomPack();
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to generate pack",
              );
            }
          })
        }
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Generating...
          </>
        ) : (
          <>+ Generate Pack</>
        )}
      </button>
      {error ? (
        <p
          aria-live="polite"
          className="max-w-60 text-right text-xs text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
