"use client";

import { FormModal } from "@/components/ui/FormModal";
import { createEventAction } from "@/server/events/create-event/create-event.action";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export function CreateEventButton() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    mutate: createEvent,
    error,
    isPending,
    reset,
  } = useMutation({
    mutationFn: createEventAction,
    onSuccess: () => closeDialog(),
    onError: (createError) => console.error(createError),
  });

  function handleSubmit(formData: FormData) {
    const start = formData.get("startTimestamp");
    const end = formData.get("endTimestamp");

    if (typeof start === "string") {
      formData.set("startTimestamp", new Date(start).toISOString());
    }

    if (typeof end === "string") {
      formData.set("endTimestamp", new Date(end).toISOString());
    }

    createEvent(formData);
  }

  function closeDialog() {
    setIsOpen(false);
    reset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="self-start rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Create event
      </button>

      <FormModal
        title="Create event"
        open={isOpen}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        isPending={isPending}
        pendingMessage="Creating event…"
        error={error}
      >
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
          Start time
          <input
            type="datetime-local"
            name="startTimestamp"
            required
            className="rounded-lg bg-white/10 px-3 py-2 text-white"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-white/75">
          End time
          <input
            type="datetime-local"
            name="endTimestamp"
            required
            className="rounded-lg bg-white/10 px-3 py-2 text-white"
          />
        </label>
      </FormModal>
    </>
  );
}
