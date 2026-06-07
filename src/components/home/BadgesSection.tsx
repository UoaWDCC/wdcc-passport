"use client";

import { getUserBadgesAction } from "@/server/badges/get-user-badges/get-user-badges.action";
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
        <li key={badge.id}>{badge.name}</li>
      ))}
    </ul>
  );
}
