"use client";

import { getUserBadgesAction } from "@/server/badges/get-user-badges/get-user-badges.action";
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
          <Image src={badge.path} alt={badge.name} width={128} height={128} />
        </li>
      ))}
    </ul>
  );
}
