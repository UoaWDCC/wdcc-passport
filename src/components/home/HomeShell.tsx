"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { HomeNav, NAV_HEIGHT } from "@/components/home/HomeNav";
import { SCENE_H, SCENE_W } from "@/components/home/scene";
import { SignOutButton } from "@/components/SignOutButton";

/** The scene backdrop without Webster; the home page places him on top. */
const BG = "/assets/pixel/scene-background.png";
const BG_WIDE = "/assets/pixel/scene-wide.png";
const LOGO = { src: "/assets/pixel/wdcc-logo.png", w: 119, h: 38, scale: 1 };
const WDCC_URL = "https://wdcc.co.nz";
const LOGO_PAD = 4;

// 500px is the column's max width (max-w-[500px] below).
const BG_SCALE = `max(500px / ${SCENE_W}, 100dvh / ${SCENE_H})`;

const HEADER_CENTER_Y = 44;
const HEADER_HEIGHT = HEADER_CENTER_Y * 2;

const pixelated = { imageRendering: "pixelated" } as const;

/**
 * Persistent frame for every /home route: the phone-width column with the pixel
 * backdrop, the logo and sign-out header, and the bottom nav. Pages render in the
 * space between; any page other than home dims the backdrop behind it.
 */
export function HomeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/home";
  const isScan = pathname === "/home/scan";
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const viewport = window.visualViewport;
    if (!isScan || !shell || !viewport) return;
    const phone = window.matchMedia("(max-width: 639px)");
    let fullHeight = Math.max(document.documentElement.clientHeight, viewport.height);
    let viewportWidth = window.innerWidth;

    const resetViewport = () => {
      shell.style.removeProperty("height");
      shell.style.removeProperty("top");
      shell.removeAttribute("data-keyboard-open");
    };

    const updateViewport = () => {
      if (!phone.matches) {
        resetViewport();
        return;
      }
      if (viewport.scale !== 1) return;
      if (window.innerWidth !== viewportWidth) {
        viewportWidth = window.innerWidth;
        fullHeight = Math.max(document.documentElement.clientHeight, viewport.height);
      }

      const input = shell.querySelector<HTMLInputElement>("#code-input");
      const inputFocused = input !== null && document.activeElement === input;
      const wasOpen = shell.hasAttribute("data-keyboard-open");
      if (!inputFocused && !wasOpen) {
        fullHeight = Math.max(document.documentElement.clientHeight, viewport.height);
      }

      const keyboardOpen = (inputFocused || wasOpen) && fullHeight - viewport.height > 120;
      shell.toggleAttribute("data-keyboard-open", keyboardOpen);
      shell.style.height = `${viewport.height}px`;
      shell.style.top = `${viewport.offsetTop}px`;

      if (wasOpen && !keyboardOpen && inputFocused) input.blur();
    };
    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    phone.addEventListener("change", updateViewport);
    shell.addEventListener("focusin", updateViewport);
    shell.addEventListener("focusout", updateViewport);
    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
      phone.removeEventListener("change", updateViewport);
      shell.removeEventListener("focusin", updateViewport);
      shell.removeEventListener("focusout", updateViewport);
      resetViewport();
    };
  }, [isScan]);

  return (
    <div
      ref={shellRef}
      className={`home-shell relative h-dvh w-full touch-manipulation overflow-hidden overscroll-none bg-black ${isScan ? "scan-shell" : ""}`}
    >
      <div
        aria-hidden
        className="absolute -inset-6 bg-repeat-x blur-[6px]"
        style={{
          backgroundImage: `url(${BG_WIDE})`,
          backgroundSize: `calc(${BG_SCALE} * ${SCENE_W * 2}) auto`,
          backgroundPosition: `calc(50vw + 24px - ${BG_SCALE} * ${SCENE_W / 2}) 24px`,
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
          className="home-header absolute left-3 z-10 block"
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

        <div className="home-header">
          <SignOutButton />
        </div>

        {!isHome && (
          <div
            className={`absolute inset-x-0 px-4 [image-rendering:auto] ${isScan ? "overflow-hidden sm:overflow-y-auto" : "overflow-y-auto"}`}
            style={{
              top: `var(--home-content-top, calc(${HEADER_HEIGHT}px + env(safe-area-inset-top)))`,
              bottom: `var(--home-content-bottom, calc(var(--nav-occupied-height, ${NAV_HEIGHT}px) + env(safe-area-inset-bottom)))`,
            }}
          >
            {children}
          </div>
        )}

        <div className="home-nav">
          <HomeNav />
        </div>
      </div>
    </div>
  );
}
