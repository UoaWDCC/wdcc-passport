"use client";

import { CreateBadgeButton } from "@/components/admin/CreateBadgeButton";
import { CreateEventButton } from "@/components/admin/CreateEventButton";
import { SignOutButton } from "@/components/SignOutButton";
import { getEventsQuery } from "@/hooks/events/query-options";
import { useQuery } from "@tanstack/react-query";

export function AdminDashboard() {
  const { data: events = [], error, isPending } = useQuery(getEventsQuery());

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-none font-semibold md:text-4xl">Admin</h1>
          <p className="mt-2 text-base leading-7 text-gray-600">
            Create and manage events and badges.
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="flex flex-wrap gap-3">
        <CreateBadgeButton events={events} eventsPending={isPending} eventsError={error} />
        <CreateEventButton />
      </div>
    </div>
  );
}
