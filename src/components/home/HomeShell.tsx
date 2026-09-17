"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { HomeNav, NAV_HEIGHT } from "@/components/home/HomeNav";
import { SignOutButton } from "@/components/SignOutButton";

/** The scene backdrop without Webster; the home page places him on top. */
const BG = "/assets/pixel/scene-background.png";
const BG_WIDE = "/assets/pixel/scene-wide.png";
const LOGO = { src: "/assets/pixel/wdcc-logo.png", w: 119, h: 38, scale: 1 };
const WDCC_URL = "https://wdcc.co.nz";
const LOGO_PAD = 4;

// 500px is the column's max width (max-w-[500px] below).
const BG_SCALE = "max(500px / 350, 100dvh / 621)";

const HEADER_CENTER_Y = 44;
const HEADER_HEIGHT = HEADER_CENTER_Y * 2;

const pixelated = { imageRendering: "pixelated" } as const;

/**
 * Persistent frame for every /home route: the phone-width column with the pixel
 * backdrop, the logo and sign-out header, and the bottom nav. Pages render in the
 * space between; any page other than home dims the backdrop behind it.
 */
export function HomeShell({ children }: { children: ReactNode }) {
  const isHome = usePathname() === "/home";

  return (
    <div className="relative h-dvh w-full touch-manipulation overflow-hidden overscroll-none bg-black">
      <div
        aria-hidden
        className="absolute -inset-6 bg-repeat-x blur-[6px]"
        style={{
          backgroundImage: `url(${BG_WIDE})`,
          backgroundSize: `calc(${BG_SCALE} * 700) auto`,
          backgroundPosition: `calc(50vw + 24px - ${BG_SCALE} * 175) 24px`,
          ...pixelated,
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/45" />

      <div
        className="[container-type:size] relative mx-auto h-full w-full max-w-[500px] bg-cover bg-top shadow-[0_0_0_4px_rgba(0,0,0,0.85),0_0_60px_rgba(0,0,0,0.7)]"
        style={{ backgroundImage: `url(${BG})`, ...pixelated }}
      >
        {isHome ? children : <div className="absolute inset-0 bg-black/60" />}

        <a
          href={WDCC_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WDCC website (opens in a new tab)"
          className="absolute left-3 z-10 block"
          style={{
            top: `calc(${HEADER_CENTER_Y - Math.floor((LOGO.h * LOGO.scale) / 2) - LOGO_PAD}px + env(safe-area-inset-top))`,
            paddingBlock: LOGO_PAD,
          }}
        >
          <Image
            src={LOGO.src}
            alt="WDCC"
            width={LOGO.w * LOGO.scale}
            height={LOGO.h * LOGO.scale}
            unoptimized
            priority
            style={pixelated}
          />
        </a>

        <SignOutButton />

        {!isHome && (
          <div
            className="absolute inset-x-0 overflow-y-auto px-4 [image-rendering:auto]"
            style={{
              top: `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top))`,
              bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
            }}
          >
            {children}
          </div>
        )}

        <HomeNav />
      </div>
    </div>
  );
}
