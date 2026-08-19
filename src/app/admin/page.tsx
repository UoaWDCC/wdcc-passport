"use client";

import { CreateBadgeButton } from "@/components/admin/CreateBadgeButton";
import { CreateEventButton } from "@/components/admin/CreateEventButton";
import { SignOutButton } from "@/components/SignOutButton";
import { getEventsAction } from "@/server/events/get-events/get-events.action";
import { useQuery } from "@tanstack/react-query";

export default function Admin() {
  const { data: events = [] } = useQuery({
    queryKey: ["get-events"],
    queryFn: getEventsAction,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-none font-semibold md:text-4xl">Admin</h1>
          <p className="mt-2 text-base leading-7 text-gray-600">Create and manage badges.</p>
        </div>
        <SignOutButton />
      </header>

      <div className="flex flex-wrap gap-3">
        <CreateBadgeButton events={events} />
        <CreateEventButton />
      </div>
    </div>
  );
}
