"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PackModal } from "@/components/packs/PackModal";
import { getUserPackCountQuery, openPackMutation } from "@/hooks/packs/query-options";

export type NavTarget = "home" | "badges" | "scan" | "passport" | "packs";

const HOME = { src: "/assets/pixel/home.png", w: 21, h: 20, scale: 3 };
const MEDAL = { src: "/assets/pixel/medal.png", w: 21, h: 20, scale: 3 };
const SCANNER = { src: "/assets/pixel/scanner.png", w: 40, h: 28, scale: 2 };
const CARD = { src: "/assets/pixel/card.png", w: 46, h: 62, scale: 1 };
const PACK = { src: "/assets/pixel/pack.png", w: 40, h: 62, scale: 1 };
const BANNER = { src: "/assets/pixel/banner.png", w: 64, h: 24, scale: 6 };

const TOUCH = 44;
const cellWidth = (w: number) => Math.ceil(Math.max(w, TOUCH) / 2) * 2;
const ICON_GAP = 6;
const BOTTOM_MARGIN = 16;

/** Height the nav occupies above the safe-area inset, so the shell can keep content clear of it. */
export const NAV_HEIGHT = BANNER.h * BANNER.scale + BOTTOM_MARGIN;

const pixelated = { imageRendering: "pixelated" } as const;

const ICONS = [
  { key: "packs" as const, sprite: PACK, label: "Packs", href: null, gapAfter: 10 },
  { key: "passport" as const, sprite: CARD, label: "Cards", href: "/home/cards" },
  { key: "scan" as const, sprite: SCANNER, label: "Scan", href: "/home/scan" },
  { key: "badges" as const, sprite: MEDAL, label: "Badges", href: "/home/badges" },
  { key: "home" as const, sprite: HOME, label: "Home", href: "/home" },
];

const ICON_BOX_H = Math.max(...ICONS.map(({ sprite }) => sprite.h * sprite.scale));

type Props = {
  onNavigate?: (target: NavTarget) => void;
};

export function HomeNav({ onNavigate = (target) => console.log("navigate", target) }: Props) {
  const queryClient = useQueryClient();
  const { data: packCount = 0 } = useQuery(getUserPackCountQuery());
  const [showPacks, setShowPacks] = useState(false);
  const {
    mutate: openPack,
    data: opened,
    error: openError,
    reset: resetOpen,
  } = useMutation(
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
    ICONS.reduce(
      (sum, icon) => sum + cellWidth(icon.sprite.w * icon.sprite.scale) + (icon.gapAfter ?? 0),
      0,
    ) +
    ICON_GAP * (ICONS.length - 1);
  const rowLeft = Math.floor((bannerW - rowW) / 2);

  return (
    <>
      <nav
        aria-label="Main"
        className="absolute left-[calc(50%_-_192px)] z-10"
        style={{
          left: `round(down, calc(50% - ${bannerW / 2}px), 1px)`,
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
          className="absolute top-0 flex h-full items-center select-none"
          style={{ left: rowLeft, gap: ICON_GAP }}
        >
          {ICONS.map(({ key, sprite, label, href, gapAfter }) => {
            const w = sprite.w * sprite.scale;
            const h = sprite.h * sprite.scale;
            const className = "flex flex-col items-center gap-1.5";
            const style = { width: cellWidth(w) };
            const image = (
              <>
                <span className="flex items-center justify-center" style={{ height: ICON_BOX_H }}>
                  <Image
                    src={sprite.src}
                    alt=""
                    width={w}
                    height={h}
                    unoptimized
                    priority
                    style={pixelated}
                  />
                </span>
                <span className="text-[8px] leading-none font-normal tracking-normal whitespace-nowrap text-[#4a3a24]">
                  {label}
                </span>
              </>
            );
            return (
              <li key={key} style={{ marginRight: gapAfter }}>
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
          opened={opened}
          openError={openError !== null}
          onOpen={() => openPack()}
          onClose={() => {
            setShowPacks(false);
            resetOpen();
          }}
        />
      )}
    </>
  );
}
