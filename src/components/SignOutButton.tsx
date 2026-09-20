"use client";

import { authClient } from "@/lib/auth-client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const redirectTo = "/";
const confirmMessage = "Do you want to sign out?";

const SPRITE = { src: "/assets/pixel/signout.png", w: 20, h: 18, scale: 2 };

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSignOut() {
    setConfirming(false);
    setLoading(true);
    setFailed(false);
    try {
      const { error } = await authClient.signOut();

      if (error) {
        setFailed(true);
        setLoading(false);
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setFailed(true);
      setLoading(false);
    }
  }

  const label = loading ? "Signing out..." : failed ? "Sign out failed. Try again." : "Sign out";

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setConfirming(true)}
        disabled={loading}
        className="absolute right-3 flex size-11 items-center justify-center disabled:opacity-50"
        style={{ top: "calc(22px + env(safe-area-inset-top))" }}
      >
        <Image
          src={SPRITE.src}
          alt=""
          width={SPRITE.w * SPRITE.scale}
          height={SPRITE.h * SPRITE.scale}
          unoptimized
          priority
          style={{ imageRendering: "pixelated" }}
        />
      </button>
      <ConfirmDialog
        open={confirming}
        message={confirmMessage}
        onConfirm={handleSignOut}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
