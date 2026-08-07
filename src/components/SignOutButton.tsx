"use client";

import { authClient } from "@/lib/auth-client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useState } from "react";

const redirectTo = "/";
const confirmMessage = "Do you want to sign out?";
const buttonClassName =
  "shrink-0 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50";

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

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={loading}
        className={buttonClassName}
      >
        {loading ? "Signing out..." : failed ? "Sign out failed. Try again." : "Sign out"}
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
