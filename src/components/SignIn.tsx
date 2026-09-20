"use client";

import { pixelFont } from "@/components/home/font";
import { SCENE_H, SCENE_W } from "@/components/home/scene";
import { PIXEL_ERROR_TEXT, PIXEL_PANEL, pixelButton } from "@/components/ui/pixel";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useState } from "react";

const BG = "/assets/pixel/scene-background.png";
const BG_WIDE = "/assets/pixel/scene-wide.png";
const GOOGLE_ICON = "/assets/google-color.svg";

const BG_SCALE = `max(500px / ${SCENE_W}, 100dvh / ${SCENE_H})`;

const pixelated = { imageRendering: "pixelated" } as const;

export default function SignIn({
  error: initialError,
  next,
}: {
  error: string | null;
  next: string | null;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const error = localError ?? initialError;

  async function handleSignIn() {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: next ?? "/home",
        errorCallbackURL: next ? `/?error=oauth&next=${encodeURIComponent(next)}` : "/?error=oauth",
      });

      if (error) {
        setLocalError("Sign in failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setLocalError("Sign in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 touch-manipulation overflow-hidden overscroll-none bg-black text-white ${pixelFont.className}`}
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

      <main
        className="relative mx-auto flex h-full w-full max-w-[500px] flex-col items-center justify-center gap-10 bg-cover bg-top px-6 shadow-[0_0_0_4px_rgba(0,0,0,0.85),0_0_60px_rgba(0,0,0,0.7)]"
        style={{ backgroundImage: `url(${BG})`, ...pixelated }}
      >
        <div aria-hidden className="absolute inset-0 bg-black/30" />

        <h1 className="relative -translate-y-6 text-center text-3xl leading-snug [text-shadow:4px_4px_0_#000]">
          WDCC
          <br />
          Passport
        </h1>

        <div className="relative flex w-full translate-y-10 flex-col items-center gap-4">
          {error && (
            <p
              role="alert"
              className={`${PIXEL_PANEL} ${PIXEL_ERROR_TEXT} px-4 py-3 text-center text-[10px] leading-relaxed`}
            >
              Sign in failed. Please try again.
            </p>
          )}
          <button type="button" onClick={handleSignIn} disabled={loading} className={pixelButton()}>
            {loading ? "Signing in..." : "Sign in with Google"}
            <Image src={GOOGLE_ICON} alt="" width={24} height={24} unoptimized />
          </button>
        </div>
      </main>
    </div>
  );
}
