"use client";

import { QrCodeDisplay } from "@/components/admin/QrCode";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormModal } from "@/components/ui/FormModal";
import { deleteEventMutation, updateEventMutation } from "@/hooks/events/query-options";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface AdminEvent {
  id: string;
  name: string;
  startTimestamp: Date | string;
  endTimestamp: Date | string;
  badgeCode: string | null;
}

interface EventListProps {
  events: AdminEvent[];
  isPending: boolean;
  error: Error | null;
}

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

function toLocalInput(value: Date | string) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function EventList({ events, isPending, error }: EventListProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [deleting, setDeleting] = useState<AdminEvent | null>(null);
  const [qrCodeOpen, setQrCodeOpen] = useState<AdminEvent | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["get-events"] });

  const update = useMutation(
    updateEventMutation({
      onSuccess: () => {
        setEditing(null);
        invalidate();
      },
    }),
  );

  const remove = useMutation(
    deleteEventMutation({
      onSuccess: () => {
        setDeleting(null);
        invalidate();
      },
    }),
  );

  function handleUpdate(formData: FormData) {
    for (const field of ["startTimestamp", "endTimestamp"]) {
      const value = formData.get(field);
      if (typeof value === "string") formData.set(field, new Date(value).toISOString());
    }
    update.mutate(formData);
  }

  function closeEdit() {
    setEditing(null);
    update.reset();
  }

  let body;
  if (isPending) {
    body = <p className="text-sm text-gray-600">Loading events…</p>;
  } else if (error) {
    body = (
      <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
        Could not load events.
      </p>
    );
  } else if (events.length === 0) {
    body = <p className="text-sm text-gray-600">No events yet.</p>;
  } else {
    body = (
      <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
        {events.map((event) => (
          <li key={event.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{event.name}</p>
              <p className="text-sm text-gray-600">
                Start: {new Date(event.startTimestamp).toLocaleString(undefined, dateFormat)}, End:{" "}
                {new Date(event.endTimestamp).toLocaleString(undefined, dateFormat)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setQrCodeOpen(event)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold transition hover:bg-gray-100"
            >
              QR Code
            </button>
            <button
              type="button"
              onClick={() => setEditing(event)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold transition hover:bg-gray-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleting(event)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Events</h2>
      {body}

      {remove.error && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
          {remove.error.message || "Could not delete event."}
        </p>
      )}
      {qrCodeOpen && (
        <QrCodeDisplay
          eventName={qrCodeOpen.name}
          code={qrCodeOpen.badgeCode}
          onClose={() => setQrCodeOpen(null)}
        />
      )}

      {editing && (
        <FormModal
          title="Edit event"
          open
          onClose={closeEdit}
          onSubmit={handleUpdate}
          isPending={update.isPending}
          pendingMessage="Saving event…"
          error={update.error}
          submitLabel="Save"
          pendingLabel="Saving…"
        >
          <input type="hidden" name="id" value={editing.id} />

          <label className="flex flex-col gap-1 text-sm text-white/75">
            Name
            <input
              name="name"
              required
              defaultValue={editing.name}
              className="rounded-lg bg-white/10 px-3 py-2 text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-white/75">
            Start time
            <input
              type="datetime-local"
              name="startTimestamp"
              required
              defaultValue={toLocalInput(editing.startTimestamp)}
              className="rounded-lg bg-white/10 px-3 py-2 text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-white/75">
            End time
            <input
              type="datetime-local"
              name="endTimestamp"
              required
              defaultValue={toLocalInput(editing.endTimestamp)}
              className="rounded-lg bg-white/10 px-3 py-2 text-white"
            />
          </label>
        </FormModal>
      )}

      <ConfirmDialog
        open={deleting !== null}
        message={`Delete event "${deleting?.name ?? ""}"?`}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
