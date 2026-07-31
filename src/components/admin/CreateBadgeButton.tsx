"use client";

import { createBadgeAction } from "@/server/badges/create-badge/create-badge.action";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export function CreateBadgeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"special" | "event">("special");
  const [eventId, setEventId] = useState<string | null>(null);

  const {
    mutate: createBadge,
    error,
    isPending,
    reset,
  } = useMutation({
    mutationFn: createBadgeAction,
    onSuccess: () => close(),
    onError: (createError) => console.error(createError),
  });

  function close() {
    setIsOpen(false);
    setType("special");
    setEventId(null);
    reset();
  }

  function changeType(nextType: "special" | "event") {
    setType(nextType);
    setEventId(nextType === "event" ? crypto.randomUUID() : null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="self-start rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25"
      >
        Create badge
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create badge"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={close}
        >
          <form
            action={createBadge}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-neutral-900 p-6"
          >
            <h2 className="text-lg font-semibold">Create badge</h2>

            <label className="flex flex-col gap-1 text-sm text-white/75">
              Name
              <input
                name="name"
                required
                className="rounded-lg bg-white/10 px-3 py-2 text-white"
                placeholder="Hackathon 2026"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-white/75">
              Type
              <select
                name="type"
                value={type}
                onChange={(changeEvent) =>
                  changeType(changeEvent.target.value as "special" | "event")
                }
                className="rounded-lg bg-white/10 px-3 py-2 text-white"
              >
                <option value="special">Special</option>
                <option value="event">Event</option>
              </select>
            </label>

            {eventId && (
              <label className="flex flex-col gap-1 text-sm text-white/75">
                Event id (generated)
                <input
                  name="eventId"
                  value={eventId}
                  readOnly
                  className="rounded-lg bg-white/10 px-3 py-2 font-mono text-xs text-white"
                />
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm text-white/75">
              Image
              <input
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/webp,image/gif"
                required
                className="text-white"
              />
            </label>

            {isPending && <p className="text-sm text-white/60">Uploading badge…</p>}

            {error && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
                {error.message || "Could not create badge."}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
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
      )}
    </>
  );
}
