"use client";

import { getUserBadgesAction } from "@/server/badges/get-user-badges/get-user-badges.action";
import { HoverCard } from "@/components/ui/HoverCard";
import { SectionHeader } from "@/components/home/SectionHeader";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function BadgesSection() {
  const {
    data: badges = [],
    error,
    isPending,
  } = useQuery({
    queryKey: ["get-user-badges"],
    queryFn: getUserBadgesAction,
  });

  let body: ReactNode;
  if (isPending) {
    body = (
      <ul className="flex flex-wrap gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="size-38 animate-pulse rounded-2xl bg-white/10" />
        ))}
      </ul>
    );
  } else if (error) {
    body = (
      <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
        Could not load badges.
      </p>
    );
  } else if (badges.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
        <p className="text-sm text-white/60">
          No badges yet — show up to WDCC events to start collecting.
        </p>
      </div>
    );
  } else {
    body = (
      <ul className="flex flex-wrap gap-4 pb-5">
        {badges.map((badge) => (
          <li key={badge.id}>
            <HoverCard
              content={
                <span className="block text-center">
                  <span className="block font-semibold">{badge.name}</span>
                  <span className="block">
                    Awarded{" "}
                    {new Date(badge.awardedAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
              }
            >
              <span className="block rounded-2xl bg-white/10 p-3 transition duration-150 group-hover:-translate-y-1 group-hover:bg-white/15">
                <Image src={badge.path} alt={badge.name} width={128} height={128} />
              </span>
            </HoverCard>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section>
      <SectionHeader title="Badges" count={isPending || error ? undefined : badges.length} />
      {body}
    </section>
  );
}
