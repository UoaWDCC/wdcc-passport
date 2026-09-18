"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PIXEL_ERROR_TEXT, PIXEL_PANEL, pixelButton } from "@/components/ui/pixel";
import { getUserBadgesQuery } from "@/hooks/badges/query-options";

type Badge = {
  id: string;
  name: string;
  path: string;
  type: "event" | "special";
  eventName: string | null;
  awardedAt: Date | null;
};

const FRAME = "/assets/pixel/badge-frame.png";
const pixelated = { imageRendering: "pixelated" } as const;

function FramedBadge({ badge, className = "" }: { badge: Badge; className?: string }) {
  return (
    <span className={`relative block aspect-square ${className}`}>
      <span className="absolute inset-[18.75%] bg-black/40" />
      <Image
        src={badge.path}
        alt=""
        fill
        sizes="(max-width: 500px) 30vw, 150px"
        className={`object-contain p-[23%] ${badge.awardedAt ? "" : "opacity-30 grayscale"}`}
      />
      <Image
        src={FRAME}
        alt=""
        fill
        unoptimized
        className={`pointer-events-none ${badge.awardedAt ? "" : "opacity-60 grayscale"}`}
        style={pixelated}
      />
    </span>
  );
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BadgeDetail({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  // Event badges are named after their event, so the event name is the title.
  const title = badge.type === "event" && badge.eventName ? badge.eventName : badge.name;
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex w-full max-w-sm flex-col items-center gap-4 p-6 pt-8 text-center [text-shadow:none] ${PIXEL_PANEL}`}
      >
        <FramedBadge badge={badge} className="w-40" />
        <div className="flex flex-col gap-3 text-xs leading-relaxed">
          <p className="text-sm">{title}</p>
          <p>
            {badge.awardedAt
              ? `Earned ${formatDate(badge.awardedAt)}`
              : "Locked. Scan the QR code at the event to earn it."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute top-3 right-3 ${pixelButton({ size: "icon" })}`}
        >
          X
        </button>
      </div>
    </div>
  );
}

export function BadgesScreen() {
  const { data: badges = [], error, isPending } = useQuery(getUserBadgesQuery());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const earned = badges.filter((b) => b.awardedAt).length;
  const selected = badges.find((b) => b.id === selectedId) ?? null;
  const groups = [
    { title: "Event badges", items: badges.filter((b) => b.type === "event") },
    { title: "Special badges", items: badges.filter((b) => b.type === "special") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-6 py-4 text-white [text-shadow:2px_2px_0_#000]">
      <header className="flex items-end justify-between">
        <h1 className="text-lg">Badges</h1>
        {!isPending && !error && (
          <p className="text-xs">
            {earned} / {badges.length}
          </p>
        )}
      </header>

      {isPending && (
        <ul className="grid grid-cols-3 gap-3" aria-label="Loading badges">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="aspect-square animate-pulse bg-white/20" />
          ))}
        </ul>
      )}

      {error && (
        <p className={`px-4 py-3 text-[10px] leading-relaxed ${PIXEL_ERROR_TEXT} ${PIXEL_PANEL}`}>
          Could not load badges.
        </p>
      )}

      {!isPending && !error && badges.length === 0 && (
        <p className={`px-4 py-3 text-[10px] leading-relaxed ${PIXEL_PANEL}`}>
          No badges have been created yet.
        </p>
      )}

      {selected && <BadgeDetail badge={selected} onClose={() => setSelectedId(null)} />}

      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-3">
          <h2 className="text-xs">{group.title}</h2>
          <ul className="grid grid-cols-3 gap-3">
            {group.items.map((badge) => {
              const isSelected = badge.id === selectedId;
              return (
                <li key={badge.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : badge.id)}
                    aria-pressed={isSelected}
                    aria-label={badge.awardedAt ? badge.name : `${badge.name} (locked)`}
                    className={`block w-full transition ${isSelected ? "scale-95" : ""}`}
                  >
                    <FramedBadge badge={badge} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
