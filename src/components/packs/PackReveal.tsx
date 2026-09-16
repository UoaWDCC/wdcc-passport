"use client";

import dynamic from "next/dynamic";

// three.js touches window/document at import time, so the scene is client-only.
export const PackReveal = dynamic(() => import("./PackRevealScene"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="absolute inset-0 flex items-center justify-center text-sm text-white/60"
    >
      Loading cards…
    </div>
  ),
});
