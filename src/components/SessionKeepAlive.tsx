"use client";

import { useEffect } from "react";

const SESSION_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

async function refreshSession() {
  try {
    await fetch("/api/auth/get-session", {
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    // Best-effort background refresh. Auth-gated views handle expired sessions.
  }
}

export default function SessionKeepAlive() {
  useEffect(() => {
    void refreshSession();

    const interval = window.setInterval(() => {
      void refreshSession();
    }, SESSION_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
