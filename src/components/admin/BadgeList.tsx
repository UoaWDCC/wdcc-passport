"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteBadgeMutation, getAllBadgesQuery } from "@/hooks/badges/query-options";
import type { getAllBadgesAction } from "@/server/badges/action";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";

type AdminBadge = Awaited<ReturnType<typeof getAllBadgesAction>>[number];

export function BadgeList() {
  const queryClient = useQueryClient();
  const { data: badges = [], error, isPending } = useQuery(getAllBadgesQuery());
  const [deleting, setDeleting] = useState<AdminBadge | null>(null);

  const remove = useMutation(
    deleteBadgeMutation({
      onSuccess: () => {
        setDeleting(null);
        queryClient.invalidateQueries({ queryKey: ["get-all-badges"] });
      },
    }),
  );

  let body;
  if (isPending) {
    body = <p className="text-sm text-gray-600">Loading badges…</p>;
  } else if (error) {
    body = (
      <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
        Could not load badges.
      </p>
    );
  } else if (badges.length === 0) {
    body = <p className="text-sm text-gray-600">No badges yet.</p>;
  } else {
    body = (
      <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
        {badges.map((badge) => (
          <li key={badge.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Image
              src={badge.path}
              alt={badge.name}
              width={48}
              height={48}
              className="rounded-lg bg-gray-100"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{badge.name}</p>
              <p className="text-sm text-gray-600">
                {badge.type === "event" ? ("Event name: " + (badge.eventName ?? "Unknown")) : "Special"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleting(badge)}
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
      <h2 className="text-xl font-semibold">Badges</h2>
      {body}

      {remove.error && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
          {remove.error.message || "Could not delete badge."}
        </p>
      )}

      <ConfirmDialog
        open={deleting !== null}
        message={`Delete badge "${deleting?.name ?? ""}"? Users who earned it will lose it.`}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
