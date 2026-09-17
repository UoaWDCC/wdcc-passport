"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PackModal } from "@/components/packs/PackModal";
import { getUserPackCountQuery, openPackMutation } from "@/hooks/packs/query-options";

export type NavTarget = "settings" | "badges" | "scan" | "passport" | "packs";

const HEXAGON = { src: "/assets/pixel/hexagon.png", w: 18, h: 19, scale: 3 };
const MEDAL = { src: "/assets/pixel/medal.png", w: 21, h: 20, scale: 3 };
const SCANNER = { src: "/assets/pixel/scanner.png", w: 40, h: 28, scale: 2 };
const CARD = { src: "/assets/pixel/card.png", w: 46, h: 62, scale: 1 };
const BANNER = { src: "/assets/pixel/banner.png", w: 64, h: 24, scale: 6 };

const TOUCH = 44;
const ICON_GAP = 6;
const BOTTOM_MARGIN = 16;

/** Height the nav occupies above the safe-area inset, so the shell can keep content clear of it. */
export const NAV_HEIGHT = BANNER.h * BANNER.scale + BOTTOM_MARGIN;

const pixelated = { imageRendering: "pixelated" } as const;

const ICONS = [
  { key: "packs" as const, sprite: CARD, label: "Packs", href: null },
  { key: "passport" as const, sprite: CARD, label: "Passport", href: "/home/cards" },
  { key: "scan" as const, sprite: SCANNER, label: "Scan", href: "/home/scan" },
  { key: "badges" as const, sprite: MEDAL, label: "Badges", href: "/home/badges" },
  { key: "settings" as const, sprite: HEXAGON, label: "Settings", href: null },
];

type Props = {
  onNavigate?: (target: NavTarget) => void;
};

export function HomeNav({ onNavigate = (target) => console.log("navigate", target) }: Props) {
  const queryClient = useQueryClient();
  const { data: packCount = 0 } = useQuery(getUserPackCountQuery());
  const [showPacks, setShowPacks] = useState(false);
  const { mutate: openPack } = useMutation(
    openPackMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["get-user-pack-count"] });
        void queryClient.invalidateQueries({ queryKey: ["get-user-cards"] });
      },
    }),
  );

  const bannerW = BANNER.w * BANNER.scale;
  const bannerH = BANNER.h * BANNER.scale;
  const rowW =
    ICONS.reduce((sum, { sprite }) => sum + Math.max(sprite.w * sprite.scale, TOUCH), 0) +
    ICON_GAP * (ICONS.length - 1);
  const rowLeft = Math.floor((bannerW - rowW) / 2);

  return (
    <>
      <nav
        aria-label="Main"
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{
          bottom: `calc(${BOTTOM_MARGIN}px + env(safe-area-inset-bottom))`,
          width: bannerW,
          height: bannerH,
        }}
      >
        <Image
          src={BANNER.src}
          alt=""
          width={bannerW}
          height={bannerH}
          unoptimized
          priority
          className="absolute top-0 left-0"
          style={pixelated}
        />
        <ul
          className="absolute top-0 flex h-full items-center"
          style={{ left: rowLeft, gap: ICON_GAP }}
        >
          {ICONS.map(({ key, sprite, label, href }) => {
            const w = sprite.w * sprite.scale;
            const h = sprite.h * sprite.scale;
            const className = "flex items-center justify-center";
            const style = { width: Math.max(w, TOUCH), height: Math.max(h, TOUCH) };
            const image = (
              <Image
                src={sprite.src}
                alt=""
                width={w}
                height={h}
                unoptimized
                priority
                style={pixelated}
              />
            );
            return (
              <li key={key}>
                {href ? (
                  <Link href={href} aria-label={label} className={className} style={style}>
                    {image}
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-label={label}
                    onClick={() => (key === "packs" ? setShowPacks(true) : onNavigate(key))}
                    className={className}
                    style={style}
                  >
                    {image}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {showPacks && (
        <PackModal
          packCount={packCount}
          onOpen={() => openPack()}
          onClose={() => setShowPacks(false)}
        />
      )}
    </>
  );
}
