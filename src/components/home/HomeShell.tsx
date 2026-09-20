"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { HomeNav, NAV_HEIGHT } from "@/components/home/HomeNav";
import { SignOutButton } from "@/components/SignOutButton";

/** The scene backdrop without Webster; the home page places him on top. */
const BG = "/assets/pixel/scene-background.png";
const LOGO = { src: "/assets/pixel/wdcc-logo.png", w: 117, h: 36, scale: 1 };

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
    <div className="h-dvh w-full overflow-hidden bg-black">
      {/* Phone-width column, centred on wider screens with black either side. */}
      <div
        className="[container-type:size] relative mx-auto h-full w-full max-w-[430px] bg-cover bg-top"
        style={{ backgroundImage: `url(${BG})`, ...pixelated }}
      >
        {isHome ? children : <div className="absolute inset-0 bg-black/60" />}

        <Image
          src={LOGO.src}
          alt="WDCC"
          width={LOGO.w * LOGO.scale}
          height={LOGO.h * LOGO.scale}
          unoptimized
          priority
          className="absolute left-3 z-10"
          style={{
            top: `calc(${HEADER_CENTER_Y - Math.floor((LOGO.h * LOGO.scale) / 2)}px + env(safe-area-inset-top))`,
            ...pixelated,
          }}
        />

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
