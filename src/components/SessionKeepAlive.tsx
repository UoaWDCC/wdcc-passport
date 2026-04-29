"use client";

import { useEffect } from "react";

const SESSION_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

async function refreshSession() {
  await fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "same-origin",
  });
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
