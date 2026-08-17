"use client";

import { FormModal } from "@/components/ui/FormModal";
import { createBadgeAction } from "@/server/badges/create-badge/create-badge.action";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export function CreateBadgeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"special" | "event">("special");

  const {
    mutate: createBadge,
    error,
    isPending,
    reset,
  } = useMutation({
    mutationFn: createBadgeAction,
    onSuccess: () => closeDialog(),
    onError: (createError) => console.error(createError),
  });

  function closeDialog() {
    setIsOpen(false);
    setType("special");
    reset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="self-start rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Create badge
      </button>

      <FormModal
        title="Create badge"
        open={isOpen}
        onClose={closeDialog}
        onSubmit={createBadge}
        isPending={isPending}
        pendingMessage="Uploading badge…"
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
          Type
          <select
            name="type"
            value={type}
            onChange={(changeEvent) => setType(changeEvent.target.value as "special" | "event")}
            className="rounded-lg bg-white/10 px-3 py-2 text-white"
          >
            <option value="special">Special</option>
          </select>
        </label>

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
      </FormModal>
    </>
  );
}
