"use client";

import { getUserBadgesAction } from "@/server/badges/get-user-badges/get-user-badges.action";
import { HoverCard } from "@/components/ui/HoverCard";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

export function BadgesSection() {
  const {
    data: badges = [],
    error,
    isPending,
  } = useQuery({
    queryKey: ["get-user-badges"],
    queryFn: getUserBadgesAction,
  });

  if (isPending) return <p>Loading badges...</p>;
  if (error) return <p>Could not load badges.</p>;

  return (
    <ul>
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
            <Image src={badge.path} alt={badge.name} width={128} height={128} />
          </HoverCard>
        </li>
      ))}
    </ul>
  );
}
